const Assert = require("assert");
const logic = require("../src/grammar.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
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
  argument,
  quantifier} = Parser;

describe("Unify", () => {
  it("parser", function() {
    // doesn't throw a parse exception.
    Parser.parse(`
        forall(x) mortal(x). 
        exists(x) men(x).
    `);
  });

  it("parser: forall (x) forall (y) P(x, y).", function() {
    // console.log(JSON.stringify(Parser.parse("forall(x) forall(y) P(x, y).")));
    // return;
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
        "expression": {"@type": "Literal", "name": "x"},
        free: true
      }]));
  });

  it("parser - multiple free variables", function() {
    assertThat(Rule.of("P(x?, y?).").arguments).equalsTo([{
        "@type": "Argument",
        "expression": {"@type": "Literal", "name": "x"},
        free: true
      }, {
        "@type": "Argument",
        "expression": {"@type": "Literal", "name": "y"},
        free: true
      }]);
  });

  it("parser - mixed variables", function() {
    assertThat(Rule.of("P(x, y?, z).").arguments).equalsTo([{
        "@type": "Argument",
        "expression": {"@type": "Literal", "name": "x"},
      }, {
        "@type": "Argument",
        "expression": {"@type": "Literal", "name": "y"},
        free: true
      }, {
        "@type": "Argument",
        "expression": {"@type": "Literal", "name": "z"}
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

  it("Rewrite: forall (x) P(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x).");
    let expects = Rule.of("P(x).");
    expects.arguments[0].free = true;
    expects.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) P(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x).");
    let expects = Rule.of("P(x).");
    expects.arguments[0].free = true;
    expects.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) P(x) && Q(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x) && Q(x).");
    let expects = Rule.of("P(x) && Q(x).");
    expects.left.arguments[0].free = true;
    expects.left.arguments[0].id = 1;
    expects.right.arguments[0].free = true;
    expects.right.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) P(x) => Q(x)", function() {
    let {statements} = Parser.parse("forall (x) P(x) => Q(x).");
    let expects = Rule.of("P(x) => Q(x).");
    expects.left.arguments[0].free = true;
    expects.left.arguments[0].id = 1;
    expects.right.arguments[0].free = true;
    expects.right.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) ~P(x)", function() {
    let {statements} = Parser.parse("forall (x) ~P(x).");
    let expects = Rule.of("~P(x).");
    expects.expression.arguments[0].free = true;
    expects.expression.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) P(x, y)", function() {
    let {statements} = Parser.parse("forall (x) P(x, y).");
    let expects = Rule.of("P(x, y).");
    expects.arguments[0].free = true;
    expects.arguments[0].id = 1;
    expects.quantifiers = [quantifier("forall", "x")];
    expects.quantifiers[0].id = 1;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) forall (y) P(x, y)", function() {
    let {statements} = Parser.parse("forall (x) forall (y) P(x, y).");
    // console.log(JSON.stringify(statements));
    // return;
    let expects = Rule.of("P(x, y).");
    expects.arguments[0].free = true;
    expects.arguments[0].id = 1;
    expects.arguments[1].free = true;
    expects.arguments[1].id = 2;
    expects.quantifiers = [quantifier("forall", "x"), quantifier("forall", "y")];
    expects.quantifiers[0].id = 1;
    expects.quantifiers[1].id = 2;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: forall (x) forall (y) ~P(x, y, c)", function() {
    let {statements} = Parser.parse("forall (x) forall (y) ~P(x, y, c).");
    let expects = Rule.of("~P(x, y, c).");
    expects.expression.arguments[0].free = true;
    expects.expression.arguments[0].id = 1;
    expects.expression.arguments[1].free = true;
    expects.expression.arguments[1].id = 2;
    expects.quantifiers = [quantifier("forall", "x"), quantifier("forall", "y")];
    expects.quantifiers[0].id = 1;
    expects.quantifiers[1].id = 2;
    assertThat(rewrite(statements[0])).equalsTo(expects);
  });

  it("Rewrite: exists (x) P(x) == P(x)", function() {
    let {statements} = Parser.parse("exists (x) P(x).");
    let expects = Rule.of("P(x).");
    expects.arguments[0].free = true;
    expects.arguments[0].id = 1;
    expects.quantifiers = [quantifier("exists", "x")];
    expects.quantifiers[0].id = 1;
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
    assertThat(unify(rewrite(Rule.of("P(a).")), 
                     rewrite(Rule.of("P(a)."))))
     .equalsTo({});
  });

  it("Unify(P(a, b), P(a, b))", function() {
    assertThat(unify(rewrite(Rule.of("P(a, b).")), 
                     rewrite(Rule.of("P(a, b)."))))
     .equalsTo({});
  });

  it("Unify(P(a), P(x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(a).")), 
                     rewrite(Rule.of("P(x?)."))))
     .equalsTo({"x@": literal("a")});
  });

  it("Unify(P(a, b), P(a, x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(a, b).")), 
                     rewrite(Rule.of("P(a, x?)."))))
     .equalsTo({"x@": literal("b")});
  });

  it("Unify(P(y?, b), P(a, x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(y?, b).")), 
                     rewrite(Rule.of("P(a, x?)."))))
     .equalsTo({"x@": literal("b"), "y@": literal("a")});
  });

  it("Unify(P(p?, q?), P(x, y))", function() {
    assertThat(unify(rewrite(Rule.of("a(p?, q?).")), 
                     rewrite(Rule.of("a(x, y)."))))
     .equalsTo({"p@": literal("x"), "q@": literal("y")});
  });

  it("Unify(P(Q(a)), P(x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(Q(a)).")), 
                     rewrite(Rule.of("P(x?)."))))
      .equalsTo({
	"x@": func("Q", [argument(literal("a"))])
      });
  });

  it("Unify(P(Q(a)), P(x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(Q(a)).")), 
                     rewrite(Rule.of("P(x?)."))))
     .equalsTo({"x@": func("Q", [argument(literal("a"))])});
  });

  // disjunctions
  it("Unify(P(Q(a)), P(Q(x?)))", function() {
    assertThat(unify(rewrite(Rule.of("P(Q(a)).")), 
                     rewrite(Rule.of("P(Q(x?))."))))
     .equalsTo({"x@": literal("a")});
  });

  it("Unify(P(a) && Q(b), P(x?) && Q(b))", function() {
    assertThat(unify(rewrite(Rule.of("P(a) && Q(b).")), 
                     rewrite(Rule.of("P(x?) && Q(b)."))))
     .equalsTo({"x@": literal("a")});
  });

  it("Unify(P(a) && Q(b), P(a) && Q(x?))", function() {
    assertThat(unify(rewrite(Rule.of("P(a) && Q(b).")), 
                     rewrite(Rule.of("P(a) && Q(x?)."))))
     .equalsTo({"x@": literal("b")});
  });

  // conjunctions
  it("Unify(P(a) || Q(b), P(x?) || Q(b))", function() {
    assertThat(unify(Rule.of("P(a) || Q(b)."), Rule.of("P(x?) || Q(b).")))
     .equalsTo({"x@": literal("a")});
  });

  it("Unify(P(a) || Q(b), P(a) || Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) || Q(b)."), Rule.of("P(a) || Q(x?).")))
     .equalsTo({"x@": literal("b")});
  });

  // implication
  it("Unify(P(a) => Q(b), P(x?) => Q(b))", function() {
    assertThat(unify(Rule.of("P(a) => Q(b)."), Rule.of("P(x?) => Q(b).")))
     .equalsTo({"x@": literal("a")});
  });

  it("Unify(P(a) => Q(b), P(a) => Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) => Q(b)."), Rule.of("P(a) => Q(x?).")))
     .equalsTo({"x@": literal("b")});
  });

  // unary
  it("Unify(~P(a), ~P(x?))", function() {
    assertThat(unify(Rule.of("~P(a)."), Rule.of("~P(x?).")))
     .equalsTo({"x@": literal("a")});
  });

  // composition
  it("Unify(P(a) && Q(~R(b)), P(a) && Q(R(x?))", function() {
    assertThat(unify(Rule.of("P(a) && Q(R(b))."), Rule.of("P(a) && Q(R(x?)).")))
     .equalsTo({"x@": literal("b")});
  });

  it("Unify(P(a) && Q(b) => ~R(c), P(a) && Q(x?) => ~R(y?)", function() {
    assertThat(unify(Rule.of("P(a) && Q(b) => ~R(c)."), Rule.of("P(a) && Q(x?) => ~R(y?).")))
     .equalsTo({"x@": literal("b"), "y@": literal("c")});
  });

  it("Unify(P(a, x?), P(y?, Q(y?)))", function() {
    assertThat(unify(Rule.of("P(a, x?)."), Rule.of("P(y?, Q(y?)).")))
      .equalsTo({
	"y@": literal("a"),
	"x@": func("Q", [argument(literal("y"), literal("a"))])
      });
  });

  it("Unify(P(a) => Q(b), forall (x) P(x) => Q(b))", function() {
    assertThat(unify(rewrite(Rule.of("P(a) => Q(b).")), rewrite(Rule.of("forall (x) P(x?) => Q(b)."))))
     .equalsTo({
       "x@1": literal("a")
     });
  });

  it("Unify(forall (y) P(y) => Q(b), forall (x) P(x?) => Q(b))", function() {
    assertThat(unify(rewrite(Rule.of("forall (y) P(y) => Q(b).")), 
                     rewrite(Rule.of("forall (x) P(x) => Q(b)."))))
     .equalsTo({
       "y@1": argument(literal("x"), undefined, true, 1)
     });
  });

  it("Unify(P(a, b), forall (x) forall (y) P(x, y))", function() {
    assertThat(unify(rewrite(Rule.of("P(a, b).")), 
                     rewrite(Rule.of("forall (x) forall (y) P(x, y)."))))
     .equalsTo({
       "x@1": literal("a"),
       "y@2": literal("b")
     });
  });
  
  it("Unify(forall (p) forall (q) P(p, q), forall (x) forall (y) P(x, y))", function() {
    assertThat(unify(rewrite(Rule.of("forall (p) forall (q) P(p, q).")), 
                     rewrite(Rule.of("forall (x) forall (y) P(x, y)."))))
     .equalsTo({
       "p@1": argument(literal("x"), undefined, true, 1),
       "q@2": argument(literal("y"), undefined, true, 2)
     });
  });
  
  it("Unify(forall (x) P(x, a), forall (y) P(b, y))", function() {
    assertThat(unify(rewrite(Rule.of("forall (x) P(x, a).")), 
                     rewrite(Rule.of("forall (y) P(b, y)."))))
     .equalsTo({
       "x@1": literal("b"),
       "y@1": literal("a") // they share ids because rewrite was called twice
     });
  });

  it("Unify(forall (x) P(x, a), exists (y) P(b, y))", function() {
    assertThat(unify(rewrite(Rule.of("forall (x) P(x, a).")), 
                     rewrite(Rule.of("exists (y) P(b, y)."))))
     .equalsTo({
       "x@1": literal("b"),
       "y@1": literal("a")
     });
  });

  it("Unify(forall (x) P(x), exists (y) P(y))", function() {
    assertThat(unify(rewrite(Rule.of("forall (x) P(x).")), 
                     rewrite(Rule.of("exists (y) P(y)."))))
     .equalsTo(false);
  });

  it("Unify(P(a, b), P(x?, y?))", function() {
    assertThat(unify(rewrite(Rule.of("P(a, b).")), rewrite(Rule.of("P(x?, y?)."))))
     .equalsTo({"x@": literal("a"), "y@": literal("b")});
  });
  
  it("Unify(P(a?), P(b?))", function() {
    assertThat(unify(Rule.of("P(a?)."), Rule.of("P(b?).")))
     .equalsTo({"a@": argument(literal("b"), undefined, true)});
  });

  it("Unify fails: Unify(P(a) && Q(b), P(x?) && Q(c))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(x?) && Q(c).")))
     .equalsTo(false);
  });

  it("Unify fails: Unify(P(a) && Q(b), P(x?) && Q(x?))", function() {
    assertThat(unify(Rule.of("P(a) && Q(b)."), Rule.of("P(x?) && Q(x?).")))
     .equalsTo(false);
  });

  it("Unify fails", function() {
    assertThat(unify(Rule.of("a(x?)."), Rule.of("b(y).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y, z).")))
       .equalsTo(false);
  });

  it("Unify(forall(x) P(x), P(a))", () => {
    assertThat(unify(rewrite(Rule.of("forall (x) P(x).")), rewrite(Rule.of("P(a)."))))
    .equalsTo({
      "x@1": literal("a")
    });
  });

  it("Unify(exists (x) P(x), P(a))", () => {
    assertThat(unify(rewrite(Rule.of("exists (x) P(x).")), rewrite(Rule.of("P(a)."))))
    .equalsTo({
      "x@1": literal("a")
    });
  });

  it("Unify(P(a), exists (x) P(x))", () => {
    assertThat(unify(rewrite(Rule.of("P(a).")),
		     rewrite(Rule.of("exists (x) P(x)."))))
    .equalsTo({
      "x@1": literal("a")
    });
  });

  it("Unify(exists (x) p(x), forall (a) p(a))", () => {
    assertThat(unify(rewrite(Rule.of("exists (x) p(x).")), rewrite(Rule.of("forall (a) p(a)."))))
    .equalsTo(false);
  });

  it("Unify(forall (x) forall (y) P(x) && Q(x, y), P(a) && Q(a, b)?)", () => {
    assertThat(unify(rewrite(Rule.of("forall (x) forall (y) P(x) && Q(x, y).")), rewrite(Rule.of("P(a) && Q(a, b)."))))
    .equalsTo({
      "x@1": literal("a"),
      "y@2": literal("b")
    });
  });

  it("Unify() implication", function() {
    // this can't be unified because ultimately, 
    // exists (y) q(y) can't be unified with
    // forall (x) q(x) between x and y.
    assertThat(unify(rewrite(Rule.of("forall (x) p(x) => q(x).")).right,
                     rewrite(Rule.of("exists (y) q(y)."))))
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

  it("Filling binds and removes ids", function() {
    let unifies = {
     "x@1": literal("a")
    };
    console.log(JSON.stringify(rewrite(Rule.of("exists (x) P(x) && R(x).")).quantifiers));
    return;
    assertThat(fill(rewrite(Rule.of("exists (x) P(x) && R(x).")).right, unifies, true))
     .equalsTo(predicate("R", [argument(literal("a"))]));
  });

  it.skip("Fills with ids", function() {
    let unifies = unify(rewrite(Rule.of("forall (x) P(x).")), rewrite(Rule.of("P(a).")));
    // console.log(unifies);
    // console.log(rewrite(Rule.of("forall (x) P(x?).")));
    // assertThat(fill(Rule.of("R(x)."), unifies))
    // .equalsTo(predicate("R", [argument(literal("x"), func("Q", [argument(literal("a"))]))]));
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
