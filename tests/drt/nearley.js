const Assert = require("assert");
const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");
const {child} = require("../../src/drt/rules.js");

class Nearley {
 constructor({ParserRules, ParserStart}, start) {
  const rule = start ? start : ParserStart;

  this.parser = new nearley.Parser(ParserRules, rule, {
    keepHistory: true
  });   
 }

 feed(code) {
  try {
   this.parser.feed(code);
   return this.parser.results;
  } catch (e) {
   throw this.reportError(e);
  }
 }

 static compile(source) {
  const parser = new nearley.Parser(grammar);
  parser.feed(source);
  const ast = parser.results[0];
  const info = compile(ast, {});
  // Generate JavaScript code from the rules
  const code = generate(info, "grammar");
  const module = { exports: {} };
  eval(code);

  return module.exports;
 }

 static from(code, start) {
  return new Nearley(Nearley.compile(code), start);
 }

 /*
    Generates a user friendly error report given the caught error 
    object and the Nearley parser instance.
  */
  reportError(e) {
   // console.log(e.message);
   let {parser} = this;
   const lastColumnIndex = parser.table.length - 2;
   const lastColumn = parser.table[lastColumnIndex];
   const token = parser.lexer.buffer[parser.current];
   let result = {
    token: token, 
    expected: [],
    message: e.message,
   };
   // result.token = token;
   // Display each state that is expecting a terminal symbol next.
   for (let i = 0; i < lastColumn.states.length; i++) {
    const state = lastColumn.states[i];
    const nextSymbol = state.rule.symbols[state.dot];
    if (nextSymbol && this.isTerminalSymbol(nextSymbol)) {
     const symbolDisplay = this.getSymbolDisplay(nextSymbol);
     // console.log(`    A ${symbolDisplay} based on:`);
     let expected = {symbol: symbolDisplay, based: []};
     result.expected.push(expected);
     // Display the "state stack" - which shows you how this state
     // came to be, step by step.
     const stateStack = this.buildStateStack(lastColumnIndex, i, parser);
     for (let j = 0; j < stateStack.length; j++) {
      const state = stateStack[j];
      expected.based.push(state.rule.toString(state.dot));
     }
    }
   }
   return result;
  }

  getSymbolDisplay(symbol) {
   const type = typeof symbol;
   if (type === "string") {
    return symbol;
   } else if (type === "object" && symbol.literal) {
    return JSON.stringify(symbol.literal);
   } else if (type === "object" && symbol instanceof RegExp) {
    return `character matching ${symbol}`;
   } else {
    throw new Error(`Unknown symbol type: ${symbol}`);
   }
  }

  /*
    Builds the "state stack" - which you can think of as the call stack of the
    recursive-descent parser, which the Nearley parse algorithm simulates.
    The state stack is represented as an array of state objects. This function
    needs to be given a starting state identified by:

    * columnIndex - the column index of the state
    * stateIndex - the state index of the state within the column
    
    and it needs:

    * parser - the Nearley parser instance that generated the parse.
    
    It returns an array of state objects. The first item of the array
    will bet the starting state, with each successive item in the array
    going further back into history.
  */
  buildStateStack(columnIndex, stateIndex, parser) {
   const state = parser.table[columnIndex].states[stateIndex];
   if (state.dot === 0) { // state not started
    // Find the previous state entry in the table that predicted this state
    const match = this.findPreviousStateWhere(
                                              (thatState) => {
                                               const nextSymbol = thatState.rule.symbols[thatState.dot];
                                               return nextSymbol && 
                                          this.isNonTerminalSymbol(nextSymbol) && 
                                          state.rule.name === nextSymbol;
                                         },
                                         columnIndex,
                                         stateIndex,
                                         parser);
    if (match) {
     return [state, ...this.buildStateStack(match[0], match[1], parser)]
      } else {
     return [state];
    }
   } else {
    // Find the previous state entry in the table that generated this state
    // entry after consuming a token
    const previousColumn = parser.table[state.reference];
        const match = previousColumn.states
         .map((state, i) => [state, i])
         .filter(([thatState, i]) =>
                 thatState.rule.toString() === state.rule.toString()
                 )[0];
        return [
                state,
                ...this.buildStateStack(state.reference, match[1], parser)
                ];
   }
  }

  /*
    Finds the previous state within the parser table that matches a given
    condition, given a "current" state based on:

    * predicate - a function which given a state object, returns true or false
    * columnIndex - the column index of the current state
    * stateIndex - the state index of the current state within the column
    * parser - the Nearley parser instance, which contains the parse table
    
    This returns a 3-tuple: [columnIndex, stateIndex, stateObject] of the matching
    state, or null.
  */
  findPreviousStateWhere(predicate, columnIndex, stateIndex, parser) {
   let i = columnIndex;
   let j = stateIndex;
   let column = parser.table[i];
   let state;
   while (true) {
    j--;
    if (j < 0) {
     i--;
     if (i < 0) {
      return null;
     }
     column = parser.table[i];
     j = column.states.length - 1;
    }

    state = column.states[j];
    if (predicate(state)) {
     return [i, j, state];
    }
   }
  }

  isTerminalSymbol(symbol) {
   return typeof symbol !== "string";
  }

  isNonTerminalSymbol(symbol) {
   return !this.isTerminalSymbol(symbol);
  }
}

describe("Nearley", function() {

  it("Basic", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    assertThat(parser.feed("foo")).equalsTo([[[[["foo"]]]]]);
  });

  it("Incomplete", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    // When there is still a possibility of completing
    // a valid parse, it returns []s.
    assertThat(parser.feed("fo")).equalsTo([]);
  });

  it("Error", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);

    try {
     parser.feed("bah");
     throw new Error();
    } catch (error) {
     // console.log(error);
     // console.log(`Instead of a ${JSON.stringify(error.token)}, I was expecting to see one of the following:`);
     for (let expected of error.expected) {
      // console.log(`    A ${expected.symbol} based on:`);
      for (let based of expected.based) {
       // console.log(`        ${based}`);
      } 
     }
    }
  });

  it("Rules", function() {
    let parser = Nearley.from(`
      expression -> number "+" number
      expression -> number "-" number
      expression -> number "*" number
      expression -> number "/" number
      number -> [0-9]:+
    `);

    assertThat(parser.feed("1+1")).equalsTo([[[["1"]], "+", [["1"]]]]);
   });

  it("Postprocessors", function() {
    let parser = Nearley.from(`
      expression -> number "+" number {%
        function([left, op, right]) {
          return {left: left, op: op, right: right};
        }
      %}
      number -> [0-9]:+ {%
        function([number]) {
         return parseInt(number);
        }
      %}
    `);

    assertThat(parser.feed("1+1")).equalsTo([{left: 1, op: "+", right: 1}]);
   });

  it("Reject", function() {
    let parser = Nearley.from(`
      # the first rule always rejects
      number -> [0-4]:+ {% (data, location, reject) => reject %}
      number -> [0-9]:+ {% ([number], location, reject) => "hello" %}
    `);

    assertThat(parser.feed("1")).equalsTo(["hello"]);
   });

  it("Javascript", function() {
    let parser = Nearley.from(`
      @{%
        function foo(num) {
         return parseInt(num);
        }
      %}
      number -> [0-9]:+ {% ([number], location, reject) => foo(number) %}
    `);

    assertThat(parser.feed("1")).equalsTo([1]);
   });

  it("Builtin", function() {
    let parser = Nearley.from(`
      @builtin "whitespace.ne"
      expression -> number _ "+" _ number
      number -> [0-9]:+ {% ([number], location, reject) => parseInt(number) %}
    `);

    assertThat(parser.feed("1 + 1")).equalsTo([[1, null, "+", null, 1]]);
   });

 });

