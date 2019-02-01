const {Parser} = require("./parser.js");

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


// Propositional Logic                                                                                                     
//                                                                                                                         
// Rules of inference                                                                                                      
//                                                                                                                         
// Modus Ponens: a => b, a |= b                                                                                            
// Modus Tollens: a => b, ~b |= ~a                                                                                         
// Modus Tollendo Ponens (Disjunctive Syllogism): a || b, ~a |= b and a || b, ~b |= a                                      
// Disjunction Introduction (Addition): a |= a || b, b |= a || b                                                           
// Conjunction Introduction (Simplification): a && b |= a and a && b |= b                                                  
// Hypothetical Syllogism: a => b, b => c |= a => c                                                                        
// Constructive Dilemma: (a => c) && (b => d), a || b |= c || d                                                            
// Absorption: a => b |= a => (a & b)                                                                                      
//                                                                                                                         
// Rules of replacement: rewriting, no new information                                                                     
//                                                                                                                         
// Double negation: ~~a |= a                                                                                               
// Communitativity: a && b |= b && a                                                                                       
// Associativity: (a && b) && c |= a && (b && c)                                                                           
// Tautology: a |= a && a, a |= a || a                                                                                     
// DeMorgan's Law: ~(a && b) |= ~a || ~b, ~(a || b) |= ~a && ~b                                                            
// Tranposition (contraposition): a => b, ~b => ~a 
// Material implication: a => b |= ~a || b                                                                                 
// Exportation: a => (b => c) |= (a && b) => c                                                                             
// Distribution: a && (b || c) |= (a && b) || (a && c), a || (b && c) |= (a || b) && (a || c)                              
// Material equivalence: a <=> b |= (a => b) && (b => a) |= (a && b) || (~a & ~b)   

