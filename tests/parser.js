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
    assertThat(Parser.parse("true")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "true"
      }]
    });
   });

  it("false", function() {
    assertThat(Parser.parse("false")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "false"
      }]
    });
   });

  it("a", function() {
    assertThat(Parser.parse("a")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Literal", 
       "name": "a"
      }]
    });
   });

  it("~a", function() {
    assertThat(Parser.parse("~a"))
     .equalsTo(program([negation(literal("a"))]));
   });

  it("~~a", function() {
    assertThat(Parser.parse("~~a"))
     .equalsTo(program([negation(negation(literal("a")))]));
   });

  it("a && b", function() {
    assertThat(Parser.parse("a && b")).equalsTo({
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
    assertThat(Parser.parse("a || b")).equalsTo({
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
    assertThat(Parser.parse("a ^ b")).equalsTo({
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
    assertThat(Parser.parse("a => b")).equalsTo({
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
    assertThat(Parser.parse("~a"))
     .equalsTo(program([negation(literal("a"))]));
   });

  it("a => b && c", function() {
    assertThat(Parser.parse("a => b && c")).equalsTo({
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
    assertThat(Parser.parse("a && b || c")).equalsTo({
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
    assertThat(Parser.parse("P(a) => Q(a)")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": {
         "@type": "Predicate",
          "name": "P",
         "arguments": ["a"],        
       },
       "op": "=>",
       "right": {
         "@type": "Predicate",
         "name": "Q",
         "arguments": ["a"]
        }
      }]
     });
   });

  it("forall (a) a && b", function() {
    assertThat(Parser.parse("forall (a) a && b")).equalsTo({
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
    assertThat(Parser.parse("exists (a) a && b")).equalsTo({
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
    assertThat(Parser.parse("(forall (x) P(x)) && (true)"))
     .equalsTo(program([
       and(
         forall("x", predicate("P", ["x"])),
         constant("true")
       )
     ]));
   });

  it("(exists (x) P(x, a)) && (exists (y) Q(y, b))", function() {
    assertThat(Parser.parse("(exists (x) P(a, x)) && (exists (x) Q(b, x))"))
     .equalsTo(program([
       and(
         exists("x", predicate("P", ["a", "x"])),
         exists("x", predicate("Q", ["b", "x"])),
       )
     ]));
   });

  it("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))", function() {
    assertThat(Parser.parse("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))"))
     .equalsTo(program([
       and(
         exists("x", predicate("father", ["Joe", "x"])),
         exists("x", predicate("mother", ["Joe", "x"]))
       )
     ]));
   });

  it("P()", function() {
    assertThat(Parser.parse("P()")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P"
       }]
     });
   });

  it("P(a)", function() {
    assertThat(Parser.parse("P(a)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a"]
       }]
     });
   });

  it("P(a, b, c)", function() {
    assertThat(Parser.parse("P(a, b, c)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a", "b", "c"]
       }]
     });
   });

  it("Multiple statements", function() {
    assertThat(Parser.parse("\na\nb\nc\n")).equalsTo({
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

  it("forall (x) man(x) => mortal(x), man(Socrates)", function() {
    let code = Parser.parse(`

     forall (x) man(x) => mortal(x)
     man(Socrates)

    `);

    assertThat(code).equalsTo(program([
      forall("x", implies(predicate("man", ["x"]), predicate("mortal", ["x"]))),
      predicate("man", ["Socrates"])
    ]));

    // Can we infer mortal(Socrates)?
    // for (let statement of code.statements) {
    // console.log(statement);
    // }
  });

  it("1+1", function() {
    try {
     Parser.parse("1+1");
     fail("blargh");
    } catch (e) {
     // expected error;
    }
  });

  it("toString", function() {
    assertThat(Rule.from(Rule.of("a"))).equalsTo("a");
    assertThat(Rule.from(Rule.of("a && b"))).equalsTo("a && b");
    assertThat(Rule.from(Rule.of("a || b"))).equalsTo("a || b");
    assertThat(Rule.from(Rule.of("a => b"))).equalsTo("a => b");
    assertThat(Rule.from(Rule.of("~a"))).equalsTo("~a");
    assertThat(Rule.from(Rule.of("a && ~b"))).equalsTo("a && ~b");
    assertThat(Rule.from(Rule.of("a && ~b || c"))).equalsTo("a && ~b || c");
    assertThat(Rule.from(Rule.of("a && ~b || c => d"))).equalsTo("a && ~b || c => d");
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

