const {equals} = require("./forward.js");
const {Backward} = require("./backward.js");

class Reasoner extends Backward {
 constructor(kb) {
  super(kb);
  // this.kb = kb;
 }
 find(predicate) {
  return this.kb.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal) {
  let propositional = super.backward(goal);
  if (propositional.length > 0) {
   return propositional;
  }

  // Universal introduction
  for (let statement of this.find("Quantifier")) {
   if (statement.op != "forall") {
    continue;
   }
   let unifies = unify(statement.expression, goal);
   if (unifies) {
    return [{given: statement, goal: goal}];
   }
  }

  // Searches for something that implies goal.
  for (let statement of this.find("Quantifier")) {
   // console.log(statement.expression.op);
   if (statement.op == "forall" &&
       statement.expression.op == "=>") {
    let implication = statement.expression.right;
    let unifies = unify(implication, goal);
    // console.log(implication);
    if (unifies) {
     let left = fill(statement.expression.left, unifies);
     // console.log(left);
     let dep = this.backward(left);
     if (dep) {
      // console.log(dep);
      return [...dep, {given: statement, and: dep.map(d => d.goal), goal: goal}];
     }
    }
   }
  }

  return [];
 }
}

function fill(rule, map) {
 // clones rule.
 let result = JSON.parse(JSON.stringify(rule));
 if (result["@type"] == "Function" || result["@type"] == "Predicate") {
  for (let arg of result.arguments.filter(y => y.free)) {
   // console.log(arg);
   if (!map[arg.literal.name]) {
    // there is non-unified free variable
    return false;
   }
   delete arg.free;
   arg.literal = map[arg.literal.name];
  }
 }
 return result;
}

function unify(a, b) {
 // Find all substitutions.
 let result = reduce(a, b);

 if (!result) {
  return false;
 }

 for (let [key, value] of Object.entries(result)) {
  // console.log(value);
  // fill(value);
  // result[key] = fill(value);
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
 fill: fill
};