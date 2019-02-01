const {equals, toString} = require("./forward.js");
const {Backward} = require("./backward.js");
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

class Reasoner extends Backward {
 constructor(kb) {
  super(rewrite(kb));
 }
 find(predicate) {
  return this.kb.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal, stack = []) {
  // console.log(JSON.stringify(goal));
  // console.log("goal: " + toString({statements: [goal]}));

  // console.log(`${Rule.from(goal)}?`);
  for (let subgoal of stack) {
   if (equals(goal, subgoal)) {
    // console.log(goal);
    // console.log("duplicate!");
    return false;
   }
  }

  if (!goal.quantifiers) {
   // console.log("propositional!");
   // console.log(goal);
   let propositional = super.backward(goal, stack);
   if (propositional.length > 0) {
    return propositional;
   }
  }

  // universal introduction
  for (let statement of this.kb) {
   let unifies = unify(statement, goal);
   if (!unifies) {
    continue;
   }

   return [{given: statement}, {given: fill(goal, unifies)}];
  }

  // universal modus ponens.
  for (let statement of this.op("=>")) {
   let implication = statement.right;
   let unifies = unify(implication, goal);
   if (!unifies || Object.entries(unifies).length == 0) {
    continue;
   }
   let left = fill(statement.left, unifies, true);
   stack.push(goal);
   let dep = this.backward(left, stack);
   stack.pop();
   if (dep) {
    return [...dep, {given: statement, and: [left], goal: fill(goal, unifies)}];
   }
  }

  // universal conjunction elimination.
  for (let statement of this.op("&&")) {
   let left = unify(statement.left, goal);
   if (left) {
    return [{given: fill(statement, left)}, {given: goal}];
   }
   let right = unify(statement.right, goal);
   if (right) {
    return [{given: fill(statement, right)}, {given: goal}];
   }
  }

  // universal disjunction syllogism
  for (let statement of this.op("||")) {
   let left = unify(statement.left, goal);
   if (left) {
    let right = negation(statement.right);
    stack.push(goal);
    let result = this.backward(right, stack);
    stack.pop();
    if (result) {
     let explanation = JSON.parse(JSON.stringify(statement));
     delete explanation.quantifiers;
     return [...result, {given: statement, goal: fill(explanation, left, true)}, {given: goal}];
    }
   }

   let right = unify(statement.right, goal);
   if (right) {
    let left = negation(statement.left);
    stack.push(goal);
    let result = this.backward(left, stack);
    stack.pop();
    if (result) {
     let explanation = JSON.parse(JSON.stringify(statement));
     delete explanation.quantifiers;
     return [...result, {given: statement, goal: fill(explanation, right, true)}, {given: goal}];
    }
   }
  }

  // existential conjunction introduction
  if (goal.quantifiers &&
      goal.quantifiers.length == 1 &&
      goal.quantifiers[0].op == "exists" &&
      goal.op == "&&") {
   // console.log("hello world");
   stack.push(goal);
   let left = this.backward(goal.left, stack);
   stack.pop();
   // console.log(left);
  }

  return false;
 }
}

function rewrite(expression, vars = []) {
 // if (statement.op == "forall") {
 // console.log(expression);
 // throw new Error();
 if (expression["@type"] == "Program") {
  // covers the case where we are rewriting the
  // entire program.
  return {statements: expression.statements.map(x => rewrite(x))};
 } else if (expression["@type"] == "Quantifier") {
  // console.log("hi");
  // vars.push(expression.variable);
  let result = expression.expression;
  // console.log(expression);
  result.quantifiers = expression.quantifiers || [];
  result.quantifiers.push({
   "@type": expression["@type"],
   "op": expression.op,
   "variable": expression.variable
  });
  vars.push(expression.variable);
  return rewrite(result, vars);
 } else if (expression["@type"] == "Predicate") {
  for (let arg of expression.arguments) {
   // console.log(vars);
   if (arg.literal && vars.includes(arg.literal.name)) {
    arg.free = true;
   }
  }
  return expression;
 } else if (expression["@type"] == "BinaryOperator") {
  expression.left = rewrite(expression.left, vars);
  expression.right = rewrite(expression.right, vars);
  return expression;
   } else if (expression["@type"] == "UnaryOperator") {
  expression.expression = rewrite(expression.expression, vars);
  return expression;
 } else {
  // console.log(expression);
  throw new Error("unknown type");
 }
}

