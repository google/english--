const Assert = require("assert");
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

describe("Parser", function() {
  it("examples", function() {

    // Logical symbols.
    // binary connectives.
    "a || b"; // conjunction
    "a && b"; // disjunction
    "a ^ b"; // xor
    "a => b"; // implication, if (a) then b
    "a == b"; // equality
    // unary connectives.
    "~a";
    // quantifiers.
    "forall (a)"; // universal, forall
    "exists (a)"; // existential, exists
    // literals
    "true";
    "false";

    // Non logical symbols.
    // predicates
    "P"; // 0-arity predicate, propositional statement
    "Q(a)"; // 1-arity predicate
    "R(a, b)"; // 2-arity predicate
    // functions
    "f"; // 0-arity function, or constant symbol
    "g(x)"; // 1-arity function

    // grammar
    // Terms
    // - variables
    // - functions with n terms
    // Formulas
    // - predicate symbols
    // - equality
    // - negation
    // - binary connectives
    // - quantifiers
    // ()s
    // ; or . or line break?
    // - precedence
    //   - ~ is evaluated first
    //   - &&s and ||s are evaluated next
    //   - quantifiers are evaluated next
    //   - => are evaluated last

    // Free and bound variables
    "forall(y) P(x, y)"; // y is bound, x is free
  });

  it("true", function() {
    assertThat(Parser.parse("true.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "true"
      }]
    });
   });

  it("false", function() {
    assertThat(Parser.parse("false.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "false"
      }]
    });
   });

  it("a", function() {
    assertThat(Parser.parse("a.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Literal", 
       "name": "a"
      }]
    });
   });

  it("~a", function() {
    assertThat(Parser.parse("~a."))
     .equalsTo(program([negation(literal("a"))]));
   });

  it("~~a", function() {
    assertThat(Parser.parse("~~a."))
     .equalsTo(program([negation(negation(literal("a")))]));
   });

  it("a && b", function() {
    assertThat(Parser.parse("a && b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "BinaryOperator", 
        "left": {
          "@type": "Literal",
          "name" : "a"
        },
        "op": "&&",
        "right": {
          "@type": "Literal",
          "name" : "b"
        }
       }]
     });
   });

  it("a || b", function() {
    assertThat(Parser.parse("a || b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "BinaryOperator", 
         "left": {
          "@type": "Literal",
          "name" : "a"
         },
         "op": "||",
         "right": {
          "@type": "Literal",
          "name" : "b"
         }
        }]
     });
   });

  it("a ^ b", function() {
    assertThat(Parser.parse("a ^ b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
          "@type": "Literal",
          "name" : "a"
        },
       "op": "^",
       "right": {
          "@type": "Literal",
          "name" : "b"
        }
      }]
     });
   });

  it("a => b", function() {
    assertThat(Parser.parse("a => b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
         "@type": "Literal",
         "name": "a"        
       },
       "op": "=>",
       "right": {
         "@type": "Literal",
         "name": "b"
       }
      }]
     });
   });

  it("~a", function() {
    assertThat(Parser.parse("~a."))
     .equalsTo(program([negation(literal("a"))]));
   });

   it("a => b. a.", function() {
    assertThat(Parser.parse("a => b. a."))
     .equalsTo(program([implies(literal("a"), literal("b")), literal("a")]));
   });

   it("space at the beginning", function() {
    assertThat(Parser.parse("    a."))
     .equalsTo(program([literal("a")]));
   });

   it("space at the end", function() {
    assertThat(Parser.parse("a.    "))
     .equalsTo(program([literal("a")]));
   });

   it("space at the beginning and end", function() {
    assertThat(Parser.parse(`
    a => b.
    a.
  `))
  .equalsTo(program([implies(literal("a"), literal("b")), literal("a")]));
  });

  it("a => b && c", function() {
    assertThat(Parser.parse("a => b && c.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
         "@type": "Literal",
         "name": "a"        
       },
       "op": "=>",
       "right": {
         "@type": "BinaryOperator",
         "op": "&&",
         "left": {
           "@type": "Literal",
           "name" : "b"
         },
         "right": {
           "@type": "Literal",
           "name" : "c"
         }
       }
      }]
     });
   });

  it("a && b || c", function() {
    assertThat(Parser.parse("a && b || c.")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
         "@type": "Literal",
         "name": "a"        
       },
       "op": "&&",
       "right": {
         "@type": "BinaryOperator",
         "op": "||",
         "left": {
           "@type": "Literal",
           "name": "b"
         },
         "right": {
           "@type": "Literal",
           "name": "c"
         }
       }
      }]
     });
   });

  it("P(a) => Q(a)", function() {
    assertThat(Parser.parse("P(a) => Q(a).")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
         "@type": "Predicate",
          "name": "P",
          "arguments": [arg("a")],
       },
       "op": "=>",
       "right": {
         "@type": "Predicate",
         "name": "Q",
         "arguments": [arg("a")]
        }
      }]
     });
   });

  it("forall (a) a && b", function() {
    assertThat(Parser.parse("forall (a) a && b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "op": "forall",
        "variable": "a",
        "expression": {
          "@type": "BinaryOperator", 
          "op": "&&",
          "left": {
            "@type": "Literal",
            "name" : "a"
          },
          "right": {
            "@type": "Literal",
            "name" : "b"
          }
         }
       }]
     });
   });

  it("exists (a) a && b", function() {
    assertThat(Parser.parse("exists (a) a && b.")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "op": "exists",
        "variable": "a",
        "expression": {
          "@type": "BinaryOperator", 
          "op": "&&",
          "left": {
            "@type": "Literal",
            "name" : "a"
          },
          "right": {
            "@type": "Literal",
            "name" : "b"
          }
         }
       }]
     });
   });

  it("(forall (x) P(x)) && (true)", function() {
    assertThat(Parser.parse("(forall (x) P(x)) && (true)."))
     .equalsTo(program([
       and(
         forall("x", predicate("P", [arg("x")])),
         constant("true")
       )
     ]));
   });

  it("(exists (x) P(x, a)) && (exists (y) Q(y, b))", function() {
    assertThat(Parser.parse("(exists (x) P(a, x)) && (exists (x) Q(b, x))."))
     .equalsTo(program([
       and(
         exists("x", predicate("P", [arg("a"), arg("x")])),
         exists("x", predicate("Q", [arg("b"), arg("x")])),
       )
     ]));
   });

  it("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))", function() {
    assertThat(Parser.parse("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))."))
     .equalsTo(program([
       and(
           exists("x", predicate("father", [arg("Joe"), arg("x")])),
           exists("x", predicate("mother", [arg("Joe"), arg("x")]))
       )
     ]));
   });

  it("P()", function() {
    assertThat(Parser.parse("P().")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P"
       }]
     });
   });

  it("P(a)", function() {
    assertThat(Parser.parse("P(a).")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": [arg("a")]
       }]
     });
   });

  it("P(a, b, c)", function() {
    assertThat(Parser.parse("P(a, b, c).")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": [arg("a"), arg("b"), arg("c")]
       }]
     });
   });

   it("line breaks at the end", function() {
    assertThat(Parser.parse("a.\n\n")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "Literal", 
         "name": "a"
        }]
    });
  });

  it("line breaks at the beginning", function() {
    assertThat(Parser.parse("\n\na.")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "Literal", 
         "name": "a"
        }]
    });
  });

  it("Multiple statements", function() {
    assertThat(Parser.parse("\na.\nb.\nc.\n")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "Literal", 
         "name": "a"
        }, {
         "@type": "Literal", 
         "name": "b"
        }, {
         "@type": "Literal", 
         "name": "c"
      }]
    });
  });

  let arg = (x, free) => {
   let result = {
    "@type": "Argument",
    "literal": {
      "@type": "Literal",
      "name": x
    }
   };
   if (free) {
    result["free"] = true
   }
   return result;
  }

  it("forall (x) man(x) => mortal(x), man(Socrates)", function() {
    let code = Parser.parse(`

     forall (x) man(x) => mortal(x).
     man(Socrates).

    `);

    assertThat(code).equalsTo(program([
      forall("x", implies(predicate("man", [arg("x")]), predicate("mortal", [arg("x")]))),
      predicate("man", [arg("Socrates")])
    ]));

    // Can we infer mortal(Socrates)?
    // for (let statement of code.statements) {
    // console.log(statement);
    // }
  });

  it("1+1", function() {
    try {
     Parser.parse("1+1");
    } catch (e) {
      // assertThat(message).equalsTo("");
      // expected
    }
  });

  it("if a then b", function() {
    assertThat(Parser.parse("if a then b."))
     .equalsTo(program([implies(literal("a"), literal("b"))]));
  });

  it("a a a", function() {
    try {
      Parser.parse("a a a");
    } catch ({message}) {
      // expected failure
      // TODO(goto): i need to find a better way to verify this.
    }
  });

  it("a then: syntax error", function() {
    // we should probably enforce a line break or . between statements.
    try {
      Parser.parse("a then b.");
    } catch (e) {
    }
  });

  it("toString", function() {
    assertThat(Rule.from(Rule.of("a."))).equalsTo("a");
    assertThat(Rule.from(Rule.of("a && b."))).equalsTo("a && b");
    assertThat(Rule.from(Rule.of("a || b."))).equalsTo("a || b");
    assertThat(Rule.from(Rule.of("a => b."))).equalsTo("a => b");
    assertThat(Rule.from(Rule.of("~a."))).equalsTo("~a");
    assertThat(Rule.from(Rule.of("a && ~b."))).equalsTo("a && ~b");
    assertThat(Rule.from(Rule.of("a && ~b || c."))).equalsTo("a && ~b || c");
    assertThat(Rule.from(Rule.of("a && ~b || c => d."))).equalsTo("a && ~b || c => d");
  });



  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

