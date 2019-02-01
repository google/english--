const {equals, toString} = require("./forward.js");
const {Backward} = require("./backward.js");

class Reasoner extends Backward {
 constructor(kb) {
  super(rewrite(kb));
 }
 find(predicate) {
  return this.kb.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal) {
  //console.log(JSON.stringify(goal));
  console.log(toString({statements: [goal]}));
  let propositional = super.backward(goal);
  // console.log(propositional);
  if (propositional.length > 0) {
   return propositional;
  }

  // for (let statement of this.kb) {
  // }

  // Universal introduction
  for (let statement of this.kb) {
   let unifies = unify(statement, goal);
   if (!unifies) {
    continue;
   }

   // console.log(statement);
   // console.log(toString({statements: [fill(statement, unifies)]}));

   return [{given: statement}, {given: fill(goal, unifies)}];
  }

  // Searches for something that implies goal.
  for (let statement of this.op("=>")) {
   let implication = statement.right;
   let unifies = unify(implication, goal);
   if (!unifies || Object.entries(unifies).length == 0) {
    continue;
   }
   let left = fill(statement.left, unifies, true);
   let dep = this.backward(left);
   // console.log(unifies);
   if (dep) {
    // console.log(toString({statements: [fill(statement, unifies)]}));
    //console.log(dep);
    return [...dep, {given: statement, and: [left], goal: fill(goal, unifies)}];
   }
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
 let result = JSON.parse(JSON.stringify(rule));
 if (result["@type"] == "UnaryOperator") {
  result.expression = fill(result.expression, map, override);
 } else if (result["@type"] == "BinaryOperator") {
  result.left = fill(result.left, map, override);
  result.right = fill(result.right, map, override);
 } else if (result["@type"] == "Argument") {
  // console.log("hello world");
  if (result.call) {
   result.call = fill(result.call, map, override);
  }
  if (result.literal && result.free) {
   let mapping = map[result.literal.name];
   if (!mapping) {
    return false;
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
  result.arguments = result.arguments.map(x => {
    return fill(x, map, override);
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
    result[a.arguments[i].name] = b.arguments[i].name;
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