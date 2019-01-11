program = statements:(NL* statement EOL)* NL* {
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
     return {"@type": "Quantifier", op: quantifier, variable: id, expression: expression} }

implication
  = left:logical op:IMPLICATION right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }
  / head:IF left:logical op:THEN right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }

negation
  =  NEGATION expression:expression { return {"@type": "UnaryOperator", op: "~", expression: expression} }
 
logical
  = left:primary op:OPLOGIC right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }
  / primary
 
primary
  = predicate
  / "true" { return {"@type": "Constant", name: "true"} }
  / "false" { return {"@type": "Constant", name: "false"} }
  / OPENPAREN expression:expression CLOSEPAREN {
    return expression;
   }
  / id:identifier { return {"@type": "Literal", name: id} }

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
  / _ c:"and" _ { return "&&"; }
  / _ c:"||" _ { return c; }
  / _ c:"or" _ { return "||"; }
  / _ c:"^" _ { return c; }

IMPLICATION
  = _ c:"=>" _ { return c; }

IF
  = _ c:"if" _ { return c; }

THEN
  = _ c:"then" _ { return "=>"; }


NEGATION
  = _ "~" _
_
  = [ ]*

NL = [ \n]+
PERIOD = _ "." _
QUESTION = _ "?" _

EOL
  = PERIOD
  / QUESTION


QUANTIFIER = 
     "forall"
   / "exists"
