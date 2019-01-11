const Assert = require("assert");
const logic = require("../grammar.js");
const {Forward, normalize, stringify, equals} = require("../forward.js");
const {Parser, Rule} = require("../parser.js");

const {
 program, 
 forall, 
 exists, 
 implies, 
 predicate, 
 binary, 
 literal, 
 constant, 
 and, 
 or, 
 negation} = Parser;

describe("Forward", function() {
  it("a => b, a |= b", function() {
    assertThat(Forward.modusPonens(Parser.parse(`
      a => b.
      a.
    `)))
     .equalsTo([literal("b")]);
  });

  it("a && b => c || d, a & b |= c || d", function() {
    assertThat(Forward.modusPonens(Parser.parse(`
      (a && b) => (c || d).
      a && b.
    `)))
     .equalsTo([
       or(literal("c"), literal("d"))
     ]);
  });

  it("a => b, ~b |= ~a", function() {
    assertThat(Forward.modusTollens(logic.parse(`
      a => b.
      ~b.
    `)))
    .equalsTo([negation(literal("a"))]);
  });

  it("a || b, ~a |= b", function() {
    let code = Parser.parse(`
      a || b.
      ~a.
    `);

    assertThat(Forward.disjunctiveSyllogism(code)).equalsTo([
      literal("b")
    ]);
  });

  it("a || b, ~b |= a", function() {
    let code = Parser.parse(`
      a || b.
      ~b.
    `);

    assertThat(Forward.disjunctiveSyllogism(code)).equalsTo([
      literal("a")
    ]);
  });

  it("a |= a || b", function() {
    let code = Parser.parse(`
      a.
    `);

    assertThat(Forward.disjunctiveIntroduction(code, literal("b")))
     .equalsTo([
       or(literal("a"), literal("b")),
       or(literal("b"), literal("a"))
    ]);
  });

  it("a && b |= a, b", function() {
    assertThat(Forward.conjunctionElimination(Parser.parse(`
      a && b.
     `)))
     .equalsTo([
       literal("a"), literal("b")
    ]);
  });

  it("a, b |= a && b", function() {
    assertThat(Forward.conjunctionIntroduction(Parser.parse(`
      a.
      b.
     `)))
     .equalsTo([
       and(literal("a"), literal("b")),
       and(literal("b"), literal("a"))
    ]);
  });

  it("a => b, b => c |= a => c", function() {
    assertThat(Forward.hypotheticalSyllogism(Parser.parse(`
      a => b.
      b => c.
     `)))
     .equalsTo([
       implies(literal("a"), literal("c"))
    ]);
  });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    assertThat(Forward.constructiveDillema(Parser.parse(`
      (a => c) && (b => d).
      a || b.
     `)))
     .equalsTo([
       or(literal("c"), literal("d"))
    ]);
  });

  it("a => b |= a => (a & b)", function() {
    assertThat(Forward.absorption(Parser.parse(`
      a => b.
     `)))
     .equalsTo([
       implies(literal("a"), and(literal("a"), literal("b")))
    ]);
  });

  it("forward chaining", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = Parser.parse(`
      cat_fur || dog_fur.
      dog_fur => thompson_allergy.
      cat_fur => macavity_criminal.
      ~thompson_allergy.
    `);

    assertThat(code).equalsTo(program([
      or(literal("cat_fur"), literal("dog_fur")),
      implies(literal("dog_fur"), literal("thompson_allergy")),
      implies(literal("cat_fur"), literal("macavity_criminal")),
      negation(literal("thompson_allergy"))
    ]));

    // 5) Can we infer ~dog_fur from 2 and 4?
    // 6) Can we infer cat_fur from 1 and 5?
    // 7) Can we infer macavity_criminal from 3 and 6?

    // Not immediately obvious whether ~dog_fur is true.
    assertThat(Forward.entails(code, negation(literal("dog_fur"))))
     .equalsTo(false);
    
    assertThat(Forward.deduce(code, negation(literal("dog_fur"))))
     .equalsTo(true);

    assertThat(Forward.deduce(code, literal("cat_fur")))
     .equalsTo(true);

    assertThat(Forward.deduce(code, literal("macavity_criminal")))
     .equalsTo(true);
  });

  it("~~a == a", function() {
    // double negatives
    assertThat(normalize(Rule.of("~~a.")))
     .equalsTo(Rule.of("a."));

    assertThat(normalize(Rule.of("~~~a.")))
     .equalsTo(Rule.of("~a."));

    assertThat(normalize(Rule.of("~~~~a.")))
     .equalsTo(Rule.of("a."));

    assertThat(normalize(Rule.of("~~~~~a.")))
     .equalsTo(Rule.of("~a."));
   });

  it("a && a == a, a || a == a", function() {
    // Tautologies
    assertThat(normalize(Rule.of("a && a.")))
     .equalsTo(Rule.of("a."));
    assertThat(normalize(Rule.of("a || a.")))
     .equalsTo(Rule.of("a."));
   });

  it("~(a && b) == (~a) || (~b)", function() {
    // DeMorgan's Law
    assertThat(normalize(Rule.of("~(a && b).")))
     .equalsTo(Rule.of("(~a) || (~b)."));
    assertThat(normalize(Rule.of("~(a || b).")))
     .equalsTo(Rule.of("(~a) && (~b)."));

   });

  it("~b => ~a == a => b", function() {
    // Transposition
    assertThat(normalize(Rule.of("(~b) => (~a).")))
     .equalsTo(Rule.of("a => b."));
   });

  it("~a || b == a => b", function() {
    // Material implication
    assertThat(normalize(Rule.of("(~a) || b.")))
     .equalsTo(Rule.of("a => b."));
   });

  it("a => (b => c) == (a && b) => c", function() {
    // Exportation
    assertThat(normalize(Rule.of("a => (b => c).")))
     .equalsTo(Rule.of("(a && b) => c."));
   });

  it("(a && b) || (a && c) == a && (b || c)", function() {
    // Distribution
    assertThat(normalize(Rule.of("(a && b) || (a && c).")))
     .equalsTo(Rule.of("a && (b || c)."));
    assertThat(normalize(Rule.of("(a || b) && (a || c).")))
     .equalsTo(Rule.of("a || (b && c)."));
   });

  it("b && a == a && b", function() {
    // Commutativity
    // Sorts parameters alphabetically
    assertThat(normalize(Rule.of("b && a.")))
     .equalsTo(Rule.of("a && b."));
    assertThat(normalize(Rule.of("a && b.")))
     .equalsTo(Rule.of("a && b."));

    assertThat(normalize(Rule.of("b || a.")))
     .equalsTo(Rule.of("a || b."));
    assertThat(normalize(Rule.of("a || b.")))
     .equalsTo(Rule.of("a || b."));
   });

  it("(a && b) && c == a && (b && c)", function() {
    // Associativity
    // Sorts parameters by size
    assertThat(normalize(Rule.of("(a && b) && c.")))
     .equalsTo(Rule.of("a && (b && c)."));
    assertThat(normalize(Rule.of("(a || b) || c.")))
     .equalsTo(Rule.of("a || (b || c)."));
   });

  it("a && ~~a == a", function() {
    // Intermingling
    // Tautology with double negative
    assertThat(normalize(Rule.of("a && (~~a).")))
     .equalsTo(Rule.of("a."));
   });

  it("a => (b => (c && c))", function() {
    // Intermingling
    // Exportation and tautology.
    assertThat(normalize(Rule.of("a => (b => (c && c)).")))
     .equalsTo(Rule.of("(a && b) => c."));
   });

  it("stringify", function() {
    assertThat(stringify(Rule.of("~a."))).equalsTo("~a");
    assertThat(stringify(Rule.of("a && b."))).equalsTo("a && b");
    assertThat(stringify(Rule.of("a || b."))).equalsTo("a || b");
    assertThat(stringify(Rule.of("a => b."))).equalsTo("a => b");
    assertThat(stringify(Rule.of("a ^ b."))).equalsTo("a ^ b");
    assertThat(stringify(Rule.of("a && b && c."))).equalsTo("a && b && c");
    assertThat(stringify(Rule.of("a && (b && c)."))).equalsTo("a && b && c");
    assertThat(stringify(Rule.of("a && b => c."))).equalsTo("a && b => c");
    assertThat(stringify(Rule.of("a => b => c."))).equalsTo("a => b => c");
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

