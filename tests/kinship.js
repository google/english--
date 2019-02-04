const Assert = require("assert");
const logic = require("../src/grammar.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
const {Reasoner, fill, unify, rewrite} = require("../src/fol.js");

const {
 program, 
 forall, 
 exists, 
 implies, 
 predicate, 
 func,
 binary, 
 literal, 
 constant, 
 and, 
 or, 
 negation,
 argument} = Parser;

describe("Kinship", () => {
  it("mother", function() {
    assertThat(`
      forall (x) forall (y) parent(x, y) => child(y, x).
      forall (x) forall (y) child(x, y) => parent(y, x).
      forall (x) forall (y) ((parent(x, y) && female(x)) => mother(x, y)).
      female(dani).
      child(leo, dani).
    `)
     .proving("mother(dani, leo).")
     .equalsTo(`
       female(dani).
       child(leo, dani).
       forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
       parent(dani, leo).
       female(dani) && parent(dani, leo) => female(dani) && parent(dani, leo).
       forall (x = dani) forall (y = leo) female(x) && parent(x, y) => mother(x, y).
       mother(dani, leo).
     `);
  });

  // Brainstorming english grammar here:
  //
  // facts
  //
  // X is a P of Y. <=> P(X, Y).
  //
  // implications
  //
  // If X is a P of Y then Y is a Q or X. <=> forall (x) forall (y) P(X, Y) => Q(Y, X).
  // If X is a P then X is a Q. <=> forall(x) P(x) => Q(x).
  //
  // negations
  //
  // If X is a P then X is not a Q. <=> forall(x) P(x) => ~Q(x).
  // If X is a P then X is not a Q. <=> forall(x) P(x) => ~Q(x).
  // If X is not a P then X is a Q. <=> forall(x) ~P(x) => Q(x).
  // If X is not a P then X is not a Q. <=> forall(x) ~P(x) => ~Q(x).

  it.skip("grandparent", function() {
    assertThat(`
      forall (x) forall (y) parent(x, y) => child(y, x).
      forall (x) forall (y) child(x, y) => parent(y, x).

      forall (g) forall (c) grandparent(g, c) => (exists (p) (parent(g, p) && parent(p, c))).
      forall (g) forall (c) (exists (p) (parent(g, p) && parent(p, c))) => grandparent(g, c).

      parent(maura, mel).
      child(anna, mel).
    `)
     .proving("grandparent(maura, anna)?")
     .equalsTo(`
       parent(maura, mel).
       exists (p = mel) parent(maura, p).
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       parent(mel, anna).
       exists (p = mel) parent(maura, p) && parent(p, anna).
       forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c).
       grandparent(maura, anna).
     `)
     .done();
   });

  it("capturing daughters", () => {
    assertThat(`
     forall (x) forall (y) parent(x, y) => child(y, x).
     forall (a) forall (b) child(a, b) => parent(b, a).
     forall (p) forall (q) ((parent(p, q) && female(q)) => daughter(q, p)).
     child(dani, marcia).
     child(thais, marcia).
     female(dani).
     female(thais).
    `)
    // .proving("exists (z) parent(marcia, z)?")
    .proving("exists (z) daughter(z, marcia)?")
    .equalsTo(`
      child(dani, marcia).
      exists (a = dani) child(a, marcia).
      forall (a = dani) forall (b = marcia) child(a, b) => parent(b, a).
      exists (q = dani) parent(marcia, q).
      female(dani).
      exists (q = dani) parent(marcia, q) && female(q).
      forall (p = marcia) forall (q = dani) female(q) && parent(p, q) => daughter(q, p).
      exists (z = dani) daughter(z, marcia).
    `)
    .equalsTo(`
      child(thais, marcia).
      exists (a = thais) child(a, marcia).
      forall (a = thais) forall (b = marcia) child(a, b) => parent(b, a).
      exists (q = thais) parent(marcia, q).
      female(thais).
      exists (q = thais) parent(marcia, q) && female(q).
      forall (p = marcia) forall (q = thais) female(q) && parent(p, q) => daughter(q, p).
      exists (z = thais) daughter(z, marcia).
    `);
    // TODO(goto): calling done() here fails, investigate.
  });

  it("sons", () => {
    assertThat(`
       forall (x) forall (y) ((parent(x, y) && male(y)) => son(y, x)).
       parent(mel, leo).
       male(leo).
    `)
    .proving("exists (z) son(z, mel)?")
    .equalsTo(`
      parent(mel, leo).
      exists (y = leo) parent(mel, y).
      male(leo).
      exists (y = leo) parent(mel, y) && male(y).
      forall (x = mel) forall (y = leo) male(y) && parent(x, y) => son(y, x).
      exists (z = leo) son(z, mel).
    `)
    .done();
  });

  it.skip("uncles", () => {
    // TODO(goto): calling done() at the end here causes an infinite loop.
    // Figure out what's going on there.
    // there is a bug where, if you wrap things in ()s this leads to a 
    // different expression.
    // forall (u) forall (c) exists(p) (parent(p, c) && sibling(u, p) && male(u)) => uncle(u, c).
    // forall (u) forall (c) ((exists(p) (parent(p, c) && sibling(u, p) && male(u))) => uncle(u, c)).

    // TODO(goto): this doesn't work, dunno why.
    // forall (x) forall (y) (sister(x, y) => (sibling(x, y) && female(x))).

    assertThat(`
       forall (x) forall (y) parent(x, y) => child(y, x).
       forall (x) forall (y) child(x, y) => parent(y, x).

       forall (x) forall (y) (exists(p) (parent(p, x) && parent(p, y))) => sibling(x, y).

       forall (x) forall (y) sibling(x, y) => sibling(y, x).

       forall (x) forall (y) (sibling(x, y) && male(x)) => brother(x, y).
       forall (x) forall (y) (sibling(x, y) && female(x)) => sister(x, y).

       forall (x) forall (y) brother(x, y) => sibling(x, y).
       forall (x) forall (y) brother(x, y) => male(x).

       forall (x) forall (y) sister(x, y) => sibling(x, y).
       forall (x) forall (y) sister(x, y) => female(x).

       forall (u) forall (c) exists(p) (parent(p, c) && sibling(u, p) && male(u)) => uncle(u, c).

       parent(mel, leo).

       brother(ni, mel).
    `)
     // .proving("uncle(ni, leo)?")
    .proving("exists (x) sibling(ni, x)?")
    .equalsTo(`
      brother(ni, mel).
      exists (y = mel) brother(ni, y).
      forall (x = ni) forall (y = mel) brother(x, y) => male(x) && sibling(x, y) => exists (p = y) male(ni) && sibling(ni, p = y).
      parent(mel, leo).
      exists (p = mel) male(ni) && sibling(ni, p) && parent(p, leo).
      forall (u = ni) forall (c = leo) exists (p = mel) parent(p, c) && sibling(u, p) && male(u) => uncle(u, c) => uncle(ni, leo).
    `);
  });

  // logic from:
  // https://people.cs.pitt.edu/~milos/courses/cs2740/Lectures/class8.pdf 
  const kb = `
     forall (x) forall (y) parent(x, y) => child(y, x).
     forall (x) forall (y) child(x, y) => parent(y, x).
     forall (x) forall (y) spouse(x, y) => spouse(y, x).

     forall (x) forall (y) ((parent(x, y) && male(y)) => son(y, x)).
     forall (x) forall (y) ((parent(x, y) && female(y)) => daughter(y, x)).

     forall (x) forall (y) ((parent(x, y) && male(x)) => father(x, y)).
     forall (x) forall (y) ((parent(x, y) && female(x)) => mother(x, y)).

     forall (x) forall (y) (exists(p) (parent(p, x) && parent(p, y))) => sibling(x, y).
     forall (x) forall (y) sibling(x, y) => sibling(y, x).

     forall (x) forall (y) (sibling(x, y) && male(x)) => brother(x, y).
     forall (x) forall (y) (sibling(x, y) && female(x)) => sister(x, y).

     forall (x) forall (y) (brother(x, y) => (sibling(x, y) && male(x))).
     forall (x) forall (y) (sister(x, y) => (sibling(x, y) && female(x))).

     forall (u) forall (c) (exists(p) (parent(p, c) && sibling(u, p) && male(u))) => uncle(u, c).

     forall (g) forall (c) grandparent(g, c) => (exists (p) (parent(g, p) && parent(p, c))).
     forall (g) forall (c) (exists (p) (parent(g, p) && parent(p, c))) => grandparent(g, c).

     forall (g) forall (c) ((grandparent(g, c) && male(g)) => grandfather(g, c)).
     forall (g) forall (c) ((grandparent(g, c) && female(g)) => grandmother(g, c)).

     forall (x) male(x) => ~female(x).
     forall (x) female(x) => ~male(x).

     spouse(mel, dani).

     parent(mel, leo).
     child(anna, mel).

     child(leo, dani).
     parent(dani, anna).

     male(mel).
     female(dani).

     male(leo).
     female(anna).

     parent(maura, mel).
     female(maura).

     male(ni).
     brother(ni, mel).
  `;

  it("child(leo, mel)", () => {
    assertThat(kb)
     .proving("child(leo, mel)?")
     .equalsTo(`
       parent(mel, leo).
       forall (x = mel) forall (y = leo) parent(x, y) => child(y, x).
       child(leo, mel).
     `);
  });

  it("parent(mel, anna)", () => {
    assertThat(kb)
     .proving("parent(mel, anna)?")
     .equalsTo(`
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       parent(mel, anna).
     `);
  });

  it("son(leo, mel)", () => {
    assertThat(kb)
      .proving("son(leo, mel)?")
      .equalsTo(`
        male(leo).
        parent(mel, leo).
        male(leo) && parent(mel, leo) => male(leo) && parent(mel, leo).
        forall (x = mel) forall (y = leo) male(y) && parent(x, y) => son(y, x).
        son(leo, mel).
     `);
  });

  it("daughter(anna, mel)", () => {
    assertThat(kb)
      .proving("daughter(anna, mel)?")
      .equalsTo(`
        female(anna).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
        parent(mel, anna).
        female(anna) && parent(mel, anna) => female(anna) && parent(mel, anna).
        forall (x = mel) forall (y = anna) female(y) && parent(x, y) => daughter(y, x).
        daughter(anna, mel).
     `);
  });

  it("exists (z) son(leo, z)?", () => {
    // TODO(goto): this isn't entirely correct, because
    // son(leo, mel) is also true as well as daughter(anna, dani)
    // but also, the filling of parent(x = leo, leo) is off too
    // and most probably related to the fact that we are using
    // names to fill rather than ids.
    assertThat(kb)
     .proving("exists (z) son(leo, z)?")
     .equalsTo(`
       parent(mel, leo).
       exists (x = mel) parent(x, leo).
       male(leo).
       exists (x = mel) parent(x, leo) && male(leo).
       forall (x = mel) forall (y = leo) male(y) && parent(x, y) => son(y, x).
       exists (z = mel) son(leo, z).
     `);
  });

  it("exists (z) daughter(anna, z)?", () => {
    assertThat(kb)
     .proving("exists (z) daughter(anna, z)?")
     .equalsTo(`
       parent(dani, anna).
       exists (x = dani) parent(x, anna).
       female(anna).
       exists (x = dani) parent(x, anna) && female(anna).
       forall (x = dani) forall (y = anna) female(y) && parent(x, y) => daughter(y, x).
       exists (z = dani) daughter(anna, z).
     `);
  });

  it("female(leo)?", () => {
    assertThat(kb)
     .proving("female(leo)?")
     .equalsTo("false.");
  });

  it("male(anna)?", () => {
    assertThat(kb)
     .proving("male(anna)?")
     .equalsTo("false.");
  });

  it("spouse(dani, mel)", () => {
    assertThat(kb)
     .proving("spouse(dani, mel).")
     .equalsTo(`
       spouse(mel, dani).
       forall (x = mel) forall (y = dani) spouse(x, y) => spouse(y, x).
       spouse(dani, mel).
     `);
  });

  it("father(mel, leo)", () => {
    assertThat(kb)
     .proving("father(mel, leo).")
     .equalsTo(`
       male(mel).
       parent(mel, leo).
       male(mel) && parent(mel, leo) => male(mel) && parent(mel, leo).
       forall (x = mel) forall (y = leo) male(x) && parent(x, y) => father(x, y).
       father(mel, leo).
     `);
  });

  it("father(mel, anna)", () => {
    assertThat(kb)
     .proving("father(mel, anna).")
     .equalsTo(`
       male(mel).
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       parent(mel, anna).
       male(mel) && parent(mel, anna) => male(mel) && parent(mel, anna).
       forall (x = mel) forall (y = anna) male(x) && parent(x, y) => father(x, y).
       father(mel, anna).
     `);
  });

  it("exists (p) spouse(dani, p)?", () => {
    // TODO(goto): calling done() here fails. figure out why.
    assertThat(kb)
     .proving("exists (p) spouse(dani, p)?")
     .equalsTo(`
       spouse(mel, dani).
       exists (x = mel) spouse(x, dani).
       forall (x = mel) forall (y = dani) spouse(x, y) => spouse(y, x).
       exists (p = mel) spouse(dani, p).
     `);
  });

  it("exists (x) spouse(mel, x)?", () => {
    assertThat(kb)
     .proving("exists (x) spouse(mel, x)?")
     .equalsTo("spouse(mel, dani). exists (x = dani) spouse(mel, x).");
  });

  it.skip("mother(dani, anna)", () => {
    assertThat(kb)
     .proving("mother(dani, anna).")
     .equalsTo(`
       female(dani).
       parent(dani, anna).
       female(dani) && parent(dani, anna) => female(dani) && parent(dani, anna).
       forall (x = dani) forall (y = anna) female(x) && parent(x, y) => mother(x, y) => mother(dani, anna).
   `);
  });

  it.skip("sibling(anna, leo)?", () => {
    assertThat(kb)
      .proving("sibling(anna, leo)?")
      .equalsTo(`
        parent(dani, anna).
        exists (p = dani) parent(p, anna).
        child(leo, dani).
        forall (x = leo) forall (y = dani) child(x, y) => parent(y, x) => parent(dani, leo).
        exists (p = dani) parent(p, anna) && parent(p, leo).
        forall (x = anna) forall (y = leo) exists (p = dani) parent(p, x) && parent(p, y) => sibling(x, y) => sibling(anna, leo).
    `);
  });

  it.skip("sibling(leo, anna)?", () => {
    assertThat(kb)
      .proving("sibling(leo, anna)?")
      .equalsTo(`
        parent(mel, leo).
        exists (p = mel) parent(p, leo).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
        exists (p = mel) parent(p, leo) && parent(p, anna).
        forall (x = leo) forall (y = anna) exists (p = mel) parent(p, x) && parent(p, y) => sibling(x, y) => sibling(leo, anna).
    `);
  });

  it.skip("brother(leo, anna)?", () => {
    assertThat(kb)
      .proving("brother(leo, anna)?")
      .equalsTo(`
        male(leo).
        parent(mel, leo).
        exists (p = mel) parent(p, leo).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
        exists (p = mel) parent(p, leo) && parent(p, anna).
        forall (x = leo) forall (y = anna) exists (p = mel) parent(p, x) && parent(p, y) => sibling(x, y) => sibling(leo, anna).
        male(leo) && sibling(leo, anna) => male(leo) && sibling(leo, anna).
        forall (x = leo) forall (y = anna) male(x) && sibling(x, y) => brother(x, y) => brother(leo, anna).
    `);
  });

  it.skip("sister(anna, leo)", () => {
    assertThat(kb)
      .proving("sister(anna, leo)?")
      .equalsTo(`
        female(anna).
        parent(dani, anna).
        exists (p = dani) parent(p, anna).
        child(leo, dani).
        forall (x = leo) forall (y = dani) child(x, y) => parent(y, x) => parent(dani, leo).
        exists (p = dani) parent(p, anna) && parent(p, leo).
        forall (x = anna) forall (y = leo) exists (p = dani) parent(p, x) && parent(p, y) => sibling(x, y) => sibling(anna, leo).
        female(anna) && sibling(anna, leo) => female(anna) && sibling(anna, leo).
        forall (x = anna) forall (y = leo) female(x) && sibling(x, y) => sister(x, y) => sister(anna, leo).
    `);
  });

  it.skip("uncle(ni, leo)?", () => {
    assertThat(kb)
      .proving("uncle(ni, leo)?")
      .equalsTo(`
      `);
  });

  it.skip("grandparent(maura, anna)?", () => {
    assertThat(kb)
     .proving("grandparent(maura, anna)?")
     .equalsTo("");
  });

  it.skip("grandmother(maura, anna)", () => {
    assertThat(kb)
     .proving("grandmother(maura, anna)?")
     .equalsTo("");
  });

  it.skip("", () => {
    assertThat(kb)
     .proving("grandmother(maura, leo)?")
      .equalsTo(``);
  });

  function assertThat(x) {
   return {
    proving(z) {
     let result = new Reasoner(Parser.parse(x)).go(rewrite(Rule.of(z)));
     return {
      done() {
       this.equalsTo("false.")
       return this;
      },
      equalsTo(y) {
       // console.log(result.toString());
       // console.log(JSON.stringify(Parser.parse(result.toString()), undefined, 2));
       assertThat(toString(Parser.parse(result.next().value.toString())))
        .equalsTo(toString(Parser.parse(y)));
       return this;
      }
     };
    },
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});