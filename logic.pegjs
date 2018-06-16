program = statements:(NL statement NL)* {
  let rest = statements.map(x => x.filter(y => !Array.isArray(y)));
  return {"@type": "Program", statements: [...rest.map(x => x[0])]}
}

statement = expression

expression
  = quantifier
  / implication
  / logical
  / negation

quantifier
  = quantifier:QUANTIFIER OPENPAREN id:identifier CLOSEPAREN expression:expression { 
     return {"@type": "Quantifier", name: quantifier, variable: id, expression: expression} }

implication
  = left:logical op:IMPLICATION right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }

negation
  =  NEGATION expression:expression { return {"@type": "UnaryOperator", name: "~", expression: expression} }
 
logical
  = left:primary op:OPLOGIC right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }
  / primary
 
primary
  = predicate
  / "true" { return {"@type": "Constant", name: "true"} }
  / "false" { return {"@type": "Constant", name: "false"} }
  / id:identifier { return {"@type": "Literal", name: id} }
  / OPENPAREN expression:expression CLOSEPAREN {
    return expression;
   }

predicate =
  id:identifier OPENPAREN CLOSEPAREN { return {"@type": "Predicate", name: id} }
  / id:identifier OPENPAREN head:identifier tail:("," identifier)* CLOSEPAREN { 
    let rest = tail.map(x => x[1]);
    return {"@type": "Predicate", name: id, arguments: [head, ...rest]}
  }
  
identifier "identifier"
  = _ id:[a-zA-Z_]+ _ { return id.join('');}

/**
 * Define tokens
 */
 
OPENPAREN = _ '(' _
CLOSEPAREN = _ ')' _
 
OPLOGIC
  = _ c:"&&" _ { return c; }
  / _ c:"||" _ { return c; }
  / _ c:"^" _ { return c; }

IMPLICATION
  = _ c:"=>" _ { return c; }

NEGATION
  = _ "~" _
_
  = [ ]*

NL = [ \n]*

QUANTIFIER = 
     "forall"
   / "exists"
