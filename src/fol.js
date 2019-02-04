const {equals, stringify, toString} = require("./forward.js");
const {Backward, Result} = require("./backward.js");
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

function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

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
  // console.log("");
  // console.log("goal: " + stringify(goal));

  for (let subgoal of stack) {
   if (equals(goal, subgoal)) {
    yield Result.failed();
   }
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
   
   reversed.right.quantifiers = reversed.quantifiers;

   let implication = reversed.right;
   let unifies = unify(implication, goal);

   if (!unifies || Object.entries(unifies).length == 0) {
    continue;
   }

   // TODO(goto): we probably need to push to the
   // quantifiers rather than replace it.
   reversed.left.quantifiers = reversed.quantifiers;
   let left = fill(reversed.left, unifies, true);

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
   if (left.quantifiers.length == 0) {
    delete left.quantifiers;
   }

   stack.push(goal);
   let deps = this.go(left, stack);
   stack.pop();

   for (let dep of deps) {
    if (!dep.failed()) {
     yield dep.bind(unifies)
      .push({given: fill(statement, dep.bindings, undefined, true)})
      .push({given: fill(goal, dep.bindings, undefined, true)});
    }
   }
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

function rewrite(expression, vars = {}) {
 let id = 1;

 function rewrite2(expression, vars = {}) {
  if (expression["@type"] == "Program") {
   // covers the case where we are rewriting the
   // entire program.
   return {statements: expression.statements.map(x => rewrite2(x))};
  } else if (expression["@type"] == "Quantifier") {
   let result = expression.expression;
   result.quantifiers = expression.quantifiers || [];
   result.quantifiers.push({
     "@type": expression["@type"],
      "op": expression.op,
      "variable": expression.variable,
      id: id
      });
   vars[expression.variable.name] = id;
   id++;
   return rewrite2(result, vars);
  } else if (expression["@type"] == "Predicate") {
   for (let arg of expression.arguments) {
    if (arg.expression && vars[arg.expression.name]) {
     arg.free = true;
     arg.id = vars[arg.expression.name];
    }
   }
   return expression;
  } else if (expression["@type"] == "BinaryOperator") {
   expression.left = rewrite2(expression.left, vars);
   expression.right = rewrite2(expression.right, vars);
   return expression;
  } else if (expression["@type"] == "UnaryOperator") {
   expression.expression = rewrite2(expression.expression, vars);
   return expression;
  } else {
   throw new Error("unknown type");
  }
 }

 return rewrite2(expression, vars);
}

function fill(rule, map, override, head = false) {
 let result = clone(rule);

 for (let quantifier of result.quantifiers || []) {
  if (map[quantifier.variable.name]) {
   let key = quantifier.variable.name;
   while (map[key] && map[key].free) {
    key = map[key].expression.name;
   }
   quantifier.value = map[key];
  }
 }

 if (result["@type"] == "UnaryOperator") {
  result.expression = fill(result.expression, map, override, head);
 } else if (result["@type"] == "BinaryOperator") {
  result.left = fill(result.left, map, override, head);
  result.right = fill(result.right, map, override, head);
 } else if (result["@type"] == "Argument") {
  if (result.expression["@type"] == "Function") {
   result.expression = fill(result.expression, map, override, head);
  }
  if (result.expression["@type"] == "Literal" && result.free) {
   let mapping = map[result.expression.name];
   if (!mapping) {
    return result;
   }
   delete result.free;
   delete result.id;
   if (head) {
   } else if (!override) {
    result.value = mapping;
   } else {
    result.expression = mapping;
   }
  }
 } else if (result["@type"] == "Function" || result["@type"] == "Predicate") {
  result.arguments = result.arguments.map(x => {
    return fill(x, map, override, head);
   });
 }
 return result;
}



function unify(a, b) {
 let result = reduce(a, b);

 if (!result) {
  return false;
 }

 for (let [key, value] of Object.entries(result)) {
  result[key] = fill(value, result);
 }

 return result;
}

function quantified(expression) {
 return expression.quantifiers != undefined && expression.quantifiers.length > 0;
}

function reduce(a, b) {
 if (quantified(a) || quantified(b)) {
  let result = match(a, b);
  if (result) {
   // TODO(goto): deal with multiple chained quantifiers.
   if (quantified(a) && quantified(b) &&
       a.quantifiers[0].op == b.quantifiers[0].op) {
    // when quantifiers are of the same type, they are
    // allowed to match each other's variables.
    return result;
   }
   let free = Object.entries(result).filter(([key, value]) => value.free);
   if (free.length == 0) {
    return result;
   }
  }
  return false;
 }

 return match(a, b);
}

function match (a, b) {
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
    let inner = unify(a.arguments[i].expression, 
                      b.arguments[i].expression);
    // Can't unify inner.
    if (!inner) {
     return false;
    }
    result = {...result, ...inner};
   } else if (a.arguments[i].free && !b.arguments[i].free) {
    result[a.arguments[i].expression.name] = b.arguments[i].expression;
   } else if (!a.arguments[i].free && b.arguments[i].free) {
    result[b.arguments[i].expression.name] = a.arguments[i].expression;
   } else if (a.arguments[i].free && b.arguments[i].free) {
    result[b.arguments[i].expression.name] = a.arguments[i];
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