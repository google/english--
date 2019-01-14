const {equals} = require("./forward.js");

class Reasoner {
 constructor(kb) {
  this.kb = kb;
 }
 find(predicate) {
  return this.kb.statements.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal) {
  if (goal["@type"] == "Predicate") {
   for (let predicate of this.find("Predicate")) {
    if (predicate.name == goal.name &&
        predicate.arguments.length == goal.arguments.length) {
     let matches = true;
     for (let i = 0; i < predicate.arguments.length; i++) {
      if (!equals(predicate.arguments[i], goal.arguments[i])) {
       matches = false;
       break;
      }
     }
     if (matches) {
      return [predicate];
     }
    }
   }
  }

  // Universal introduction
  for (let statement of this.find("Quantifier")) {
   if (statement.op != "forall") {
    continue;
   }
   // console.log(goal);
   let unifies = unify(statement.expression, goal);
   if (unifies) {
    // console.log(unifies);
    return [{given: statement, goal: goal}];
   }
  }

  // Searches for something that implies goal.
  for (let statement of this.kb.statements) {
   if (statement["@type"] == "Quantifier" &&
       statement.op == "forall" &&
       statement.expression.op == "=>") {
    let implication = statement.expression.right;
    let unifies = unify(implication, goal);
    if (unifies) {
     let left = fill(statement.expression.left, unifies);
     let dep = this.backward(left);
     if (dep) {
      return [{given: statement, and: [...dep], goal: goal}];
     }
    }
   }
  }

  return false;
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
 } if ((a["@type"] == "Predicate" && b["@type"] == "Predicate" ||
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