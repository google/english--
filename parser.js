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
  return {"@type": "Quantifier", op: "forall", variable: x, expression: expression};
 }

 static exists(x, expression) {
  return {"@type": "Quantifier", op: "exists", variable: x, expression: expression};
 }

 static predicate(name, args) {
  return {"@type": "Predicate", name: name, arguments: args};
 }

 static negation(a) {
  return {"@type": "UnaryOperator", op: "~", expression: a};
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
}

class Rule {
 static of(str) {
  return logic.parse(str).statements[0];
 }
}

module.exports = {
 Parser: Parser,
 Rule: Rule
};

