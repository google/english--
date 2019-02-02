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

  it("parser - values in forall", function() {
    assertThat(Rule.of("forall(x = mel) p(x)."))
     .equalsTo(forall("x", predicate("p", [argument(literal("x"))]), literal("mel")));
  });

  it("parser - values in forall", function() {
    let result = Rule.of("if (forall (x = socrates)  men(x) => mortal(x)) then (mortal(socrates)).");
    assertThat(stringify(result))
     .equalsTo("forall (x = socrates) men(x) => mortal(x) => mortal(socrates)");
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
    // console.log(JSON.stringify(unify(Rule.of("P(a, x?)."), Rule.of("P(y?, Q(y?)).")), undefined, 2));
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
     `)
     .done();
  });

  it("Generalized modus ponens", function() {
    assertThat("forall(x) men(x) => mortal(x). men(socrates).")
     .proving("mortal(socrates)?")
     .equalsTo(`
        men(socrates). 
        forall (x = socrates) men(x) => mortal(x) => mortal(socrates).
     `)
     .done();
  });

  it("forall (x) P(x). P(a)?", function() {
    assertThat("forall (x) P(x).")
     .proving("P(a)?")
     .equalsTo("forall (x) P(x). P(a).")
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
        forall (x = a) forall (y = b) p(x, y) && q(y) => r(y, x) => r(b, a).
     `);
    // TODO(goto): there is another production here which doesn't look right.
   });

  it("p(a). p(b). |= p(x?)?", function() {
    assertThat("p(a). p(b).").proving("p(x?).")
     .equalsTo("p(a). p(x = a).")
     .equalsTo("p(b). p(x = b).")
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
     .proving("p(x?).")
     .equalsTo("p(a). p(x = a).")
     .done();
   });

  it("p(a). forall (x) p(x) => q(x). |= q(y?).", function() {
    // TODO(goto): sanity check if this is right. seems a bit off
    // to me to explain this as forall (x = a) p(x).
    // should this be exists (x = a) p(x)?
    assertThat("p(a). forall (x) p(x) => q(x).")
     .proving("q(y?)?")
     .equalsTo("p(a). exists (x = a) p(x). forall (x = a) p(x) => q(x) => q(y = x).")
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
       forall (x = c) p(x) && q(x) => r(x) => r(c).
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
     .proving("r(z?)?")
     .equalsTo(`
       p(c).
       exists (x = c) p(x).
       q(c).
       exists (x = c) p(x) && q(x).
       forall (x = c) p(x) && q(x) => r(x) => r(z = x).
     `)
     .equalsTo(`
       p(d).
       exists (x = d) p(x).
       q(d).
       exists (x = d) p(x) && q(x).
       forall (x = d) p(x) && q(x) => r(x) => r(z = x).
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
        if (forall (x = john) greedy(x) && king(x) => evil(x)) then evil(john).
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
        if (forall (x = father(john)) greedy(x) && king(x) => evil(x)) then evil(father(john)).
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
       forall (x = john) dean(x) => professor(x) => professor(john).
       forall (x = john) professor(x) => person(x) => person(john).
       criticized(lucy, john) && person(john) => criticized(lucy, john) && person(john).
       professor(lucy).
       forall (x = lucy) professor(x) => person(x) => person(lucy).
       criticized(lucy, john) && person(john) && person(lucy) => criticized(lucy, john) && person(john) && person(lucy).
       forall (x = lucy) forall (y = john) criticized(x, y) && person(y) && person(x) => ~friends(y, x) => ~friends(john, lucy).
     `);

    assertThat(kb)
      .proving("person(sam)?")
      .equalsTo("false.");

    assertThat(kb)
     .proving("person(john)?")
     .equalsTo(`
       dean(john).
       forall (x = john) dean(x) => professor(x) => professor(john).
       forall (x = john) professor(x) => person(x) => person(john).
     `);

    assertThat(kb)
     .proving("person(lucy)?")
     .equalsTo(`
       professor(lucy).
       forall (x = lucy) professor(x) => person(x) => person(lucy).
     `);

    assertThat(kb)
      .proving("criticized(x?, john)?")
      .equalsTo("criticized(lucy, john). criticized(x = lucy, john).");

    // TODO(goto): add this case.
    // assertThat(kb)
    // .proving("~knows(lucy, john)?")
    // .equalsTo("");
  });

  it("big bertha", function() {
    assertThat("forall (x) on(x, table). forall (y) on(bertha, y) => collapses(y).")
     .proving("collapses(table)?")
     .equalsTo(`
       forall (x) on(x, table).
       on(bertha, table).
       forall (y = table) on(bertha, y) => collapses(y) => collapses(table).
     `);

    assertThat("forall (x) on(x, table). forall (x) on(bertha, x) => collapses(x).")
     .proving("collapses(y?)?")
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
       forall (x = leo) forall (y = dani) child(x, y) => parent(y, x) => parent(dani, leo).
       female(dani) && parent(dani, leo) => female(dani) && parent(dani, leo).
       forall (x = dani) forall (y = leo) female(x) && parent(x, y) => mother(x, y) => mother(dani, leo).
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
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
       exists (p = mel) parent(maura, p) && parent(p, anna).
       forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c) => grandparent(maura, anna).
     `)
     .done();
   });

  it("capturing daughters", () => {
    // TODO(goto): this is returning a single daughter.
    assertThat(`
     forall (x) forall (y) parent(x, y) => child(y, x).
     forall (x) forall (y) child(x, y) => parent(y, x).
     forall (x) forall (y) ((parent(x, y) && female(y)) => daughter(y, x)).
     child(dani, marcia).
     child(thais, marcia).
     female(dani).
     female(thais).
    `)
    .proving("daughter(z?, marcia)?")
    .equalsTo(`
      female(dani).
      exists (y = dani) female(y).
      child(dani, marcia).
      forall (x = dani) forall (y = marcia) child(x, y) => parent(y, x) => parent(marcia, dani).
      exists (y = dani) female(y) && parent(marcia, y).
      forall (x = marcia) forall (y = dani) female(y) && parent(x, y) => daughter(y, x) => daughter(z = y, marcia).
    `)
    .equalsTo(`
      female(thais).
      exists (y = thais) female(y).
      child(thais, marcia).
      forall (x = thais) forall (y = marcia) child(x, y) => parent(y, x) => parent(marcia, thais).
      exists (y = thais) female(y) && parent(marcia, y).
      forall (x = marcia) forall (y = thais) female(y) && parent(x, y) => daughter(y, x) => daughter(z = y, marcia).
    `)
    .done();
  });

  it("sons", () => {
    assertThat(`
       forall (x) forall (y) ((parent(x, y) && male(y)) => son(y, x)).
       parent(mel, leo).
       male(leo).
    `)
    .proving("son(z?, mel)?")
    .equalsTo(`
      male(leo).
      exists (y = leo) male(y).
      parent(mel, leo).
      exists (y = leo) male(y) && parent(mel, y).
      forall (x = mel) forall (y = leo) male(y) && parent(x, y) => son(y, x) => son(z = y, mel).
    `)
    .done();
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

     forall (g) forall (c) grandparent(g, c) => (exists (p) (parent(g, p) && parent(p, c))).
     forall (g) forall (c) (exists (p) (parent(g, p) && parent(p, c))) => grandparent(g, c).

     forall (g) forall (c) ((grandparent(g, c) && male(g)) => grandfather(g, c)).
     forall (g) forall (c) ((grandparent(g, c) && female(g)) => grandmother(g, c)).

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
    `;

    assertThat(kb)
     .proving("child(leo, mel)?")
     .equalsTo(`
       parent(mel, leo).
       forall (x = mel) forall (y = leo) parent(x, y) => child(y, x) => child(leo, mel).
     `);

    assertThat(kb)
     .proving("parent(mel, anna)?")
     .equalsTo(`
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
     `);

    assertThat(kb)
      .proving("son(leo, mel)?")
      .equalsTo(`
        male(leo).
        parent(mel, leo).
        male(leo) && parent(mel, leo) => male(leo) && parent(mel, leo).
        forall (x = mel) forall (y = leo) male(y) && parent(x, y) => son(y, x) => son(leo, mel).
     `);

    assertThat(kb)
      .proving("daughter(anna, mel)?")
      .equalsTo(`
        female(anna).
        child(anna, mel).
        forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
        female(anna) && parent(mel, anna) => female(anna) && parent(mel, anna).
        forall (x = mel) forall (y = anna) female(y) && parent(x, y) => daughter(y, x) => daughter(anna, mel).
     `);

    // TODO(goto): this isn't entirely correct, because
    // son(leo, dani) is also true as well as daughter(anna, mel).
    assertThat(kb)
     .proving("son(leo, z?).")
     .equalsTo(`
       male(leo).
       parent(mel, leo).
       parent(x = mel, leo).
       exists (x) male(leo) && parent(x, leo).
       forall (x) forall (y = leo) male(y) && parent(x, y) => son(y, x) => son(leo, z = x).
     `)
     .done();

    assertThat(kb)
     .proving("daughter(anna, z?)?")
     .equalsTo(`
       female(anna).
       parent(dani, anna).
       parent(x = dani, anna).
       exists (x) female(anna) && parent(x, anna).
       forall (x) forall (y = anna) female(y) && parent(x, y) => daughter(y, x) => daughter(anna, z = x).
     `)
     .done();

    assertThat(kb)
     .proving("female(leo)?")
     .equalsTo("false.");

    assertThat(kb)
     .proving("male(anna)?")
     .equalsTo("false.");

    assertThat(kb)
     .proving("spouse(dani, mel).")
     .equalsTo(`
       spouse(mel, dani).
       forall (x = mel) forall (y = dani) spouse(x, y) => spouse(y, x) => spouse(dani, mel).
     `);

    assertThat(kb)
     .proving("father(mel, leo).")
     .equalsTo(`
       male(mel).
       parent(mel, leo).
       male(mel) && parent(mel, leo) => male(mel) && parent(mel, leo).
       forall (x = mel) forall (y = leo) male(x) && parent(x, y) => father(x, y) => father(mel, leo).
     `);

    assertThat(kb)
     .proving("father(mel, anna).")
     .equalsTo(`
       male(mel).
       child(anna, mel).
       forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
       male(mel) && parent(mel, anna) => male(mel) && parent(mel, anna).
       forall (x = mel) forall (y = anna) male(x) && parent(x, y) => father(x, y) => father(mel, anna).
     `);

    assertThat(kb)
     .proving("mother(dani, anna).")
     .equalsTo(`
       female(dani).
       parent(dani, anna).
       female(dani) && parent(dani, anna) => female(dani) && parent(dani, anna).
       forall (x = dani) forall (y = anna) female(x) && parent(x, y) => mother(x, y) => mother(dani, anna).
     `);

    // TODO(goto): these are causing an infinite loop somewhere in our
    // moden ponus generator.

    //assertThat(kb)
    // .proving("grandparent(maura, anna)?")
    // .equalsTo(`
    //   parent(maura, mel).
    //   exists (p = mel) parent(maura, p).
    //   child(anna, mel).
    //   forall (x = anna) forall (y = mel) child(x, y) => parent(y, x)  => parent(mel, anna).
    //   exists (p = mel) parent(maura, p) && parent(p, anna).
    //   forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c) => grandparent(maura, anna).
    // `);

    //assertThat(kb)
    // .proving("grandmother(maura, anna)?")
    // .equalsTo(`
    //   female(maura).
    //   parent(maura, mel).
    //   exists (p = mel) parent(maura, p).
    //   child(anna, mel).
    //   forall (x = anna) forall (y = mel) child(x, y) => parent(y, x) => parent(mel, anna).
    //   exists (p = mel) parent(maura, p) && parent(p, anna).
    //   forall (g = maura) forall (c = anna) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c) => grandparent(maura, anna).
    //   female(maura) && grandparent(maura, anna) => female(maura) && grandparent(maura, anna).
    //   forall (g = maura) forall (c = anna) female(g) && grandparent(g, c) => grandmother(g, c) => grandmother(maura, anna).
    // `);

    // assertThat(kb)
    // .proving("grandmother(maura, leo)?")
    //  .equalsTo(`
    //   female(maura).
    //   parent(maura, mel).
    //   exists (p = mel) parent(maura, p).
    //   parent(mel, leo).
    //   exists (p = mel) parent(maura, p) && parent(p, leo).
    //   forall (g = maura) forall (c = leo) exists (p = mel) parent(g, p) && parent(p, c) => grandparent(g, c) => grandparent(maura, leo).
    //   female(maura) && grandparent(maura, leo) => female(maura) && grandparent(maura, leo).
    //   forall (g = maura) forall (c = leo) female(g) && grandparent(g, c) => grandmother(g, c) => grandmother(maura, leo).
    // `);

    // TODO(goto): calling done() here fails. figure out why.
    assertThat(kb)
     .proving("spouse(dani, p?).")
     .equalsTo(`
       spouse(mel, dani).
       exists (x = mel) spouse(x, dani).
       forall (x = mel) forall (y = dani) spouse(x, y) => spouse(y, x) => spouse(dani, p = x).
     `);

    assertThat(kb)
     .proving("spouse(mel, x?).")
     .equalsTo("spouse(mel, dani). spouse(mel, x = dani).");
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

