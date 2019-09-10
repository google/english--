const logic = require("./logic.js");

class Parser {
  static parse(code) {
    return logic.parse(code);
  }

  static literal(x) {
    return {"@type": "Literal", "name": x};
  };

  static binary(op, left, right) {
    return {"@type": "BinaryOperator", left: left, "op": op, right: right, quantifiers: []};
  };
 
  static program(statements) {
    return {"@type": "Program", statements: statements};
  }
  
  static constant(value) {
    return {"@type": "Constant", name: value};
  }

  static quantifier(op, x, value, id) {
    let result =  {
      "@type": "Quantifier", 
      op: op, 
      variable: {
	"@type": "Variable",
	name: x
      }
    };
    if (id) {
      result.id = id;
    }
    if (value) {
      result.value = value;
    }
    return result;
  }
  
  static forall(x, expression, value, id) {
    let result = Parser.quantifier("forall", x, value, id);
    expression.quantifiers.unshift(result);
    return expression;
  }

  static exists(x, expression, value, id) {
    let result = Parser.quantifier("exists", x, value, id);
    expression.quantifiers.unshift(result);
    return expression;
  }

  static predicate(name, args, ) {
    return {"@type": "Predicate", name: name, arguments: args, quantifiers: []};
  }

  static negation(a) {
    return {"@type": "UnaryOperator", op: "~", expression: a, quantifiers: []};
  }
  
  static func(name, args) {
    return {"@type": "Function", name: name, arguments: args, quantifiers: []};
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

  static argument(a, value, free, id) {
    // if (!free && id) {
    //   throw new Error("bound variables can't have an id");
    // }

    let result = {"@type": "Argument"};
    result.expression = a;
    if (value) {
      result.value = value;
    }
    if (free) {
      result.free = free;
    }
    if (id) {
      result.id = id;
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