function bind(type, types = {}, conditions = []) {
   
 return (data, location, reject) => {
  // Creates a copy of the types because it is reused
  // across multiple calls and we assign values to it.
  let bindings = JSON.parse(JSON.stringify(types));

  // Creates a copy of the input data, because it is
  // reused across multiple calls.
  let result = JSON.parse(JSON.stringify(data))
  .filter((ws) => ws != null);
  
  // Ignores the null type.
  let expects = conditions.filter((x) => x["@type"] != "null");

  let signature = `${type}${JSON.stringify(bindings)} -> `;
  for (let child of expects) {
   signature += `${child["@type"] || child}${JSON.stringify(child.types || {})} `;
  }

  let hash = (str) => {
   return str.split("")
   .reduce((prevHash, currVal) =>
           (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
  }
       
  // console.log(hash(signature));
  let namespace = hash(signature);

  let children = result.filter((node) => node["@type"]);

  //console.log(`Trying to bind ${signature}`);
  //let foo = children.map((x) => {
  //  return `${x["@type"]}${JSON.stringify(x.types)}`;
  //}).join(" ");
  //console.log(`To ${foo}`);

  if (expects.length != children.length) {
   // console.log("not the same length");
   return reject;
  }

  let variables = {};

  for (let i = 0; i < expects.length; i++) {
   let expected = expects[i];
   let child = children[i];
   if (expected["@type"] != child["@type"]) {
    // console.log("Children of different types");
    return reject;
   }
   for (let [key, value] of Object.entries(expected.types || {})) {
    if (typeof value == "number") {
     if (variables[value]) {
      if (Array.isArray(variables[value])) {
       if (!variables[value].includes(child.types[key])) {
        return reject;
       }
      } else if (typeof variables[value] == "number") {
       // console.log("hi");
       variables[value] = child.types[key];
      } else if (Array.isArray(child.types[key])) {
       if (!child.types[key].includes(variables[value])) {
        return reject;
       }
       continue;
      } else if (typeof child.types[key] == "number") {
       // console.log("hi");
       variables[child.types[key]] = variables[value];
       continue;
      } else if (variables[value] != child.types[key]) {
       // console.log(`Expected ${key}="${variables[value]}", got ${key}="${child.types[key]}"`);
       return reject;
      }
     }
     // collects variables
     variables[value] = child.types[key];
    } else if (typeof child.types[key] == "number") {
     child.types[key] = value;
    } else if (Array.isArray(child.types[key])) {
     if (!child.types[key].includes(expected.types[key])) {
      return reject;
     }
     child.types[key] = expected.types[key];
    } else if (typeof child.types[key] == "string" &&
               expected.types[key] != child.types[key]) {
     if (Array.isArray(expected.types[key]) &&
         expected.types[key].includes(child.types[key])) {
      // variables[key] = child.types[key];
      // console.log(key);
      continue;
     }
     // console.log(`Expected ${key}="${expected.types[key]}", got ${key}="${child.types[key]}"`);
     return reject;
    } else if (!child.types[key]) {
     return reject;
    }
   }
  }
    
  // Sets variables
  for (let [key, value] of Object.entries(bindings)) {
   if (typeof value == "number") {
    // console.log(key);
    // console.log("hello");
    if (!variables[value]) {
     // console.log(variables);
     // console.log(types);
     // console.log(variables);
     // console.log("hi");
     // return reject;
     bindings[key] = namespace + value;
    } else {
     // console.log(`${key} = ${variables[value]}`);
     bindings[key] = variables[value];
    }
   }
  }

  // console.log(JSON.stringify(types));

  return {
   "@type": type,
   "types": bindings,
   "children": result,
  };
 };
}

describe("Binding", function() {
  it("Whitespace", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);

    assertThat(post([{
        "@type": "V", 
      }, null, {
        "@type": "NP", 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {},
      "children": [{"@type": "V"}, {"@type": "NP"}]
    });

  });
  
  it("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([]))
    .equalsTo(undefined);
   });

  it("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([null,null]))
    .equalsTo(undefined);

   });

  it("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([{"@type": "V"},{"@type": "DET"}]))
    .equalsTo(undefined);
   });

  it("Rejects based on types", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([{"@type": "V"},{"@type": "DET"}]))
     .equalsTo(undefined);
  });

  it("Rejects based on types", function() {
    let post = bind("NP", {}, [{"@type": "PN", "types": {"num": "sing"}}]);
    assertThat(post([{"@type": "PN", "types": {"num": "plur"}}]))
     .equalsTo(undefined);
  });

  it("Rejects based on conflicting bindings", function() {
    let post = bind("VP", {"num": 1}, [{ 
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "NP", 
        "types": {"num": "plur"}, 
    }]))
    .equalsTo(undefined);
  });

  it("Rejects invalid array entry", function() {
    let post = bind("NP", {"gen": "male"}, [{
       "@type": "PN",
       "types": {"gen": "male"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["-hum", "fem"]}, 
    }]))
    .equalsTo(undefined);
  });

  it("Binds", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"num": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing"},
      }]
    });
  });

  it("Binds keeps free variables", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"gen": 2}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": "male"},
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": -568255581}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "male"},
      }]
    });
  });

  it("Binds tail variable to head", function() {
    let post = bind("NP", {}, [{ 
       "@type": "PN",
       "types": {"gen": "-"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": -1638024502},
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "-"},
      }]
    });
  });

  it("Binds to literals", function() {
    let post = bind("PN", {"num": "sing"});

    assertThat(post(["Sam"]))
    .equalsTo({
      "@type": "PN", 
      "types": {"num": "sing"}, 
      "children": ["Sam"]
    });
  });

  it("Binds multiple", function() {
    let post = bind("NP", {"num": 1, "gen": 2}, [{ 
       "@type": "PN",
       "types": {"num": 1, "gen": 2}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing", "gen": "-hum"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing", "gen": "-hum"},
      }]
    });
  });

  it("Binds multiple", function() {
    let post = bind("S", {"num": 1}, [{ 
       "@type": "NP",
       "types": {"num": 1}
      }, { 
       "@type": "VP_",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "NP", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "VP_", 
        "types": {"num": 2}, 
      }]))
    .equalsTo({
      "@type": "S", 
      "types": {"num": "sing"}, 
      "children": [{
         "@type": "NP", 
         "types": {"num": "sing"},
       }, {
         "@type": "VP_", 
         "types": {"num": 2},
      }]
    });
  });

  it("Binds ignoring extras", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"num": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing", "gen": "-hum"},
      }]
    });
  });

  it("Rejects fewer of expected types", function() {
    let post = bind("VP", {}, [{ 
       "@type": "NP",
       "types": {"num": 1, "gen": 2, "case": "-nom", "gap": 3}
    }]);

    assertThat(post([{
      "@type": "NP", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo(undefined);
  });

  it("Binds to arrays", function() {
    let post = bind("NP", {"gen": 1}, [{
       "@type": "PN",
       "types": {"gen": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["male", "fem"]}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"gen": ["male", "fem"]}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": ["male", "fem"]}, 
      }]
    });
  });

  it("Binds to array entry", function() {
    let post = bind("NP", {"gen": "male"}, [{
       "@type": "PN",
       "types": {"gen": "male"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["male", "fem"]}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"gen": "male"}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "male"}, 
      }]
    });
  });

  it("Binds and array entry to a literal", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": ["sing", "plur"]}, 
      }, {
        "@type": "NP", 
        "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": ["sing", "plur"]}, 
        }, {
          "@type": "NP", 
          "types": {"num": "sing"}, 
      }]
    });
  });

  it("Binds and array entry to a literal", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "NP", 
        "types": {"num": ["sing", "plur"]}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": "sing"}, 
        }, {
          "@type": "NP", 
          "types": {"num": ["sing", "plur"]}, 
      }]
    });
  });

  it("Binds literal to an array entry", function() {
    let post = bind("V", {}, [{
       "@type": "VERB",
       "types": {"ends": ["s", "ch"]}
      }]);

    assertThat(post([{
        "@type": "VERB",
        "types": {"ends": "s"}, 
      }]))
    .equalsTo({
      "@type": "V", 
      "types": {}, 
      "children": [{
          "@type": "VERB", 
          "types": {"ends": "s"}, 
        }]
    });
  });

  it("Binds literal to variable", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": 1234}, 
      }, {
        "@type": "NP", 
        "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": 1234}, 
        }, {
          "@type": "NP", 
          "types": {"num": "sing"}, 
      }]
    });
  });
});