function fill(rule, map, override) {
 // clones rule.
 // console.log(rule);
 // console.log(map);
 let result = JSON.parse(JSON.stringify(rule));
 if (result["@type"] == "UnaryOperator") {
  result.expression = fill(result.expression, map, override);
 } else if (result["@type"] == "BinaryOperator") {
  result.left = fill(result.left, map, override);
  result.right = fill(result.right, map, override);
 } else if (result["@type"] == "Argument") {
  // console.log("hello world");
  // console.log(result);
  // console.log(map);
  if (result.call) {
   result.call = fill(result.call, map, override);
  }
  if (result.literal && result.free) {
   let mapping = map[result.literal.name];
   // console.log(result);
   if (!mapping) {
    return result;
   }
   delete result.free;
   // console.log(override);
   if (!override) {
    result.value = mapping;
   } else if (mapping["@type"] == "Function") {
    result.call = mapping;
    delete result.literal;
   } else {
    result.literal = mapping;
   }
  }
 } else if (result["@type"] == "Function" || result["@type"] == "Predicate") {
  // console.log(result);
  result.arguments = result.arguments.map(x => {
    return fill(x, map, override);
   });
 }
 return result;
}

function unify(a, b) {
 // console.log("Unifying");
 // console.log(JSON.stringify(a));
 // console.log(JSON.stringify(b));

 let result = reduce(a, b);

 // console.log(result);
 // console.log();

 if (!result) {
  return false;
 }

 for (let [key, value] of Object.entries(result)) {
  result[key] = fill(value, result);
 }

 return result;
}

function reduce(a, b) {
 if (a["@type"] == "Literal" && b["@type"] == "Literal" &&
     a.name == b.name) {
  return {};
 } else if (a["@type"] == "UnaryOperator" && b["@type"] == "UnaryOperator") {
  return unify(a.expression, b.expression);
 } else if (a.op == "forall") {
  return reduce(a.expression, b);
 } else if (b.op == "forall") {
  return reduce(a, b.expression);
 } else if (a["@type"] == "BinaryOperator" && b["@type"] == "BinaryOperator") {
  let left = unify(a.left, b.left);
  let right = unify(a.right, b.right);
  if (left && right) {
   for (let variable of Object.keys(left)) {
    if (right[variable] && !equals(right[variable], left[variable])) {            
     // There is a unification that happened on the left side of the
     // equation that is inconsistent with the unification of the right
     // side.
     return false;
    }
   }
   return Object.assign(left, right);
  }
 } else if ((a["@type"] == "Predicate" && b["@type"] == "Predicate" ||
             a["@type"] == "Function" && b["@type"] == "Function") &&
            a.name == b.name &&
            a.arguments.length == b.arguments.length) {
  let result = {};
  for (let i = 0; i < a.arguments.length; i++) {
   if (!a.arguments[i].free && !b.arguments[i].free) {
    let inner = unify(a.arguments[i].literal || a.arguments[i].call, 
                      b.arguments[i].literal || b.arguments[i].call);
    // can't unify inner.
    if (!inner) {
     return false;
    }
    result = {...result, ...inner};
   } else if (a.arguments[i].free && !b.arguments[i].free) {
    result[a.arguments[i].literal.name] = b.arguments[i].literal || b.arguments[i].call;
   } else if (!a.arguments[i].free && b.arguments[i].free) {
    result[b.arguments[i].literal.name] = a.arguments[i].literal || a.arguments[i].call;
   } else if (a.arguments[i].free && b.arguments[i].free) {
    // sanity check if this is correct.
    // console.log(a.arguments[i].literal.name);
    // console.log(b.arguments[i]);
    result[b.arguments[i].literal.name] = a.arguments[i];
    // console.log(result);
   }
  }
  return result;
 }
 return false;
}

module.exports = {
 Reasoner: Reasoner,
 unify: unify,
 fill: fill,
 rewrite: rewrite
};