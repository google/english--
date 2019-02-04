const {equals, stringify, toString, clone} = require("./forward.js");
const {Backward, Result} = require("./backward.js");
const {Parser, Rule} = require("./parser.js");
const {unify, fill, rewrite} = require("./unify.js");

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

class Reasoner extends Backward {
 constructor(kb) {
  super(rewrite(kb));
 }
 find(predicate) {
  return this.kb.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal, stack = []) {
  return this.go(goal, stack).next().value;
 }
 * quantifiers(op) {
  // console.log(`${op}`);
  for (let statement of this.kb.filter(x => x.op == op)) {
   if (statement.quantifiers != undefined && statement.quantifiers.length > 0) {
    yield statement;
   }
  }
 }
 *go(goal, stack = []) {
  // console.log("goal: " + stringify(goal) + ", stack: " + stack.length);

  for (let subgoal of stack) {
   // this is expensive and un-necessary, but more
   // correct than equals().
   // console.log(`${stringify(goal)} == ${stringify(subgoal)}`);
   if (stringify(goal) == stringify(subgoal)) {
    return Result.failed();
   }
   // if (equals(goal, subgoal)) {
   //   yield Result.failed();
   // }
  }

  if (!goal.quantifiers || goal.quantifiers.length == 0) {
   let propositional = super.backward(goal, stack);
   if (!propositional.failed()) {
    yield propositional;
   }
  }

  // existential introduction
  if (goal.quantifiers &&
      goal.quantifiers.length == 1 &&
      goal.quantifiers[0].op == "exists") {
   let subgoal = clone(goal);
   for (let statement of this.kb) {
    let unifies = unify(statement, subgoal);
    if (!unifies) {
     continue;
    } else if (Object.entries(unifies).length == 0) {
     yield Result.of({given: statement});
    } else {
     let head = goal.quantifiers && goal.quantifiers.length > 0;
     yield Result.of([{given: statement}, {given: fill(goal, unifies, undefined, head)}]).bind(unifies);
    }
   }
  }

  // universal introduction
  for (let statement of this.kb) {
   let universal = clone(statement);
   if (!(universal.quantifiers &&
         universal.quantifiers.length == 1 &&
         universal.quantifiers[0].op == "forall")) {
    // TODO(goto): deal with multiple chained quantifiers.
    continue;
   }
   // removes the quantifier, while still leaving
   // the variable free in the body.
   universal.quantifiers.pop();
   // TODO(goto): deal with expressions in the body
   // rather than just immediate unifications.
   let unifies = unify(universal, goal);
   if (!unifies) {
    continue;
   } else if (Object.entries(unifies).length == 0) {
    yield Result.of({given: statement});
   } else {
    let head = goal.quantifiers && goal.quantifiers.length > 0;
    yield Result.of([{given: statement}, {given: fill(goal, unifies, undefined, head)}]).bind(unifies);
   }
  }

  // universal modus ponens.
  for (let statement of this.quantifiers("=>")) {
   let reversed = clone(statement);
   reversed.quantifiers = reversed.quantifiers
    .map((x) => {x.op = "exists"; return x;});

   let implication = clone(reversed.right);
   implication.quantifiers = reversed.quantifiers;

   let unifies = unify(implication, goal);

   if (!unifies || Object.entries(unifies).length == 0) {
    continue;
   }

   // TODO(goto): we probably need to push to the
   // quantifiers rather than replace it.
   let head = clone(reversed.left);
   head.quantifiers = reversed.quantifiers;
   let left = fill(head, unifies, true);

   // console.log(stringify(reversed));
   // console.log(stringify(head));
   // console.log(stringify(left));
 
   // console.log(stringify(left));

   // TODO(goto): understand and create a test to see what
   // happens when there are multiple quantifiers.

   left.quantifiers = left.quantifiers.filter(x => {
     return !unifies[x.variable.name];
   });

   // TODO(goto): this is a total hack because the
   // .equals() of expressions don't know the difference
   // between an expression with empty quantifiers
   // and undefined quantifiers. This is going to cause
   // a lot of trouble, we should fix it.
   // for (let quantifier of left.quantifiers) {
   //   delete quantifier.id;
   // }

   if (left.quantifiers.length == 0) {
    delete left.quantifiers;
   }

   // console.log(JSON.stringify(left, undefined, 2));
   // throw new Error("foo");

   stack.push(goal);
   // console.log("push: " + stringify(goal));
   // console.log("stack: " + stack.map(x => stringify(x)));
   let deps = this.go(left, stack);
   // console.log("hello");

   for (let dep of deps) {
    if (!dep.failed()) {
     yield dep.bind(unifies)
      .push({given: fill(statement, dep.bindings, undefined, true)})
      .push({given: fill(goal, dep.bindings, undefined, true)});
    }
   }

   stack.pop();
  }

  // universal conjunction elimination.
  for (let statement of this.quantifiers("&&")) {
   let left = unify(statement.left, goal);
   if (left) {
    yield Result.of([{given: fill(statement, left, undefined, true)}, {given: goal}]);
   }
   let right = unify(statement.right, goal);
   if (right) {
    yield Result.of([{given: fill(statement, right, undefined, true)}, {given: goal}]);
   }
  }

  // universal disjunction syllogism
  for (let statement of this.quantifiers("||")) {
   let left = unify(statement.left, goal);
   if (left) {
    let right = fill(negation(statement.right), left, true);
    stack.push(goal);
    let result = this.backward(right, stack);
    stack.pop();
    if (!result.failed()) {
     yield result.push({given: fill(statement, left, undefined, true), goal: goal});
    }
   }

   let right = unify(statement.right, goal);
   if (right) {
    let left = fill(negation(statement.left), right, true);
    stack.push(goal);
    let result = this.backward(left, stack);
    stack.pop();
    if (!result.failed()) {
     yield result.push({given: fill(statement, right, undefined, true), goal: goal});
    }
   }
  }

  // existential conjunction introduction
  if (goal.quantifiers &&
      goal.quantifiers.length == 1 &&
      goal.quantifiers[0].op == "exists" &&
      goal.op == "&&") {

   let variable = goal.quantifiers[0].variable.name;
   let left = JSON.parse(JSON.stringify(goal.left));
   left.quantifiers = goal.quantifiers;
   stack.push(goal);
   let lefts = this.go(left, stack);
   stack.pop();

   for (let dep of lefts) {
    if (!dep.failed()) {
     let bindings = {
      [variable]: dep.get(variable)
     };

     let right = JSON.parse(JSON.stringify(goal.right));
     stack.push(goal);
     let result = this.backward(fill(right, bindings, true), stack);
     stack.pop();

     if (!result.failed()) {
      yield dep.push(result).push({given: fill(goal, bindings, undefined, true)}).bind(bindings);
     }
    }
   }
  }

  yield Result.failed();
 }
}

module.exports = {
 Reasoner: Reasoner
};