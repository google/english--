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
   // console.log(statement);
   if (statement.quantifiers != undefined && statement.quantifiers.length > 0) {
    yield statement;
   }
  }
 }
 *go(goal, stack = []) {
  // console.log("goal: " + stringify(goal));

  // console.log(`${Rule.from(goal)}?`);
  for (let subgoal of stack) {
   if (equals(goal, subgoal)) {
    // console.log(goal);
    // console.log("duplicate!");
    yield Result.failed();
   }
  }

  // console.log("foo");
  if (!goal.quantifiers || goal.quantifiers.length == 0) {
   // console.log("hello");
   // stack.push(goal);
   let propositional = super.backward(goal, stack);
   // stack.pop();
   if (!propositional.failed()) {
    // console.log("propositional!");
    yield propositional;
   }
  }
  // console.log("bar");

  // unifies.

  // existential introduction
  if (goal.quantifiers &&
      goal.quantifiers.length == 1 &&
      goal.quantifiers[0].op == "exists") {
   let subgoal = clone(goal);
   for (let statement of this.kb) {
    // console.log(stringify(statement));
    // console.log(stringify(subgoal));
    // console.log(subgoal);
    let unifies = unify(statement, subgoal);
    // console.log(unifies);
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
  // forall (x) P(x) |= P(a).
  for (let statement of this.kb) {
   // console.log(stringify(statement));
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
   // console.log("hi");
   // TODO(goto): deal with expressions in the body
   // rather than just immediate unifications.
   let unifies = unify(universal, goal);
   // console.log(unifies);
   // console.log(goal);
   // console
   if (!unifies) {
    continue;
   } else if (Object.entries(unifies).length == 0) {
    yield Result.of({given: statement});
   } else {
    let head = goal.quantifiers && goal.quantifiers.length > 0;
    // console.log(goal);
    // console.log(head);
    yield Result.of([{given: statement}, {given: fill(goal, unifies, undefined, head)}]).bind(unifies);
   }
  }

  // universal modus ponens.
  for (let statement of this.quantifiers("=>")) {
   let implication = statement.right;
   let unifies = unify(implication, goal);
   // console.log(unifies);
   if (!unifies || Object.entries(unifies).length == 0) {
    continue;
   }
   // console.log(unifies);
   let left = fill(statement.left, unifies, true);
   // console.log(JSON.stringify(left, undefined, 2));
   // console.log(JSON.stringify(statement.left, undefined, 2));
   // TODO(goto): understand and create a test to see what
   // happens when there are multiple quantifiers.
   // console.log(unifies);
   let wrapping = clone(statement.quantifiers).filter(x => {
     return !unifies[x.variable.name];
   }).map((x) => {x.op = "exists"; return x;});
   left.quantifiers = (left.quantifiers || []);
   left.quantifiers.push(...wrapping);

   // TODO(goto): this is a total hack because the
   // .equals() of expressions don't know the difference
   // between an expression with empty quantifiers
   // and undefined quantifiers. This is going to cause
   // a lot of trouble, we should fix it.
   if (left.quantifiers.length == 0) {
    delete left.quantifiers;
   }

   // console.log(statement);

   // console.log(left);

   // throw new Error("hello world");

   stack.push(goal);
   let deps = this.go(left, stack);
   stack.pop();

   for (let dep of deps) {

    // console.log(dep.failed());

    if (!dep.failed()) {
     // console.log("hey");
     // console.log(stringify(goal));
     yield dep.bind(unifies).push({given: fill(statement, dep.bindings, undefined, true), goal: fill(goal, dep.bindings, undefined, false)});
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

   // console.log("hello");

   let variable = goal.quantifiers[0].variable.name;
   let left = JSON.parse(JSON.stringify(goal.left));
   left.quantifiers = goal.quantifiers;
   stack.push(goal);
   let lefts = this.go(left, stack);
   stack.pop();

   for (let dep of lefts) {
    if (!dep.failed()) {
     // console.log(variable);
     let bindings = {
      [variable]: dep.get(variable)
     };

     // console.log(`${stringify(goal)}`);
     // console.log(`${stringify(goal.right)}`);
     // console.log(dep.get(variable));
     // console.log(dep.bindings);
     // console.log(variable);
     // Ah, interesting, so we have to resolve
     // the internal bindings here before continuing
     // ... interesting ...
     // throw new Error("hello");

     let right = JSON.parse(JSON.stringify(goal.right));
     stack.push(goal);
     let result = this.backward(fill(right, bindings, true), stack);
     stack.pop();

     if (!result.failed()) {
      yield dep.push(result).push({given: fill(goal, bindings, undefined, true)}).bind(bindings);
     }
    }

   }
   
   // console.log(left);
  }

  // console.log("hi");

  yield Result.failed();
 }
}

function rewrite(expression, vars = {}) {
 let id = 1;

 function rewrite2(expression, vars = {}) {
  // if (statement.op == "forall") {
  // console.log(expression);
  // throw new Error();
  if (expression["@type"] == "Program") {
   // covers the case where we are rewriting the
   // entire program.
   return {statements: expression.statements.map(x => rewrite2(x))};
  } else if (expression["@type"] == "Quantifier") {
   // console.log("hi");
   // vars.push(expression.variable);
   let result = expression.expression;
   // console.log(expression);
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
    // console.log(vars);
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
   // console.log(expression);
   throw new Error("unknown type");
  }
 }

 return rewrite2(expression, vars);
}

function fill(rule, map, override, head = false) {
 // clones rule.
 // console.log(rule);
 // console.log(map);
 let result = JSON.parse(JSON.stringify(rule));

 for (let quantifier of result.quantifiers || []) {
  // console.log(quantifier);
  //let ref = quantifier.variable;
  //while (map[ref]) {
  // if () {
  // }
  //}
  if (map[quantifier.variable.name]) {
   // console.log("hi");
   quantifier.value = map[quantifier.variable.name];
  }
  // console.log(result);
 }

 if (result["@type"] == "UnaryOperator") {
  result.expression = fill(result.expression, map, override, head);
 } else if (result["@type"] == "BinaryOperator") {
  result.left = fill(result.left, map, override, head);
  result.right = fill(result.right, map, override, head);
 } else if (result["@type"] == "Argument") {
  // console.log(result.expression["@type"]);
  if (result.expression["@type"] == "Function") {
   result.expression = fill(result.expression, map, override, head);
  }
  if (result.expression["@type"] == "Literal" && result.free) {
   let mapping = map[result.expression.name];
   if (!mapping) {
    return result;
   }
   // console.log(mapping);
   delete result.free;
   delete result.id;
   if (head) {
    // keep it free
    // console.log(result);
   } else if (!override) {
    result.value = mapping;
   } else {
    result.expression = mapping;
   }
  }
 } else if (result["@type"] == "Function" || result["@type"] == "Predicate") {
  // console.log(result);
  result.arguments = result.arguments.map(x => {
    return fill(x, map, override, head);
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

function quantified(expression) {
 return expression.quantifiers != undefined && expression.quantifiers.length > 0;
}

function reduce(a, b) {
 // console.log(quantified(a));
 // console.log(quantified(b));
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
  //} else if (quantified(a) && quantified(b) &&
  //          a.quantifiers.length == 1 && b.quantifiers.length == 1 &&
  //          a.quantifiers[0].op != b.quantifiers[0].op) {
  // TODO(goto): deal with multiple chained quantifiers.
  // if one is an existential quantifier and the other is
  // a universal quantifier they can only be reduced
  // if there are no more free arguments left.
  //let result = match(a, b);
  //let free = Object.entries(result).filter(([key, value]) => value.free);
  //if (result && free.length == 0) {
   // console.log("hi");
  // return result;
  //}
  //return false;
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
  // console.log("hello");
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
   //console.log("hi");
   // console.log(a.arguments[i].free);
   // console.log(!b.arguments[i].free);
   if (!a.arguments[i].free && !b.arguments[i].free) {
    let inner = unify(a.arguments[i].expression, 
                      b.arguments[i].expression);
    // can't unify inner.
    if (!inner) {
     return false;
    }
    result = {...result, ...inner};
   } else if (a.arguments[i].free && !b.arguments[i].free) {
    // console.log("hi");
    result[a.arguments[i].expression.name] = b.arguments[i].expression;
   } else if (!a.arguments[i].free && b.arguments[i].free) {
    result[b.arguments[i].expression.name] = a.arguments[i].expression;
   } else if (a.arguments[i].free && b.arguments[i].free) {
    // sanity check if this is correct.
    // console.log
    // console.log(a.arguments[i].literal.name);
    // console.log(b.arguments[i]);
    result[b.arguments[i].expression.name] = a.arguments[i];
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