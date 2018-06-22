const Assert = require("assert");
const logic = require("../grammar.js");
const {Reasoner, normalize, stringify, equals} = require("../reasoner.js");
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

describe("Logic", function() {
  it("a => b, a |= b", function() {
    assertThat(Reasoner.modusPonens(Parser.parse(`
      a => b
      a
    `)))
     .equalsTo([literal("b")]);
  });

  it("a && b => c || d, a & b |= c || d", function() {
    assertThat(Reasoner.modusPonens(Parser.parse(`
      (a && b) => (c || d)
      a && b
    `)))
     .equalsTo([
       or(literal("c"), literal("d"))
     ]);
  });

  it("a => b, ~b |= ~a", function() {
    assertThat(Reasoner.modusTollens(logic.parse(`
      a => b
      ~b
    `)))
    .equalsTo([negation(literal("a"))]);
  });

  it("a || b, ~a |= b", function() {
    let code = Parser.parse(`
      a || b
      ~a
    `);

    assertThat(Reasoner.disjunctiveSyllogism(code)).equalsTo([
      literal("b")
    ]);
  });

  it("a || b, ~b |= a", function() {
    let code = Parser.parse(`
      a || b
      ~b
    `);

    assertThat(Reasoner.disjunctiveSyllogism(code)).equalsTo([
      literal("a")
    ]);
  });

  it("a |= a || b", function() {
    let code = Parser.parse(`
      a
    `);

    assertThat(Reasoner.disjunctiveIntroduction(code, literal("b")))
     .equalsTo([
       or(literal("a"), literal("b")),
       or(literal("b"), literal("a"))
    ]);
  });

  it("a && b |= a, b", function() {
    assertThat(Reasoner.conjunctionElimination(Parser.parse(`
      a && b
     `)))
     .equalsTo([
       literal("a"), literal("b")
    ]);
  });

  it("a, b |= a && b", function() {
    assertThat(Reasoner.conjunctionIntroduction(Parser.parse(`
      a
      b
     `)))
     .equalsTo([
       and(literal("a"), literal("b")),
       and(literal("b"), literal("a"))
    ]);
  });

  it("a => b, b => c |= a => c", function() {
    assertThat(Reasoner.hypotheticalSyllogism(Parser.parse(`
      a => b
      b => c
     `)))
     .equalsTo([
       implies(literal("a"), literal("c"))
    ]);
  });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    assertThat(Reasoner.constructiveDillema(Parser.parse(`
      (a => c) && (b => d)
      a || b
     `)))
     .equalsTo([
       or(literal("c"), literal("d"))
    ]);
  });

  it("a => b |= a => (a & b)", function() {
    assertThat(Reasoner.absorption(Parser.parse(`
      a => b
     `)))
     .equalsTo([
       implies(literal("a"), and(literal("a"), literal("b")))
    ]);
  });

  it("forward chaining", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = Parser.parse(`
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
    assertThat(Reasoner.entails(code, negation(literal("dog_fur"))))
     .equalsTo(false);
    
    assertThat(Reasoner.deduce(code, negation(literal("dog_fur"))))
     .equalsTo(true);

    assertThat(Reasoner.deduce(code, literal("cat_fur")))
     .equalsTo(true);

    assertThat(Reasoner.deduce(code, literal("macavity_criminal")))
     .equalsTo(true);
  });

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

  it("b && a == a && b", function() {
    // Commutativity
    // Sorts parameters alphabetically
    assertThat(normalize(Rule.of("b && a")))
     .equalsTo(Rule.of("a && b"));
    assertThat(normalize(Rule.of("a && b")))
     .equalsTo(Rule.of("a && b"));

    assertThat(normalize(Rule.of("b || a")))
     .equalsTo(Rule.of("a || b"));
    assertThat(normalize(Rule.of("a || b")))
     .equalsTo(Rule.of("a || b"));
   });

  it("(a && b) && c == a && (b && c)", function() {
    // Associativity
    // Sorts parameters by size
    assertThat(normalize(Rule.of("(a && b) && c")))
     .equalsTo(Rule.of("a && (b && c)"));
    assertThat(normalize(Rule.of("(a || b) || c")))
     .equalsTo(Rule.of("a || (b || c)"));
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

  it("stringify", function() {
    assertThat(stringify(Rule.of("~a"))).equalsTo("~a");
    assertThat(stringify(Rule.of("a && b"))).equalsTo("a && b");
    assertThat(stringify(Rule.of("a || b"))).equalsTo("a || b");
    assertThat(stringify(Rule.of("a => b"))).equalsTo("a => b");
    assertThat(stringify(Rule.of("a ^ b"))).equalsTo("a ^ b");
    assertThat(stringify(Rule.of("a && b && c"))).equalsTo("a && b && c");
    assertThat(stringify(Rule.of("a && (b && c)"))).equalsTo("a && b && c");
    assertThat(stringify(Rule.of("a && b => c"))).equalsTo("a && b => c");
    assertThat(stringify(Rule.of("a => b => c"))).equalsTo("a => b => c");
   });

  function* op(kb, op) {
   for (let statement of kb.statements.filter(x => x.op == op)) {
    // body(statement);
    yield statement;
   }
  }

  function backward(kb, goal) {
   // console.log("proving: " + JSON.stringify(goal));

   // Searches the KB for implications with
   // the goal on the right hand side (modus ponens).
   for (let statement of op(kb, "=>")) {
    if (equals(statement.right, goal)) {
     let subgoal = backward(kb, statement.left);
     if (subgoal.length > 0) {
      return [...subgoal, {given: statement, and: [statement.left], goal: goal}];
     }
     //return backward(statement.left);
    }
   }
   
   // Searches the KB for implications with
   // the negation of the goal on the left hand
   // side (modus tollens).
   for (let statement of op(kb, "=>")) {
    if (equals(statement.left, negation(goal))) {
     let subgoal = backward(kb, negation(statement.right));
     if (subgoal.length > 0) {
      return [...subgoal, {given: statement, and: [negation(statement.right)], goal: goal}];
     }
     // return backward(negation(statement.right));
    }
   }

   // Disjunctive Syllogism
   for (let statement of op(kb, "||")) {
    // console.log(statement);
    if (equals(statement.left, goal)) {
     // console.log(statement);
     let subgoal = backward(kb, negation(statement.right));
     if (subgoal.length > 0) {
      return [...subgoal, {given: statement, and: [negation(statement.right)], goal: goal}];
     }
    } else if (equals(statement.right, goal)) {
     // console.log(statement);
     let subgoal = backward(kb, negation(statement.left));
     if (subgoal.length > 0) {
      return [...subgoal, {given: statement, and: [negation(statement.left)], goal: goal}];
     }
    }
   }

   // Conjunction elimination
   for (let statement of op(kb, "&&")) {
    if (equals(statement.left, goal)) {
     return [{given: statement, goal: goal}];
    }

    if (equals(statement.right, goal)) {
     return [{given: statement, goal: goal}];
    }
   }

   // Conjunction introduction
   if (goal.op == "&&") {
    // console.log("hi");
    let left = backward(kb, goal.left);
    if (left.length > 0) {
     let right = backward(kb, goal.right);
     if (right.length > 0) {
      return [...left, ...right, {given: goal.left, and: [goal.right], goal: goal}];
     }
    }
   }

   // Disjunction introduction
   if (goal.op == "||") {
    let left = backward(kb, goal.left);
    if (left.length > 0) {
     return [{given: goal.left, goal: goal}];
    }
    let right = backward(kb, goal.right);
    if (right.length > 0) {
     return [{given: goal.right, goal: goal}];
    }
   }
   
   // Hypothetical Syllogysm
   if (goal.op == "=>") {
    // TODO(goto): this only deals with a single
    // level of recursion. Generalize this to
    // multiple levels.
    for (let right of op(kb, "=>")) {
     if (equals(right.right, goal.right)) {
      for (let left of op(kb, "=>")) {
       if (equals(left.right, right.left)) {
        return [{given: left, and: [right], goal: goal}];
       }
      }
     }
    }
   }

   // Absorption.
   if (goal.op == "=>") {
    if (goal.right.op == "&&") {
     if (equals(goal.right.left, goal.left)) {
      let result = backward(kb, implies(goal.left, goal.right.right));
      if (result.length > 0) {
       return [{given: implies(goal.left, goal.right.right), goal: goal}];
      }
     } else if (equals(goal.right.right, goal.left)) {
      let result = backward(kb, implies(goal.left, goal.right.left));
      if (result.length > 0) {
       return [{given: implies(goal.left, goal.right.left), goal: goal}];
      }
     }
    }
   }

   // Constructive dilemma.
   if (goal.op == "||") {
    // TODO(goto): this is a shallow implementation
    // too of the constructive dilemma. Specifically
    // it doens't look recursively for implications
    // nor enables implications to be written as
    // conjunctions, disjunctions and negations.
    for (let first of op(kb, "=>")) {
     if (equals(first.right, goal.left)) {
      for (let second of op(kb, "=>")) {
       if (equals(second.right, goal.right)) {
        for (let third of op(kb, "||")) {
         if (equals(third.left, first.left) &&
             equals(third.right, second.left)) {
          // console.log("found");
          return [{given: first, and: [second, third], goal: goal}];
         }
        }
       }
      }      
     }
    }    
   }

   // console.log("hello");
   // console.log(goal);
   // console.log(kb.statements);
   
   for (let statement of kb.statements) {
    // console.log(statement);
    if (equals(statement, goal)) {
     return [{given: statement, goal: goal}];
    }
   };

   return [];
  }

  function explain(reasons) {
   let result = [];
   // console.log(JSON.stringify(reasons));
   for (let reason of reasons) {
    // console.log(reason);
    if (equals(reason.given, reason.goal)) {
     result.push("Take that " + stringify(reason.given) + ". ");
    } else {
     let line = [];
     line.push("If " + stringify(reason.given) + " ");
     let ands = reason.and || [];
     for (let and of ands) {
      line.push("and " + stringify(and) + " ");
     }
     line.push("then " + stringify(reason.goal) + ". ");
     result.push(line.join(""));
    }
   }
   return result.join("\n");
  }

  it("a => b, a |= b?", function() {
    let code = logic.parse(`
      a => b
      a
    `);

    assertThat(explain(backward(code, Rule.of("b"))))
     .equalsTo(`Take that a. 
If a => b and a then b. `);
   });

  it("a => b, ~b |= ~a?", function() {
    let code = logic.parse(`
      a => b
      ~b
    `);

    assertThat(explain(backward(code, Rule.of("~a"))))
     .equalsTo(`Take that ~b. 
If a => b and ~b then ~a. `);
   });

  it("a || b, ~a |= b?", function() {
    let code = logic.parse(`
      a || b
      ~a
    `);

    assertThat(explain(backward(code, Rule.of("b"))))
     .equalsTo(`Take that ~a. 
If a || b and ~a then b. `);
   });

  it("a || b, ~b |= a?", function() {
    let code = logic.parse(`
      a || b
      ~b
    `);

    assertThat(explain(backward(code, Rule.of("a"))))
     .equalsTo(`Take that ~b. 
If a || b and ~b then a. `);
   });

  it("a |= a || b?", function() {
    let code = logic.parse(`
      a
    `);

    assertThat(explain(backward(code, Rule.of("a || b"))))
     .equalsTo(`If a then a || b. `);
   });

  it("a |= b || a?", function() {
    let code = logic.parse(`
      a
    `);

    assertThat(explain(backward(code, Rule.of("b || a"))))
     .equalsTo(`If a then b || a. `);
   });

  it("a && b |= a?", function() {
    let code = logic.parse(`
      a && b
    `);

    assertThat(explain(backward(code, Rule.of("a"))))
     .equalsTo(`If a && b then a. `);
   });

  it("b && a |= a?", function() {
    let code = logic.parse(`
      b && a
    `);

    assertThat(explain(backward(code, Rule.of("a"))))
     .equalsTo(`If b && a then a. `);
   });

  it("a, b |= a && b?", function() {
    let code = logic.parse(`
      a
      b
    `);

    assertThat(explain(backward(code, Rule.of("a && b"))))
     .equalsTo(`Take that a. 
Take that b. 
If a and b then a && b. `);
   });

  it("a => b, b => c |= a => c?", function() {
    let code = logic.parse(`
      a => b
      b => c
    `);

    assertThat(explain(backward(code, Rule.of("a => c"))))
     .equalsTo(`If a => b and b => c then a => c. `);
   });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    let code = logic.parse(`
      a => c
      b => d
      a || b
    `);

    assertThat(explain(backward(code, Rule.of("c || d"))))
     .equalsTo(`If a => c and b => d and a || b then c || d. `);
   });

  it("a => b |= a => (a && b)", function() {
    let code = logic.parse(`
      a => b
    `);

    assertThat(explain(backward(code, Rule.of("a => (a && b)"))))
     .equalsTo(`If a => b then a => a && b. `);
   });

  it("criminal?", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = logic.parse(`
      cat_fur || dog_fur
      dog_fur => thompson_allergy
      cat_fur => macavity_criminal
      ~thompson_allergy
    `);

    assertThat(explain(backward(code, Rule.of("macavity_criminal"))))
     .equalsTo(`Take that ~thompson_allergy. 
If dog_fur => thompson_allergy and ~thompson_allergy then ~dog_fur. 
If cat_fur || dog_fur and ~dog_fur then cat_fur. 
If cat_fur => macavity_criminal and cat_fur then macavity_criminal. `);

   });

  it("brake?", function() {
    // http://www.cs.cornell.edu/courses/cs472/2005fa/lectures/15-kb-systems_part3_6up.pdf
    let kb = logic.parse(`
     PersonInFrontOfCar => Brake
     (YellowLight && Policeman && ~Slippery) => Brake
     Policecar => Policeman
     Snow => Slippery
     Slippery => ~Dry
     RedLight => Brake
     Winter => Snow    
     YellowLight
     ~RedLight
     ~Snow
     Dry
     Policecar
     ~PersonInFrontOfCar
    `);

    // Can we infer "Brake"?
    assertThat(explain(backward(kb, Rule.of("Brake"))))
     .equalsTo(`Take that Policecar. 
If Policecar => Policeman and Policecar then Policeman. 
Take that Dry. 
If Slippery => ~Dry and ~~Dry then ~Slippery. 
If Policeman and ~Slippery then Policeman && ~Slippery. 
Take that YellowLight. 
If Policeman && ~Slippery and YellowLight then Policeman && ~Slippery && YellowLight. 
If Policeman && ~Slippery && YellowLight => Brake and YellowLight && Policeman && ~Slippery then Brake. `);

  });

  // TODO(goto): check if a && b => c has the precedence there

  it.skip("q?", function() {
    // http://pages.cs.wisc.edu/~bgibson/cs540/handouts/pl.pdf
    // TODO(goto): 
    let kb = logic.parse(`
      p => q
      (l && m) => p
      (b && l) => m
      (a && p) => l
      (a && b) => l
      a
      b
    `);

    // Can we infer "Brake"?
    assertThat(explain(backward(kb, Rule.of("q"))))
     .equalsTo(``);

  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

