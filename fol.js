const {equals, toString} = require("./forward.js");
const {Backward} = require("./backward.js");

class Reasoner extends Backward {
 constructor(kb) {
  super(kb);
 }
 find(predicate) {
  return this.kb.filter(statement => (statement["@type"] == predicate));
 }
 backward(goal) {
  //console.log(JSON.stringify(goal));
  // console.log(toString({statements: [goal]}));
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
   if (statement.op == "forall" &&
       statement.expression.op == "=>") {
    // console.log("hello");
        let implication = statement.expression.right;
    let unifies = unify(implication, goal);
    // console.log(implication);
    // console.log(JSON.stringify(unifies));
    if (unifies) {
     let left = fill(statement.expression.left, unifies);
     // console.log(JSON.stringify(left));
     let dep = this.backward(left);
     if (dep) {
      // console.log("hi");
      return [...dep, {given: statement, and: [left], goal: goal}];
     }
    }
   }
  }

  return [];
 }
}

function fill(rule, map) {
  // clones rule.
  // console.log(rule);
  let result = JSON.parse(JSON.stringify(rule));
  if (result["@type"] == "UnaryOperator") {
    result.expression = fill(result.expression, map);
  } else if (result["@type"] == "BinaryOperator") {
    result.left = fill(result.left, map);
    result.right = fill(result.right, map);
  } else if (result["@type"] == "Argument") {
      // console.log("hello world");
      if (result.call) {
        result.call = fill(result.call, map);
      }
      if (result.literal && result.free) {
        let mapping = map[result.literal.name];
        if (!mapping) {
            // console.log(result);
            // console.log(map);
            // there is non-unified free variable
          return false;
        }
        delete result.free;
        if (mapping["@type"] == "Function") {
            // NOTE(goto): this is a mess, causing a lot of
            // trouble. redo this.
            result.call = mapping;
            delete result.literal;
        } else {
            result.literal = mapping;
        }
    }
  } else if (result["@type"] == "Function" || result["@type"] == "Predicate") {
    result.arguments = result.arguments.map(x => {
        //if (x.free) {
        //  console.log(x);
        //}
        //console.log(x);
        //console.log(map);
        return fill(x, map);
    });
  }
  return result;
}

function unify(a, b) {
 // Find all substitutions.
 let result = reduce(a, b);

 if (!result) {
  return false;
 }

 // console.log(result);

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