function equals(a, b) {
 return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function normalize(node) {
 // https://www.iep.utm.edu/prop-log/#SH5a                                                                                 
 let result = Object.assign(node);
 if (node.op == "~") {
  result.expression = normalize(node.expression);
 } else if (node.op == "&&" ||
            node.op == "||" ||
            node.op == "=>") {
  result.left = normalize(node.left);
  result.right = normalize(node.right);
 }
 
 if (result.op == "~" &&
     result.expression.op == "~") {
  // double-negation                                                                                                       
  return result.expression.expression;
 } else if ((result.op == "&&" || result.op == "||") &&
            equals(result.left, result.right)) {
  return result.left;
 } else if (result.op == "~" &&
            result.expression.op == "&&") {
  // demorgan's law                                                                                                        
  return or(negation(result.expression.left),
            negation(result.expression.right));
 } else if (result.op == "~" &&
            result.expression.op == "||") {
  // demorgan's law                                                                                                        
  return and(negation(result.expression.left),
             negation(result.expression.right));
 } else if (result.op == "=>" &&
            result.left.op == "~" &&
            result.right.op == "~") {
  // tranposition / contraposition                                                                                         
  return implies(result.right.expression,
                 result.left.expression);
 } else if (result.op == "||" &&
            result.left.op == "~") {
  return implies(result.left.expression,
                 result.right);
  // material implication                                                                                                  
 } else if (result.op == "=>" &&
            result.right.op == "=>") {
  return implies(and(result.left, result.right.left),
                 result.right.right);
  } else if (result.op == "||" &&
             result.left.op == "&&" &&
             result.right.op == "&&" &&
             equals(result.left.left, result.right.left)) {
  // disjunctive distribution.                                                                                             
  return and(result.left.left,
             or(result.left.right, result.right.right));
 } else if (result.op == "&&" &&
            result.left.op == "||" &&
            result.right.op == "||" &&
            equals(result.left.left, result.right.left)) {
  // conjunctive distribution.                                                                                             
  return or(result.left.left,
            and(result.left.right, result.right.right));
 } else if ((result.op == "&&" && result.left.op == "&&") ||
            (result.op == "||" && result.left.op == "||")) {
  // associativity.                                                                                                        
  return binary(result.left.op,
                result.left.left,
                binary(result.op, result.left.right, result.right));
 } else if (result.op == "&&" ||
            result.op == "||") {
  // commutativity.                                                                                                        
  let left = JSON.stringify(result.left);
  let right = JSON.stringify(result.right);
  if (right < left) {
   // If the right arm is greater than (alphabetically)                                                                    
    // than the left arm, switch orders.                                                                                    
    // We compare alphabetically, e.g. "a" < "b".                                                                           
   return binary(result.op, result.right, result.left);
  }
 }

 return result;
}

class Forward {
 static modusPonens({statements}) {
  let result = [];
  // modus ponen: a => b, a |= b                                                                                            
  for (let implication of statements.filter(x => x.op == "=>")) {
   if (statements.find(y => equals(implication.left, y))) {
    result.push(implication.right);
   }
  }
  return result;
 }

 static modusTollens({statements}) {
  let result = [];
  // modus tollens: a => b, ~b |= ~a                                                                                        
  for (let implication of statements.filter(x => x.op == "=>")) {
   if (statements.find(y => equals(negation(implication.right), y))) {
    result.push(negation(implication.left));
   }
  }
  return result;
 }

 static disjunctiveSyllogism({statements}) {
  let result = [];
  // disjunctive syllogism: a || b, ~a |= ~b and a || b, ~b |= a                                                            
  for (let disjunction of statements.filter(x => x.op == "||")) {
   if (statements.find(y => equals(negation(disjunction.left), y))) {
    result.push(disjunction.right);
   }
   if (statements.find(y => equals(negation(disjunction.right), y))) {
    result.push(disjunction.left);
   }
  }
  return result;
 }

 static disjunctiveIntroduction({statements}, term) {
  let result = [];
  for (let statement of statements) {
   result.push(or(statement, term));
   result.push(or(term, statement));
  }
  return result;
 }

 static conjunctionElimination({statements}) {
  let result = [];
  for (let statement of statements.filter(x => x.op == "&&")) {
   result.push(statement.left);
   result.push(statement.right);
  }
  return result;
 }

 static conjunctionIntroduction({statements}) {
  let result = [];
  for (let statement of statements) {
   // console.log(statement);                                                                                               
   for (let other of statements) {
    if (!equals(statement, other)) {
     result.push(and(statement, other));
    }
   }
  }
  return result;
 }

 static hypotheticalSyllogism({statements}) {
  let result = [];
  // a => b, b => c |= a => c                                                                                               
  let implications = statements.filter(x => x.op == "=>");
  for (let implication of implications) {
   let match = implications.find(x => equals(x.left, implication.right));
   if (match) {
    result.push(implies(implication.left, match.right));
   }
  }
  return result;
 }

 static constructiveDillema({statements}) {
  let result = [];
  // (a => c) && (b => d), a || b |= c || d                                                                                 
  let disjunctions = statements.filter(x => x.op == "&&");
  let conjunctions = statements.filter(x => x.op == "||");
  for (let disjunction of disjunctions) {
   if (disjunction.left.op == "=>" &&
       disjunction.right.op == "=>") {
    let match = conjunctions.find(x =>
                                  equals(x.left, disjunction.left.left) &&
                                  equals(x.right, disjunction.right.left));
    result.push(or(disjunction.left.right, disjunction.right.right));
   }
  }
  return result;
 }

 static absorption({statements}) {
  let result = [];
  // a => b |= a => (a & b)                                                                                                 
  let implications = statements.filter(x => x.op == "=>");
  for (let implication of implications) {
   result.push(implies(implication.left, and(implication.left, implication.right)));
  }
  return result;
 }

 static forward(program) {
  let result = [];
  result = result.concat(Forward.modusPonens(program));
  result = result.concat(Forward.modusTollens(program));
  result = result.concat(Forward.disjunctiveSyllogism(program));
  // This expands a lot. We probably want to use this more carefully.                                                       
  // disjunctiveIntroduction(program);                                                                                      
  result = result.concat(Forward.conjunctionElimination(program));
  // This expands a lot too.                                                                                                
  // result = result.concat(conjunctionIntroduction(program)); 
  result = result.concat(Forward.hypotheticalSyllogism(program));
  result = result.concat(Forward.constructiveDillema(program));
  // This expands a lot too.                                                                                                
  // result = result.concat(absorption(program));                                                                           
  return result;
 }

 static deduce(program, assumption) {
  do {
   if (Forward.entails(program, assumption)) {
    return true;
   }
   let inference = Forward.forward(program);
   program.statements.splice(program.statements.length, 0, ...inference);
  } while (true);
 }

 static entails({statements}, assumption) {
  for (let statement of statements) {
   if (equals(statement, assumption)) {
    return true;
   }
  }
  return false;
 }

}

function quantify(rule, expression) {
 if (!rule.quantifiers) {
  return expression;
 }

 let prefix = rule.quantifiers.map(x => {
   return `${x.op} (${x.variable}) `;
 }).join("");

 return `${prefix} ${expression}`;
}

function stringify(rule) {
 if (rule["@type"] == "Literal") {
  return quantify(rule, rule.name);
 } else if (rule["@type"] == "Quantifier") {
  return `${rule.op} (${rule.variable}) ${stringify(rule.expression)}`;
 } else if (rule.op == "~") {
  return quantify(rule, `~${stringify(rule.expression)}`);
 } else if (rule["@type"] == "Predicate") {
  // console.log(JSON.stringify(rule.arguments, undefined, 2));
  // console.log(rule.arguments.map(x => x.literal));
  // console.log(JSON.stringify(rule));
  let arg = (x) => {
   if (x.literal) {
    // return x.literal.name + (x.free ? "?" : "");
    return x.literal.name;
   } else if (x.call) {
    return x.call.name + "(" + x.call.arguments.map(arg).join(", ") + ")";
   }
  }
  return quantify(rule, `${rule.name}(${rule.arguments.map(arg).join(", ")})`);
 } else if (rule.op) {
  // NOTE(goto): by not parenthesizing we loose some information
  // but on the other hand we gain readability. Not sure if that's
  // the right trade-off but works for now.
  // console.log(rule);
  return quantify(rule, `${stringify(rule.left)} ${rule.op} ${stringify(rule.right)}`);
 }
 throw new Error("Unknown rule type" + JSON.stringify(rule));
}

function explain(reasons) {
 let result = [];
 // console.log(JSON.stringify(reasons));
 // console.log("hi");
 if (!reasons) {
  return "";
 }
 for (let reason of reasons) {
  // console.log(reason);
  // console.log(reason);
  // console.log(reason.given);
  // console.log(reason.goal);
  if (equals(reason.given, reason.goal)) {
   // console.log("hi");
   result.push(stringify(reason.given) + ".\n");
  } else {
   let line = [];
   line.push("if (");
   line.push(stringify(reason.given));
   // line.push(" ");
   let ands = reason.and || [];
   for (let and of ands) {
    // console.log(and);
    line.push(" and " + stringify(and));
   }
   line.push(")");
   line.push(" ");
   line.push("then (" + stringify(reason.goal) + ").\n");
   result.push(line.join(""));
  }
 }
 return result.join("\n");
}

function toString(program) {
 let result = "";
 for (let statement of program.statements) {
  result += stringify(statement) + ".\n";
 }
 return result;
}

module.exports = {
 Forward: Forward,
 normalize: normalize,
 stringify: stringify,
 equals: equals,
 explain: explain,
 toString: toString
};