const RuntimeGrammar = Nearley.compile(`
      @builtin "whitespace.ne"
      @builtin "number.ne"
      @builtin "string.ne"

      rules -> (_ rule _ "."):+ _ {% ([rules]) => {
        return rules.map(([ws, rule]) => rule);
      } %}

      rule -> head __ "->" __ tail {%
        ([head, ws0, arrow, ws1, tail]) => {
         return {
          "head": head,
          "tail": tail
         }
        }
      %}

      head -> name {% id %}
      tail -> (term __ {% id %}):* term {%
        ([beginning, end]) => {
         return [...beginning, end];
        }
      %}

      term -> name {% id %}
      term -> string {% id %}

      name -> word features:? {% 
        ([word, features]) => {
         return {
          name: word,
          types: Object.fromEntries(features || [])
         }
        }
      %}
      string -> dqstring {% ([str]) => '"' + str + '"' %}

      features -> "[" props "]" {% ([p0, props, p1]) => {
        // console.log(props);
        return props;
      }%}

      props -> (keyvalue _ "," _ {% id %}):* keyvalue:? {%
        ([beginning, end]) => {
         if (!end) {
          return beginning;
         }
         return [...beginning, end];
        }
      %}

      keyvalue -> word _ "=" _ word {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      keyvalue -> word _ "=" _ int {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      keyvalue -> word _ "=" _ array {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      array -> "[" values "]" {% ([p0, values, p1]) => values %}

      values -> (word _ "," _ {% id %}):* word:? {%
        ([beginning, end]) => {
         if (!end) {
          return beginning;
         }
         return [...beginning, end];
        }
      %}

      word -> [a-zA-Z_\+\-]:+ {% ([char]) => {
        return char.join("");
      }%}
`);

class FeaturedNearley {
 constructor() {
  this.parser = new Nearley(RuntimeGrammar);
 }

 feed(code) {
  return this.parser.feed(code);
 }

 static compile(source) {
  let parser = new FeaturedNearley();
  let grammar = parser.feed(source);

  let result = [];

  function feed(code) {
   result.push(code);
  }

  feed(`@builtin "whitespace.ne"`);
  feed(``);
  feed(`@{%`);
  feed(`${bind.toString()}`);
  feed(`%}`);
  feed(``);

  // console.log(grammar[0].length);
  
  for (let {head, tail} of grammar[0]) {
   // console.log("hi");
   let term = (x) => typeof x == "string" ? `${x}i` : x.name;
   feed(`${head.name} -> ${tail.map(term).join(" ")} {%`);
        feed(`  bind("${head.name}", ${JSON.stringify(head.types)}, [`);
                     for (let term of tail) {
                      if (term.name == "_" || term.name == "__" || typeof term == "string") {
                       continue;
                      }
                      feed(`    {"@type": "${term.name}", "types": ${JSON.stringify(term.types)}}, `);
                     }
                     feed(`  ])`);
        feed(`%}`);

  }
 
  return Nearley.compile(result.join("\n"));
 }
}

describe("FeaturedNearley", function() {
  it("Rejects at Runtime", function() {
    let parser = Nearley.from(`
      @builtin "whitespace.ne"

      @{% ${bind.toString()} %}

      S -> NP _ VP {%
        bind("S", {"num": 1}, [{
          "@type": "NP",
          "types": {"num": 1}
          }, {
          "@type": "VP",
          "types": {"num": 1}
          }])
      %}
      VP -> V _ NP {% 
        bind("VP", {"num": "sing"}, [{
           "@type": "V",
          }, {
           "@type": "NP",
          }]) 
      %}
      NP -> PN {% 
        bind("NP", {"num": 1}, [{ 
           "@type": "PN",
           "types": {"num": 1}
        }]) 
      %}
      PN -> "Sam" {% bind("PN", {"num": "sing"}) %}
      PN -> "Dani" {% bind("PN", {"num": "sing"}) %}
      V -> "likes" {% bind("V", {"num": "sing"}) %}
    `);

    let result = parser.feed("Sam likes Dani");

    let node = (type, ...children) => { 
     return {"@type": type, "children": children} 
    };

    assertThat(result[0].types).equalsTo({
      "num": "sing"
    });

    function clear(root) {
     delete root.types;
     for (let child of root.children || []) {
      clear(child);
     }
     return root;
    }

    assertThat(clear(result[0]))
     .equalsTo(node("S",
                    node("NP", node("PN", "Sam")),
                    node("VP", 
                         node("V", "likes"), 
                         node("NP", node("PN", "Dani"))))
               );
   });

  it("Nearley features", function() {
    let parser = new FeaturedNearley();

    let result = parser.feed(`
      foo[num=1] -> bar hello[gender=male].
      hello -> world.
      a -> "hi".
      a -> b "c" d.
      S -> NP _ VP_.
      PRO[gen=-hum, case=[+nom, -nom]] -> "it".
    `);

    let term = (name, types = {}) => {
     return {name: name, types: types};
    };

    assertThat(result).equalsTo([[{
        "head": term("foo", {"num": 1}),
        "tail": [term("bar"), term("hello", {"gender": "male"})]
       }, {
        "head": term("hello"), 
        "tail": [term("world")]
       }, {
        "head": term("a"), 
        "tail": ["\"hi\""]
       }, {
        "head": term("a"), 
        "tail": [term("b"), "\"c\"", term("d")]
       }, {
        "head": term("S"), 
        "tail": [term("NP"), term("_"), term("VP_")]
       }, {
        "head": term("PRO", {"case": ["+nom", "-nom"], "gen": "-hum"}), 
        "tail": ["\"it\""]
       }]]);
  });
});

