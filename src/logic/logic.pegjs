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
  = quantifier:QUANTIFIER OPENPAREN id:identifier value:(_ "=" _ primary)? CLOSEPAREN expression:expression {
     let result = {
       "@type": "Quantifier", 
       op: quantifier,
       variable: {
         "@type": "Variable",
         name: id
       }
     };

     if (value && value.length > 0) {
       // console.log(value);
       result.value = value[value.length - 1];
     }
 
     // TODO(goto): this will lead to a bug if we try to
     // quantify a non-quantifiable expression, like
     // forall (x) true.
     expression.quantifiers.unshift(result);

     return expression;
}

implication
  = left:logical op:IMPLICATION right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right, quantifiers: []};
   }
  / head:IF left:logical op:THEN right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right, quantifiers: []};
   }

negation
  =  NEGATION expression:expression { return {"@type": "UnaryOperator", op: "~", expression: expression, quantifiers: []} }
 
logical
  = left:primary op:OPLOGIC right:expression {
    return {"@type": "BinaryOperator", left:left, op:op, right:right, quantifiers: []};
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
  id:identifier OPENPAREN CLOSEPAREN { return {"@type": "Predicate", name: id, arguments: [], quantifiers: []} }
  / id:identifier OPENPAREN head:argument tail:("," argument)* CLOSEPAREN { 
    let rest = tail.map(x => x[1]);
    return {"@type": "Predicate", name: id, arguments: [head, ...rest], quantifiers: []}
  }

argument =
  call:function { return {"@type": "Argument", expression: call} }
  / name:identifier free:QUESTION? value:(_ "=" _ primary)? {
    let result = {"@type": "Argument", expression: {"@type": "Literal", name: name}}; 
    if (free == "?") {
      result.free = true;
    }
    if (value && value.length > 0) {
      // console.log(value);
      result.value = value[value.length - 1];
    }
    return result;
  }

function =
  id:identifier OPENPAREN CLOSEPAREN { return {"@type": "Function", name: id, quantifiers: []} }
  / id:identifier OPENPAREN head:argument tail:("," argument)* CLOSEPAREN { 
    let rest = tail.map(x => x[1]);
    return {"@type": "Function", name: id, arguments: [head, ...rest], quantifiers: []}
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
PERIOD = _ "." _ { return "."; }
QUESTION = _ "?" _ { return "?"; }

EOL
  = PERIOD
  / QUESTION


QUANTIFIER = 
     "forall"
   / "exists"