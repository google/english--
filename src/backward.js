const {normalize, stringify, equals, explain, toString} = require("./forward.js");
const {Parser, Rule} = require("./parser.js");

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

class Result {
 constructor() {
  this.reason = [];
  this.bindings = {};
 }
 static failed() {
  return new Result();
 }
 static of(reason) {
  return new Result().push(reason);
 }
 failed() {
  return this.reason.length == 0;
 }
 get(key) {
  let result = key;
  while (this.bindings[result] && this.bindings[result].free) {
   result = this.bindings[result].expression.name;
  }
  return this.bindings[result];
 }
 bind(vars) {
   for (let [key, value] of Object.entries(vars)) {
     if (this.bindings[key] && !equals(value, this.get(key))) {
       console.log(this.bindings[key]);
       console.log(value);
       console.log(this.get(key));
       throw new Error("Unsupported condition: conflicting bindings: " + key);
     }
   }
   for (let [key, value] of Object.entries(vars)) {
     if (!value.free) {
       // if this is a concrete value, bind it.
       this.bindings[key] = value;
     } else {
       // if this is an free value, leave it open or
       // bind it to an existing one.
       this.bindings[key] = this.get(value.expression.name) || value;
     }
   }
   return this;
 }
 push(reason) {
  if (reason instanceof Result) {
   this.reason.push(...reason.reason);
  } else if (Array.isArray(reason)) {
   this.reason.push(...reason);
  } else if (typeof reason == "object") {
   this.reason.push(reason);
  } else {
   throw new Error("Unsupported reason type");
  }
  return this;
 }
 toString() {
  return explain(this.reason);
 }
}

class Backward {
 constructor(kb) {
  this.kb = kb.statements;
 }

 * op(op) {
  for (let statement of this.kb.filter(x => x.op == op)) {
   if (statement.quantifiers && statement.quantifiers.length > 0) {
    // ignore all of the statements that are quantified.
    // console.log(`skipping ${stringify(statement)}`);
    continue;
   }
   yield statement;
  }
 }

 direct(goal) {
  for (let statement of this.kb) {
   // console.log(`${stringify(goal)} == ${stringify(statement)}`);
   // console.log(goal);
   if (equals(statement, goal)) {
    // console.log("hello");
    return {statement: statement, match: true};
   }
  }
  return {match: false};
 }

 backward(goal, stack = []) {
  // console.log(`goal: ${stringify(goal)}? \/\/ propositional`);
  for (let subgoal of stack) {
   if (equals(goal, subgoal)) {
    return Result.failed();
   }
  }

  let {statement, match} = this.direct(goal);
  if (match) {
   return Result.of({given: statement, goal: goal});
  }

  // Conjunction elimination
  for (let statement of this.op("&&")) {
   if (equals(statement.left, goal)) {
    this.kb.push(goal);
    return Result.of({given: statement, goal: goal});
   }

   if (equals(statement.right, goal)) {
    this.kb.push(goal);
    return Result.of({given: statement, goal: goal});
   }
  }

  // Searches the KB for implications with
  // the goal on the right hand side (modus ponens).
  for (let statement of this.op("=>")) {
   // console.log("foo");
   if (equals(statement.right, goal)) {
    stack.push(goal);
    let subgoal = this.backward(statement.left, stack);
    stack.pop();
    if (!subgoal.failed()) {
     this.kb.push(goal);
     return subgoal.push({given: statement, and: [statement.left], goal: goal});
    }
   }
  }

  // Searches the KB for implications with
  // the negation of the goal on the left hand
  // side (modus tollens).
  for (let statement of this.op("=>")) {
   if (equals(statement.left, negation(goal))) {
    stack.push(goal);
    let subgoal = this.backward(negation(statement.right), stack);
    stack.pop();
    if (!subgoal.failed()) {
     this.kb.push(goal);
     return subgoal.push({given: statement, and: [negation(statement.right)], goal: goal});
    }
    // return backward(negation(statement.right));
   }
  }

  // Disjunctive Syllogism
  for (let statement of this.op("||")) {
   // console.log(statement);
   if (equals(statement.left, goal)) {
    // console.log(statement);
    stack.push(goal);
    let subgoal = this.backward(negation(statement.right), stack);
    stack.pop();
    if (!subgoal.failed()) {
     this.kb.push(goal);
     return subgoal.push({
       given: statement, 
       and: [negation(statement.right)], 
       goal: goal
     });
    }
   } else if (equals(statement.right, goal)) {
    // console.log(statement);
    stack.push(goal);
    let subgoal = this.backward(negation(statement.left), stack);
    stack.pop();
    if (!subgoal.failed()) {
     this.kb.push(goal);
     return  subgoal.push({
       given: statement, 
       and: [negation(statement.left)], 
       goal: goal
     });
    }
   }
  }

  // Conjunction introduction
  if (goal.op == "&&") {
   // console.log("hi");
   stack.push(goal);
   let left = this.backward(goal.left, stack);
   stack.pop();
   if (!left.failed()) {
    stack.push(goal);
    let right = this.backward(goal.right, stack);
    stack.pop();
    if (!right.failed()) {
     this.kb.push(goal);
     return left.push(right).push({
       given: goal.left, 
       and: [goal.right], 
       goal: goal
     });
    }
   }
  }

  // Disjunction introduction
  if (goal.op == "||") {
   stack.push(goal);
   let left = this.backward(goal.left, stack);
   stack.pop();
   if (!left.failed()) {
    this.kb.push(goal);
    return left.push({given: goal.left, goal: goal});
   }
   stack.push(goal);
   let right = this.backward(goal.right, stack);
   stack.pop()
    if (!right.failed()) {
    this.kb.push(goal);
    return right.push({given: goal.right, goal: goal});
   }
  }

  // Hypothetical Syllogysm
  if (goal.op == "=>") {
   // TODO(goto): this only deals with a single
   // level of recursion. Generalize this to
   // multiple levels.
   for (let right of this.op("=>")) {
    if (equals(right.right, goal.right)) {
     for (let left of this.op("=>")) {
      if (equals(left.right, right.left)) {
       this.kb.push(goal);
       return Result.of({given: left, and: [right], goal: goal});
      }
     }
    }
   }
  }

  // Absorption.
  if (goal.op == "=>") {
   if (goal.right.op == "&&") {
    if (equals(goal.right.left, goal.left)) {
     stack.push(goal);
     let result = this.backward(implies(goal.left, goal.right.right), stack);
     stack.pop();
     if (!result.failed()) {
      this.kb.push(goal);
      return  Result.of({given: implies(goal.left, goal.right.right), goal: goal});
     }
    } else if (equals(goal.right.right, goal.left)) {
     stack.push(goal);
     let result = this.backward(implies(goal.left, goal.right.left), stack);
     stack.pop();
     if (!result.failed()) {
      this.kb.push(goal);
      return Result.of({given: implies(goal.left, goal.right.left), goal: goal});
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
   for (let first of this.op("=>")) {
    if (equals(first.right, goal.left)) {
     for (let second of this.op("=>")) {
      if (equals(second.right, goal.right)) {
       for (let third of this.op("||")) {
        if (equals(third.left, first.left) &&
            equals(third.right, second.left)) {
         // console.log("found");
         this.kb.push(goal);
         return Result.of({given: first, and: [second, third], goal: goal});
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

  return new Result();
 }
}


module.exports = {
 Backward: Backward,
 Result: Result
};