const DRTGrammar = FeaturedNearley.compile(`
      Statement -> S_ _ ".".

      Question ->
          "Who" __
          VP_[num=1, fin=+, gap=-, tp=3, tense=4] _
          "?"
          .

      S_[num=1, gap=-, tp=2, tense=3] -> S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          "if" __ 
          S[num=1, gap=-, tp=2, tense=3] __ 
          "then" __ 
          S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          S[num=4, gap=-, tp=2, tense=3] __ 
          "and" __ 
          S[num=5, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=3, tense=4] -> 
          NP[num=1, gen=2, case=+nom, gap=-] __ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4] ->
          NP[num=1, gen=2, case=+nom, gap=np] _ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4] ->
          NP[num=1, gen=2, case=+nom, gap=-] __ 
          VP_[num=1, fin=+, gap=np, tp=3, tense=4].

      VP_[num=1, fin=+, gap=2, stat=3, tp=4, tense=fut] ->
        AUX[num=1, fin=+, tp=4, tense=fut] __ 
        VP[num=5, fin=-, gap=2, stat=3, tp=4, tense=pres].

      VP_[num=1, fin=+, gap=2] ->
          AUX[num=1, fin=+] __ "not" __ VP[num=3, fin=-, gap=2].

      VP_[num=1, fin=+, gap=2, state=3, tp=4, tense=5] -> 
          VP[num=1, fin=+, gap=2, state=3, tp=4, tense=5].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] ->
          V[num=1, fin=2, trans=+, stat=3, tp=4, tense=5] __ 
          NP[num=6, gen=7, case=-nom, gap=-].

      VP[num=1, fin=2, gap=np] ->
          V[num=1, fin=2, trans=+] _ NP[num=4, gen=5, case=-nom, gap=np].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] -> 
        V[num=1, fin=2, trans=-, stat=3, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          "not" __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      NP[num=1, gen=2, case=3, gap=np] -> GAP.

      GAP -> null.

      NP[num=1, gen=2, case=3, gap=-] -> DET[num=1] __ N[num=1, gen=2].

      NP[num=1, gen=2, case=3, gap=-] -> PN[num=1, gen=2].
 
      NP[num=1, gen=2, case=3, gap=-] -> PRO[num=1, gen=2, case=3].

      NP[num=plur, gen=1, case=2, gap=-] -> 
        NP[num=3, gen=4, case=2, gap=-] __ 
        "and" __ 
        NP[num=5, gen=6, case=2, gap=-].

      N[num=1, gen=2] -> N[num=1, gen=2] __ RC[num=1, gen=2].

      RC[num=1, gen=2] -> RPRO[num=1, gen=2] __ S[num=1, gap=np].

      VP[num=1, fin=2] -> BE[num=1, fin=2, tp=3, tense=4] __ ADJ.
      VP[num=1, fin=2] -> BE[num=1, fin=2, tp=3, tense=4] __ "not" __ ADJ.

      VP[num=1, fin=2] -> 
        BE[num=1, fin=2] __ PP.
      VP[num=1, fin=2] -> 
        BE[num=1, fin=2] __ "not" __ PP.

      VP[num=1, fin=2] -> 
        BE[num=1, fin=2] __ NP[num=3, gen=4, case=5, gap=-].
      VP[num=1, fin=2] -> 
        BE[num=1, fin=2] __ "not" __ NP[num=3, gen=4, case=5, gap=-].

      DET[num=sing] -> "a".
      DET[num=sing] -> "an".
      DET[num=sing] -> "every".
      DET[num=sing] -> "the".
      DET[num=sing] -> "some".

      DET[num=1] -> NP[num=2, gen=3, case=+nom, gap=-] _ "'s".

      PRO[num=sing, gen=male, case=+nom] -> "he".
      PRO[num=sing, gen=male, case=-nom] -> "him".

      PRO[num=sing, gen=fem, case=+nom] -> "she".
      PRO[num=sing, gen=fem, case=-nom] -> "her".

      PRO[num=sing, gen=-hum, case=[-nom, +nom]] -> "it".

      PRO[num=plur, gen=[male, fem, -hum], case=+nom] -> "they".
      PRO[num=plur, gen=[male, fem, -hum], case=-nom] -> "them".

      PRO[num=sing, gen=male, case=-nom, refl=+] -> "himself".
      PRO[num=sing, gen=fem, case=-nom, refl=+] -> "herself".
      PRO[num=sing, gen=-hum, case=-nom, refl=+] -> "itself".

      PN[num=sing, gen=male] -> "Jones".
      PN[num=sing, gen=male] -> "Smith".
      PN[num=sing, gen=fem] -> "Mary".
      PN[num=sing, gen=-hum] -> "Brazil".

      N[num=sing, gen=male] -> "man".
      N[num=sing, gen=fem] -> "woman".
      N[num=sing, gen=fem] -> "girl".
      N[num=sing, gen=fem] -> "sister".
      N[num=sing, gen=-hum] -> "book".
      N[num=sing, gen=-hum] -> "telescope".
      N[num=sing, gen=-hum] -> "donkey".
      N[num=sing, gen=-hum] -> "porsche".
      N[num=sing, gen=[male, fem]] -> "engineer".

      N[num=1, gen=2] -> N[num=1, gen=2] __ PP.

      PP -> PREP __ NP[num=1, gen=2, case=3, gap=-].

      PREP -> "behind".
      PREP -> "in".
      PREP -> "over".
      PREP -> "under".
      PREP -> "near".

      PREP -> "before".
      PREP -> "after".
      PREP -> "during".

      PREP -> "from".
      PREP -> "to".
      PREP -> "of".
      PREP -> "about".
      PREP -> "by".
      PREP -> "for".
      PREP -> "with".

      AUX[num=sing, fin=+, tp=-past, tense=pres] -> "does".
      AUX[num=plur, fin=+, tp=-past, tense=pres] -> "do".

      AUX[num=1, fin=+, tp=-past, tense=past] -> "did".
      AUX[num=1, fin=+, tp=+past, tense=pres] -> "did".

      AUX[num=1, fin=+, tp=-past, tense=fut] -> "will".
      AUX[num=1, fin=+, tp=+past, tense=fut] -> "would".

      RPRO[num=[sing, plur], gen=[male, fem]] -> "who".
      RPRO[num=[sing, plur], gen=-hum] -> "which".

      BE[num=sing, fin=+, tp=-past, tense=pres] -> "is".
      BE[num=plur, fin=+, tp=-past, tense=pres] -> "are".

      BE[num=sing, fin=+, tp=-past, tense=past] -> "was".
      BE[num=plur, fin=+, tp=-past, tense=past] -> "were".

      BE[num=sing, fin=+, tp=+past, tense=pres] -> "was".
      BE[num=plur, fin=+, tp=+past, tense=pres] -> "were".

      BE[fin=-] -> "be".
      BE[fin=part] -> "been".

      HAVE[fin=-1] -> "have".

      HAVE[num=sing, fin=+, tp=-past, tense=pres] -> "has".
      HAVE[num=plur, fin=+, tp=-past, tense=pres] -> "have".

      HAVE[num=1, fin=+, tp=-past, tense=past] -> "had".
      HAVE[num=1, fin=+, tp=+past, tense=[pres, past]] -> "had".

      ADJ -> "happy".
      ADJ -> "unhappy".
      ADJ -> "foolish".

      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "like".
      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "beat".
      VERB[trans=1, stat=-, pres=+s, past=+ed] -> "listen".
      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "own".

      VERB[trans=1, stat=-, pres=+s, past=+ed] -> "listen".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "walk".
      VERB[trans=-, stat=-, pres=+s] -> "leave".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "sleep".
      VERB[trans=-, stat=-, pres=+s] -> "come".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "stink".

      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "kiss".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "box".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "watch".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "crash".

      VERB[trans=+, stat=-, pres=+s, past=+d] -> "seize".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "tie".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "free".
      VERB[trans=1, stat=-, pres=+s, past=+d] -> "love".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "ski".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "echo".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "play".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "decay".
      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "enjoy".

      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "cr".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "appl".
      VERB[trans=+, stat=-, pres=+ies, past=+ied] -> "cop".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "repl".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "tr".

      VERB[trans=-, stat=-, pres=+s, past=+led] -> "compel".
      VERB[trans=-, stat=-, pres=+s, past=+red] -> "defer".

      V[num=1, fin=-, stat=-, trans=2] -> 
          VERB[trans=2, stat=-].

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+s] "s".

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+es] "es".

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+ies] "ies".

      V[num=plur, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1].

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
          -> VERB[trans=3, stat=2, past=+ed] "ed".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+d] "d".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+ied] "ied".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+led] "led".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+red] "red".
`);

class Parser {
 constructor (start){
  this.parser = new Nearley(DRTGrammar, start);
 }

 feed(code) {
  return this.parser.feed(code);
 }
}

function clear(root) {
 if (!root) {
  return;
 }
 delete root.types;
 for (let child of root.children || []) {
  clear(child);
 }
 return root;
}

let node = (type, ...children) => { 
 return {"@type": type, "children": children} 
};

let Statement = (...children) => node("Statement", ...children);
let Question = (...children) => node("Question", ...children);

let S = (...children) => node("S", ...children);
let NP = (...children) => node("NP", ...children);
let PN = (...children) => node("PN", ...children);
let VP_ = (...children) => node("VP_", ...children);
let VP = (...children) => node("VP", ...children);
let V = (...children) => node("V", ...children);
let AUX = (...children) => node("AUX", ...children);
let PRO = (...children) => node("PRO", ...children);
let DET = (...children) => node("DET", ...children);
let N = (...children) => node("N", ...children);
let RC = (...children) => node("RC", ...children);
let RPRO = (...children) => node("RPRO", ...children);
let GAP = (...children) => node("GAP", ...children);
let BE = (...children) => node("BE", ...children);
let ADJ = (...children) => node("ADJ", ...children);
let PREP = (...children) => node("PREP", ...children);
let PP = (...children) => node("PP", ...children);
let VERB = (...children) => node("VERB", ...children);
let HAVE = (...children) => node("HAVE", ...children);
let RN = (...children) => node("RN", ...children);

