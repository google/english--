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
    super(kb);
  }
  find(predicate) {
    return this.kb.filter(statement => (statement["@type"] == predicate));
  }
  backward(goal, stack = []) {
    return this.go(goal, stack).next().value;
  }
  *quantifiers(op) {
    for (let statement of this.kb.filter(x => x.op == op)) {
      if (statement.quantifiers != undefined && statement.quantifiers.length > 0) {
	yield statement;
      }
    }
  }
  generates(goal) {
    if (goal.quantifiers &&
	goal.quantifiers.find(x => x.op == "exists") != undefined) {
      // If this the goal is an existential quantification, it may
      // generate multiple results. Otherwise, it returns just
      // a single result.
      return true;
    }
    return false;
  }
  *go(goal, stack = []) {
    let indent = " ".repeat(stack.length);
    // console.log(indent + "goal: " + stringify(goal));
    
    for (let subgoal of stack) {
      // TODO(goto): this is expensive and un-necessary, but more
      // correct than equals(). we can stringify before putting
      // on the stack, so that we only need to do that once.
      if (stringify(goal) == stringify(subgoal)) {
	yield Result.failed();
	return;
      }
    }
    
    if (!goal.quantifiers || goal.quantifiers.length == 0) {
      // console.log(`${indent} propositional: ${stringify(goal)}?`);
      // console.log(goal);
      let propositional = super.backward(goal, stack);
      if (!propositional.failed()) {
	yield propositional;
	if (!this.generates(goal)) {
	  return;
	}
      }
    }

    // existential introduction
    if (goal.quantifiers &&
	goal.quantifiers.length > 0 &&
	goal.quantifiers.find(x => x.op == "forall") == undefined) {
      let subgoal = clone(goal);
      for (let statement of this.kb) {
	let unifies = unify(statement, subgoal);
	if (!unifies) {
	  continue;
	}

	if (Object.entries(unifies).length == 0) {
	  yield Result.of({given: statement});
	} else {
	  let head = goal.quantifiers && goal.quantifiers.length > 0;
	  yield Result.of([{given: statement}, {given: fill(goal, unifies, undefined, head)}]).bind(unifies);
	}

	if (!this.generates(goal)) {
	  return;
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
      // console.log("hello");
      // removes the quantifier, while still leaving
      // the variable free in the body.
      universal.quantifiers.pop();
      // TODO(goto): deal with expressions in the body
      // rather than just immediate unifications.
      let unifies = unify(universal, goal);
      if (!unifies) {
	continue;
      }

      if (Object.entries(unifies).length == 0) {
	yield Result.of({given: statement});
      } else {
	let head = goal.quantifiers && goal.quantifiers.length > 0;
	yield Result.of([{given: statement}, {given: fill(goal, unifies, undefined, head)}]).bind(unifies);
      }

      if (!this.generates(goal)) {
	return;
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

      // console.log(unifies);
      
      if (!unifies) {
	// If we fail to unify lexically, we construct
	// a new temporary knowledge base with the implication
	// and check if the implication entails the goal. If it does,
	// we use the result as the unification bindings.

	let right = clone(statement.right);
	// right.quantifiers = right.quantifiers || [];
	right.quantifiers.push(...statement.quantifiers);
	
	// console.log(`going into a side inference: ${stringify(right)}.`);
	let reasoner = new Reasoner({"@type": "Program", statements: [right]});
	let entails = reasoner.backward(goal);
	// console.log(`out of the side inference: failed? ${entails.failed()}.`);
	
	if (entails.failed()) {
	  continue;
	}
	// TODO(goto): this is a terrible way to get the resulting
	// bindings of the result. We should come up with a better
	// API.
	// console.log(`original: ${stringify(statement)}`);
	// console.log(`looking for: ${stringify(goal)}`);
	// console.log(`right: ${stringify(right)}`);
	// console.log(entails.toString());
	let bindings = entails.reason[entails.reason.length - 2].given;
	// console.log(`result: ${stringify(bindings)}`);
	if (!bindings.quantifiers || bindings.quantifiers.length == 0) {
	  // If we weren't able to find anything, ignore.
	  // This isn't entirely correct, the Result isn't guaranteed
	  // to have the right bindings in the penultimate position.
	  // TODO(goto): add a test that captures this error and fix it.
	  continue;
	}
	unifies = {};
	for (let {variable, id, value} of bindings.quantifiers) {
	  if (!value) {
	    // console.log(variable.name);
	    // console.log(bindings.quantifiers);
	    // throw new Error("foo");
	    continue;
	  }
	  unifies[`${variable.name}@${id}`] = value;
	}
      }
      
      // TODO(goto): we probably need to push to the
      // quantifiers rather than replace it.
      let head = clone(reversed.left);
      head.quantifiers = reversed.quantifiers;
      let left = fill(head, unifies, true);
      
      // TODO(goto): understand and create a test to see what
      // happens when there are multiple quantifiers.

      left.quantifiers = left.quantifiers.filter(x => {
	let binding = unifies[`${x.variable.name}@${x.id}`]; 
	return !binding || binding.free;
      });
      
      // if (left.quantifiers.length == 0) {
      // delete left.quantifiers;
      // }

      stack.push(goal);
      // console.log(`${indent} recurse: ${stringify(left)}`);
      let deps = this.go(left, stack);
      // console.log(`${indent} back!`);
      
      for (let dep of deps) {
	// console.log(`${indent} back!`);
	// console.log(dep.conflicts(unifies));
	if (!dep.failed() && !dep.conflicts(unifies)) {
	  dep.bind(unifies);
	  yield dep.bind(unifies)
	    .push({given: fill(statement, dep.bindings, undefined, true)})
	    .push({given: fill(goal, dep.bindings, undefined, true)});
	}
      }
      
      stack.pop();
    }

    // universal conjunction elimination.
    for (let statement of this.quantifiers("&&")) {
      if ((statement.quantifiers || []).find(x => x.op == "exists") != undefined) {
	// the elimination requires all quantifiers to be of the type forall.
	continue;
      }
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
	goal.quantifiers.length > 0 &&
	goal.quantifiers.find(x => x.op == "forall") == undefined &&
	goal.op == "&&") {

      let variable = goal.quantifiers[0].variable.name;
      let left = JSON.parse(JSON.stringify(goal.left));
      left.quantifiers = goal.quantifiers;
      
      stack.push(goal);
      
      let lefts = this.go(left, stack);
      
      for (let dep of lefts) {
	if (!dep.failed()) {
	  let right = clone(goal.right);
	  right.quantifiers = goal.quantifiers;
	  stack.push(goal);
	  let result = this.backward(fill(right, dep.bindings, true), stack);
	  if (!result.failed() && !dep.conflicts(result.bindings)) {
	    dep.bind(result.bindings);
	    yield dep.push(result).push({
	      given: fill(goal, dep.bindings, undefined, true)
	    }).bind(dep.bindings);
	  }
          stack.pop();
	}
      }
      
      stack.pop();
    }

    yield Result.failed();
  }
}

module.exports = {
 Reasoner: Reasoner
};
