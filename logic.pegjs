program = head:statement tail:(NL statement)* {
  // console.log(tail);
  let rest = tail.map(x => x[1]);
  return {"@type": "Program", statements: [head, ...rest]}
}

statement = logical
    / id:identifier { return {"@type": "Literal", name: id} } 

logical
  = left:identifier op:OPLOGIC right:identifier {
    return {"@type": "BinaryOperator", left:left, op:op, right:right};
   }
  / additive

additive
  = left:multiplicative op:OPADD right:additive {
    return {left:left, op:op, right:right};
   }
  / multiplicative
 
multiplicative
  = left:primary op:OPMULTI right:multiplicative {
    return {left:left, op:op, right:right}; 
  }
  / primary
 
primary
  = integer
  / OPENPAREN additive:additive CLOSEPAREN {
    return additive; 
   }
  
integer "integer"
  = _ digits:[0-9]+ _ { return parseInt(digits.join(''), 10); }

identifier "identifier"
  = _ id:[a-z]+ _ { return id.join('');}

/**
* Define tokens
*/
 
OPENPAREN = _ '(' _
CLOSEPAREN = _ ')' _
 
OPADD
  = _ c:"+" _ { return c; }
  / _ c:"-" _ { return c; }

OPLOGIC
  = _ c:"&&" _ { return c; }
  / _ c:"||" _ { return c; }
  / _ c:"=>" _ { return c; }
  / _ c:"^" _ { return c; }

OPMULTI
  = _ c:"*" _ { return c; }
  / _ c:"/" _ { return c; }
_
  = [ ]*

NL = [\n]*