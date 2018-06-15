const Assert = require("assert");
const logic = require("../logic.js");

describe("Parser", function() {
  it("Examples", function() {
    // Logical symbols.
    // binary connectives.
    "a || b"; // conjunction
    "a && b"; // disjunction
    "a ^ b"; // xor
    "a => b"; // implication, if (a) then b
    "a == b"; // equality
    // unary connectives.
    "~a";
    // quantifiers.
    "forall (a)"; // universal, forall
    "exists (a)"; // existential, exists
    // literals
    "true";
    "false";

    // Non logical symbols.
    // predicates
    "P"; // 0-arity predicate, propositional statement
    "Q(a)"; // 1-arity predicate
    "R(a, b)"; // 2-arity predicate
    // functions
    "f"; // 0-arity function, or constant symbol
    "g(x)"; // 1-arity function

    // grammar
    // Terms
    // - variables
    // - functions with n terms
    // Formulas
    // - predicate symbols
    // - equality
    // - negation
    // - binary connectives
    // - quantifiers
    // ()s
    // ; or . or line break?
    // - precedence
    //   - ~ is evaluated first
    //   - &&s and ||s are evaluated next
    //   - quantifiers are evaluated next
    //   - => are evaluated last

    // Free and bound variables
    "forall(y) P(x, y)"; // y is bound, x is free
  });

  it("true and false", function() {
    assertThat(logic.parse("true")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "true"
      }]
    });

    assertThat(logic.parse("false")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Constant", 
       "name": "false"
      }]
    });
   });


  it("a", function() {
    assertThat(logic.parse("a")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "Literal", 
       "name": "a"
      }]
    });
   });

  it("&&s, ||s and =>s", function() {
    assertThat(logic.parse("a && b")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "BinaryOperator", 
        "left": "a",
        "op": "&&",
        "right": "b"
       }]
     });
    assertThat(logic.parse("a || b")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "BinaryOperator", 
         "left": "a",
         "op": "||",
         "right": "b"
        }]
     });

    assertThat(logic.parse("a => b")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": "a",
       "op": "=>",
       "right": "b"
      }]
     });

    assertThat(logic.parse("a ^ b")).equalsTo({
      "@type": "Program", 
      "statements": [{
       "@type": "BinaryOperator", 
       "left": "a",
       "op": "^",
       "right": "b"
      }]
     });
   });

  it("~a", function() {
    assertThat(logic.parse("~a")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "UnaryOperator", 
        "name": "~",
        "expression": "a"
       }]
     });
   });

  it("forall (a) a && b", function() {
    assertThat(logic.parse("forall (a) a && b")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "name": "forall",
        "variable": "a",
        "expression": {
          "@type": "BinaryOperator", 
          "op": "&&",
          "left": "a",
          "right": "b"
         }
       }]
     });
   });

  it("exists (a) a && b", function() {
    assertThat(logic.parse("exists (a) a && b")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Quantifier",
        "name": "exists",
        "variable": "a",
        "expression": {
          "@type": "BinaryOperator", 
          "op": "&&",
          "left": "a",
          "right": "b"
         }
       }]
     });
   });

  it("P()", function() {
    assertThat(logic.parse("P()")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P"
       }]
     });
   });

  it("P(a)", function() {
    assertThat(logic.parse("P(a)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a"]
       }]
     });
   });

  it("P(a, b, c)", function() {
    assertThat(logic.parse("P(a, b, c)")).equalsTo({
      "@type": "Program", 
      "statements": [{
        "@type": "Predicate",
        "name": "P",
        "arguments": ["a", "b", "c"]
       }]
     });
   });

  it("Multiple statements", function() {
    assertThat(logic.parse("\na\nb\nc\n")).equalsTo({
      "@type": "Program", 
      "statements": [{
         "@type": "Literal", 
         "name": "a"
        }, {
         "@type": "Literal", 
         "name": "b"
        }, {
         "@type": "Literal", 
         "name": "c"
      }]
    });
  });

  it("Invalid syntax", function() {
    try {
     logic.parse("1+1");
     fail("blargh");
    } catch (e) {
     // expected error;
    }
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

return;

describe("Logic", function(done) {  

  function* lexer(code) {
   // console.log("hi");
   let i = 0;
   while (i < code.length) {
    let char = code[i];
    if (char == " ") {
     yield {"@type": "Space", name: " "};
     i++;
    } else if (char == "(" || char == ")") {
     yield {"@type": "Parenthesis", name: char};
     i++;
    } else if (char == ",") {
     yield {"@type": "Comma", name: ","};
     i++;
    } else if (char == "\n") {
     yield {"@type": "Newline", name: "\n"};
     i++;
    } else if (char == "~") {
     yield {"@type": "Negation", name: "~"};
     i++;
    } else if (char == "&" &&
               (i + 1) < code.length &&
               code[i + 1] == "&") {
     yield {"@type": "Disjunction", name: "&&"};
     i += "&&".length;
    } else if (char == "|" &&
               (i + 1) < code.length &&
               code[i + 1] == "|") {
     yield {"@type": "Conjunction", name: "||"};
     i += "||".length;
    } else if (char == "=" &&
               (i + 1) < code.length &&
               code[i + 1] == ">") {
     yield {"@type": "Implication", name: "=>"};
     i += "=>".length;
    } else if (char == "^") {
     yield {"@type": "ExclusiveDisjunction", name: "^"};
     i += "^".length;
    } else if (char == "t" &&
               (i + 3) < code.length &&
               code[i + 1] == "r" &&
               code[i + 2] == "u" &&
               code[i + 3] == "e") {
     yield {"@type": "Literal", name: "true"};
     i += "true".length;
    } else if (char == "f" &&
               (i + 4) < code.length &&
               code[i + 1] == "a" &&
               code[i + 2] == "l" &&
               code[i + 3] == "s" &&
               code[i + 4] == "e") {
     yield {"@type": "Literal", name: "false"};
     i += "false".length;
    } else if (char == "f" &&
               (i + 5) < code.length &&
               code[i + 1] == "o" &&
               code[i + 2] == "r" &&
               code[i + 3] == "a" &&
               code[i + 4] == "l" &&
               code[i + 5] == "l") {
     yield {"@type": "Quantifier", name: "forall"};
     i += "forall".length;
    } else if (char == "e" &&
               (i + 5) < code.length &&
               code[i + 1] == "x" &&
               code[i + 2] == "i" &&
               code[i + 3] == "s" &&
               code[i + 4] == "t" &&
               code[i + 5] == "s") {
     yield {"@type": "Quantifier", name: "exists"};
     i += "exists".length;
    } else if (char >= "a" && char <= "z" ||
               char >= "A" && char <= "Z") {
     // TODO(goto): enable multiple character identifiers.
     yield {"@type": "Identifier", name: char};
     i++;
    } else {
     throw new Error("Invalid character at " + i);
    }
   }
  }

  function tokenize(code, opt_flat) {
   let result = [];
   for (token of lexer(code)) {
    // console.log("got something");
    result.push(opt_flat ? token.name : token);
   }
   return result;
  }

  it("Literals", function() {
    assertThat(tokenize("true")).equalsTo([{"@type": "Literal", "name": "true"}]);
    assertThat(tokenize("false")).equalsTo([{"@type": "Literal", "name": "false"}]);
   });

  it("Identifiers", function() {
    assertThat(tokenize("a")).equalsTo([{"@type": "Identifier", "name": "a"}]);
   });

  it("Unary operators", function() {
    assertThat(tokenize("~")).equalsTo([{
      "@type": "Negation", 
      "name": "~"
    }]);
   });

  it("Binary operators", function() {
    assertThat(tokenize("&&")).equalsTo([{
      "@type": "Disjunction", 
      "name": "&&"
    }]);
    assertThat(tokenize("||")).equalsTo([{
      "@type": "Conjunction", 
      "name": "||"
    }]);
    assertThat(tokenize("=>")).equalsTo([{
      "@type": "Implication", 
      "name": "=>"
    }]);
    assertThat(tokenize("^")).equalsTo([{
      "@type": "ExclusiveDisjunction", 
      "name": "^"
    }]);
   });

  it("Quantifiers", function() {
    assertThat(tokenize("forall")).equalsTo([{
      "@type": "Quantifier",
      "name": "forall"
    }]);
    assertThat(tokenize("exists")).equalsTo([{
      "@type": "Quantifier", 
      "name": "exists"
    }]);
   });

  it("Parenthesis", function() {
    assertThat(tokenize("(")).equalsTo([{
      "@type": "Parenthesis",
      "name": "("
    }]);
    assertThat(tokenize(")")).equalsTo([{
      "@type": "Parenthesis", 
      "name": ")"
    }]);
   });

  it("Comma", function() {
    assertThat(tokenize(",")).equalsTo([{
      "@type": "Comma",
      "name": ","
    }]);
   });

  it("new lines", function() {
    assertThat(tokenize("\n")).equalsTo([{
      "@type": "Newline",
      "name": "\n"
    }]);
   });

  it("Sentence", function() {
    assertThat(tokenize("a && b", true))
     .equalsTo(["a", " ", "&&", " ", "b"]);
    assertThat(tokenize("a => b", true))
     .equalsTo(["a", " ", "=>", " ", "b"]);
    assertThat(tokenize("~a => ~b", true))
     .equalsTo(["~", "a", " ", "=>", " ", "~", "b"]);
    assertThat(tokenize("forall (a) P(a) => ~b", true))
     .equalsTo(["forall", " ", "(", "a", ")", " ", "P", "(", "a", ")", " ", "=>", " ", "~", "b"]);
   });

  class Parser {
   constructor(tokens) {
    this.tokens = tokens;
    this.current = this.tokens.next();
   }
   consume() {
    this.current = this.tokens.next();
    return this.current;
   }
   accept(token) {
    if (this.current.done) {
     return false;
    }

    let current = this.current.value;
    let matches = false;
    if (token[0] == "@") {
     // compares by type
     // console.log(current);
     return token.substring(1) == current["@type"];
     // console.log(matches);
    } else if (token == current.name) {
     // compares by value
     return true;
    }
    // if (matches) {
    //  this.next();
    // }
    return false;
   }
   expect(token) {
    if (this.accept(token)) {
     return true;
    }
    this.error(`Unexpected token`);
   }
   error(msg) {
    throw new Error(msg);
   }
   identifier() {
    if (this.accept("@Identifier")) {
     return this.current.value;
    }
    this.error(`Expected identifier, got ${this.current.done}`);
   }
   parse() {
    if (this.accept("@Identifier")) {
     
    }
    return this.identifier();
   }
  }

  it("AST - Identifiers", function() {
    assertThat(new Parser(lexer("a")).parse()).equalsTo({
      "@type": "Identifier",
      "name": "a"
    });
   });

  it("AST - BinaryOperator", function() {
    assertThat(new Parser(lexer("a + b")).parse()).equalsTo({
      "@type": "Identifier",
      "name": "a"
    });
   });
});
