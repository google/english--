const Assert = require("assert");
const logic = require("../logic.js");

describe("Parser", function() {
  it("Examples", function() {
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

  it("true and false", function() {
    assertThat(logic.parse("true")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "true"
      }]
    });

    assertThat(logic.parse("false")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "false"
      }]
    });
   });


  it("a", function() {
    assertThat(logic.parse("a")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Literal", 
       "name": "a"
      }]
    });
   });

  it("&&s and ||s", function() {
    assertThat(logic.parse("a && b")).equalsTo({
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
    assertThat(logic.parse("a || b")).equalsTo({
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

    assertThat(logic.parse("a ^ b")).equalsTo({
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

  it("=>", function() {
    assertThat(logic.parse("a => b")).equalsTo({
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
    assertThat(logic.parse("~a")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "UnaryOperator", 
        "name": "~",
        "expression": "a"
       }]
     });
   });

  it("Composites =>s and &&s", function() {
    assertThat(logic.parse("a => b && c")).equalsTo({
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

  it("Composites &&s and ||", function() {
    assertThat(logic.parse("a && b || c")).equalsTo({
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

  it("Composites =>s and P()s", function() {
    assertThat(logic.parse("P(a) => Q(a)")).equalsTo({
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
    assertThat(logic.parse("forall (a) a && b")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "name": "forall",
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
    assertThat(logic.parse("exists (a) a && b")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "name": "exists",
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

  it("P()", function() {
    assertThat(logic.parse("P()")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P"
       }]
     });
   });

  it("P(a)", function() {
    assertThat(logic.parse("P(a)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a"]
       }]
     });
   });

  it("P(a, b, c)", function() {
    assertThat(logic.parse("P(a, b, c)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a", "b", "c"]
       }]
     });
   });

  it("Multiple statements", function() {
    assertThat(logic.parse("\na\nb\nc\n")).equalsTo({
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

  it("Example program", function() {
    assertThat(logic.parse(`

    forall (x) man(x) => mortal(x)
    man(Socrates)

    `)).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier", 
        "name": "forall",
        "variable" : "x",
        "expression": {
          "@type": "BinaryOperator",
          "op": "=>",
          "left": {
            "@type": "Predicate",
            "name": "man",
            "arguments": ["x"]
          },
          "right": {
            "@type": "Predicate",
            "name": "mortal",
            "arguments": ["x"]
          } 
        }
     }, {
       "@type": "Predicate",
       "name": "man",
       "arguments": ["Socrates"]
     }]
    });
  });

  it("Invalid syntax", function() {
    try {
     logic.parse("1+1");
     fail("blargh");
    } catch (e) {
     // expected error;
    }
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

