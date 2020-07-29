const Assert = require("assert");
const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");

describe("Nearley", function() {

  function parse(source) {
    const parser = new nearley.Parser(grammar);
    parser.feed(source);
    const ast = parser.results[0];
    const info = compile(ast, {});
    // Generate JavaScript code from the rules
    const code = generate(info, "grammar");
    // console.log(code);
    // Pretend this is a CommonJS environment to catch exports from the grammar.
    const module = { exports: {} };
    eval(code);

    // console.log(module.exports);
    return module.exports;
  }

  function create(source, start) {
   let {ParserRules, ParserStart} = parse(source);
   let rule = start ? start : ParserStart;
   // console.log(grammar.ParserStart);
    
   //console.log(grammar);

   const parser = new nearley.Parser(ParserRules, rule, {
     keepHistory: true
    });

   //const parser = new nearley.Parser(
   //    nearley.Grammar.fromCompiled(grammar, start),
   //    {keepHistory: true});
   
   //parser.reportError = function(token) {
   // var message = this.lexer.formatError(token, "Invalid syntax") + "\n";
   // message += "Unexpected " + (token.type ? token.type + " token: " : "");
   // message +=
   // JSON.stringify(token.value !== undefined ? token.value : token) + "\n";
   // return JSON.stringify({message: message, token: token});
   //};
   
   return parser;
  }

  it("basic", function() {
    let parser = create(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    parser.feed("foo");
    assertThat(parser.results).equalsTo([[[[["foo"]]]]]);
  });

  it("incomplete", function() {
    let parser = create(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    parser.feed("fo");
    // When there is still a possibility of completing
    // a valid parse, it returns []s.
    assertThat(parser.results).equalsTo([]);
  });


  /*
    Generates a user friendly error report given the caught error 
    object and the Nearley parser instance.
  */
  function reportError(e, parser) {
   // console.log(e.message);
   const lastColumnIndex = parser.table.length - 2;
   const lastColumn = parser.table[lastColumnIndex];
   const token = parser.lexer.buffer[parser.current];
   let result = {token: token, expected: []};
   // result.token = token;
   // Display each state that is expecting a terminal symbol next.
   for (let i = 0; i < lastColumn.states.length; i++) {
    const state = lastColumn.states[i];
    const nextSymbol = state.rule.symbols[state.dot];
    if (nextSymbol && isTerminalSymbol(nextSymbol)) {
     const symbolDisplay = getSymbolDisplay(nextSymbol);
     // console.log(`    A ${symbolDisplay} based on:`);
     let expected = {symbol: symbolDisplay, based: []};
     result.expected.push(expected);
     // Display the "state stack" - which shows you how this state
     // came to be, step by step.
     const stateStack = buildStateStack(lastColumnIndex, i, parser);
     for (let j = 0; j < stateStack.length; j++) {
      const state = stateStack[j];
      expected.based.push(state.rule.toString(state.dot));
     }
    }
   }
   return result;
  }

  function getSymbolDisplay(symbol) {
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
  function buildStateStack(columnIndex, stateIndex, parser) {
   const state = parser.table[columnIndex].states[stateIndex];
   if (state.dot === 0) { // state not started
    // Find the previous state entry in the table that predicted this state
    const match = findPreviousStateWhere(
                                         (thatState) => {
                                          const nextSymbol = thatState.rule.symbols[thatState.dot];
                return nextSymbol && 
                                          isNonTerminalSymbol(nextSymbol) && 
                                          state.rule.name === nextSymbol;
                                         },
                                         columnIndex,
                                         stateIndex,
                                         parser);
    if (match) {
     return [state, ...buildStateStack(match[0], match[1], parser)]
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
                ...buildStateStack(state.reference, match[1], parser)
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
  function findPreviousStateWhere(predicate, columnIndex, stateIndex, parser) {
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

  function isTerminalSymbol(symbol) {
   return typeof symbol !== "string";
  }

  function isNonTerminalSymbol(symbol) {
   return !isTerminalSymbol(symbol);
  }

  it("error", function() {
    let parser = create(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);

    try {
     parser.feed("bah");
     throw new Error("expected error");
    } catch (e) {
     let error = reportError(e, parser);
     //console.log(`Instead of a ${JSON.stringify(error.token)}, I was expecting to see one of the following:`);
     for (let expected of error.expected) {
      //console.log(`    A ${expected.symbol} based on:`);
      for (let based of expected.based) {
       //console.log(`        ${based}`);
      }
     }
     
    }
  });

  it("rules", function() {
    let parser = create(`
      expression -> number "+" number
      expression -> number "-" number
      expression -> number "*" number
      expression -> number "/" number
      number -> [0-9]:+
    `);

    parser.feed("1+1");
    assertThat(parser.results).equalsTo([[[["1"]], "+", [["1"]]]]);
   });

  it("postprocessors", function() {
    let parser = create(`
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

    parser.feed("1+1");
    assertThat(parser.results).equalsTo([{left: 1, op: "+", right: 1}]);
   });

  it("reject", function() {
    let parser = create(`
      # the first rule always rejects
      number -> [0-4]:+ {% (data, location, reject) => reject %}
      number -> [0-9]:+ {% ([number], location, reject) => "hello" %}
    `);

    parser.feed("1");
    assertThat(parser.results).equalsTo(["hello"]);
   });

  it("javascript", function() {
    let parser = create(`
      @{%
        function foo(num) {
         return parseInt(num);
        }
      %}
      number -> [0-9]:+ {% ([number], location, reject) => foo(number) %}
    `);

    parser.feed("1");
    assertThat(parser.results).equalsTo([1]);
   });

  it("builtin", function() {
    let parser = create(`
      @builtin "whitespace.ne"
      expression -> number _ "+" _ number
      number -> [0-9]:+ {% ([number], location, reject) => parseInt(number) %}
    `);

    parser.feed("1 + 1");
    assertThat(parser.results).equalsTo([[1, null, "+", null, 1]]);
   });

  function bind(type, types = {}, expects = []) {
   
   return (data, location, reject) => {
    // Creates a copy of the types because it is reused
    // across multiple calls and we assign values to it.
    let bindings = JSON.parse(JSON.stringify(types));
    let signature = `${type}${JSON.stringify(bindings)} -> `;
    // console.log(data);
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

    // console.log(`Trying ${signature}.`);
    
    // Creates a copy of the input data, because it is
    // reused across multiple calls.
    let result = JSON.parse(JSON.stringify(data))
      .filter((ws) => ws != null);

    let children = result.filter((node) => node["@type"]);

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
       if (variables[value] &&
           variables[value] != child.types[key]) {
        // console.log("Existing and conflicting variables");
        return reject;
       }
       // collects variables
       variables[value] = child.types[key];
      } else if (typeof child.types[key] == "number") {
       child.types[key] = value;
      } else if (child.types[key] && expected.types[key] != child.types[key]) {
       // console.log(`Expected ${key}="${expected.types[key]}", got ${key}="${child.types[key]}"`);
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

  it("whitespace", function() {
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
  
  it("rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    const rejected = "rejected";
    assertThat(post([], "", rejected))
    .equalsTo(rejected);
   });

  it("rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    const rejected = "rejected";
    assertThat(post([null,null], "", rejected))
    .equalsTo(rejected);

   });

  it("rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    const rejected = "rejected";
    assertThat(post([{"@type": "V"},{"@type": "DET"}], "", rejected))
    .equalsTo(rejected);
   });

  it("rejects based on types", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    const rejected = "rejected";
    assertThat(post([{"@type": "V"},{"@type": "DET"}], "", rejected))
     .equalsTo(rejected);
  });

  it("rejects based on types", function() {
    let post = bind("NP", {}, [{"@type": "PN", "types": {"num": "sing"}}]);
    const rejected = "rejected";
    assertThat(post([{"@type": "PN", "types": {"num": "plur"}}], "", rejected))
     .equalsTo(rejected);
  });

  it("rejects based on conflicting bindings", function() {
    let post = bind("VP", {"num": 1}, [{ 
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    const reject = "reject";
    assertThat(post([{
        "@type": "V", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "NP", 
        "types": {"num": "plur"}, 
    }], undefined, reject))
    .equalsTo(reject);
  });

  it("binds", function() {
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

  it("binds keeps free variables", function() {
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

  it("binds tail variable to head", function() {
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

  it("binds to literals", function() {
    let post = bind("PN", {"num": "sing"});

    assertThat(post(["Sam"]))
    .equalsTo({
      "@type": "PN", 
      "types": {"num": "sing"}, 
      "children": ["Sam"]
    });
  });

  it("binds multiple", function() {
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

  it("binds ignoring extras", function() {
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

  it("binds ignoring fewer", function() {
    let post = bind("VP", {}, [{ 
       "@type": "NP",
       "types": {"num": 1, "gend": 2, "case": "-nom", "gap": 3}
    }]);

    assertThat(post([{
      "@type": "NP", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {}, 
      "children": [{
        "@type": "NP", 
        "types": {"num": "sing", "gen": "-hum"},
      }]
    });
  });

  it("Basic DRT", function() {
    let parser = create(`
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

    parser.feed("Sam likes Dani");

    let node = (type, ...children) => { 
     return {"@type": type, "children": children} 
    };

    assertThat(parser.results[0].types).equalsTo({
      "num": "sing"
    });

    function clear(root) {
     delete root.types;
     for (let child of root.children || []) {
      clear(child);
     }
     return root;
    }

    assertThat(clear(parser.results[0]))
     .equalsTo(node("S",
                    node("NP", node("PN", "Sam")),
                    node("VP", 
                         node("V", "likes"), 
                         node("NP", node("PN", "Dani"))))
               );
   });

  function rules() {
    return create(`
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
  }

  it("Nearley features", function() {
    let parser = rules();

    parser.feed(`
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

    assertThat(parser.results).equalsTo([[{
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

  it("Compiler compiler compiler", function() {
    let grammar = rules();

    let source = `
      S[num=1] -> 
          NP[num=1, gen=2, case=+nom] _ VP_[num=1, fin=+].

      S[num=1, gap=np] -> 
          NP[num=1, gen=2, case=+nom, gap=np] _ VP_[num=1, fin=+, gap=-].

      S[num=1, gap=np] ->
          NP[num=1, gen=2, case=+nom, gap=-] _ VP_[num=1, fin=+, gap=np].

      VP_[num=1, fin=+, gap=2] ->
          AUX[num=1, fin=+] _ "not" _ VP[num=3, fin=-, gap=2].

      VP_[num=1, fin=+, gap=2] -> VP[num=1, fin=+, gap=2].

      VP[num=1, fin=2, gap=3] ->
          V[num=1, fin=2, trans=+] _ NP[num=1, gen=4, case=-nom, gap=3].

      VP[num=1, fin=2, gap=3] -> V[num=1, fin=2, trans=-].

      NP[num=1, gen=2, case=3, gap=np] -> null.

      NP[num=1, gen=2, case=3] -> DET[num=1] _ N[num=1, gen=2].

      NP[num=1, gen=2] -> PN[num=1, gen=2].
 
      NP[num=1, gen=2, case = 3] -> PRO[num=1, gen=2, case=3].

      NP[num=plur, gen=1, case=2] -> 
        NP[num=3, gen=4, case=2] _ "and" NP[num=5, gen=6, case=2].

      N[num=1, gen=2] -> N[num=1, gen=2] _ RC[num=1, gen=2].

      RC[num=1, gen=2] -> RPRO[num=1, gen=2] _ S[num=1, gap=np].

      DET[num=sing] -> "a".
      DET[num=sing] -> "every".
      DET[num=sing] -> "the".
      DET[num=sing] -> "some".

      PRO[num=sing, gen=male, case=+nom] -> "he".
      PRO[num=sing, gen=male, case=-nom] -> "him".
      PRO[num=sing, gen=fem, case=-nom] -> "she".
      PRO[num=sing, gen=fem, case=-nom] -> "her".
      PRO[num=sing, gen=-hum, case=[-nom, +nom]] -> "it".
      PRO[num=plur, gen=[male, fem, -hum], case=+nom] -> "they".
      PRO[num=plur, gen=[male, fem, -hum], case=-nom] -> "them".

      PN[num=sing, gen=male] -> "Jones".
      PN[num=sing, gen=fem] -> "Mary".
      PN[num=sing, gen=-hum] -> "Brazil".

      N[num=sing, gen=male] -> "man".
      N[num=sing, gen=fem] -> "woman".
      N[num=sing, gen=-hum] -> "book".

      AUX[num=sing, fin=+] -> "does".
      AUX[num=plur, fin=+] -> "do".

      V[num=[sing, plur], trans=+, fin=-] -> "love".
      V[num=[sing, plur], trans=-, fin=-] -> "rotate".

      V[num=sing, trans=1, fin=+] -> "likes".
      V[num=plur, trans=1, fin=+] -> "like".
 
      RPRO[num=[sing, plur], gen=[male, fem]] -> "who".
      RPRO[num=[sing, plur], gen=-hum] -> "which".
    `;

    grammar.feed(source);
    //grammar.feed(`
    //  NP[num=1, gen=2] -> PN[num=1, gen=2].
    //   VP[num=1, fin=2, gap=3] ->
    //       V[num=1, fin=2, trans=+] _ NP[num=1, gen=4, case=-nom, gap=3].
    //  VP[num=1, fin=2, gap=3] -> V[num=1, fin=2, trans=-].
    //  PN[num=sing, gen=fem] -> "Mary".
    //  V[num=sing, trans=1, fin=+] -> "likes".
    //`);

    let result = [];

    function feed(source) {
     result.push(source);
    }

    feed(`@builtin "whitespace.ne"`);
    feed(``);
    feed(`@{%`);
    feed(`${bind.toString()}`);
    feed(`%}`);
    feed(``);

    for (let {head, tail} of grammar.results[0] || []) {
     let term = (x) => typeof x == "string" ? x : x.name;
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

    let parser = create(result.join("\n"));
    parser.feed("Jones likes Mary");
    // assertThat(parser.results).equalsTo([{}]);
  });

  it("Preliminary DRT", function() {
    let parser = create(`
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

      # Lexical Insertion Rules

      # LI 1
      DET -> "a" {% bind("DET", {"num": "sing"}) %}
      DET -> "every" {% bind("DET", {"num": "sing"}) %}
      DET -> "the" {% bind("DET", {"num": "sing"}) %}
      DET -> "some" {% bind("DET", {"num": "sing"}) %}

      # LI 2
      PRO -> "he" {% 
        bind("PRO", {
          "num": "sing", 
          "gen": "male", 
          "case": "+nom"
        }) %}

      # LI 3
      PRO -> "him" {% 
        bind("PRO", {
          "num": "sing", 
          "gen": "male", 
          "case": "-nom"
        }) %}

      # LI 4
      PRO -> "she" {% 
        bind("PRO", {
          "num": "sing", 
          "gen": "fem", 
          "case": "+nom"
        }) %}

      # LI 5
      PRO -> "her" {% 
        bind("PRO", {
          "num": "sing", 
          "gen": "male", 
          "case": "-nom"
        }) %}

      # LI 6
      PRO -> "it" {% 
        bind("PRO", {
          "num": "sing", 
          "gen": "-hum", 
          "case": ["-nom", "+nom"]
        }) %}
    `);

    parser.feed("Sam likes Dani");

    let node = (type, ...children) => { 
     return {"@type": type, "children": children} 
    };

    assertThat(parser.results[0].types).equalsTo({
      "num": "sing"
    });

    function clear(root) {
     delete root.types;
     for (let child of root.children || []) {
      clear(child);
     }
     return root;
    }

    assertThat(clear(parser.results[0]))
     .equalsTo(node("S",
                    node("NP", node("PN", "Sam")),
                    node("VP", 
                         node("V", "likes"), 
                         node("NP", node("PN", "Dani"))))
               );
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

