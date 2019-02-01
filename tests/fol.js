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
  it("parser", function() {
    // doesn't throw a parse exception.
    Parser.parse(`
        forall(x) mortal(x). 
        exists(x) men(x).
    `);
  });

  it("parser: forall (x) forall (y) P(x, y).", function() {
    assertThat(Parser.parse("forall(x) forall(y) P(x, y)."))
      .equalsTo(program([
          forall("x",
                 forall("y", 
                        predicate("P", [argument(literal("x")), argument(literal("y"))])))
      ]));
  });

  it("parser", function() {
    // doesn't throw a parse exception.
    Parser.parse("forall(x) (king(x) && greedy(x) => evil(x)).");
  });

  it("parser - free variables", function() {
    assertThat(Rule.of("P(x?).")).equalsTo(
      predicate("P", [{
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "x"},
        free: true
      }]));
  });

  it("parser - multiple free variables", function() {
    assertThat(Rule.of("P(x?, y?).").arguments).equalsTo([{
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "x"},
        free: true
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "y"},
        free: true
      }]);
  });

  it("parser - mixed variables", function() {
    assertThat(Rule.of("P(x, y?, z).").arguments).equalsTo([{
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "x"},
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "y"},
        free: true
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "z"}
      }]);
  });

  it("parser - function args", function() {
    assertThat(Rule.of("P(Q(x)).")).equalsTo(
      predicate("P", [argument(func("Q", [argument(literal("x"))]))]));
  });

  it("parser - arg values", function() {
    assertThat(Rule.of("P(x = a)."))
     .equalsTo(predicate("P", [argument(literal("x"), literal("a"))]));
  });

  it("Rewrite: forall(x) P(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x).");
    let expects = Rule.of("P(x).");
    expects.arguments[0].free = true;
    expects.quantifiers = [forall("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) P(x) && Q(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x) && Q(x).");
    let expects = Rule.of("P(x) && Q(x).");
    expects.left.arguments[0].free = true;
    expects.right.arguments[0].free = true;
    expects.quantifiers = [forall("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) P(x) => Q(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x) => Q(x).");
    let expects = Rule.of("P(x) => Q(x).");
    expects.left.arguments[0].free = true;
    expects.right.arguments[0].free = true;
    expects.quantifiers = [forall("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) ~P(x)", function() {
    let {statements} = Parser.parse("forall (x) ~P(x).");
    let expects = Rule.of("~P(x).");
    expects.expression.arguments[0].free = true;
    expects.quantifiers = [forall("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) P(x, y)", function() {
    let {statements} = Parser.parse("forall (x) P(x, y).");
    let expects = Rule.of("P(x, y).");
    expects.arguments[0].free = true;
    expects.quantifiers = [forall("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) forall (y) P(x, y)", function() {
    let {statements} = Parser.parse("forall (x) forall (y) P(x, y).");
    let expects = Rule.of("P(x, y).");
    expects.arguments[0].free = true;
    expects.arguments[1].free = true;
    expects.quantifiers = [forall("x"), forall("y")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall(x) forall (y) ~P(x, y, c)", function() {
    let {statements} = Parser.parse("forall (x) forall (y) ~P(x, y, c).");
    let expects = Rule.of("~P(x, y, c).");
    expects.expression.arguments[0].free = true;
    expects.expression.arguments[1].free = true;
    expects.quantifiers = [forall("x"), forall("y")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: exists (x) P(x) == P(x)", function() {
    let {statements} = Parser.parse("exists (x) P(x).");
    let expects = Rule.of("P(x).");
    expects.arguments[0].free = true;
    expects.quantifiers = [exists("x")];
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it.skip("multiple variables", function() {
    // TODO(goto): the following fails, figure out
    // why.
    Parser.parse(`
        forall(x, y) mortal(x, y).
    `);
  });

  let literal = (x) => {return {"@type": "Literal", "name": x}};

  it("Unify(P(a), P(a))", function() {
    assertThat(unify(Rule.of("P(a)."), Rule.of("P(a).")))
     .equalsTo({});
  });

  it("Unify(P(a, b), P(a, b))", function() {
    assertThat(unify(Rule.of("P(a, b)."), Rule.of("P(a, b).")))
     .equalsTo({});
  });

  it("Unify(P(a), P(x?))", function() {
    assertThat(unify(Rule.of("P(a)."), Rule.of("P(x?).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(a, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": literal("b")});
  });

  it("Unify(P(y?, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(y?, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": literal("b"), "y": literal("a")});
  });

  it("Unify(P(p?, q?), P(x, y))", function() {
    assertThat(unify(Rule.of("a(p?, q?)."), Rule.of("a(x, y).")))
     .equalsTo({"p": literal("x"), "q": literal("y")});
  });

  it("Unify(P(Q(a)), P(x?))", function() {
    assertThat(unify(Rule.of("P(Q(a))."), Rule.of("P(x?).")))
     .equalsTo({"x": {
        "@type": "Function",
        "name": "Q",
        "arguments": [{
          "@type": "Argument",
          "literal": {
           "@type": "Literal",
            "name": "a"
          }
        }] 
      }
     });
  });

  it("Unify(P(Q(a)), P(x?))", function() {
    assertThat(unify(Rule.of("P(Q(a))."), Rule.of("P(x?).")))
     .equalsTo({"x": func("Q", [argument(literal("a"))])});
  });

  // disjunctions
  it("Unify(P(Q(a)), P(Q(x?)))", function() {
    assertThat(unify(Rule.of("P(Q(a))."), Rule.of("P(Q(x?)).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a) && Q(b), P(x?) && Q(b))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(x?) && Q(b).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a) && Q(b), P(a) && Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(a) && Q(x?).")))
     .equalsTo({"x": literal("b")});
  });

  // conjunctions
  it("Unify(P(a) || Q(b), P(x?) || Q(b))", function() {
    assertThat(unify(Rule.of("P(a) || Q(b)."), Rule.of("P(x?) || Q(b).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a) || Q(b), P(a) || Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) || Q(b)."), Rule.of("P(a) || Q(x?).")))
     .equalsTo({"x": literal("b")});
  });

  // implication
  it("Unify(P(a) => Q(b), P(x?) => Q(b))", function() {
    assertThat(unify(Rule.of("P(a) => Q(b)."), Rule.of("P(x?) => Q(b).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a) => Q(b), P(a) => Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) => Q(b)."), Rule.of("P(a) => Q(x?).")))
     .equalsTo({"x": literal("b")});
  });

  // unary
  it("Unify(~P(a), ~P(x?))", function() {
    assertThat(unify(Rule.of("~P(a)."), Rule.of("~P(x?).")))
     .equalsTo({"x": literal("a")});
  });

  // composition
  it("Unify(P(a) && Q(~R(b)), P(a) && Q(R(x?))", function() {
    assertThat(unify(Rule.of("P(a) && Q(R(b))."), Rule.of("P(a) && Q(R(x?)).")))
     .equalsTo({"x": literal("b")});
  });

  it("Unify(P(a) && Q(b) => ~R(c), P(a) && Q(x?) => ~R(y?)", function() {
    assertThat(unify(Rule.of("P(a) && Q(b) => ~R(c)."), Rule.of("P(a) && Q(x?) => ~R(y?).")))
     .equalsTo({"x": literal("b"), "y": literal("c")});
  });

  it("Unify(P(a, x?), P(y?, Q(y?)))", function() {
    assertThat(unify(Rule.of("P(a, x?)."), Rule.of("P(y?, Q(y?)).")))
     .equalsTo({"y": literal("a"), "x": {
        "@type": "Function",
        "name": "Q",
        "arguments": [{
          "@type": "Argument",
          "literal": {
           "@type": "Literal",
           "name": "y"
          },
          "value": {
           "@type": "Literal",
            "name": "a"
          }
        }]
     }});
  });

  // syntax forall
  it("Unify(P(a) => Q(b), forall (x) P(x?) => Q(b))", function() {
    assertThat(unify(Rule.of("P(a) => Q(b)."), Rule.of("forall (x) P(x?) => Q(b).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a, b), forall (x) forall (y) P(x?, y?))", function() {
    assertThat(unify(Rule.of("P(a, b)."), Rule.of("forall (x) forall (y) P(x?, y?).")))
     .equalsTo({"x": literal("a"), "y": literal("b")});
  });
  
  it("Unify(P(a?), P(b?))", function() {
    assertThat(unify(Rule.of("P(a?)."), Rule.of("P(b?).")))
     .equalsTo({"b": argument(literal("a"), undefined, true)});
  });

  it("Unity fails: Unify(P(a) && Q(b), P(x?) && Q(c))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(x?) && Q(c).")))
     .equalsTo(false);
  });

  it("Unity fails: Unify(P(a) && Q(b), P(x?) && Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(x?) && Q(x?).")))
     .equalsTo(false);
  });

  it("Unify fails", function() {
    assertThat(unify(Rule.of("a(x?)."), Rule.of("b(y).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y, z).")))
       .equalsTo(false);
  });

  it("Fill(P(a), P(x?))", function() {
    let rule = Rule.of("P(x?).");
    assertThat(fill(rule, unify(Rule.of("P(a)."), rule)))
     .equalsTo(Rule.of("P(x = a)."));
  });

  it("Fill(P(a) && Q(b), P(x?) && Q(b))", function() {
    let rule = Rule.of("P(x?) && Q(b).");
    assertThat(fill(rule, unify(Rule.of("P(a) && Q(b)."), rule)))
     .equalsTo(Rule.of("P(x = a) && Q(b)."));
  });

  it("Fill(P(Q(a)), P(Q(x?)))", function() {
    let rule = Rule.of("P(Q(x?)).");
    assertThat(fill(rule, unify(Rule.of("P(Q(a))."), rule)))
     .equalsTo(Rule.of("P(Q(x = a))."));
  });

  it("Fills from unification", function() {
    let unifies = unify(Rule.of("P(x?)."), Rule.of("P(Q(a))."));
    assertThat(fill(Rule.of("R(x?)."), unifies))
     .equalsTo(predicate("R", [argument(literal("x"), func("Q", [argument(literal("a"))]))]));
  });

  it("Universal introduction", function() {
    assertThat("forall(x) P(x?).")
     .proving("P(a)?")
     .equalsTo(`
       forall (x) P(x).
       P(a).
     `);
  });

  it("Generalized modus ponens", function() {
    assertThat("forall(x) men(x) => mortal(x). men(socrates).")
     .proving("mortal(socrates)?")
     .equalsTo(`
        men(socrates). 
        if (forall (x) men(x) => mortal(x) and men(socrates)) then mortal(socrates).
     `);
  });

  it("forall (x) P(x). P(a)?", function() {
    assertThat("forall (x) P(x).")
     .proving("P(a)?")
     .equalsTo("forall (x) P(x). P(a).");
  });

  it("forall (x) P(x, b). P(a, b)?", function() {
    assertThat("forall (x) P(x, b).")
     .proving("P(a, b)?")
     .equalsTo("forall (x) P(x, b). P(a, b).");
  });

  it("forall (x) P(x) && Q(x). P(a)?", function() {
    // universal conjunction elimination.
    assertThat("forall (x) P(x) && Q(x).")
     .proving("P(a)?")
     .equalsTo("forall (x) P(x = a) && Q(x = a). P(a).");
    assertThat("forall (x) P(x) && Q(x).")
     .proving("Q(a)?")
     .equalsTo("forall (x) P(x = a) && Q(x = a). Q(a).");
  });

  it("forall (x) P(x) || Q(x). ~Q(a). P(a)?", function() {
    // universal disjunctive syllogistm.
    assertThat("forall (x) P(x) || Q(x). ~Q(a).")
     .proving("P(a)?")
     .equalsTo(`
         ~Q(a). 
         ~Q(x = a). 
         forall (x) P(x) || Q(x) => P(a) || Q(a).
         P(a).
     `);

    assertThat("forall (x) P(x) || Q(x). ~P(a).")
     .proving("Q(a)?")
     .equalsTo(`
         ~P(a). 
         ~P(x = a). 
         forall (x) P(x) || Q(x) => P(a) || Q(a).
         Q(a).
     `);
  });

  it("forall (x) forall (y) p(x, y) && q(y) => r(y, x). p(a, b). q(b). |= r(b, a)?", function() {
    assertThat("forall (x) forall (y) ((p(x, y) && q(y)) => r(y, x)). p(a, b). q(b).")
     .proving("r(b, a)?")
     .equalsTo(`
        p(a, b). 
        q(b). 
        p(a, b) && q(b) => p(a, b) && q(b).
        forall (x) forall (y) p(x, y) && q(y) => r(y, x) && p(a, b) && q(b) => r(b, a).
     `);
   });

  it.skip("p(a). p(b). |= p(x?)?", function() {
    // we want to find a way to get x = [a, b] rather than
    // stop on the first match. may be useful to use a
    // generator here.
    assertThat("p(a). p(b).")
     .proving("p(x?).")
     .equalsTo("p(a). p(x = a).");
   });

  it.skip("P(a). Q(a). exists (x) P(x) && Q(x)?", function() {
    // existential conjunction introduction.
    // TODO(goto): it is probably hard to do conjunction
    // introduction with the universal quantifier.
    assertThat("P(a). Q(a).")
     .proving("exists (x) P(x) && Q(x)?")
     .equalsTo("");
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
     .equalsTo("");
   });

  it("p(a) |= exists (x) p(x).", function() {
    assertThat("p(a).")
     .proving("exists (x) p(x)?")
     .equalsTo("p(a). exists (x) p(x = a).");
   });

  it("p(a) |= p(x?).", function() {
    assertThat("p(a).")
     .proving("p(x?)?")
     .equalsTo("p(a). p(x = a).");
   });

  it("p(a). forall (x) p(x) => q(x). |= q(y?).", function() {
    assertThat("p(a). forall (x) p(x) => q(x).")
     .proving("q(y?)?")
     .equalsTo("p(a). p(x = a). forall (x) p(x) => q(x) && p(x) => q(y = x).");
   });

  it.skip("p(a). q(b). forall (x) p(x) && q(x) => r(x). |= r(x?).", function() {
    // here is an example where we are going to have to look at multiple unification
    // options before finding something that works.
    assertThat(`
       p(a). 
       q(b). 
       p(c). q(c). 
       forall (x) p(x) && q(x) => r(x).
     `)
     .proving("r(x?)?")
     .equalsTo("");
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
        if (forall (x) greedy(x) && king(x) => evil(x) and greedy(john) && king(john)) then evil(john).
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
        if (forall (x) greedy(x) && king(x) => evil(x) and greedy(father(john)) && king(father(john))) then evil(father(john)).
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
       forall (x) dean(x) => professor(x) && dean(john) => professor(john).
       forall (x) professor(x) => person(x) && professor(john) => person(john).
       criticized(lucy, john) && person(john) => criticized(lucy, john) && person(john).
       professor(lucy).
       forall (x) professor(x) => person(x) && professor(lucy) => person(lucy).
       criticized(lucy, john) && person(john) && person(lucy) => criticized(lucy, john) && person(john) && person(lucy).
       forall (x) forall (y) person(x) && person(y) && criticized(x, y) => ~friends(y, x) && criticized(lucy, john) && person(john) && person(lucy) => ~friends(john, lucy).
     `);

    assertThat(kb)
      .proving("person(sam)?")
      .equalsTo("");

    assertThat(kb)
     .proving("person(john)?")
     .equalsTo(`
       dean(john).
       forall (x) dean(x) => professor(x) && dean(john) => professor(john).
       forall (x) professor(x) => person(x) && professor(john) => person(john).
     `);

    assertThat(kb)
     .proving("person(lucy)?")
     .equalsTo(`
       professor(lucy).
       forall (x) professor(x) => person(x) && professor(lucy) => person(lucy).
     `);

    assertThat(kb)
      .proving("criticized(x?, john)?")
      .equalsTo("criticized(lucy, john). criticized(x = lucy, john).");

    // TODO(goto): add this case.
    // assertThat(kb)
    // .proving("knows(lucy, john)?")
    // .equalsTo("");
    // return;
  });

  it("big bertha", function() {
    assertThat("forall (x) on(x, table). forall (x) on(bertha, x) => collapses(x).")
     .proving("collapses(table)?")
     .equalsTo(`
       forall (x) on(x, table).
       on(bertha, table).
       forall (x) on(bertha, x) => collapses(x) && on(bertha, table) => collapses(table).
     `);

    assertThat("forall (x) on(x, table). forall (x) on(bertha, x) => collapses(x).")
     .proving("collapses(y?)?")
     .equalsTo(`
       forall (x) on(x, table).
       on(bertha, x = table).
       forall (x) on(bertha, x) => collapses(x) && on(bertha, x) => collapses(y = x).
     `);
   });

  it.skip("diet", function() {
    // nobody can see oneself. 
    assertThat("forall(x) ~sees(x, x). forall(x) ~sees(x, feet(x)) => diet(x).")
     .proving("forall(x) diet(x)?")
     .equalsTo("");
    // should be false, since feet(x?) isn't necessarily x?.
   });

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
       forall (x) forall (y) child(x, y) => parent(y, x) && child(leo, dani) => parent(dani, leo).
       female(dani) && parent(dani, leo) => female(dani) && parent(dani, leo).
       forall (x) forall (y) female(x) && parent(x, y) => mother(x, y) && female(dani) && parent(dani, leo) => mother(dani, leo).
     `);
  });

  it("grandparent", function() {
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

    let kb = `
      forall (x) forall (y) parent(x, y) => child(y, x).
      forall (x) forall (y) child(x, y) => parent(y, x).

      forall (g) forall (c) (grandparent(g, c) => (exists (p) (parent(g, p) && parent(p, c)))).
      forall (g) forall (c) ((exists (p) (parent(g, p) && parent(p, c))) => grandparent(g, c)).

      parent(maura, mel).
      child(anna, mel).
    `;
    assertThat(kb)
     .proving("exists (x) parent(maura, x?).")
     .equalsTo("parent(maura, mel). exists (x) parent(maura, x = mel).");
    // TODO(goto): we need to resolve the existential conjunction introduction
    // before this can be made to work.
    assertThat(kb)
     .proving("grandparent(maura, anna)?")
     .equalsTo(`
     `);
   });

  it("my family", function() {
    // logic from:
    // https://people.cs.pitt.edu/~milos/courses/cs2740/Lectures/class8.pdf 
    let kb = `
     forall (x) forall (y) parent(x, y) => child(y, x).
     forall (x) forall (y) child(x, y) => parent(y, x).

     forall (x) male(x) => ~female(x).
     forall (x) female(x) => ~male(x).

     forall (x) forall (y) spouse(x, y) => spouse(y, x).

     forall (x) forall (y) parent(x, y) => child(y, x).

     forall (x) forall (y) ((parent(x, y) && male(y)) => son(y, x)).
     forall (x) forall (y) ((parent(x, y) && female(y)) => daughter(y, x)).

     forall (x) forall (y) ((parent(x, y) && male(x)) => father(x, y)).
     forall (x) forall (y) ((parent(x, y) && female(x)) => mother(x, y)).

     spouse(mel, dani).

     parent(mel, leo).
     child(anna, mel).

     child(leo, dani).
     parent(dani, anna).

     male(mel).
     female(dani).

     male(leo).
     female(anna).
    `;

    assertThat(kb)
     .proving("child(leo, mel)?")
     .equalsTo(`
       parent(mel, leo).
       forall (x) forall (y) parent(x, y) => child(y, x) && parent(mel, leo) => child(leo, mel).
     `);

    assertThat(kb)
     .proving("parent(mel, anna)?")
     .equalsTo(`
       child(anna, mel).
       forall (x) forall (y) child(x, y) => parent(y, x) && child(anna, mel) => parent(mel, anna).
     `);

    assertThat(kb)
      .proving("son(leo, mel)?")
      .equalsTo(`
        male(leo).
        parent(mel, leo).
        male(leo) && parent(mel, leo) => male(leo) && parent(mel, leo).
        forall (x) forall (y) male(y) && parent(x, y) => son(y, x) && male(leo) && parent(mel, leo) => son(leo, mel).
     `);

    assertThat(kb)
      .proving("daughter(anna, mel)?")
      .equalsTo(`
        female(anna).
        child(anna, mel).
        forall (x) forall (y) child(x, y) => parent(y, x) && child(anna, mel) => parent(mel, anna).
        female(anna) && parent(mel, anna) => female(anna) && parent(mel, anna).
        forall (x) forall (y) female(y) && parent(x, y) => daughter(y, x) && female(anna) && parent(mel, anna) => daughter(anna, mel).
     `);

    // TODO(goto): this makes x = mel, which isn't right.
    // assertThat(kb)
    // .proving("daughter(x?, mel)?")
    // .equalsTo("");

    // TODO(goto): this too.
    // assertThat(kb)
    // .proving("son(x?, mel)?")
    // .equalsTo("");

    // TODO(goto): this fails.
    // assertThat(kb)
    // .proving("son(leo, ?)?")
    // .equalsTo("");

    // TODO(goto): this fails.
    // assertThat(kb)
    //  .proving("daughter(anna, x?)?")
    //  .equalsTo("");

    assertThat(kb)
     .proving("female(leo)?")
     .equalsTo("");

    assertThat(kb)
     .proving("male(anna)?")
     .equalsTo("");

    assertThat(kb)
     .proving("spouse(mel, x?).")
     .equalsTo("spouse(mel, dani). spouse(mel, x = dani).");

    assertThat(kb)
     .proving("spouse(dani, mel).")
     .equalsTo(`
       spouse(mel, dani).
       forall (x) forall (y) spouse(x, y) => spouse(y, x) && spouse(mel, dani) => spouse(dani, mel).
     `);

    assertThat(kb)
     .proving("father(mel, leo).")
     .equalsTo(`
       male(mel).
       parent(mel, leo).
       male(mel) && parent(mel, leo) => male(mel) && parent(mel, leo).
       forall (x) forall (y) male(x) && parent(x, y) => father(x, y) && male(mel) && parent(mel, leo) => father(mel, leo).
     `);

    assertThat(kb)
     .proving("father(mel, anna).")
     .equalsTo(`
       male(mel).
       child(anna, mel).
       forall (x) forall (y) child(x, y) => parent(y, x) && child(anna, mel) => parent(mel, anna).
       male(mel) && parent(mel, anna) => male(mel) && parent(mel, anna).
       forall (x) forall (y) male(x) && parent(x, y) => father(x, y) && male(mel) && parent(mel, anna) => father(mel, anna).
     `);

    assertThat(kb)
     .proving("mother(dani, anna).")
     .equalsTo(`
       female(dani).
       parent(dani, anna).
       female(dani) && parent(dani, anna) => female(dani) && parent(dani, anna).
       forall (x) forall (y) female(x) && parent(x, y) => mother(x, y) && female(dani) && parent(dani, anna) => mother(dani, anna).
     `);

    // TODO(goto): this fails.
    // assertThat(kb)
    // .proving("spouse(dani, x?).")
    // .equalsTo("");
   });

  function assertThat(x) {
   return {
    proving(z) {
     let result = explain(new Reasoner(Parser.parse(x)).backward(rewrite(Rule.of(z))));
     return {
      equalsTo(y) {
       assertThat(toString(Parser.parse(result)))
        .equalsTo(toString(Parser.parse(y)));
      }
     };
    },
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