function parse(s, start, raw = false) {
 let parser = new Parser(start);
 let results = parser.feed(s);
 if (start) {
  return raw ? results[0] : clear(results[0]);
 }
 return clear(results[0]).children[0].children[0];
}

describe("Statements", function() {

  it("Jones likes Mary", function() {
    assertThat(parse("Jones likes Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(PN("Mary"))))));
   });

  it.skip("Jones like Mary", function() {
    let parser = DRTParser.from();
    try {
     parser.feed("Jones like Mary.");
     throw new Error("expected error");
    } catch (error) {
     // We only realize there is an error when we
     // see the ".", because it commits to the end
     // of the sentence and we don't have any option
     // that works. That's unfortunate, because
     // the number disagreement between the verb and
     // the subject could've been caught earlier :(
     assertThat(error.token).equalsTo(".");
    }
   });

  it("Jones likes him.", function() {
    assertThat(parse("Jones likes him."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("She likes him.", function() {
    assertThat(parse("She likes him."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("She likes her.", function() {
    assertThat(parse("She likes her."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("her"))))));
   });

  it("He likes it.", function() {
    assertThat(parse("He likes it."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
   });

  it("They like it.", function() {
    assertThat(parse("They like it."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("like")), NP(PRO("it"))))));
   });

  it("She likes them.", function() {
    assertThat(parse("She likes them."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("them"))))));
   });

  it("Jones does not love Mary", function() {
    assertThat(parse("Jones does not love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PN("Mary"))))));
   });

  it("He does not love her", function() {
    assertThat(parse("He does not love her."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
   });

  it("They do not love her", function() {
    assertThat(parse("They do not love her."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("It does not love them", function() {
    assertThat(parse("It does not love them."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("them"))))));
  });

  it("He likes a book.", function() {
    assertThat(parse("He likes a book."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("a"), N("book"))))));
   });

  it("He likes every book.", function() {
    assertThat(parse("He likes every book."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("every"), N("book"))))));
   });

  it("Every man likes him.", function() {
    assertThat(parse("Every man likes him."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("A woman likes him.", function() {
    assertThat(parse("A woman likes him."))
     .equalsTo(S(NP(DET("A"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("The woman likes him.", function() {
    assertThat(parse("The woman likes him."))
     .equalsTo(S(NP(DET("The"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("Jones and Mary like him.", function() {
    assertThat(parse("Jones and Mary like him."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(PRO("him"))))));
  });

  it("He likes Jones and Mary.", function() {
    assertThat(parse("He likes Jones and Mary."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(NP(PN("Jones")), 
                           "and", 
                           NP(PN("Mary")))))));
  });

  it("Jones likes a book which Mary likes.", function() {
    assertThat(parse("Jones likes a book which Mary likes."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"),
                                S(NP(PN("Mary")), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(GAP()))))
                                )))
                        ))));
   });

  it("Jones likes a woman which likes Mary.", function() {
    assertThat(parse("Jones likes a book which likes Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"),
                                S(NP(GAP()), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(PN("Mary")))))
                                )))
                        ))));
   });

  it("Every man who likes Brazil likes a woman which likes Jones.", function() {
    assertThat(parse("Every man who likes Brazil likes a woman who likes Jones."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), 
                      RC(RPRO("who"),
                         S(NP(GAP()),
                           VP_(VP(V(VERB("like"), "s"), NP(PN("Brazil")))))
                         ))),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("woman"), 
                             RC(RPRO("who"),
                                S(NP(GAP()), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(PN("Jones")))))
                                )))
                        ))));
   });

   it("Jones is happy.", function() {
    assertThat(parse("Jones is happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

   it("They are happy.", function() {
    assertThat(parse("They are happy."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(BE("are"), ADJ("happy")))));
   });

  it("Jones likes a woman who is happy.", function() {
    assertThat(parse("Jones likes a woman who is happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("woman"), 
                             RC(RPRO("who"),
                                S(NP(GAP()), 
                                  VP_(VP(BE("is"), ADJ("happy"))))
                                )))
                        ))));
   });

  it("Jones is a man.", function() {
    assertThat(parse("Jones is a man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), 
                        NP(DET("a"), N("man"))))));
  });

  it("Jones is not a woman.", function() {
    assertThat(parse("Jones is not a woman."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"),
                        "not",
                        NP(DET("a"), N("woman"))))));
  });

  it("If Mary is happy then Jones is happy.", function() {
    assertThat(parse("If Mary is happy then Jones is happy."))
     .equalsTo(S("If",
                 S(NP(PN("Mary")), VP_(VP(BE("is"), ADJ("happy")))),
                 "then",
                 S(NP(PN("Jones")), VP_(VP(BE("is"), ADJ("happy")))),
                 ));
  });

  it("Jones and Mary like a book.", function() {
    assertThat(parse("Jones and Mary like a book."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(DET("a"), N("book"))))));
  });

  it("Jones likes Mary and Brazil.", function() {
    assertThat(parse("Jones likes Mary and Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                     NP(NP(PN("Mary")), "and", NP(PN("Brazil")))
                        ))));
  });

  it("Jones likes Brazil and he likes Mary.", function() {
    assertThat(parse("Jones likes Brazil and he likes Mary."))
     .equalsTo(S(S(NP(PN("Jones")),
                   VP_(VP(V(VERB("like"), "s"), NP(PN("Brazil"))))),
                 "and",
                 S(NP(PRO("he")),
                   VP_(VP(V(VERB("like"), "s"), NP(PN("Mary"))))),
                 ));
  });

  it("Jones likes himself", function() {
    assertThat(parse("Jones likes himself."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(PRO("himself"))))));
  });

  it("Jones's book is foolish", function() {
    assertThat(parse("Jones's book is foolish."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("book")),
                 VP_(VP(BE("is"), ADJ("foolish")))));
  });

  it("Mary likes Jones's book", function() {
    assertThat(parse("Mary likes Jones's book."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET(NP(PN("Jones")), "'s"), N("book"))))));
  });

  it("Jones likes a book about Brazil", function() {
    assertThat(parse("Jones likes a book about Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("book"), 
                             PP(PREP("about"), NP(PN("Brazil"))))
                           )))));
  });

  it("Jones likes a book from Brazil", function() {
    assertThat(parse("Jones likes a book from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("book"), 
                             PP(PREP("from"), NP(PN("Brazil"))))
                           )))));
  });

  it("Jones likes a girl with a telescope.", function() {
    assertThat(parse("Jones likes a girl with a telescope."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("girl"), 
                             PP(PREP("with"), NP(DET("a"), N("telescope"))))
                           )))));
  });

  it("Jones is from Brazil.", function() {
    assertThat(parse("Jones is from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), 
                        PP(PREP("from"), NP(PN("Brazil")))))));
  });

  it("Jones is not from Brazil.", function() {
    assertThat(parse("Jones is not from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), "not",
                        PP(PREP("from"), NP(PN("Brazil")))))));
  });

  it("Jones likes a girl who is from Brazil.", function() {
    assertThat(parse("Jones likes a girl who is from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("girl"), 
                             RC(RPRO("who"),
                                S(NP(GAP()),
                                  VP_(VP(BE("is"), 
                                         PP(PREP("from"), NP(PN("Brazil"))))))
                                ))
                           )))
                 ));
  });

  it("Jones's sister is Mary", function() {
    assertThat(parse("Jones's sister is Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("sister")),
                 VP_(VP(BE("is"), NP(PN("Mary"))))));
  });

  it("Jones's sister is not Mary", function() {
    assertThat(parse("Jones's sister is not Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("sister")),
                 VP_(VP(BE("is"), "not", NP(PN("Mary"))))));
  });

  it("Jones walks.", function() {
    assertThat(parse("Jones walks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "s")))));
  });

  it("They walk.", function() {
    assertThat(parse("They walk."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("walk"))))));
   });

  it("Jones walked.", function() {
    assertThat(parse("Jones walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "ed")))));
   });

  it("Jones will walk.", function() {
    assertThat(parse("Jones will walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("walk"))))));
  });

  it("Jones would walk.", function() {
    assertThat(parse("Jones would walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("would"), VP(V(VERB("walk"))))));
  });

  it("Jones does not walk.", function() {
    assertThat(parse("Jones does not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones did not walk.", function() {
    assertThat(parse("Jones did not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("did"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones would not walk.", function() {
    assertThat(parse("Jones would not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("would"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones will not walk.", function() {
    assertThat(parse("Jones will not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones was happy.", function() {
   assertThat(parse("Jones was happy."))
    .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("was"), ADJ("happy")))));
  });

  it("They were happy.", function() {
   assertThat(parse("They were happy."))
    .equalsTo(S(NP(PRO("They")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("Jones loves Mary.", function() {
    assertThat(parse("Jones loves Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(PN("Mary"))))));
  });

  it("Jones will love Mary.", function() {
    assertThat(parse("Jones will love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), 
                     VP(V(VERB("love")),
                        NP(PN("Mary"))))));
  });

  it("Jones will not love Mary.", function() {
    assertThat(parse("Jones will not love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not",
                     VP(V(VERB("love")),
                        NP(PN("Mary"))))));
  });

  it("Jones kissed Mary.", function() {
    assertThat(parse("Jones kissed Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("They kissed Mary.", function() {
    assertThat(parse("They kissed Mary."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("Jones has walked.", function() {
    assertThat(parse("Jones has walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("has"), VP(V(VERB("walk"), "ed"))))));
  });

  it("Jones had walked.", function() {
    assertThat(parse("Jones had walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("They have walked.", function() {
    assertThat(parse("They have walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("They had walked.", function() {
    assertThat(parse("They had walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("Jones has not walked.", function() {
    assertThat(parse("Jones has not walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("has"), "not", VP(V(VERB("walk"), "ed"))))));
  });

  it("They have not walked.", function() {
    assertThat(parse("They have not walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), "not", VP(V(VERB("walk"), "ed"))))));
  });
});

describe("Questions", function() {
  it("Who walks?", function() {
    assertThat(parse("Who walks?", "Question"))
     .equalsTo(Question("Who", VP_(VP(V(VERB("walk"), "s"))), "?"));
  });

  it("Who likes Mary?", function() {
    assertThat(parse("Who likes Mary?", "Question"))
     .equalsTo(Question("Who", VP_(VP(V(VERB("like"), "s"),
                                      NP(PN("Mary")))), "?"));
  });

  it("Who does not love Mary?", function() {
    assertThat(parse("Who does not love Mary?", "Question"))
     .equalsTo(Question("Who", VP_(AUX("does"), 
                                   "not", 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });

  it("Who will walk?", function() {
    assertThat(parse("Who will walk?", "Question"))
     .equalsTo(Question("Who", VP_(AUX("will"), 
                                   VP(V(VERB("walk")))), "?"));
  });

  it("Who will love Mary?", function() {
    assertThat(parse("Who will love Mary?", "Question"))
     .equalsTo(Question("Who", VP_(AUX("will"), 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });
});

describe("DRT Verbs", function() {
  it("Verbs", function() {
    // https://parentingpatch.com/third-person-singular-simple-present-verbs/
    // https://www.lawlessenglish.com/learn-english/grammar/simple-past-regular-verbs/

    // Third person plural for regular verbs
    assertThat(parse("walk", "V")).equalsTo(V(VERB("walk")));

    // Third person for regular verbs
    assertThat(parse("listens", "V")).equalsTo(V(VERB("listen"), "s"));
    assertThat(parse("walks", "V")).equalsTo(V(VERB("walk"), "s"));

    // Third person present for verbs ending in s, x, ch, sh
    assertThat(parse("kisses", "V")).equalsTo(V(VERB("kiss"), "es"));
    assertThat(parse("boxes", "V")).equalsTo(V(VERB("box"), "es"));
    assertThat(parse("watches", "V")).equalsTo(V(VERB("watch"), "es"));
    assertThat(parse("crashes", "V")).equalsTo(V(VERB("crash"), "es"));

    // Third person present for verbs ending in e
    assertThat(parse("frees", "V")).equalsTo(V(VERB("free"), "s"));    
    assertThat(parse("ties", "V")).equalsTo(V(VERB("tie"), "s"));    
    assertThat(parse("loves", "V")).equalsTo(V(VERB("love"), "s"));

    // Third person present ending in vow + y
    assertThat(parse("plays", "V")).equalsTo(V(VERB("play"), "s"));

    // Third person present ending in consonant + y
    assertThat(parse("applies", "V")).equalsTo(V(VERB("appl"), "ies"));
    assertThat(parse("copies", "V")).equalsTo(V(VERB("cop"), "ies"));
    assertThat(parse("replies", "V")).equalsTo(V(VERB("repl"), "ies"));
    assertThat(parse("tries", "V")).equalsTo(V(VERB("tr"), "ies"));

    // Third person for verbs where the final syllable is stressed
    assertThat(parse("compels", "V")).equalsTo(V(VERB("compel"), "s"));    
    assertThat(parse("defers", "V")).equalsTo(V(VERB("defer"), "s"));

    // Third person past for verbs ending in s, x, ch, sh
    assertThat(parse("kissed", "V")).equalsTo(V(VERB("kiss"), "ed"));

    // Past tense for regular verbs
    assertThat(parse("listened", "V")).equalsTo(V(VERB("listen"), "ed"));
    assertThat(parse("walked", "V")).equalsTo(V(VERB("walk"), "ed"));

    // Past tense for verbs ending in s, x, ch, sh
    assertThat(parse("kissed", "V")).equalsTo(V(VERB("kiss"), "ed"));
    assertThat(parse("boxed", "V")).equalsTo(V(VERB("box"), "ed"));
    assertThat(parse("watched", "V")).equalsTo(V(VERB("watch"), "ed"));
    assertThat(parse("crashed", "V")).equalsTo(V(VERB("crash"), "ed"));

    // Past tense for verbs ending in e
    assertThat(parse("freed", "V")).equalsTo(V(VERB("free"), "d"));
    assertThat(parse("tied", "V")).equalsTo(V(VERB("tie"), "d"));
    assertThat(parse("loved", "V")).equalsTo(V(VERB("love"), "d"));

    // Past tense for verbs ending in i, o
    assertThat(parse("skied", "V")).equalsTo(V(VERB("ski"), "ed"));    
    assertThat(parse("echoed", "V")).equalsTo(V(VERB("echo"), "ed"));    

    // Past tense for verbs ending in consonant + y
    assertThat(parse("applied", "V")).equalsTo(V(VERB("appl"), "ied"));
    assertThat(parse("tried", "V")).equalsTo(V(VERB("tr"), "ied"));

    // Past tense for verbs ending in vowel + y
    assertThat(parse("played", "V")).equalsTo(V(VERB("play"), "ed"));    
    assertThat(parse("enjoyed", "V")).equalsTo(V(VERB("enjoy"), "ed"));    

    // Past tense for verbs where the final syllable is stressed
    assertThat(parse("compelled", "V")).equalsTo(V(VERB("compel"), "led"));    
    assertThat(parse("deferred", "V")).equalsTo(V(VERB("defer"), "red"));
  });
});

describe("Backwards compatibility", function() {
  it("He likes it.", function() {
    assertThat(parse("He likes it."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
  });


  it("Jones loves.", function() {
    assertThat(parse("Jones loves."))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s")))));
  });

  it("He likes her.", function() {
    assertThat(parse("He likes her."))
     .equalsTo(S(NP(PRO("He")), 
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(PRO("her"))))));
  });

  it("Jones stinks.", function() {
    assertThat(parse("Jones stinks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("A man loves.", function() {
    assertThat(parse("A man loves."))
     .equalsTo(S(NP(DET("A"), N("man")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("Every donkey stinks.", function() {
    assertThat(parse("Every book stinks."))
     .equalsTo(S(NP(DET("Every"), N("book")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("The woman loves.", function() {
    assertThat(parse("The woman loves."))
     .equalsTo(S(NP(DET("The"), N("woman")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("He loves.", function() {
    assertThat(parse("He loves."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("She loves", function() {
    assertThat(parse("She loves."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("It stinks.", function() {
    assertThat(parse("It stinks."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("It does not stink.", function() {
    assertThat(parse("It does not stink."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("The book does not stink.", function() {
    assertThat(parse("The book does not stink."))
     .equalsTo(S(NP(DET("The"), N("book")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("He loves her.", function() {
    assertThat(parse("He loves her."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("She loves the book.", function() {
    assertThat(parse("She loves the book."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("love"), "s"), NP(DET("the"), N("book"))))));
  });

  it("Every man loves her.", function() {
    assertThat(parse("Every man loves her."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("Every man loves Jones.", function() {
    assertThat(parse("Every man loves Jones."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Jones"))))));
  });

  it("She does not love.", function() {
    assertThat(parse("She does not love."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(AUX("does"), "not", VP(V(VERB("love"))))));
  });

  it("She does not love him.", function() {
    assertThat(parse("She does not love him."))
     .equalsTo(S(NP(PRO("She")),
                  VP_(AUX("does"), "not", 
                      VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("Jones does not like the book.", function() {
    assertThat(parse("Jones does not like the book."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), "not", 
                     VP(V(VERB("like")), NP(DET("the"), N("book"))))));
  });

  it("They love him.", function() {
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(parse("They love him."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("They do not love him.", function() {
    assertThat(parse("They do not love him."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), "not", VP(V(VERB("love")), NP(PRO("him"))))
                 ));
  });

  it("They do not love the book", function() {
    assertThat(parse("They do not love the book."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), "not", 
                     VP(V(VERB("love")), NP(DET("the"), N("book"))))
                 ));
  });

  it("He and she love her.", function() {
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(parse("He and she love her."))
     .equalsTo(S(NP(NP(PRO("He")), "and", NP(PRO("she"))),
                 VP_(VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("They love him and her.", function() {
    assertThat(parse("They love him and her."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("love")), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
  });

  it("Every man loves a book and a woman.", function() {
    assertThat(parse("Every man loves a book and a woman."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), 
                        NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
  });

  it("Brazil loves her.", function() {
    assertThat(parse("Brazil loves her."))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("Brazil loves Mary.", function() {
    assertThat(parse("Brazil loves Mary."))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
  });

  it.skip("every man loves Italy and Brazil", function() {
    assertThat(parse("Every man loves Italy and Brazil."))
     .equalsTo(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), 
                           NP(NP(PN("Italy")), "and", NP(PN("Brazil")))
                           ))));
  });

  it("Mary loves a man who loves her.", function() {
    assertThat(parse("Mary loves a man who loves her."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(DET("a"), 
                           N(N("man"), 
                             RC(RPRO("who"), 
                                S(NP(GAP()), VP_(VP(V(VERB("love"), "s"), 
                                                    NP(PRO("her")))))
                                )))))));
  });

  it("Mary loves a book which surprises her", function() {
    assertThat(parse("Mary loves a book which likes her."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"), 
                                S(NP(GAP()), VP_(VP(V(VERB("like"), "s"), NP(PRO("her")))))
                                )))))));
  });

  it.skip("Every book which she loves surprises him.", function() {
    assertThat(parse("Every book which she loves surprises him."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V("loves"), NP(GAP()))))
                                    ))),
                 VP_(VP(V("surprises"), NP(PRO("him")))
                     )));

  });

  it("Every man who knows her loves her.", function() {
    assertThat(parse("Every man who loves her likes him."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V(VERB("love"), "s"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))
                 ));
   });

  it("A man who does not love her watches him.", function() {
    assertThat(parse("A man who does not love her watches him."))
     .equalsTo(S(NP(DET("A"),
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(AUX("does"), "not", VP(V(VERB("love")), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("watch"), "es"), NP(PRO("him"))))
                 ));

  });

  it("He is happy.", function() {
    assertThat(parse("He is happy."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

  it("He is not happy.", function() {
    assertThat(parse("He is not happy."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), "not", ADJ("happy")))));
   });

  it("A book does not stink.", function() {
    assertThat(parse("A man does not stink."))
     .equalsTo(S(NP(DET("A"), N("man")),
                 VP_(AUX("does"), "not", 
                     VP(V(VERB("stink"))))));
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat(parse("Jones loves a woman who does not love him."))
   .equalsTo(S(NP(PN("Jones")),
               VP_(VP(V(VERB("love"), "s"),
                      NP(DET("a"), 
                         N(N("woman"), 
                           RC(RPRO("who"), 
                              S(NP(GAP()), 
                                VP_(AUX("does"), "not", 
                                    VP(V(VERB("love")), NP(PRO("him"))))
                                ))
                           ))))
               ));
   });

  it("If Jones owns a book then he likes it.", function() {
    assertThat(parse("If Jones loves a book then he likes it."))
     .equalsTo(S("If", 
                 S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s"), NP(DET("a"), N("book"))))), 
                 "then", 
                 S(NP(PRO("he")), VP_(VP(V(VERB("like"), "s"), NP(PRO("it")))))));
  });

  it("Every man who loves a book likes it.", function() {
    assertThat(parse("Every man who loves a book likes it."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), 
                      RC(RPRO("who"), 
                         S(NP(GAP()), 
                           VP_(VP(V(VERB("love"), "s"), 
                                  NP(DET("a"), N("book")))))))), 
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
   });

  it.skip("Jones loves her or Mary loves her.", function() {
    assertThat(parse("Jones loves her or Mary loves her."))
     .equalsTo(S(S(NP(PN("Jones")), VP_(VP(V("loves"), NP(PRO("her"))))), 
                 "or", 
                 S(NP(PN("Smith")), VP_(VP(V("loves"), NP(PRO("her")))))));
   });

  it.skip("Mary loves Jones or likes Smith.", function() {
    assertThat(parse("Mary loves Jones or likes Brazil."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP_(VP(VP(V("loves"), NP(PN("Jones"))), 
                        "or", 
                        VP(V("likes"), NP(PN("Smith")))))));
   });

  it.skip("Jones or Smith loves her.", function() {
    assertThat(parse("Jones or Smith loves her."))
     .equalsTo(S(NP(NP(PN("Jones")), "or", NP(PN("Smith"))),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it.skip("Jones likes and loves a porsche.", function() {
    assertThat(parse("Jones likes and loves a porsche."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("owns"), "and", V("loves")), NP(DET("a"), N("porsche"))))));
  });

  it("Jones likes.", function() {
    try {
     assertThat(parse("Jones likes."));
     // This should be an error as opposed to undefined.
    } catch (e) {
    }
  });

  it.skip("Jones likes and loves Mary.", function() {
    assertThat(parse("Jones likes and loves Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("likes"), "and", V("loves")), NP(PN("Mary"))))));
  });

  it.skip("Mary likes Smith and she loves him.", function() {
    assertThat(first(parse("Mary likes Smith and she loves him.")))
     .equalsTo(S(S(NP(PN("Mary")), VP_(VP(V("likes"), NP(PN("Smith"))))), 
                 "and", 
                 S(NP(PRO("she")), VP_(VP(V("loves"), NP(PRO("him")))))));
  });

  it("Jones is happy.", function() {
    assertThat(parse("Jones is happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it.skip("Jones's wife is happy.", function() {
    assertThat(parse("Jones's wife is happy."))
     .equalsTo(S(NP(DET(PN("Jones"), "'s"), RN("wife")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it.skip("Jones's wife likes and loves Mary.", function() {
    assertThat(first(parse("Jones's wife likes and loves Mary.")))
     .equalsTo(S(NP(DET(PN("Jones"), "'s"), RN("wife")),
                 VP_(VP(V(V("likes"), "and", V("loves")), NP(PN("Mary"))))));
  });

  it.skip("Sam and Dani love Anna and Leo.", function() {
    assertThat(first(parse("Sam and Dani love Anna and Leo.")))
     .equalsTo(S(NP(NP(PN("Sam")), 
                    "and", 
                    NP(PN("Dani"))),
                 VP_(VP(V("love"), 
                        NP(NP(PN("Anna")), 
                           "and", 
                           NP(PN("Leo")))))));
  });

  it.skip("Jones's wife and Smith's brother like and love Mary.", function() {
    assertThat(first(parse("Jones's wife and Smith's brother like and love Mary.")))
     .equalsTo(S(NP(NP(DET(PN("Jones"), "'s"), RN("wife")), 
                    "and", 
                    NP(DET(PN("Smith"), "'s"), RN("brother"))),
                 VP_(VP(V(V("like"), "and", V("love")), NP(PN("Mary"))))));
  });

  it.skip("Jones owns an unhappy donkey.", function() {
    assertThat(parse("Jones owns an unhappy donkey."))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V("owns"), NP(DET("an"), N(ADJ("unhappy"), N("donkey")))))));
  });

  it("Jones likes a woman with a donkey.", function() {
    assertThat(parse("Jones likes a woman with a donkey."))
     .equalsTo(S(NP(PN("Jones")), 
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), N(N("woman"), 
                                       PP(PREP("with"), NP(DET("a"), N("donkey"))
                                          )))))));
  });

  it("Jones is a man.", function() {
    assertThat(parse("Jones is a man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N("man"))))));
  });

  it("Who likes Mary?", function() {
    assertThat(parse("Who likes Mary?", "Question"))
     .equalsTo(Question("Who", 
                        VP_(VP(V(VERB("like"), "s"), NP(PN("Mary")))), 
                        "?"));
  });

  it("Who is happy?", function() {
    assertThat(parse("Who is happy?", "Question"))
     .equalsTo(Question("Who", 
                        VP_(VP(BE("is"), ADJ("happy"))), 
                        "?"));
  });

  it.skip("Who does Mary like?", function() {
    assertThat(clean(parse("Who does Mary like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(PN("Mary")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it.skip("Who does the man like?", function() {
    assertThat(clean(parse("Who does the man like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET("the"), N("man")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it.skip("Who does Smith's brother like?", function() {
    assertThat(clean(parse("Who does Smith's brother like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET(PN("Smith"), "'s"), RN("brother")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it.skip("Is Mary happy?", function() {
    assertThat(clean(parse("Is Mary happy?")))
     .equalsTo(Sentence("Is", 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it.skip("Sam's wife is Dani.", function() {
    assertThat(first(parse("Sam's wife is Dani.")))
     .equalsTo(S(NP(DET(PN("Sam"), "'s"), RN("wife")),
                 VP_(VP(BE("is"), NP(PN("Dani"))))));
  });

  it.skip("Sam's wife was Dani.", function() {
    assertThat(first(parse("Sam's wife was Dani.")))
     .equalsTo(S(NP(DET(PN("Sam"), "'s"), RN("wife")),
                 VP_(VP(BE("was"), NP(PN("Dani"))))));
  });

  it.skip("John is a happy man", function() {
    assertThat(parse("Jones is a happy man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N(ADJ("happy"), N("man")))))));
  });

  it("Mary loves Jones and Smith.", function() {
    assertThat(parse("Mary loves Jones and Smith."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"), 
                        NP(NP(PN("Jones")), "and", NP(PN("Smith")))
                        ))));
  });

  it("John is from Brazil", function() {
    assertThat(parse("Jones is from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it.skip("Every brazilian is from Brazil", function() {
    assertThat(parse("Every brazilian is from Brazil."))
     .equalsTo(S(NP(DET("Every"), N("brazilian")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it.skip("If A is B's parent then B is A's child.", function() {
    assertThat(first(parse("If A is B's parent then B is A's child.")))
     .equalsTo(S("If", 
                 S(NP(PN("A")), VP_(VP(BE("is"), NP(DET(PN("B"), "'s"), RN("parent"))))), 
                 "then", 
                 S(NP(PN("B")), VP_(VP(BE("is"), NP(DET(PN("A"), "'s"), RN("child"))))), 
                 ));
  });

  it("He loves it.", function() {
    assertThat(parse("He loves it."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("it"))))));
  });

  it("Jones loves himself.", function() {
    assertThat(parse("Jones loves himself."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("himself"))))));
  });

  it.skip("John is happy with Mary.", function() {
    // TODO(goto): this probably involves second order logic?
    assertThat(first(parse("John is happy with Mary.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("loves"), NP(PRO("himself"))))));
  });

  it("Jones walks.", function() {
    // non-stative verbs
    assertThat(parse("Jones walks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "s")))));
  });

  it("Jones likes a porsche.", function() {
    // non-stative verbs
    assertThat(parse("Jones likes a porsche."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), N("porsche"))
                        ))));
  });

  it("Jones walked.", function() {
    // past tense
    assertThat(parse("Jones walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "ed")))));
  });

  it("Jones kissed Mary.", function() {
    // past tense
    assertThat(parse("Jones kissed Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("Jones will walk.", function() {
    // future tense
    assertThat(parse("Jones will walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("walk"))))));
  });

  it("Jones will kiss Mary.", function() {
    // future tense
    assertThat(parse("Jones will kiss Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("kiss")), NP(PN("Mary"))))));
  });

  it("Jones will not kiss Mary.", function() {
    // future tense
    assertThat(parse("Jones will not kiss Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not", VP(V(VERB("kiss")), 
                                            NP(PN("Mary"))))));
  });

  it("Jones did not walk.", function() {
    // past tense
    assertThat(parse("Jones did not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("did"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones was happy.", function() {
    assertThat(parse("Jones was happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("was"), ADJ("happy")))));
  });

  it("They were happy.", function() {
    assertThat(parse("They were happy."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("She has walked.", function() {
    assertThat(parse("She has walked."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("has"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She has kissed him.", function() {
    assertThat(parse("She has kissed him."))
     .equalsTo(S(NP(PRO("She")), 
                 VP_(VP(HAVE("has"), VP(V(VERB("kiss"), "ed"), 
                                        NP(PRO("him")))))));
  });

  it("They have walked.", function() {
    assertThat(parse("They have walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She had walked.", function() {
    assertThat(parse("She had walked."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("They had walked.", function() {
    assertThat(parse("They had walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She had kissed him.", function() {
    assertThat(parse("She had kissed him."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("had"), VP(V(VERB("kiss"), "ed"), NP(PRO("him")))))));
  });

  it("Jones skied.", function() {
    // past tense of verbs ending in "a, i, o, u".
    assertThat(parse("Jones skied."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("ski"), "ed")))));
  });

  it("Jones skis.", function() {
    // third person present conjugation of verbs ending in "a, i, o, u".
    // https://conjugator.reverso.net/conjugation-english-verb-ski.html
    assertThat(parse("Jones skis."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("ski"), "s")))));
  });

  it("They ski.", function() {
    // third person plural present conjugation of verbs ending in "a, i, o, u".
    // https://conjugator.reverso.net/conjugation-english-verb-ski.html
    assertThat(parse("They ski."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("ski"))))));
  });

  it("She played.", function() {
    assertThat(parse("She played."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("play"), "ed")))));
  });

  it("Mary kissed Jones.", function() {
    assertThat(parse("Mary kissed Jones."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Jones"))))));
  });

  it.skip("Mary knows Jones.", function() {
    assertThat(parse("Mary knows Jones."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("knows"),
                        NP(PN("Jones"))))));
  });

  it.skip("Mary has loved Anna.", function() {
    // statitive verbs ending in "e" need to eat the "e" in
    // the "ed" expansion.
    // also, statitive verbs that are intransitive don't 
    // seem to expand either.
    assertThat(first(parse("Mary has loved Anna.")))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("knows"),
                        NP(PN("Jones"))))));
  });

  it("Mary was an engineer.", function() {
    assertThat(parse("Mary was an engineer."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(BE("was"),
                        NP(DET("an"), N("engineer"))))));
  });

  it("Mary was not an engineer.", function() {
    assertThat(parse("Mary was not an engineer."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(BE("was"), "not",
                        NP(DET("an"), N("engineer"))))));
  });

});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
