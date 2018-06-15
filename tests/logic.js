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

  it("true", function() {
    assertThat(logic.parse("true")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "true"
      }]
    });
   });

  it("false", function() {
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


  it("a && b", function() {
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
   });

  it("a || b", function() {
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
   });

  it("a ^ b", function() {
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

  it("a => b", function() {
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

  it("a => b && c", function() {
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

  it("a && b || c", function() {
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

  it("P(a) => Q(a)", function() {
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

  function literal(x) {
   return {"@type": "Literal", "name": x};
  };

  function binary(op, left, right) {
   return {"@type": "BinaryOperator", "op": op, left: left, right: right};
  };

  function program(statements) {
   return {"@type": "Program", statements: statements};
  }

  it("(a && b) && c", function() {
    assertThat(logic.parse("(a && b) && c"))
     .equalsTo(program([and(and(literal("a"), literal("b")), literal("c"))]));
   });

  it("a && (b && c)", function() {
    assertThat(logic.parse("a && (b && c)"))
     .equalsTo(program([and(literal("a"), and(literal("b"), literal("c")))]));
   });

  it("(a => b) && (b && c)", function() {
    assertThat(logic.parse("(a => b) && (b && c)"))
     .equalsTo(program([
       and(
         implies(
           literal("a"),
           literal("b")
         ),
         and(
           literal("b"),
           literal("c")
         )
       )
     ]));
   });

  function constant(value) {
   return {"@type": "Constant", name: value};
  }

  function forall(x, expression) {
   return {"@type": "Quantifier", name: "forall", variable: x, expression: expression};
  }

  function exists(x, expression) {
   return {"@type": "Quantifier", name: "exists", variable: x, expression: expression};
  }

  function predicate(name, arguments) {
   return {"@type": "Predicate", name: name, arguments: arguments};
  }

  function and(left, right) {
   return binary("&&", left, right);
  }

  function implies(left, right) {
   return binary("=>", left, right);
  }

  it("(forall (x) P(x)) && (true)", function() {
    assertThat(logic.parse("(forall (x) P(x)) && (true)"))
     .equalsTo(program([
       and(
         forall("x", predicate("P", ["x"])),
         constant("true")
       )
     ]));
   });

  it("(exists (x) P(x, a)) && (exists (y) Q(y, b))", function() {
    assertThat(logic.parse("(exists (x) P(a, x)) && (exists (x) Q(b, x))"))
     .equalsTo(program([
       and(
         exists("x", predicate("P", ["a", "x"])),
         exists("x", predicate("Q", ["b", "x"])),
       )
     ]));
   });

  it("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))", function() {
    assertThat(logic.parse("(exists (x) father(Joe, x)) && (exists (x) mother(Joe, x))"))
     .equalsTo(program([
       and(
         exists("x", predicate("father", ["Joe", "x"])),
         exists("x", predicate("mother", ["Joe", "x"]))
       )
     ]));
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

  it("forall (x) man(x) => mortal(x), man(Socrates)", function() {
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

  it("1+1", function() {
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

