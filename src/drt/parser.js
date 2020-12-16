const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");
const {Tokenizer} = require("./lexer.js");

class Nearley {
  constructor(compiled, start) {
    // const {ParserRules, ParserStart} = compiled;  
    // const rule = start ? start : ParserStart;
    if (start) {
      compiled.ParserStart = start;  
    }
    this.parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiled), {
      keepHistory: true
    });   
  }
  
  feed(code) {
    try {
      this.parser.feed(code);
      return this.parser.results;
    } catch (e) {
      console.log(e);
      throw this.reportError(e);
    }
  }
  
  static compile(source, raw = false) {       
    const parser = new nearley.Parser(grammar);
    parser.feed(source);
    const ast = parser.results[0];
    const info = compile(ast, {});
    // Generate JavaScript code from the rules
    const code = generate(info, "grammar");
    
    if (raw) {
      return code;
    }
    
    const module = { exports: {} };
    
    // console.log(code);
    eval(code);
    
    // console.log(module.exports.Lexer);
    
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
    } else if (type === "object" && symbol.type) {
      return symbol.type;
    } else {
      // console.log(symbol);
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

function bind(type, types = {}, conditions = []) {   
  return (data, location, reject) => {
    //console.log("hi");
    // console.log(data);
    // Creates a copy of the types because it is reused
    // across multiple calls and we assign values to it.
    let bindings = JSON.parse(JSON.stringify(types));
    
    // Creates a copy of the input data, because it is
    // reused across multiple calls.
    //console.log(data);
    let result = JSON.parse(JSON.stringify(data || []))
        .filter((ws) => ws != null);
    
    // console.log(data);


    
    // Ignores the null type.
    let expects = conditions.filter((x) => x["@type"] != "null");
    
    let signature = `${type}${JSON.stringify(bindings)} -> `;
    for (let child of expects) {
      signature += `${child["@type"] || JSON.stringify(child)}${JSON.stringify(child.types || {})} `;
    }
    
    let hash = (str) => {
      return str.split("")
        .reduce((prevHash, currVal) =>
                (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }
    
    // console.log(hash(signature));
    let namespace = hash(signature);
    
    // console.log(data);
    // console.log(result);

    // console.log(expects);

    //let children = result.filter((node) => {
    // if (node["@type"]) {
    //    return true;
    //  }
    //  if (Array.isArray(node)) {
    //    // console.log(node[0]);
    //    return true;
    //  }
    //});
    let children = [];
    

    //console.log(children);
    
    //let children2 = [];
    for (let i = 0; i < result.length; i++) {
      let node = result[i];
      if (node["@type"] || Array.isArray(node)) {
        // console.log("children);
        children.push([node, i]);
      }
      // console.log(expects[i]);
      //  let node = result[i];
      //  if (node["@type"] || (expects[i] && expects[i]["@type"] == "@list")) {
      //    children2.push(node);
      //console.log(expects[i]);
      //console.log(`node: ${i} *${JSON.stringify(node)}*`);
      //  }
    }
    
    // let children = result.filter((node) => node["@type"]);
    //expects = expects.filter((node) => node["@type"] != "@list");
    
    //console.log(`Trying to bind ${signature}`);
    //let foo = children.map((x) => {
    //  return `${x["@type"] || JSON.stringify(x)}${JSON.stringify(x.types || {})}`;
    //}).join(" ");
    //console.log(`To ${foo}`);
    
    if (expects.length != children.length) {
      // console.log("not the same length");
      return reject;
    }
    
    // console.log(children);
    
    let variables = {};
    
    for (let i = 0; i < expects.length; i++) {
      let expected = expects[i];
      let [child, index] = children[i];
      if (expected["@type"] == "@list") {
        // bind(type, types = {}, conditions = [])
        //let sub = expected.children.filter((s) => {
        //  return typeof s != "string";
        //});
        let sub = [];
        for (let s of expected.children) {
          if (typeof s == "string" ||
              s.name == "__" ||
              s.name == "_") {
            continue;
          }
          sub.push({"@type": s.name, types: s.types});
        }
        //console.log("hi");
        //console.log(children);
        //console.log(sub);
        // console.log(child);
        let processed = [];
        for (el of child) {
          let list = bind("@list", {}, sub)(el, location, reject);
          if (list == reject) {
            //console.log("blarh");
            return reject;
          }
          processed.push(list.children);
        }
        // children[i] = list;
        //console.log(`Trying to override ${index} in result`);
        result[index] = processed;
        //console.log(list.children);
        // children[i][0] = list.children;
        // console.log(result);
        continue;
      }
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
    
    // console.log("Binded!");
    let n = {
      "@type": type,
      "types": bindings,
      "children": result,
    };
    
    if (location != undefined) {
      n["loc"] = location;
    }
    
    return n;
  };
}

const RuntimeSyntax = `
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
      tail -> termList {% id %}

      termList -> (term __ {% id %}):* term {%
        ([beginning, end]) => {
         return [...beginning, end];
        }
      %}

      term -> "(" _ termList _ "):" ("+" | "*") {% 
        ([paren1, ws1, termList, ws2, paren2, [number]]) => {
          // console.log(number);
          return {
            "name": "@list",
            "types": {"@number": number},
            "children": termList,
          };
        } 
      %}

      term -> name {% id %}
      term -> string {% id %}
      term -> "%" word {% ([tok, word]) =>  tok + word %}

      name -> word features:? {% 
        ([word, features]) => {
         return {
          name: word,
          types: Object.fromEntries(features || []),
          children: [],
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
`;

let RuntimeGrammar;

function runtimeGrammar() {
  if (!RuntimeGrammar) {
    RuntimeGrammar = Nearley.compile(RuntimeSyntax);
  }

  return RuntimeGrammar;
}


class FeaturedNearley {
  constructor() {
    this.parser = new Nearley(runtimeGrammar());
  }

  feed(code) {
    return this.parser.feed(code);
  }

  static compile(source, header = "", footer = "", raw) {
    let grammar = FeaturedNearley.generate(source, header, footer);
    return Nearley.compile(grammar, raw);    
  }

  static generate(source, header = "", footer = "", raw) {
    let parser = new FeaturedNearley();
    let grammar = parser.feed(source + footer);
    
    let result = [];

    function feed(code) {
      result.push(code);
    }

    if (header) {
      feed(header);
    }

    for (let {head, tail} of grammar[0]) {
      function term(x) {
        if (typeof x == "string") {
          return x;
        } else if (x["name"] == "@list") {
          let children = x.children.map(term).join(" ");
          return `(${children}):${x["types"]["@number"]}`;
        } else {
          return x.name;
        }
      }
      feed(`${head.name} -> ${tail.map(term).join(" ")} {%`);
      if (tail.length == 1 && tail[0] == "%word") {
        // For A[] -> %word rules, we special case and enforce that
        // the types of %A at runtime need to match the types of A[].
        // console.log("hi: " + head.name);
        feed(`([token], location, reject) => {
          //console.log("hello");
          for (let match of token.tokens) {
            //console.log("foo");
            //console.log(match);
            // console.log("${head.name}");
            //console.log(${JSON.stringify(head)});
            // console.log(${JSON.stringify(tail[0])});
            // console.log("${tail[0]}");
            let result = bind("${head.name}", ${JSON.stringify(head.types)}, [
              {"@type": "${head.name}", "types": ${JSON.stringify(head.types)}}, 
            ])([match], location, reject);
            // console.log(result);
            if (result != reject) {
              // console.log(result.children[0]);
              // console.log(token);
              let node = JSON.parse(JSON.stringify(result.children[0]));
              node.children = [{value: token.value}];
              // node.value = token.value; 
              return node;
            }
          }
          return reject;
        }`);
      } else {
        feed(`  bind("${head.name}", ${JSON.stringify(head.types)}, [`);
        for (let term of tail) {
          if (term.name == "_" ||
              term.name == "__" ||
              typeof term == "string" ||
              term.name == "unsigned_int") {
            continue;
          } else {
            // console.log(term);
            feed(`    {"@type": "${term.name || term}", "types": ${JSON.stringify(term.types || {})}, "children": ${JSON.stringify(term.children || [])}}, `);
          }
        }
        feed(`  ])`);
      }
      feed(`%}`);
      
    }
    // console.log(result.join("\n"));
    return result.join("\n");
  }
}

const DrtSyntax = `
      Sentence -> _ Statement _.
      Sentence -> _ Question _.      

      Statement -> S_ _ %PERIOD.

      Question ->
          %who __
          VP_[num=1, fin=+, gap=-, tp=3, tense=4] _
          %QUESTION
          .

      Question ->
          %who __ 
          AUX[num=1, fin=+, tp=2, tense=3] __
          NP[num=1, gen=4, case=+nom, gap=-] __
          V[num=1, fin=-, trans=+] _
          %QUESTION
          .

      Question ->
          BE[num=1, fin=+, tp=2, tense=3] __
          NP[num=1, gen=4, case=+nom, gap=-] __
          ADJ _
          %QUESTION
          .

      S_[num=1, gap=-, tp=2, tense=3] -> S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          %__if__ __ 
          S[num=1, gap=-, tp=2, tense=3] __ 
          %then __ 
          S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          S[num=4, gap=-, tp=2, tense=3] __ 
          %and __ 
          S[num=5, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          S[num=4, gap=-, tp=2, tense=3] __ 
          %or __ 
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

      VP_[num=1, fin=+, gap=2, stat=4, tp=5, tense=6] ->
        AUX[num=1, fin=+, tp=5, tense=6] __ 
        %not __ 
        VP[num=3, fin=-, gap=2, stat=4, tp=5, tense=6].

      VP_[num=1, fin=+, gap=2, state=3, tp=4, tense=5] -> 
          VP[num=1, fin=+, gap=2, state=3, tp=4, tense=5].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] ->
          V[num=1, fin=2, trans=+, stat=3, tp=4, tense=5] __ 
          NP[num=6, gen=7, case=-nom, gap=-].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] ->
          V[num=1, fin=2, trans=+, stat=3, tp=4, tense=5] 
          PP __
          NP[num=6, gen=7, case=-nom, gap=-].

      VP[num=1, fin=2, gap=np, tp=6, tense=7] ->
          V[num=1, fin=2, trans=+, tp=6, tense=7] _ 
          NP[num=4, gen=5, case=-nom, gap=np].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] -> 
        V[num=1, fin=2, trans=-, stat=3, tp=4, tense=5].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] -> 
        V[num=1, fin=2, trans=-, stat=3, tp=4, tense=5] PP.

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          %not __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      NP[num=1, gen=2, case=3, gap=np] -> GAP.

      GAP -> null.

      NP[num=1, gen=2, case=3, gap=-] -> DET[num=1] __ N[num=1, gen=2].

      NP[num=1, gen=2, case=3, gap=-] -> DET[num=1] __ N[num=1, gen=2] PP.

      NP[num=sing, gen=2, case=3, gap=-] -> PN[gen=2].
 
      NP[num=1, gen=2, case=3, gap=-] -> PRO[num=1, gen=2, case=3].

      NP[num=plur, gen=1, case=2, gap=-] -> 
        NP[num=3, gen=4, case=2, gap=-] __ 
        %and __ 
        NP[num=5, gen=6, case=2, gap=-].

      NP[num=3, gen=1, case=2, gap=-] -> 
        NP[num=3, gen=4, case=2, gap=-] __ 
        %or __ 
        NP[num=3, gen=6, case=2, gap=-].

      N[num=1, gen=2] -> N[num=1, gen=2] __ RC[num=1, gen=2].

      RC[num=1, gen=2] -> RPRO[num=1, gen=2] __ S[num=1, gap=np].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ ADJ.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ %not __ ADJ.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] PP.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ %not PP.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          NP[num=3, gen=4, case=5, gap=-].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          %not __ 
          NP[num=3, gen=4, case=5, gap=-].

      DET[num=sing] -> %a.
      DET[num=sing] -> %an.
      DET[num=sing] -> %the.

      DET[num=sing, quantifier=true] -> %every.
      DET[num=sing, quantifier=true] -> %some.
      DET[num=sing, quantifier=true] -> %no.

      DET[num=plur, quantifier=true] -> %all.
      DET[num=plur, quantifier=true] -> %some.
      DET[num=plur, quantifier=true] -> %most.
      DET[num=plur, quantifier=true] -> %many.
      DET[num=plur, quantifier=true] -> %only.
      DET[num=plur, quantifier=true] -> %not _ %all.
      DET[num=plur, quantifier=true] -> %the _ %majority _ %__of__.
      DET[num=plur, quantifier=true] -> %the _ %minority _ %__of__.
      DET[num=plur, quantifier=true] -> %at _ %least _ %unsigned_int.
      DET[num=plur, quantifier=true] -> %at _ %most _ %unsigned_int.
      DET[num=plur, quantifier=true] -> %more _ %than _ %unsigned_int.
      DET[num=plur, quantifier=true] -> %fewer _ %than _ %unsigned_int.
      DET[num=plur, quantifier=true] -> %exactly _ %unsigned_int.
      DET[num=plur, quantifier=true] -> %unsigned_int.
      
      DET[num=1] -> NP[num=2, gen=3, case=+nom, gap=-] _ %POSS.

      N[num=1, gen=2] -> ADJ __ N[num=1, gen=2].

      PRO[num=sing, gen=male, case=+nom] -> %he.
      PRO[num=sing, gen=male, case=-nom] -> %him.
      
      PRO[num=sing, gen=fem, case=+nom] -> %she.
      PRO[num=sing, gen=fem, case=-nom] -> %her.
      
      PRO[num=sing, gen=-hum, case=[-nom, +nom]] -> %it.

      PRO[num=plur, gen=[male, fem, -hum], case=+nom] -> %they.
      PRO[num=plur, gen=[male, fem, -hum], case=-nom] -> %them.

      PRO[num=sing, gen=male, case=-nom, refl=+] -> %himself.
      PRO[num=sing, gen=fem, case=-nom, refl=+] -> %herself.
      PRO[num=sing, gen=-hum, case=-nom, refl=+] -> %itself.

      PP -> (__ PREP __ NP[num=1, gen=2, case=3, gap=-]):+.

      PREP -> %behind.
      PREP -> %__in__.
      PREP -> %__with__.
      PREP -> %__for__.
      PREP -> %__of__.
      PREP -> %over.
      PREP -> %under.
      PREP -> %near.
      PREP -> %before.
      PREP -> %after.
      PREP -> %during.
      PREP -> %from.
      PREP -> %to.
      PREP -> %about.
      PREP -> %by.  

      AUX[num=sing, fin=+, tp=-past, tense=pres] -> %does.
      AUX[num=plur, fin=+, tp=-past, tense=pres] -> %__do__.

      AUX[num=1, fin=+, tp=-past, tense=past] -> %did.
      AUX[num=1, fin=+, tp=+past, tense=pres] -> %did.

      AUX[num=1, fin=+, tp=-past, tense=fut] -> %will.
      AUX[num=1, fin=+, tp=+past, tense=fut] -> %would.

      RPRO[num=[sing, plur], gen=[male, fem]] -> %who.
      RPRO[num=[sing, plur], gen=-hum] -> %which.

      BE[num=sing, fin=+, tp=-past, tense=pres] -> %is.
      BE[num=plur, fin=+, tp=-past, tense=pres] -> %are.

      BE[num=sing, fin=+, tp=-past, tense=past] -> %was.
      BE[num=plur, fin=+, tp=-past, tense=past] -> %were.

      BE[num=sing, fin=+, tp=+past, tense=pres] -> %was.
      BE[num=plur, fin=+, tp=+past, tense=pres] -> %were.

      BE[fin=-] -> %be.
      BE[fin=part] -> %been.

      HAVE[fin=-] -> %have.

      HAVE[num=sing, fin=+, tp=-past, tense=pres] -> %has.
      HAVE[num=plur, fin=+, tp=-past, tense=pres] -> %have.

      HAVE[num=1, fin=+, tp=-past, tense=past] -> %had.
      HAVE[num=1, fin=+, tp=+past, tense=[pres, past]] -> %had.

      V[num=1, fin=-, stat=-, trans=2] -> 
          VERB[trans=2, stat=-].

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+s] %s.

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+es] %es.

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+ies] %ies.

      V[num=plur, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1].

      V[num=1, fin=part, stat=2, tp=-past, tense=[pres, past], trans=3] 
          -> VERB[trans=3, stat=2, past=+ed] %ed.

      V[num=1, fin=+, stat=2, tp=+past, tense=past, trans=3] 
          -> VERB[trans=3, stat=2, past=+ed] %ed.

      V[num=1, fin=part, stat=2, tp=-past, tense=[pres, past], trans=3] 
          -> VERB[trans=3, stat=2, past=+d] %d.

      V[num=1, fin=+, stat=2, tp=+past, tense=past, trans=3] 
          -> VERB[trans=3, stat=2, past=+d] %d.

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+ied] %ied.

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+led] %led.

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+red] %red.

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=past, trans=3] 
         -> VERB[trans=3, stat=2, past=-reg].

      N[num=plur, gen=1] -> N[num=sing, gen=1, plur=s] %s.
      N[num=plur, gen=1] -> N[num=sing, gen=1, plur=es] %es.

      PN[gen=2] -> PN __ PN.
      PN[gen=2] -> %word.
      PN[gen=2] -> %name.
      ADJ -> %word.
      N[num=1, gen=2, plur=3] -> %word.      
      VERB[trans=1, stat=2, pres=3, past=4] -> %word.
`;

const keywords = [
  // determiners
  "a", "an", "the",
  "every", "some", "no", "all", "most", "many",
  "only", "not", "majority", "minority", "at", "least",
  "more", "than", "fewer", "exactly",

  // prepositions
  "behind", "over", "under", "near", "before", "after",
  "during", "from", "to", "about", "by",  
  
  "then",

  "and", "or",

  "he", "him",
  "she", "her",
  "they", "them",
  "himself", "herself",
  "it", "itself",

  "does", "did",
  "will", "would",
  "is", "are",
  "was", "were",
  "be", "been",
  "have", "has", "had",

  "who",
  "which",

  // verbs
  "s", "es", "ies", "ed", "d", "ied", "led", "red",
].map((keyword) => [keyword, keyword, []]);

const dict = [
  [" ", "WS"],
  [".", "PERIOD"],
  ["?", "QUESTION"],
  ["'s", "POSS"],

  ["if", "__if__"],
  ["do", "__do__"],

  ["in", "__in__"],
  ["with", "__with__"],
  ["for", "__for__"],
  ["of", "__of__"],
].concat([
  // proper names
  //["Socrates", "word", [{"@type": "PN", types: {"num": "sing", "gen": "male"}}]],
  ["Jones", "word", [{"@type": "PN", types: {"num": "sing", "gen": "male"}}]],
  //["John", "word", [{"@type": "PN", types: {"num": "sing", "gen": "male"}}]],
  ["Smith", "word", [{"@type": "PN", types: {"num": "sing", "gen": "male"}}]],
  ["Mary", "word", [{"@type": "PN", types: {"num": "sing", "gen": "fem"}}]],
  //["Brazil", "word", [{"@type": "PN", types: {"num": "sing", "gen": "-hum"}}]],
  ["Ulysses", "word", [{"@type": "PN", types: {"num": "sing", "gen": "-hum"}}]],
  
  // nouns
  ["man", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["woman", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["men", "word", [{"@type": "N", types: {"num": "plur", "gen": "male"}}]],
  ["women", "word", [{"@type": "N", types: {"num": "plur", "gen": "fem"}}]],
  ["girl", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem", "plur": "s"}}]],
  ["book", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["telescope", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["donkey", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["horse", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["cat", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["porsche", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],
  ["dish", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "es"}}]],
  ["witch", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "es"}}]],
  ["judge", "word", [{"@type": "N", types: {"num": "sing", "gen": 1, "plur": "es"}}]],
  ["engineer", "word", [{"@type": "N", types: {"num": "sing", "gen": ["male", "fem"], "plur": "s"}}]],
  ["reservation", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum", "plur": "s"}}]],

  // RNs
  
  ["brother", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["father", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["husband", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["sister", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["mother", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["wife", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],

  // verbs
  //["beat", "word", [{"@type": "VERB", types: {
  //  "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["listen", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["own", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["walk", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["sleep", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["stink", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["leave", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s"}}]],
  ["left", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "-reg", "past": "-reg"}}]],
  ["come", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s"}}]],
  ["came", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "past": "-reg"}}]],
  ["give", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s"}}]],
  ["gave", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "past": "-reg"}}]],
  ["travelled", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "past": "-reg"}}]],

  ["make", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "s"}}]],
  ["made", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "past": "-reg"}}]],
  
  ["kiss", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["box", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["watch", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["crash", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],

  ["like", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["seize", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["tie", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  //["free", "word", [{"@type": "VERB", types: {
  //  "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["love", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["surprise", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["fascinate", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["admire", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  
  ["ski", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["echo", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  
  ["play", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["decay", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["enjoy", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  
  ["cr", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["appl", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["cop", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["repl", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["tr", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  
  ["compel", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+led"}}]],
  ["defer", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+red"}}]],    
  
  // Adjectives
  ["happy", "word", [{"@type": "ADJ"}]],
  ["unhappy", "word", [{"@type": "ADJ"}]],
  ["foolish", "word", [{"@type": "ADJ"}]],  
  ["fast", "word", [{"@type": "ADJ"}]],    
  ["beautiful", "word", [{"@type": "ADJ"}]],
  ["mortal", "word", [{"@type": "ADJ"}]],
  ["married", "word", [{"@type": "ADJ"}]],

  // Some words can take multiple roles
  ["brazilian", "word", [{
    "@type": "ADJ"
  }, {
    "@type": "N",
    "types": {"num": "sing", "plur": "s"}
  }]],
      
]);

let DRTGrammar;

function drtGrammar(header, footer = "", body = DrtSyntax) {
  // console.log("drt grammar");
  header = header || `
      @{%
        // const lexer = new Tokenizer(dict.concat(keywords));
        // NOTE(goto): this only gets called once per test
        // so gets reused. We need to figure out why and fix it.
        // console.log("new lexer");
        const lexer = {
          use(tokenizer) {
            this.tokenizer = tokenizer;
          },
          next() {
            return this.tokenizer.next();
          },
          save() {
            return this.tokenizer.save();
          },
          reset(chunk, info) {
            return this.tokenizer.reset(chunk, info);
          },
          formatError(token) {
            return this.tokenizer.formatError(token);
          },
          has(name) {
            return true;
          }
        };
      %}
      @lexer lexer
      _ -> %WS:* {% function(d) {return null;} %}
      __ -> %WS:+ {% function(d) {return null;} %}
      Discourse -> Sentence:+
    `;

  // console.log(header);
  
  if (!DRTGrammar) {
    DRTGrammar = FeaturedNearley.compile(body, header, footer);
  }
  return DRTGrammar;  
}

// console.log("hi");
// console.log(DRTGrammar);

class Parser {
  constructor (start = "Discourse", header, footer, body){
    const grammar = drtGrammar(header, footer, body);
    this.parser = new Nearley(grammar, start);
    this.lexer = new Tokenizer(dict.concat(keywords));
    this.parser.parser.lexer.use(this.lexer);
  }

  add([str, type, value]) {
    this.lexer.push(str, type, value);
  }

  feed(code) {
    return this.parser.feed(code);
  }
}

let node = (type) => { 
 return (...children) => {
  return {"@type": type, "children": children};
 }
};

function parse(s, start = "Statement") {
  let parser = new Parser(start);
  let result = parser.feed(s);
  return result;
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

function first(result) {
 return preprocess(child(result[0], 0, 0));
}

function preprocess(node) {
 if (node["@type"] == "V") {
  // console.log(node);                                                       
  let root = node.children[0].children[0];
  let suffix = node.children[1] || "";
  node.children = [root + suffix];
  return node;
 }

 for (let child of node.children || []) {
  preprocess(child);
 }
 return node;
}

module.exports = {
 parse: parse,
 first: first,
 preprocess: preprocess,
 Nearley: Nearley,
 bind: bind,
 FeaturedNearley: FeaturedNearley,
 Parser: Parser,
 nodes: {
  "Statement": node("Statement"),
  "Sentence": node("Sentence"),
  "Question": node("Question"),
  "S": node("S"),
  "S_": node("S_"),
  "NP": node("NP"),
  "PN": node("PN"),
  "VP_": node("VP_"),
  "VP": node("VP"),
  "V": node("V"),
  "AUX": node("AUX"),
  "PRO": node("PRO"),
  "DET": node("DET"),
  "N": node("N"),
  "RC": node("RC"),
  "RPRO": node("RPRO"),
  "GAP": node("GAP"),
  "BE": node("BE"),
  "ADJ": node("ADJ"),
  "PREP": node("PREP"),
  "PP": node("PP"),
  "VERB": node("VERB"),
  "HAVE": node("HAVE"),
  "RN": node("RN"),
 }
}
