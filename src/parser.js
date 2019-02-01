const logic = require("./grammar.js");

class Parser {
 static parse(code) {
  return logic.parse(code);
 }

 static literal(x) {
  return {"@type": "Literal", "name": x};
 };

 static binary(op, left, right) {
  return {"@type": "BinaryOperator", left: left, "op": op, right: right};
 };
 
 static program(statements) {
  return {"@type": "Program", statements: statements};
 }

 static constant(value) {
  return {"@type": "Constant", name: value};
 }

 static forall(x, expression) {
  let result =  {"@type": "Quantifier", op: "forall", variable: x};
  if (expression) {
   result.expression = expression;
  }
  return result;
 }

 static exists(x, expression) {
  let result = {"@type": "Quantifier", op: "exists", variable: x};
  if (expression) {
   result.expression = expression;
  }
  return result;
 }

 static predicate(name, args) {
  return {"@type": "Predicate", name: name, arguments: args};
 }

 static negation(a) {
  return {"@type": "UnaryOperator", op: "~", expression: a};
 }

 static func(name, args) {
   return {"@type": "Function", name: name, arguments: args};
 }
  
 static and(left, right) {
  return Parser.binary("&&", left, right);
 }

 static or(left, right) {
  return Parser.binary("||", left, right);
 }

 static implies(left, right) {
  return Parser.binary("=>", left, right);
 }

 static xor(a, b) {
  return Parser.binary("^", a, b);
 }

 static argument(a, value, free) {
    let result = {"@type": "Argument"};
    if (a["@type"] == "Literal") {
     result.literal = a;
    } else if (a["@type"] == "Function") {
     result.call = a;
    } else {
     throw new Error("unknown argument type: " + a["@type"]);
    }
    if (value) {
     result.value = value;
    }
    if (free) {
     result.free = free;
    }
    return result;
 } 
}

class Rule {
 static of(str) {
  return logic.parse(str).statements[0];
 }
 static from(node) {
  // console.log(node);
  if (node["@type"] == "Literal") {
   return `${node.name}`;
  } else if (node["@type"] == "BinaryOperator") {
   return `${Rule.from(node.left)} ${node.op} ${Rule.from(node.right)}`;
  } else if (node["@type"] == "UnaryOperator") {
   return `${node.op}${Rule.from(node.expression)}`;
  }
 }
}

module.exports = {
 Parser: Parser,
 Rule: Rule
};

