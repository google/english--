const {equals, stringify, toString, clone} = require("./forward.js");

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

function id(arg) {
 return `${arg.expression.name}@${arg.id || ""}`;
}

function fill(rule, map, override, head = false) {
 let result = clone(rule);

 // console.log(map);
 // console.log(rule);

 let deref = (name) => {
  let key = name;
  while (map[key] && map[key].expression && map[key].free) {
   if (key == id(map[key])) {
    // circular reference.
    // console.log(`${key}: ${JSON.stringify(map)}`);
    break;
   }
   key = map[key].expression.name;
  }
  return map[key];
 }

 for (let quantifier of result.quantifiers || []) {
  // console.log(quantifier);
  let id = `${quantifier.variable.name}@${quantifier.id || ""}`;
  let value = deref(id);
  // console.log(key);
  // console.log(map);
  // console.log(value);
  if (value) {
   quantifier.value = value;
  }
  //if (map[quantifier.variable.name]) {
  //  let key = quantifier.variable.name;
  //  while (map[key] && map[key].free) {
  //    key = map[key].expression.name;
  //  }
  // quantifier.value = map[key];
  //}
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
   // console.log("hi");
   // let mapping = map[result.expression.name];
   let value = deref(id(result));
   // console.log(value);
   // console.log(result);
   // console.log(map);
   // console.log();
   // console.log(result.expression.name);
   // console.log(`${JSON.stringify(value)} == ${JSON.stringify(mapping)}`);
   if (!value) {
    return result;
   }
   delete result.free;
   delete result.id;

   if (value["@type"] == "Argument" && value.value) {
       // TODO(goto): figure out if this is a valid
       // case or if this should never be supported.
     value = value.value;
   }

   if (head) {
   } else if (!override) {
    result.value = value;
   } else {
    result.expression = value;
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
     let left = a.arguments[i];
     let right = b.arguments[i];
   if (!left.free && !right.free) {
    let inner = unify(left.expression,
                      right.expression);
    // Can't unify inner.
    if (!inner) {
     return false;
    }
    result = {...result, ...inner};
   } else if (left.free && !right.free) {
     let key = `${left.expression.name}@${left.id || ""}`;
     result[key] = right.expression;
   } else if (!left.free && right.free) {
     let key = `${right.expression.name}@${right.id || ""}`;
     result[key] = left.expression;
   } else if (left.free && right.free) {
     let key = `${left.expression.name}@${left.id || ""}`;
     result[key] = right;
   }
  }
  return result;
 }
 return false;
}

module.exports = {
 unify: unify,
 fill: fill,
 rewrite: rewrite
};
