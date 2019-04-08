const Assert = require("assert");
const logic = require("../src/grammar.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
const {Reasoner} = require("../src/fol.js");
const {fill, unify, rewrite} = require("../src/unify.js");

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
  it("mother(dani, leo)", function() {
    assertThat(`
      forall (x) forall (y) parent(x, y) => child(y, x).
      forall (x) forall (y) child(x, y) => parent(y, x).
      forall (x) forall (y) ((parent(x, y) && female(x)) => mother(x, y)).
      female(dani).
      child(leo, dani).
    `)
     .proving("mother(dani, leo)?")
     .equalsTo(`
       female(dani).
       child(leo, dani).
       forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
       parent(dani, leo).
       female(dani) && parent(dani, leo) => female(dani) && parent(dani, leo).
       forall (x = dani) forall (y = leo) female(x) && parent(x, y) => mother(x, y).
       mother(dani, leo).
     `)
    .done();
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

  it("grandparent(maura, anna)", function() {
    assertThat(kb)
     .proving("grandparent(maura, anna)?")
     .equalsTo(`
       parent(maura, mel).
       exists (p = mel) parent(maura, p).
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       exists (p = mel) parent(mel, anna).
       exists (p = mel) parent(maura, p) && parent(p, anna).
       forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c).
       grandparent(maura, anna).
     `)
     .done();
   });

  it("exists (z) daughter(z, marcia)", () => {
    assertThat(`
     forall (x) forall (y) parent(x, y) => child(y, x).
     forall (a) forall (b) child(a, b) => parent(b, a).
     forall (p) forall (q) ((parent(p, q) && female(q)) => daughter(q, p)).
     child(dani, marcia).
     child(thais, marcia).
     female(dani).
     female(thais).
    `)
    .proving("exists (z) daughter(z, marcia)?")
    .equalsTo(`
      child(dani, marcia).
      exists (a = dani) child(a, marcia).
      forall (a = dani) forall (b = marcia) child(a, b) => parent(b, a).
      exists (q = dani) parent(marcia, q).
      female(dani).
      exists (q = dani) parent(marcia, q) && female(q).
      forall (p = marcia) forall (q = dani) (parent(p, q) && female(q)) => daughter(q, p).
      exists (z = dani) daughter(z, marcia).
    `)
    .equalsTo(`
      child(thais, marcia).
      exists (a = thais) child(a, marcia).
      forall (a = thais) forall (b = marcia) child(a, b) => parent(b, a).
      exists (q = thais) parent(marcia, q).
      female(thais).
      exists (q = thais) parent(marcia, q) && female(q).
      forall (p = marcia) forall (q = thais) (parent(p, q) && female(q)) => daughter(q, p).
      exists (z = thais) daughter(z, marcia).
    `)
    .done();
  });

  it("exists (z) son(z, mel)", () => {
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
      forall (x = mel) forall (y = leo) (parent(x, y) && male(y)) => son(y, x).
      exists (z = leo) son(z, mel).
    `)
    .done();
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

     forall (x) forall (y) exists(p) (parent(p, x) && parent(p, y)) => sibling(x, y).
     forall (x) forall (y) sibling(x, y) => sibling(y, x).

     forall (x) forall (y) (sibling(x, y) && male(x)) => brother(x, y).
     forall (x) forall (y) (sibling(x, y) && female(x)) => sister(x, y).

     forall (x) forall (y) (brother(x, y) => (sibling(x, y) && male(x))).
     forall (x) forall (y) (sister(x, y) => (sibling(x, y) && female(x))).

     forall (u) forall (c) exists(p) (parent(p, c) && sibling(u, p) && male(u)) => uncle(u, c).

     forall (g) forall (c) grandparent(g, c) => (exists (p) (parent(g, p) && parent(p, c))).
     forall (g) forall (c) exists (p) (parent(g, p) && parent(p, c)) => grandparent(g, c).

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
     `)
     .done();
  });

  it("parent(mel, anna)", () => {
    assertThat(kb)
     .proving("parent(mel, anna)?")
     .equalsTo(`
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       parent(mel, anna).
     `)
    .done();
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
    `)
    .done();
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
     `)
      .done();
  });

  it("exists (z) son(leo, z)", () => {
    assertThat(kb)
     .proving("exists (z) son(leo, z)?")
     .equalsTo(`
       parent(mel, leo).
       exists (x = mel) parent(x, leo).
       male(leo).
       exists (x = mel) parent(x, leo) && male(leo).
       forall (x = mel) forall (y = leo) (parent(x, y) && male(y)) => son(y, x).
       exists (z = mel) son(leo, z).
     `)
     .equalsTo(`
       child(leo, dani).
       exists (y = dani) child(leo, y).
       forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
       exists (x = dani) parent(x, leo).
       male(leo).
       exists (x = dani) parent(x, leo) && male(leo).
       forall (x = dani) forall (y = leo) parent(x, y) && male(y) => son(y, x).
       exists (z = dani) son(leo, z).
     `)
     .done();
  });

  it("exists (z) daughter(anna, z)", () => {
    assertThat(kb)
     .proving("exists (z) daughter(anna, z)?")
     .equalsTo(`
       parent(dani, anna).
       exists (x = dani) parent(x, anna).
       female(anna).
       exists (x = dani) parent(x, anna) && female(anna).
       forall (x = dani) forall (y = anna) (parent(x, y) && female(y)) => daughter(y, x).
       exists (z = dani) daughter(anna, z).
     `)
     .equalsTo(`
       child(anna, mel).
       exists (y = mel) child(anna, y).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       exists (x = mel) parent(x, anna).
       female(anna).
       exists (x = mel) parent(x, anna) && female(anna).
       forall (x = mel) forall (y = anna) parent(x, y) && female(y) => daughter(y, x).
       exists (z = mel) daughter(anna, z).
     `)
     .done();
  });

  it("female(leo)", () => {
    assertThat(kb)
    .proving("female(leo)?")
    .equalsTo("false.")
    .done();
  });

  it("male(anna)", () => {
    assertThat(kb)
     .proving("male(anna)?")
     .equalsTo("false.")
     .done();
  });

  it("spouse(dani, mel)", () => {
    assertThat(kb)
     .proving("spouse(dani, mel).")
     .equalsTo(`
       spouse(mel, dani).
       forall (x = mel) forall (y = dani) spouse(x, y) => spouse(y, x).
       spouse(dani, mel).
     `)
     .done();
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
     `)
     .done();
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
     `)
     .done();
  });

  it("exists (p) spouse(dani, p)", () => {
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

  it("exists (x) spouse(mel, x)", () => {
    assertThat(kb)
     .proving("exists (x) spouse(mel, x)?")
     .equalsTo("spouse(mel, dani). exists (x = dani) spouse(mel, x).");
  });

  it("mother(dani, anna)", () => {
    assertThat(kb)
     .proving("mother(dani, anna).")
     .equalsTo(`
       female(dani).
       parent(dani, anna).
       female(dani) && parent(dani, anna) => female(dani) && parent(dani, anna).
       forall (x = dani) forall (y = anna) female(x) && parent(x, y) => mother(x, y).
       mother(dani, anna).
    `)
    .done();
  });

  it("sibling(anna, leo)", () => {
    assertThat(kb)
      .proving("sibling(anna, leo)?")
      .equalsTo(`
        parent(dani, anna).
        exists (p = dani) parent(p, anna).
        child(leo, dani).
        forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
        exists (p = dani) parent(dani, leo).
        exists (p = dani) parent(p, anna) && parent(p, leo).
        forall (x = anna) forall (y = leo) exists (p = dani) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(anna, leo).
     `)
    .equalsTo(`
        child(anna, mel).
        exists (y = mel) child(anna, y).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
        exists (p = mel) parent(p, anna).
        parent(mel, leo).
        exists (p = mel) parent(p, anna) && parent(p, leo).
        forall (x = anna) forall (y = leo) exists (p = mel) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(anna, leo).
    `);
    // .done(); returns one more instance
  });

  it("sibling(leo, anna)", () => {
    assertThat(kb)
      .proving("sibling(leo, anna)?")
      .equalsTo(`
        parent(mel, leo).
        exists (p = mel) parent(p, leo).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
        exists (p = mel) parent(mel, anna).
        exists (p = mel) parent(p, leo) && parent(p, anna).
        forall (x = leo) forall (y = anna) exists (p = mel) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(leo, anna).
     `)
     .equalsTo(`
        child(leo, dani).
        exists (y = dani) child(leo, y).
        forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
        exists (p = dani) parent(p, leo).
        parent(dani, anna).
        exists (p = dani) parent(p, leo) && parent(p, anna).
        forall (x = leo) forall (y = anna) exists (p = dani) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(leo, anna).
     `);
    // .done();
  });

  it("brother(leo, anna)", () => {
    assertThat(kb)
      .proving("brother(leo, anna)?")
      .equalsTo(`
        male(leo).
        parent(mel, leo).
        exists (p = mel) parent(p, leo).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
        exists (p = mel) parent(mel, anna).
        exists (p = mel) parent(p, leo) && parent(p, anna).
        forall (x = leo) forall (y = anna) exists (p = mel) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(leo, anna).
        male(leo) && sibling(leo, anna) => male(leo) && sibling(leo, anna).
        forall (x = leo) forall (y = anna) male(x) && sibling(x, y) => brother(x, y).
        brother(leo, anna).
    `)
    .done();
  });

  it("sister(anna, leo)", () => {
    assertThat(kb)
      .proving("sister(anna, leo)?")
      .equalsTo(`
        female(anna).
        parent(dani, anna).
        exists (p = dani) parent(p, anna).
        child(leo, dani).
        forall (x = leo) forall (y = dani) child(x, y) => parent(y, x).
        exists (p = dani) parent(dani, leo).
        exists (p = dani) parent(p, anna) && parent(p, leo).
        forall (x = anna) forall (y = leo) exists (p = dani) parent(p, x) && parent(p, y) => sibling(x, y).
        sibling(anna, leo).
        female(anna) && sibling(anna, leo) => female(anna) && sibling(anna, leo).
        forall (x = anna) forall (y = leo) female(x) && sibling(x, y) => sister(x, y).
        sister(anna, leo).
    `)
    .done();
  });

  it("uncle(ni, leo)", () => {
    assertThat(kb)
      .proving("uncle(ni, leo)?")
      .equalsTo(`
        brother(ni, mel).
        exists (y = mel) brother(ni, y).
        forall (x = ni) forall (y = mel) brother(x, y) => male(x) && sibling(x, y).
        exists (p = mel) male(ni) && sibling(ni, p).
        parent(mel, leo).
        exists (p = mel) male(ni) && sibling(ni, p) && parent(p, leo).
        forall (u = ni) forall (c = leo) exists (p = mel) male(u) && sibling(u, p) && parent(p, c) => uncle(u, c).
        uncle(ni, leo).
     `);
  });

  it("exists (u) exists (p) parent(p, leo) && sibling(u, p) && male(u)?", () => {
    assertThat(kb)
	.proving("exists (u) exists (p) parent(p, leo) && sibling(u, p) && male(u)?")
	.equalsTo(`
          parent(mel, leo).
          exists (u) exists (p = mel) parent(p, leo).
          brother(ni, mel).
          exists (x = ni) brother(x, mel).
          forall (x = ni) forall (y = mel) brother(x, y) => sibling(x, y) && male(x).
          exists (u = ni) exists (p = mel) sibling(u, mel) && male(u).
          exists (u = ni) exists (p = mel) parent(p, leo) && sibling(u, p) && male(u).
        `);
  });

  it("exists (x) uncle(x, leo)", () => {
    assertThat(kb)
     .proving("exists (x) uncle(x, leo)?")
     .equalsTo(`
      parent(mel, leo).
      exists (u) exists (p = mel) parent(p, leo).
      brother(ni, mel).
      exists (x = ni) brother(x, mel).
      forall (x = ni) forall (y = mel) brother(x, y) => sibling(x, y) && male(x).
      exists (u = ni) exists (p = mel) sibling(u, mel) && male(u).
      exists (u = ni) exists (p = mel) parent(p, leo) && sibling(u, p) && male(u).
      forall (u = ni) forall (c = leo) exists (p = mel) parent(p, c) && sibling(u, p) && male(u) => uncle(u, c).
      exists (x = ni) uncle(x, leo).
    `);
  });

  it("exists (x) exists (y) child(x, y)?", () => {
    assertThat(kb)
    .proving("exists (x) exists (y) child(x, y)?")
    .equalsTo("child(anna, mel). exists (x = anna) exists (y = mel) child(x, y).")
    .equalsTo("child(leo, dani). exists (x = leo) exists (y = dani) child(x, y).")
    // this is incorrectly capturing the variables.
    .equalsTo(`
       parent(mel, leo).
       exists (x = mel) exists (y = leo) parent(x, y).
       forall (x = leo) forall (y = leo) parent(x, y) => child(y, x).
       exists (x = leo) exists (y = leo) child(x, y).`)
    ;
  });

  it("child(ni, maura)", () => {
    // the kb is missing this relationship, so we can't infer,
    // but this is otherwise working as expected.
    assertThat(kb)
    .proving("child(ni, maura)?")
    .equalsTo("false.")
    .done();
  });

  it.skip("exists (x) sibling(x, ni)", () => {
    assertThat(kb)
    .proving("exists (x) sibling(x, ni)?")
    .equalsTo(`
    `);
  });

  it.skip("exists (x) sibling(ni, x)", () => {
    assertThat(kb)
    .proving("exists (x) sibling(ni, x)?")
    .equalsTo(`
    `);
  });

  it("grandparent(maura, anna)", () => {
    assertThat(kb)
     .proving("grandparent(maura, anna)?")
     .equalsTo(`
       parent(maura, mel).
       exists (p = mel) parent(maura, p).
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x).
       exists (p = mel) parent(mel, anna).
       exists (p = mel) parent(maura, p) && parent(p, anna).
       forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c).
       grandparent(maura, anna).
     `)
    .done();
  });

  it("grandmother(maura, leo)", () => {
    assertThat(kb)
     .proving("grandmother(maura, leo)?")
     .equalsTo(`
       female(maura).
       parent(maura, mel).
       exists (p = mel) parent(maura, p).
       parent(mel, leo).
       exists (p = mel) parent(maura, p) && parent(p, leo).
       forall (g = maura) forall (c = leo) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c).
       grandparent(maura, leo).
       female(maura) && grandparent(maura, leo) => female(maura) && grandparent(maura, leo).
       forall (g = maura) forall (c = leo) female(g) && grandparent(g, c) => grandmother(g, c).
       grandmother(maura, leo).
      `)
    .done();
  });

  function assertThat(x) {
   return {
    proving(z) {
     let result = new Reasoner(Parser.parse(x)).go(rewrite(Rule.of(z)));
     let end = false;
     return {
      done() {
       if (end) {
        return this;
       }
       this.equalsTo("false.");
       return this;
      },
      equalsTo(y) {
       let next = result.next();
       end = next.done;
       assertThat(toString(Parser.parse(next.value.toString())))
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
