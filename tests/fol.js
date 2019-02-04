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

describe("First order logic", function() {
  it("forall (x) P(x). P(a)?", function() {
    // universal introduction.
    assertThat("forall (x) P(x).")
     .proving("P(a)?")
     .equalsTo(`
       forall (x) P(x).
       P(a).
     `)
     .done();
  });

  it("forall (x) P(x) && Q(x). P(a)?", function() {
    // universal introduction.
    assertThat("forall (x) P(x) && Q(x).")
     .proving("P(a)?")
     .equalsTo(`
       forall (x = a) P(x) && Q(x).
       P(a).
     `)
     .done();
  });

  it("Generalized modus ponens", function() {
    assertThat("forall(x) men(x) => mortal(x). men(socrates).")
     .proving("mortal(socrates)?")
     .equalsTo(`
        men(socrates). 
        forall (x = socrates) men(x) => mortal(x).
        mortal(socrates).
     `)
     .done();
  });

  it("forall (x) P(x). P(a)?", function() {
    assertThat("forall (x) P(x).")
     .proving("P(a)?")
     .equalsTo("forall (x) P(x). P(a).")
     .done();
  });

  it("Unify() implication", function() {
    // this can't be unified because ultimately, 
    // exists (y) q(y) can't be unified with
    // forall (x) q(x) between x and y.
    assertThat(unify(rewrite(Rule.of("forall (x) p(x) => q(x).")).right,
                     rewrite(Rule.of("exists (y) q(y)."))))
     .equalsTo(false);
  });

  it("forall (x) p(x) => q(x). p(a). q(a)?", function() {
    assertThat("forall (x) p(x) => q(x). p(a).")
     .proving("q(a)?")
     .equalsTo(`
       p(a).
       forall (x = a) p(x) => q(x).
       q(a).
     `)
     .done();
  });

  it("forall (x) p(x) => q(x). p(a). exists (y) q(y)?", function() {
    assertThat("forall (x) p(x) => q(x). p(a).")
     .proving("exists (y) q(y)?")
     .equalsTo(`
       p(a).
       exists (x = a) p(x).
       forall (x = a) p(x) => q(x).
       exists (y = a) q(y).
     `)
     .done();
  });

  it("forall (x) P(x, b). P(a, b)?", function() {
    assertThat("forall (x) P(x, b).")
     .proving("P(a, b)?")
     .equalsTo("forall (x) P(x, b). P(a, b).")
     .done();
  });

  it("forall (x) P(x) && Q(x). P(a)?", function() {
    // universal conjunction elimination.
    assertThat("forall (x) P(x) && Q(x).")
     .proving("P(a)?")
     .equalsTo("forall (x = a) P(x) && Q(x). P(a).")
     .done();
    assertThat("forall (x) P(x) && Q(x).")
     .proving("Q(a)?")
     .equalsTo("forall (x = a) P(x) && Q(x). Q(a).")
     .done();
  });

  it("forall (x) P(x) || Q(x). ~Q(a). P(a)?", function() {
    // universal disjunctive syllogistm.
    assertThat("forall (x) P(x) || Q(x). ~Q(a).")
     .proving("P(a)?")
     .equalsTo(`
         ~Q(a). 
         forall (x = a) P(x) || Q(x) => P(a).
     `).
     done();

    assertThat("forall (x) P(x) || Q(x). ~P(a).")
     .proving("Q(a)?")
     .equalsTo(`
         ~P(a). 
         forall (x = a) P(x) || Q(x) => Q(a).
     `)
     .done();
  });

  it("forall (x) forall (y) p(x, y) && q(y) => r(y, x). p(a, b). q(b). |= r(b, a)?", function() {
    assertThat("forall (x) forall (y) ((p(x, y) && q(y)) => r(y, x)). p(a, b). q(b).")
     .proving("r(b, a)?")
     .equalsTo(`
        p(a, b). 
        q(b). 
        p(a, b) && q(b) => p(a, b) && q(b).
        forall (x = a) forall (y = b) p(x, y) && q(y) => r(y, x).
        r(b, a).
     `);
    // TODO(goto): there is another production here which doesn't look right.
   });

  it("p(a). p(b). |= p(x)?", function() {
    assertThat("p(a). p(b).").proving("exists (x) p(x)?")
     .equalsTo("p(a). exists (x = a) p(x).")
     .equalsTo("p(b). exists (x = b) p(x).")
     .done();
   });

  it("P(a). Q(a). exists (x) P(x) && Q(x)?", function() {
    assertThat("P(a). Q(a). ")
     .proving("exists (x) P(x) && Q(x)?")
     .equalsTo(`
       P(a).
       exists (x = a) P(x).
       Q(a).
       exists (x = a) P(x) && Q(x).
     `);
  });

  it("P(a). exists (x) P(x)?", function() {
    // existential conjunction introduction.
    assertThat("P(a).")
     .proving("exists (x) P(x)?")
     .equalsTo(`
       P(a).
       exists (x = a) P(x).
     `)
     .done();
  });

  it("P(a). Q(a). exists (x) P(x) && Q(x)?", function() {
    // existential conjunction introduction.
    // TODO(goto): it is probably hard to do conjunction
    // introduction with the universal quantifier.
    assertThat("P(a). Q(a).")
     .proving("exists (x) P(x) && Q(x)?")
     .equalsTo(`
       P(a).
       exists (x = a) P(x).
       Q(a).
       exists (x = a) P(x) && Q(x).
     `)
     .done();
  });

  it("a(x) => b(x), a(x) |= b(x)", function() {
    // modus ponens.
    let {Backward} = require("../src/backward.js");
    let {explain} = require("../src/forward.js");
    let kb = Parser.parse("a(x) => b(x). a(x).");
    let result = new Backward(kb)
     .backward(Rule.of("b(x)?"));
  });

  it("a(x) => b(x). a(x). |= b(x)", function() {
    // modus ponens.
    assertThat("a(x) => b(x). a(x).")
     .proving("b(x)?")
     .equalsTo("a(x). if (a(x) => b(x) and a(x)) then b(x).");
  });

  it("a(x), b(x) |= a(x) && b(x)", function() {
    // conjunction introduction.
    assertThat("a(x). b(x).")
     .proving("a(x) && b(x)?")
     .equalsTo("a(x). b(x). if (a(x) and b(x)) then a(x) && b(x).");
  });

  it("a(x) |= a(x) || b(x)", function() {
    // disjunction introduction.
    assertThat("a(x).")
     .proving("a(x) || b(x)?")
     .equalsTo("a(x). if (a(x)) then a(x) || b(x).");
  });

  it("a(x) => b(x), ~b(x) |= ~a(x)?", function() {
    assertThat(`
      a(x) => b(x).
      ~b(x).
    `)
     .proving("~a(x)?")
     .equalsTo(`
      ~b(x).
      a(x) => b(x) && ~b(x) => ~a(x).
    `);
   });

  it("a(x) || b(x), ~a(x) |= b(x)?", function() {
    assertThat(`
       a(x) || b(x).
       ~a(x).
    `)
     .proving("b(x)?")
     .equalsTo(`
       ~a(x).
       a(x) || b(x) && ~a(x) => b(x).
    `);
   });

  it("a(x) || b(x), ~b(x) |= a(x)?", function() {
    assertThat("a(x) || b(x). ~b(x).")
    .proving("a(x)?")
    .equalsTo("~b(x). a(x) || b(x) && ~b(x) => a(x).");
   });

  it("a(x) |= a(x) || b(x)?", function() {
    assertThat("a(x).")
     .proving("a(x) || b(x)?")
     .equalsTo("a(x). a(x) => a(x) || b(x).");
   });

  it("a(x) |= b(x) || a(x)?", function() {
    assertThat("a(x).")
    .proving("b(x) || a(x)?")
    .equalsTo("a(x). a(x) => b(x) || a(x).");
   });

  it("a(x) && b(x) |= a(x)?", function() {
    assertThat("a(x) && b(x).")
    .proving("a(x).")
    .equalsTo("a(x) && b(x) => a(x).");
   });

  it("b(x) && a(x) |= a(x)?", function() {
    assertThat("b(x) && a(x).")
     .proving("a(x).")
     .equalsTo("b(x) && a(x) => a(x).");
   });

  it("a(x), b(x) |= a(x) && b(x)?", function() {
    assertThat("a(x). b(x).")
    .proving("a(x) && b(x)?")
    .equalsTo("a(x). b(x). a(x) && b(x) => a(x) && b(x).");
   });

  it("a(x) => b(x), b(x) => c(x) |= a(x) => c(x)?", function() {
    assertThat("a(x) => b(x). b(x) => c(x).")
     .proving("a(x) => c(x)?")
     .equalsTo("((a(x) => b(x)) && (b(x) => c(x))) => (a(x) => c(x)).");
   });

  it("(a(x) => c(x)) && (b(x) => d(x)), a(x) || b(x) |= c(x) || d(x)", function() {
    assertThat("a(x) => c(x). b(x) => d(x). a(x) || b(x).")
     .proving("c(x) || d(x)?")
     .equalsTo("if ((a(x) => c(x)) and (b(x) => d(x)) and (a(x) || b(x))) then c(x) || d(x).");
   });

  it("a(x) => b(x) |= a(x) => (a(x) && b(x))", function() {
    assertThat("a(x) => b(x).")
     .proving("a(x) => (a(x) && b(x))?")
     .equalsTo("if (a(x) => b(x)) then a(x) => a(x) && b(x).");
   });

  it("p(x) |~ p(y)?", function() {
    assertThat("p(x).")
     .proving("p(y)?")
     .equalsTo("false.");
   });

  it("p(a) |= exists (x) p(x).", function() {
    assertThat("p(a).")
     .proving("exists (x) p(x)?")
     .equalsTo("p(a). exists (x = a) p(x).")
     .done();
   });

  it("p(a) |= p(x?).", function() {
    assertThat("p(a).")
     .proving("exists (x) p(x)?")
     .equalsTo("p(a). exists (x = a) p(x).")
     .done();
   });

  it("p(a). forall (x) p(x) => q(x). |= q(y?).", function() {
    assertThat("p(a). forall (x) p(x) => q(x).")
     .proving("exists (y) q(y)?")
     .equalsTo(`
       p(a). 
       exists (x = a) p(x). 
       forall (x = a) p(x) => q(x).
       exists (y = a) q(y).
     `)
     .done();
   });

  it("p(a). q(b). forall (x) p(x) && q(x) => r(x). |= r(c).", function() {
    assertThat(`
       p(a). 
       q(b). 
       p(c). q(c). 
       forall (x) (p(x) && q(x)) => r(x).
     `)
     .proving("r(c)?")
     .equalsTo(`
       p(c).
       q(c).
       p(c) && q(c) => p(c) && q(c).
       forall (x = c) p(x) && q(x) => r(x).
       r(c).
     `);
  });

  it("p(a). q(a). p(b). q(b). p(c). q(c). |= exists (x) p(x) && q(x). ", function() {
    assertThat(`
      p(a). q(a). 
      p(b). q(b). 
      p(c).
      q(d). 
      p(e). q(e).
    `)
    .proving("exists (x) p(x) && q(x)?")
    .equalsTo(`
       p(a).
       exists (x = a) p(x).
       q(a).
       exists (x = a) p(x) && q(x).
     `)
    .equalsTo(`
       p(b).
       exists (x = b) p(x).
       q(b).
       exists (x = b) p(x) && q(x).
     `)
    .equalsTo(`
       p(e).
       exists (x = e) p(x).
       q(e).
       exists (x = e) p(x) && q(x).
     `)
    .done();
  });

  it("p(a). q(b). p(c). q(c). forall (x) p(x) && q(x) => r(x). |= r(x?).", function() {
    // TODO(goto): deal with re-writing variables.
    assertThat(`
       p(a). 
       q(b). 
       p(c). q(c). 
       p(d). q(d). 
       forall (x) (p(x) && q(x)) => r(x).
     `)
     .proving("exists (z) r(z)?")
     .equalsTo(`
       p(c).
       exists (x = c) p(x).
       q(c).
       exists (x = c) p(x) && q(x).
       forall (x = c) p(x) && q(x) => r(x).
       exists (z = c) r(z).
     `)
     .equalsTo(`
       p(d).
       exists (x = d) p(x).
       q(d).
       exists (x = d) p(x) && q(x).
       forall (x = d) p(x) && q(x) => r(x).
       exists (z = d) r(z).
     `)
     .done();
   });

  it("greedy(x) && king(x) => evil(x). greedy(john). king(john). evil(john)?", function() {
    assertThat(`
        forall(x) ((greedy(x) && king(x)) => evil(x)).
        greedy(john).
        king(john).
    `)
     .proving("evil(john)?")
     .equalsTo(`
        greedy(john).
        king(john).
        if (greedy(john) && king(john)) then greedy(john) && king(john).
        forall (x = john) greedy(x) && king(x) => evil(x).
        evil(john).
     `);
  });

  it("greedy(x) && king(x) => evil(x). greedy(father(john)). king(father(john)). evil(father(john))?", function() {
    assertThat(`
        forall(x) (greedy(x) && king(x)) => evil(x).
        greedy(father(john)).
        king(father(john)).
    `)
     .proving("evil(father(john))?")
     .equalsTo(`
        greedy(father(john)).
        king(father(john)).
        if (greedy(father(john)) && king(father(john))) then greedy(father(john)) && king(father(john)).
        forall (x = father(john)) greedy(x) && king(x) => evil(x).
        evil(father(john)).
     `);
  });

  it("students and professors", function() {
    const kb = `
      professor(lucy).
      forall (x) professor(x) => person(x).
      dean(john).
      forall (x) exists (y) friends(y, x).
      forall (x) dean(x) => professor(x).
      forall (x) forall(y) (professor(x) && dean(y)) => (friends(x, y) || ~knows(x, y)).
      forall (x) forall (y) (person(x) && person(y) && criticized(x, y)) => ~friends(y, x).
      criticized(lucy, john).
     `;

    assertThat(kb)
     .proving("~friends(john, lucy)?")
     .equalsTo(`
       criticized(lucy, john).
       dean(john).
       forall (x = john) dean(x) => professor(x).
       professor(john).
       forall (x = john) professor(x) => person(x).
       person(john).
       criticized(lucy, john) && person(john) => criticized(lucy, john) && person(john).
       professor(lucy).
       forall (x = lucy) professor(x) => person(x).
       person(lucy).
       criticized(lucy, john) && person(john) && person(lucy) => criticized(lucy, john) && person(john) && person(lucy).
       forall (x = lucy) forall (y = john) person(x) && person(y) && criticized(x, y) => ~friends(y, x).
       ~friends(john, lucy).
     `);

    assertThat(kb)
      .proving("person(sam)?")
      .equalsTo("false.");

    assertThat(kb)
     .proving("person(john)?")
     .equalsTo(`
       dean(john).
       forall (x = john) dean(x) => professor(x).
       professor(john).
       forall (x = john) professor(x) => person(x).
       person(john).
     `);

    assertThat(kb)
     .proving("person(lucy)?")
     .equalsTo(`
       professor(lucy).
       forall (x = lucy) professor(x) => person(x).
       person(lucy).
     `);

    assertThat(kb)
      .proving("exists (x) criticized(x, john)?")
      .equalsTo("criticized(lucy, john). exists (x = lucy) criticized(x, john).");

    // TODO(goto): add this case.
    // assertThat(kb)
    // .proving("~knows(lucy, john)?")
    // .equalsTo("");
  });

  it("forall (x) p(x, a). p(b, a)?", () => {
    // universal introduction
    assertThat("forall (x) p(x, a).")
    .proving("p(b, a)?")
    .equalsTo("forall (x) p(x, a). p(b, a).");
  });

  it("forall (x) p(x, b). exists (x) p(a, x)?", () => {
    assertThat("forall (x) p(x, b).")
    .proving("exists (x) p(a, x)?")
    .equalsTo("forall (x) p(x, b). exists (x = b) p(a, x).");
  });

  it("forall (x) p(x). exists (x) p(x)?", () => {
    // You have to be able to find x to something
    // concrete to say exists (x).
    assertThat("forall (x) p(x).")
    .proving("exists (x) p(x)?")
    .equalsTo("false.");
  });

  it("forall (x) p(x, a). forall (y) p(b, y) => q(y). exists (x) q(x)?", () => {
    assertThat("forall (x) p(x, a). forall (y) p(b, y) => q(y).")
    .proving("q(a)?")
    .equalsTo(`
      forall (x) p(x, a).
      p(b, a).
      forall (y = a) p(b, y) => q(y).
      q(a).
    `);
  });

  it("forall (x) p(x, a). forall (y) p(b, y) => q(y). exists (x) q(x)?", () => {
    assertThat("forall (x) p(x, a). forall (y) p(b, y) => q(y).")
    .proving("exists (z) q(z)?")
    .equalsTo(`
      forall (x) p(x, a).
      exists (y = a) p(b, y).
      forall (y = a) p(b, y) => q(y).
      exists (z = a) q(z).
    `);
  });

  it("collapses(table)?", function() {
    assertThat("forall (x) on(x, table). forall (y) on(bertha, y) => collapses(y).")
     .proving("collapses(table)?")
     .equalsTo(`
       forall (x) on(x, table).
       on(bertha, table).
       forall (y = table) on(bertha, y) => collapses(y).
       collapses(table).
    `);
   });

  it.skip("exists (y) collapses(y)?", function() {
    assertThat("forall (x) on(x, table). forall (x) on(bertha, x) => collapses(x).")
     .proving("exists (y) collapses(y)?")
     .equalsTo(`
       forall (x) on(x, table).
       exists (x = table) on(bertha, x).
       forall (x = table) on(bertha, x) => collapses(x) => collapses(y = x).
     `)
     .done();
   });

  it("diet", function() {
    // nobody can see oneself. 
    assertThat("forall(x) ~sees(x, x). forall(x) ~sees(x, feet(x)) => diet(x).")
     .proving("forall(x) diet(x)?")
     .equalsTo("false.");
    // should be false, since feet(x?) isn't necessarily x?.
   });

  it("generators", () => {
    function* a() {
     yield 1;
     yield 2;
    };

    let it = a();

    assertThat(it.next().value).equalsTo(1);
    assertThat(it.next().value).equalsTo(2);
    assertThat(it.next().done).equalsTo(true);

    let foo = new class {
      hello() { return 1; }
      *world() { yield 2; }
    }();

    assertThat(foo.hello()).equalsTo(1);
    assertThat(foo.world().next().value).equalsTo(2);

    function* loop() {
     yield 1;
     yield 2;
     yield 3;
    }

    let sum = 0;
    for (let i of loop()) {
     sum += i;
    }

    assertThat(sum).equalsTo(6);

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

