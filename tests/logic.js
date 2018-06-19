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

  it("~a", function() {
    assertThat(logic.parse("~a"))
     .equalsTo(program([negation(literal("a"))]));
   });

  it("~~a", function() {
    assertThat(logic.parse("~~a"))
     .equalsTo(program([negation(negation(literal("a")))]));
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
    assertThat(logic.parse("~a"))
     .equalsTo(program([negation(literal("a"))]));
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

  function or(left, right) {
   return binary("||", left, right);
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

  function xor(a, b) {
   return binary("^", a, b);
  }

  function negation(a) {
   return {"@type": "UnaryOperator", name: "~", expression: a};
  }

  it("forall (x) man(x) => mortal(x), man(Socrates)", function() {
    let code = logic.parse(`

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
     logic.parse("1+1");
     fail("blargh");
    } catch (e) {
     // expected error;
    }
  });

  function modusPonens({statements}) {
   let result = [];
   // modus ponen: a => b, a |= b
   for (let implication of statements.filter(x => x.op == "=>")) {
    if (statements.find(y => equals(implication.left, y))) {
     result.push(implication.right);
    }
   }
   return result;
  }

  function modusTollens({statements}) {
   let result = [];
   // modus tollens: a => b, ~b |= ~a
   for (let implication of statements.filter(x => x.op == "=>")) {
    if (statements.find(y => equals(negation(implication.right), y))) {
     result.push(negation(implication.left));
    }
   }
   return result;
  }

  function disjunctiveSyllogism({statements}) {
   let result = [];
   // disjunctive syllogism: a || b, ~a |= ~b and a || b, ~b |= a
   for (let disjunction of statements.filter(x => x.op == "||")) {
    if (statements.find(y => equals(negation(disjunction.left), y))) {
     result.push(disjunction.right);
    }
    if (statements.find(y => equals(negation(disjunction.right), y))) {
     result.push(disjunction.left);
    }
   }
   return result;
  }

  it("a => b, a |= b", function() {
    assertThat(modusPonens(logic.parse(`
      a => b
      a
    `)))
     .equalsTo([literal("b")]);
  });

  it("a && b => c || d, a & b |= c || d", function() {
    assertThat(modusPonens(logic.parse(`
      (a && b) => (c || d)
      a && b
    `)))
     .equalsTo([
       or(literal("c"), literal("d"))
     ]);
  });

  it("a => b, ~b |= ~a", function() {
    assertThat(modusTollens(logic.parse(`
      a => b
      ~b
    `)))
    .equalsTo([negation(literal("a"))]);
  });

  it("a || b, ~a |= b", function() {
    let code = logic.parse(`
      a || b
      ~a
    `);

    assertThat(disjunctiveSyllogism(code)).equalsTo([
      literal("b")
    ]);
  });

  it("a || b, ~b |= a", function() {
    let code = logic.parse(`
      a || b
      ~b
    `);

    assertThat(disjunctiveSyllogism(code)).equalsTo([
      literal("a")
    ]);
  });

  function disjunctiveIntroduction({statements}, term) {
   let result = [];
   for (let statement of statements) {
    result.push(or(statement, term));
    result.push(or(term, statement));
   }
   return result;
  }

  it("a |= a || b", function() {
    let code = logic.parse(`
      a
    `);

    assertThat(disjunctiveIntroduction(code, literal("b")))
     .equalsTo([
       or(literal("a"), literal("b")),
       or(literal("b"), literal("a"))
    ]);
  });

  function conjunctionElimination({statements}) {
   let result = [];
   for (let statement of statements.filter(x => x.op == "&&")) {
    result.push(statement.left);
    result.push(statement.right);
   }
   return result;
  }

  it("a && b |= a, b", function() {
    assertThat(conjunctionElimination(logic.parse(`
      a && b
     `)))
     .equalsTo([
       literal("a"), literal("b")
    ]);
  });

  function conjunctionIntroduction({statements}) {
   let result = [];
   for (let statement of statements) {
    // console.log(statement);
    for (let other of statements) {
     if (!equals(statement, other)) {
      result.push(and(statement, other));
     }
    }
   }
   return result;
  }

  it("a, b |= a && b", function() {
    assertThat(conjunctionIntroduction(logic.parse(`
      a
      b
     `)))
     .equalsTo([
       and(literal("a"), literal("b")),
       and(literal("b"), literal("a"))
    ]);
  });

  function hypotheticalSyllogism({statements}) {
   let result = [];
   // a => b, b => c |= a => c
   let implications = statements.filter(x => x.op == "=>");
   for (let implication of implications) {
    let match = implications.find(x => equals(x.left, implication.right));
    if (match) {
     result.push(implies(implication.left, match.right));
    }
   }
   return result;
  }

  it("a => b, b => c |= a => c", function() {
    assertThat(hypotheticalSyllogism(logic.parse(`
      a => b
      b => c
     `)))
     .equalsTo([
       implies(literal("a"), literal("c"))
    ]);
  });

  function constructiveDillema({statements}) {
   let result = [];
   // (a => c) && (b => d), a || b |= c || d
   let disjunctions = statements.filter(x => x.op == "&&");
   let conjunctions = statements.filter(x => x.op == "||");
   for (let disjunction of disjunctions) {
    if (disjunction.left.op == "=>" &&
        disjunction.right.op == "=>") {
     let match = conjunctions.find(x =>
                                   equals(x.left, disjunction.left.left) &&
                                   equals(x.right, disjunction.right.left));
     result.push(or(disjunction.left.right, disjunction.right.right));
    }
   }
   return result;
  }

  it("(a => c) && (b => d), a || b |= c || d", function() {
    assertThat(constructiveDillema(logic.parse(`
      (a => c) && (b => d)
      a || b
     `)))
     .equalsTo([
       or(literal("c"), literal("d"))
    ]);
  });

  function absorption({statements}) {
   let result = [];
   // a => b |= a => (a & b)
   let implications = statements.filter(x => x.op == "=>");
   for (let implication of implications) {
    result.push(implies(implication.left, and(implication.left, implication.right)));
   }
   return result;
  }

  it("a => b |= a => (a & b)", function() {
    assertThat(absorption(logic.parse(`
      a => b
     `)))
     .equalsTo([
       implies(literal("a"), and(literal("a"), literal("b")))
    ]);
  });

  // Propositional Logic
  //
  // Rules of inference
  //
  // Modus Ponens: a => b, a |= b
  // Modus Tollens: a => b, ~b |= ~a
  // Modus Tollendo Ponens (Disjunctive Syllogism): a || b, ~a |= b and a || b, ~b |= a
  // Disjunction Introduction (Addition): a |= a || b, b |= a || b
  // Conjunction Introduction (Simplification): a && b |= a and a && b |= b
  // Hypothetical Syllogism: a => b, b => c |= a => c
  // Constructive Dilemma: (a => c) && (b => d), a || b |= c || d
  // Absorption: a => b |= a => (a & b)
  //
  // Rules of replacement: rewriting, no new information
  //
  // Double negation: ~~a |= a
  // Communitativity: a && b |= b && a
  // Associativity: (a && b) && c |= a && (b && c)
  // Tautology: a |= a && a, a |= a || a
  // DeMorgan's Law: ~(a && b) |= ~a || ~b, ~(a || b) |= ~a && ~b
  // Tranposition (contraposition): a => b, ~b => ~a
  // Material implication: a => b |= ~a || b
  // Exportation: a => (b => c) |= (a && b) => c
  // Distribution: a && (b || c) |= (a && b) || (a && c), a || (b && c) |= (a || b) && (a || c)
  // Material equivalence: a <=> b |= (a => b) && (b => a) |= (a && b) || (~a & ~b)

  function forward(program) {
   let result = [];
   result = result.concat(modusPonens(program));
   result = result.concat(modusTollens(program));
   result = result.concat(disjunctiveSyllogism(program));
   // This expands a lot. We probably want to use this more carefully.
   // disjunctiveIntroduction(program);
   result = result.concat(conjunctionElimination(program));
   // This expands a lot too.
   // result = result.concat(conjunctionIntroduction(program));
   result = result.concat(hypotheticalSyllogism(program));
   result = result.concat(constructiveDillema(program));
   // This expands a lot too.
   // result = result.concat(absorption(program));
   return result;
  }

  it("forward chaining", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = logic.parse(`
      cat_fur || dog_fur
      dog_fur => thompson_allergy
      cat_fur => macavity_criminal
      ~thompson_allergy
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
    assertThat(entails(code, negation(literal("dog_fur"))))
     .equalsTo(false);
    
    assertThat(deduce(code, negation(literal("dog_fur"))))
     .equalsTo(true);

    assertThat(deduce(code, literal("cat_fur")))
     .equalsTo(true);

    assertThat(deduce(code, literal("macavity_criminal")))
     .equalsTo(true);
  });

  function deduce(program, assumption) {
   do {
    if (entails(program, assumption)) {
     return true;
    }
    let inference = forward(program);
    program.statements.splice(
        program.statements.length, 0, ...inference);
   } while (true);
  }

  function entails({statements}, assumption) {
   for (statement of statements) {
    if (equals(statement, assumption)) {
     return true;
    }
   }
   return false;
  }

  it("backward chaining", function() {
    // http://www.cs.cornell.edu/courses/cs472/2005fa/lectures/15-kb-systems_part3_6up.pdf
    let knowledge = `
     PersonInFrontOfCar => Brake
     (YelloLight && Policeman && ~Slippery) => Brake
     Policecar => Policeman
     Snow => Slippery
     Slippery => ~Dry
     RedLight => Brake
     Winter => Snow    
    `;
    let observations = `
     YellowLight
     ~RedLight
     ~Snow
     Dry
     Policecar
     ~PersonInFrontOfCar
    `
    let kb = logic.parse(knowledge + observations);

    // Can we infer "Brake"?
  });

  function equals(a, b) {
   return JSON.stringify(a) === JSON.stringify(b);
  }

  function normalize(node) {
   // https://www.iep.utm.edu/prop-log/#SH5a
   let result = Object.assign(node);
   if (node.name == "~") {
    result.expression = normalize(node.expression);
   } else if (node.op == "&&" || 
              node.op == "||" ||
              node.op == "=>") {
    result.left = normalize(node.left);
    result.right = normalize(node.right);
   }

   if (result.name == "~" &&
       result.expression.name == "~") {
    // double-negation
    return result.expression.expression;
   } else if ((result.op == "&&" || result.op == "||") &&
              equals(result.left, result.right)) {
    return result.left;
   } else if (result.name == "~" &&
              result.expression.op == "&&") {
    // demorgan's law
    return or(negation(result.expression.left),
              negation(result.expression.right));
   } else if (result.name == "~" &&
              result.expression.op == "||") {
    // demorgan's law
    return and(negation(result.expression.left), 
               negation(result.expression.right));
   } else if (result.op == "=>" && 
              result.left.name == "~" &&
              result.right.name == "~") {
    // tranposition / contraposition
    return implies(result.right.expression,
                   result.left.expression);
   } else if (result.op == "||" &&
              result.left.name == "~") {
    return implies(result.left.expression,
                   result.right);
    // material implication
   } else if (result.op == "=>" &&
              result.right.op == "=>") {
    return implies(and(result.left, result.right.left),
                   result.right.right);
   } else if (result.op == "||" &&
              result.left.op == "&&" &&
              result.right.op == "&&" &&
              equals(result.left.left, result.right.left)) {
    // distribution.
    return and(result.left.left,
               or(result.left.right, result.right.right));
   } else if (result.op == "&&" &&
              result.left.op == "||" &&
              result.right.op == "||" &&
              equals(result.left.left, result.right.left)) {
    // distribution.
    return or(result.left.left,
              and(result.left.right, result.right.right));
   }
   
   return result;
  }

  it("~~a == a", function() {
    // double negatives
    assertThat(normalize(Rule.of("~~a")))
     .equalsTo(Rule.of("a"));

    assertThat(normalize(Rule.of("~~~a")))
     .equalsTo(Rule.of("~a"));

    assertThat(normalize(Rule.of("~~~~a")))
     .equalsTo(Rule.of("a"));

    assertThat(normalize(Rule.of("~~~~~a")))
     .equalsTo(Rule.of("~a"));
   });

  it("a && a == a, a || a == a", function() {
    // Tautologies
    assertThat(normalize(Rule.of("a && a")))
     .equalsTo(Rule.of("a"));
    assertThat(normalize(Rule.of("a || a")))
     .equalsTo(Rule.of("a"));
   });

  it("~(a && b) == (~a) || (~b)", function() {
    // DeMorgan's Law
    assertThat(normalize(Rule.of("~(a && b)")))
     .equalsTo(Rule.of("(~a) || (~b)"));
    assertThat(normalize(Rule.of("~(a || b)")))
     .equalsTo(Rule.of("(~a) && (~b)"));

   });

  it("~b => ~a == a => b", function() {
    // Transposition
    assertThat(normalize(Rule.of("(~b) => (~a)")))
     .equalsTo(Rule.of("a => b"));
   });

  it("~a || b == a => b", function() {
    // Material implication
    assertThat(normalize(Rule.of("(~a) || b")))
     .equalsTo(Rule.of("a => b"));
   });

  it("a => (b => c) == (a && b) => c", function() {
    // Exportation
    assertThat(normalize(Rule.of("a => (b => c)")))
     .equalsTo(Rule.of("(a && b) => c"));
   });

  it("(a && b) || (a && c) == a && (b || c)", function() {
    // Distribution
    assertThat(normalize(Rule.of("(a && b) || (a && c)")))
     .equalsTo(Rule.of("a && (b || c)"));
    assertThat(normalize(Rule.of("(a || b) && (a || c)")))
     .equalsTo(Rule.of("a || (b && c)"));
   });

  it.skip("b && a == a && b", function() {
    // Commutativity
    // Sorts parameters alphabetically
    // assertThat(rewrite(Rule.of("b & a")))
    // .equalsTo(Rule.of("a & b"));
   });

  it.skip("(a && b) && c == a && (b && c)", function() {
    // Associativity
    // Sorts parameters alphabetically
    // assertThat(rewrite(Rule.of("(a && b) && c")))
    // .equalsTo(Rule.of("a && (b && c)"));
    // assertThat(rewrite(Rule.of("(a || b) || c")))
    // .equalsTo(Rule.of("a || (b || c)"));
   });

  it("a && ~~a == a", function() {
    // Intermingling
    // Tautology with double negative
    assertThat(normalize(Rule.of("a && (~~a)")))
     .equalsTo(Rule.of("a"));
   });

  it("a => (b => (c && c))", function() {
    // Intermingling
    // Exportation and tautology.
    assertThat(normalize(Rule.of("a => (b => (c && c))")))
     .equalsTo(Rule.of("(a && b) => c"));
   });

  class Rule {
   static of(str) {
    return logic.parse(str).statements[0];
   }
  }

  it.skip("backward chaining", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = logic.parse(`
      cat_fur || dog_fur
      dog_fur => thompson_allergy
      cat_fur => macavity_criminal
      ~thompson_allergy
    `);

    function foreach(kb, op, body) {
     for (let statement of kb.statements.filter(x => x.op == op)) {
      body(statement);
     }
    }

    function backward(goal) {
     console.log("proving: " + JSON.stringify(goal));

     // Searches the KB for implications with
     // the goal on the right hand side (modus ponens).
     foreach (code, "=>", (statement) => {
       if (equals(statement.right, goal)) {
        // console.log(statement);
        // goal.push();
        // console.log("hi");
        backward(statement.left);
       }
      });

     // Searches the KB for implications with
     // the negation of the goal on the left hand
     // side (modus tollens).
     foreach (code, "=>", (statement) => {
       // console.log(negation(goal));
       if (equals(statement.left, negation(goal))) {
        backward(negation(statement.right));
       }
      });

     foreach (code, "||", (statement) => {
       // console.log(statement);
       if (equals(statement.left, goal)) {
        // console.log(statement);
        backward(negation(statement.right));
       } else if (equals(statement.right, goal)) {
        // console.log(statement);
        backward(negation(statement.left));
       }
      });
    }

    backward(literal("macavity_criminal"));

   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

