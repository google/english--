/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");
const {Tokenizer} = require("./lexer.js");

class Nearley {
  constructor(compiled, start) {
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
    
    eval(code);
    
    return module.exports;
  }
  
  static from(code, start) {
    return new Nearley(Nearley.compile(code), start);
  }

  complete() {
    return complete(this.tracks());
  }
  
  reportError(e) {
    let that = this;
    const buffer = this.parser.lexer.tokenizer ?
          this.parser.lexer.tokenizer.buffer :
          this.parser.lexer.buffer;
    return {
      buffer: buffer,
      token: e.token,
      loc: e.offset, 
      start: buffer[that.parser.current],
      print() {
        const tracks = that.tracks(2);
        const result = [];
        let unexpected = ""; 
        let head = "";
        if (this.token.type) {
          head = `Unexpected %${this.token.type} token: "${this.token.value}".`;
        } else {
          head = `Unexpected "${this.token.value}".`;
        }
        head += " ";
        head += `Instead, I was expecting to see one of the following:`;
        result.push(head);
        result.push(``);
        for (let track of tracks) {
          result.push(`A ${track.symbol} token based on:`);
          for (let line of track.stack) {
            result.push(`    ${print(line)}`);
          }
        }
        
        return result.join("\n");
      },
    };
  }
  
  /*
    Generates a user friendly error report given the caught error 
    object and the Nearley parser instance.
  */
  tracks(last = 1) {
    let {parser} = this;
    const lastColumnIndex = parser.table.length - last;
    const lastColumn = parser.table[lastColumnIndex];
    let tracks = [];
    // Display each state that is expecting a terminal symbol next.
    for (let i = 0; i < lastColumn.states.length; i++) {
      const state = lastColumn.states[i];
      const nextSymbol = state.rule.symbols[state.dot];
      if (nextSymbol && this.isTerminalSymbol(nextSymbol)) {
        const symbolDisplay = this.getSymbolDisplay(nextSymbol);
        let track = {symbol: symbolDisplay, stack: []};
        tracks.push(track);
        // Display the "state stack" - which shows you how this state
        // came to be, step by step.
        const stateStack = this.buildStateStack(lastColumnIndex, i, parser);
        for (let j = 0; j < stateStack.length; j++) {
          const state = stateStack[j];
          track.stack.push(state);
        }
      }
    }
    return tracks;
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
    //console.log(state);
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

  print() {
    let result = [];
    const tokens = this.complete();
    for (let [symbol, path] of Object.entries(tokens)) {
      result.push(`A ${symbol} token based on:`);
      for (let line of path) {
        result.push(`    ${print(line)}`);
      }
    }
    return result.join("\n");
  }
}

function ancestors(state, path = []) {
  if (state.wantedBy.length == 0) {
    return [state];
  }
  
  if (path.includes(state)) {
    return false;
  }

  let current = [...path, state];
  
  if (!valid(current) || !continuous(current)) {
    return false;
  }
  
  for (let parent of state.wantedBy) {
    let result = ancestors(parent, current);
    if (result) {
      result.unshift(state);
      return result;
    }
  }
  
  return false;
}

function walk({isComplete, data, left, right}) {
  let result = [];
  if (data) {
    result.push(data);
  }
  if (isComplete) {
    return result.flat();
  }
  if (left) {
    result.push(...walk(left));
  }
  if (right) {
    result.push(...walk(right));
  }
  return result.flat();
}

function valid(path) {
  for (let line of path) {
    if (!line.rule.postprocess ||
        !line.rule.postprocess.meta) {
      return true;
    }
    const meta = line.rule.postprocess.meta; 
    let right = walk(line);
    let result = match(meta.type, meta.types, meta.conditions,
                       right, undefined, false, true);
    if (!result) {
      return false;
    }
  }
  return true;
}

function continuous(path) {
  let j = 0;
  do  {
    let rule = path[j].rule;
    if (rule.postprocess && rule.postprocess.meta) {
      break;
    }
    j++;
    
    if (j >= path.length) {
      // If we got to the end of the array
      // with no types, this is a static path.
      return true;
    }
  } while (true);
  
  let last = {
    "@type": path[j].rule.name,
    "types" : path[j].rule.postprocess.meta.types,
  };
  
  for (let i = (j + 1); i < path.length; i++) {
    let next = path[i];
    let meta = next.rule.postprocess.meta;
    let right = walk(next);
    right.push(last);
    let result = match(next.rule.name, meta.types, meta.conditions,
                       right, undefined, false, true);
    if (!result) {
      return false;
    }
    last = result;
  }
  return true;
}

function complete(tracks) {
  let tokens = {};
  for (let track of tracks) {
    let path = ancestors(track.stack[0]);
    if (!path) {
      continue;
    }
    // Saves the first valid path.
    tokens[track.symbol] = path;
  }

  return tokens;
}

function namespace(type, bindings, conditions) {  
  let signature = `${type}${JSON.stringify(bindings)} -> `;
  for (let child of conditions) {
    signature += `${child["@type"] || JSON.stringify(child)}${JSON.stringify(child.types || {})} `;
  }
  
  let hash = (str) => {
    return str.split("")
      .reduce((prevHash, currVal) =>
              (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
  }
  
  return hash(signature); 
}

function match(type, types = {}, conditions = [], data, location, reject,
               partial = false) {
  // Creates a copy of the types because it is reused
  // across multiple calls and we assign values to it.
  let bindings = JSON.parse(JSON.stringify(types));

  // Creates a copy of the input data, because it is
  // reused across multiple calls.
  let result = JSON.parse(JSON.stringify(data || []))
  
  // Ignores the null type.
  let expects = conditions.filter((x) => x["@type"] != "null");

  if (!partial && expects.length != data.length) {
    throw new Error("Unexpected data length");
  }
  
  let variables = {};

  let intersection = (a, b) => a.filter(value => b.includes(value));

  for (let i = 0; i < result.length; i++) {
    let expected = expects[i];
    let child = result[i];
    if (expected["@type"] != child["@type"]) {
      return reject;
    }
    for (let [key, value] of Object.entries(expected.types || {})) {
      if (typeof value == "number") {
        if (variables[value]) {
          if (Array.isArray(variables[value])) {
            if (Array.isArray(child.types[key])) {
              if (intersection(child.types[key], variables[value]).length == 0) {
                return reject;
              }
            } else if (!variables[value].includes(child.types[key])) {
              return reject;
            }
          } else if (typeof variables[value] == "number") {
            variables[value] = child.types[key];
          } else if (Array.isArray(child.types[key])) {
            if (!child.types[key].includes(variables[value])) {
              return reject;
            }
            continue;
          } else if (typeof child.types[key] == "number") {
            variables[child.types[key]] = variables[value];
            continue;
          } else if (variables[value] != child.types[key]) {
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
          continue;
        }
        return reject;
      } else if (!child.types[key]) {
        return reject;
      }
    }
  }
    
  // Sets variables
  const scope = namespace(type, bindings, conditions);
  for (let [key, value] of Object.entries(bindings)) {
    if (typeof value == "number") {
      if (!variables[value]) {
        bindings[key] = scope + value;
      } else {
        bindings[key] = variables[value];
      }
    }
  }

  return {
    "@type": type,
    "types": bindings,
    "children": result.filter(
      (child) => (child["@type"] != "_" && child["@type"] != "__")),
  };
}

function bind(type, types = {}, conditions = []) {   
  let matcher = (data, location, reject) => {
    return match(type, types, conditions, data, location, reject);
  };

  matcher.meta = {
    type: type,
    types: types,
    conditions: conditions
  };
  
  return matcher;
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
      tail -> (term __ {% id %}):* term {%
        ([beginning, end]) => {
         return [...beginning, end];
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
      function name(x) {
        if (typeof x == "string") {
          return x;
        } else {
          return x.name;
        }
      }
      feed(`${head.name} -> ${tail.map(name).join(" ")} {%`);
      if (tail.length == 1 && tail[0] == "%word") {
        // For A[] -> %word rules, we special case and enforce that
        // the types of %A at runtime need to match the types of A[].
        feed(`
          (() => {
            let lexicon = ([token], location, reject) => {
              for (let match of token.tokens) {
                let result = bind("${head.name}", 
                                  ${JSON.stringify(head.types)}, [{
                                    "@type": "${head.name}", 
                                    "types": ${JSON.stringify(head.types)}
                                  }])([match], location, reject);
                if (result != reject) {
                  // console.log(result.children[0]);
                  let node = JSON.parse(JSON.stringify(result.children[0]));
                  node.children = [{value: token.value}];
                  //console.log(node);
                  return node;
                }
              }
              return reject;
            }
            lexicon.meta = {
              type: ${JSON.stringify(head.name)},
              types: ${JSON.stringify(head.types)},
            };
            return lexicon;
          })()
        `);
      } else {
        feed(`  bind("${head.name}", ${JSON.stringify(head.types)}, [`);
        for (let term of tail) {
          feed(`    {"@type": "${name(term)}", "types": ${JSON.stringify(term.types)}}, `);
        }
        feed(`  ])`);
      }
      feed(`%}`);
    }
    return result.join("\n");
  }
}

const DrtSyntax = `
      Sentence -> Statement.
      Sentence -> Question.      

      Statement -> S_ _ %PERIOD.
      Question -> Q_ _ %QUESTION.

      Q_ -> Q.

      Q -> AUX[num=1, fin=+, tp=2, tense=3] __ 
           NP[num=1, gen=4, case=+nom, gap=-, deep=6] __
           VP[num=1, fin=-, gap=-, tp=5, tense=3].

      Q -> BE[num=1, fin=+, tp=2, tense=3] __
           NP[num=1, gen=4, case=+nom, gap=-, deep=5] __
           ADJ.

      Q -> BE[num=1, fin=2, tp=-past, tense=4] __
           NP[num=1, gen=3, case=+nom, gap=-, deep=5] __
           PP.

      Q -> BE[num=1, fin=2, tp=-past, tense=4] __
           NP[num=1, gen=3, case=+nom, gap=-, deep=7] __
           DET[num=1] __ 
           N_[num=1, gen=5, deep=6].

      Q -> WH __ 
           VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      Q -> WH __ 
           AUX[num=1, fin=+, tp=2, tense=3] __
           NP[num=1, gen=4, case=+nom, gap=-, deep=5] __
           V[num=1, fin=-, trans=+].

      Q -> WH __ 
           N_[num=1, gen=2, deep=5] __
           VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      WH -> %who.
      WH -> %what.
      WH -> %which.

      S_[num=1, gap=-, tp=2, tense=3] -> S[num=1, gap=-, tp=2, tense=3, s=+].

      S[num=1, gap=-, tp=2, tense=3, s=+] -> 
          %__if__ __ 
          S[num=1, gap=-, tp=2, tense=3, s=-] __ 
          %then __ 
          S[num=1, gap=-, tp=2, tense=3, s=-].

      S[num=1, gap=-, tp=2, tense=3, s=+] -> 
          S[num=4, gap=-, tp=2, tense=3, s=-] __ 
          %and __ 
          S[num=5, gap=-, tp=2, tense=3, s=-].

      S[num=1, gap=-, tp=2, tense=3,s=+] -> 
          %either __
          S[num=4, gap=-, tp=2, tense=3, s=-] __ 
          %or __ 
          S[num=5, gap=-, tp=2, tense=3, s=-].

      S[num=1, gap=-, tp=3, tense=4, s=6] -> 
          NP[num=1, gen=2, case=+nom, gap=-, deep=5] __ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4, s=6] ->
          NP[num=1, gen=2, case=+nom, gap=np, deep=5] _ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4, s=6] ->
          NP[num=1, gen=2, case=+nom, gap=-, deep=5] __ 
          VP_[num=1, fin=+, gap=np, tp=3, tense=4].

      VP_[num=1, fin=+, gap=2, stat=3, tp=4, tense=fut] ->
        AUX[num=1, fin=+, tp=4, tense=fut] __ 
        VP[num=5, fin=-, gap=2, stat=3, tp=4, tense=pres].

      VP_[num=1, fin=+, gap=2, stat=4, tp=5, tense=6] ->
        AUX[num=1, fin=+, tp=5, tense=6] __ 
        %not __ 
        VP[num=3, fin=-, gap=2, stat=4, tp=5, tense=pres].

      VP_[num=1, fin=+, gap=2, state=3, tp=4, tense=5] -> 
          VP[num=1, fin=+, gap=2, state=3, tp=4, tense=5].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] ->
          V[num=1, fin=2, trans=+, stat=3, tp=4, tense=5] __ 
          NP[num=6, gen=7, case=-nom, gap=-, deep=8].

      VP[num=1, fin=2, gap=np, tp=6, tense=7] ->
          V[num=1, fin=2, trans=+, tp=6, tense=7] _ 
          NP[num=4, gen=5, case=-nom, gap=np, deep=8].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] -> 
        V[num=1, fin=2, trans=-, stat=3, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          %not __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=7, tp=4, tense=5] ->
          BE[num=1, fin=+, tp=-past, tense=5] __
          VP[num=1, fin=part, gap=np, stat=6, tp=8, tense=5].

      NP[num=1, gen=2, case=3, gap=-, deep=-, np=6] -> 
        %LBRACKET _
        NP[num=1, gen=2, case=3, gap=4, deep=5, np=6] _
        %RBRACKET.

      NP[num=1, gen=2, case=3, gap=np, deep=4, np=5] -> GAP.

      GAP -> null.

      NP[num=1, gen=2, case=3, gap=-, deep=4, np=5] -> DET[num=1] __ N_[num=1, gen=2, deep=4].

      NP[num=sing, gen=2, case=3, gap=-, deep=4, np=5] -> PN[gen=2].

      NP[num=plur, gen=2, case=3, gap=-, deep=4, np=5] -> N_[num=plur, gen=2, deep=4].
 
      PN -> %the __ PN.

      NP[num=1, gen=2, case=3, gap=-, deep=4, np=5] -> PRO[num=1, gen=2, case=3].

      NP[num=plur, gen=1, case=2, gap=-, deep=7, np=+] -> 
        NP[num=3, gen=4, case=2, gap=-, deep=7, np=-] __ 
        %and __ 
        NP[num=5, gen=6, case=2, gap=-, deep=7, np=-].

      NP[num=plur, gen=1, case=2, gap=-, deep=7, np=-] -> 
        NP[num=3, gen=4, case=2, gap=-, deep=7, np=-] _ 
        %COMMA _
        NP[num=5, gen=6, case=2, gap=-, deep=7, np=-].

      NP[num=3, gen=1, case=2, gap=-, deep=7, np=+] -> 
        %either __
        NP[num=3, gen=4, case=2, gap=-, deep=7, np=-] __ 
        %or __ 
        NP[num=3, gen=6, case=2, gap=-, deep=7, np=-].

      RC[num=1, gen=2] -> RPRO[num=1, gen=2] __ S[num=1, gap=np].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ ADJ.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ %not __ ADJ.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ PP.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ %not __ PP.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          NP[num=3, gen=4, case=5, gap=-, deep=8].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          %not __ 
          NP[num=3, gen=4, case=5, gap=-, deep=8].

      NP[num=1, gen=2, case=3, gap=-, deep=+, np=+] -> %everyone.
      NP[num=1, gen=2, case=3, gap=-, deep=+, np=+] -> %one.

      DET[num=sing, quant=some] -> %a.
      DET[num=sing, quant=some] -> %an.
      DET[num=sing, quant=some] -> %the.

      DET[num=sing, quant=+] -> %every.
      DET[num=sing, quant=+] -> %some.
      DET[num=sing, quant=+] -> %no.
      DET[num=plur, quant=+] -> %all.
      DET[num=plur, quant=+] -> %some.
      DET[num=plur, quant=+] -> %most.
      DET[num=plur, quant=+] -> %many.
      DET[num=plur, quant=+] -> %only.
      DET[num=plur, quant=+] -> %not __ %all.
      DET[num=plur, quant=+] -> %the __ %majority __ %__of__.
      DET[num=plur, quant=+] -> %the __ %minority __ %__of__.
      DET[num=plur, quant=+] -> %at __ %least __ %UNSIGNED_INT.
      DET[num=plur, quant=+] -> %at __ %most __ %UNSIGNED_INT.
      DET[num=plur, quant=+] -> %more __ %than __ %UNSIGNED_INT.
      DET[num=plur, quant=+] -> %fewer __ %than __ %UNSIGNED_INT.
      DET[num=plur, quant=+] -> %exactly __ %UNSIGNED_INT.
      DET[num=plur, quant=+] -> %UNSIGNED_INT.
      
      DET[num=1] -> NP[num=2, gen=3, case=+nom, gap=-, deep=+] _ %POSS.

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

      V[num=1, fin=2, trans=3, stat=4, tp=5, tense=6] -> 
        V[num=1, fin=2, trans=3, stat=4, tp=5, tense=6] __ 
        PP.  

      N_[num=1, gen=2, deep=3] -> ADJ __ N_[num=1, gen=2, deep=-].
      
      N_[num=1, gen=2, deep=+] -> N_[num=1, gen=2, deep=3] __ RC[num=1, gen=2].

      N_[num=1, gen=2, deep=+] -> N_[num=1, gen=2, deep=3] __ PP.

      N_[num=1, gen=2, deep=-] -> N[num=1, gen=2].

      PP -> PREP __ NP[num=1, gen=2, case=3, gap=-, deep=-].

      ADJ -> ADJ __ PP.
      
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
      PREP -> %on.  
      PREP -> %as.  
      PREP -> %at.  

      AUX[num=sing, fin=+, tp=-past, tense=pres] -> %does.
      AUX[num=plur, fin=+, tp=-past, tense=pres] -> %__do__.

      AUX[fin=+, tp=-past, tense=past] -> %did.
      
      AUX[fin=+, tp=-past, tense=fut] -> %will.
      AUX[fin=+, tp=+past, tense=fut] -> %would.

      RPRO[num=[sing, plur], gen=[male, fem]] -> %who.
      RPRO[num=[sing, plur], gen=-hum] -> %which.
      RPRO[num=[sing, plur], gen=1] -> %that.

      BE[num=sing, fin=+, tp=-past, tense=pres] -> %is.
      BE[num=plur, fin=+, tp=-past, tense=pres] -> %are.

      BE[num=sing, fin=+, tp=-past, tense=past] -> %was.
      BE[num=plur, fin=+, tp=-past, tense=past] -> %were.

      BE[fin=-] -> %be.
      BE[fin=part] -> %been.

      HAVE[fin=-] -> %have.

      HAVE[num=sing, fin=+, tp=-past, tense=pres] -> %has.
      HAVE[num=plur, fin=+, tp=-past, tense=pres] -> %have.

      HAVE[fin=+, tp=-past, tense=past] -> %had.
      HAVE[fin=+, tp=+past, tense=[pres, past]] -> %had.

      V[fin=part] -> %word.
      V[fin=-] -> %word.
      V[fin=+] -> %word.
      PN[] -> %word.
      ADJ[] -> %word.
      N[num=1, gen=2] -> %word.
`;

let DRTGrammar;

function drtGrammar() {
  const header = `
      @{%
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
            this.keywords = this.keywords || [];
            this.keywords.push(name);
            return true;
          }
        };
      %}
      @lexer lexer
      _ -> %WS:* {% function(d) {return {"@type": "_", types: {}};} %}
      __ -> %WS:+ {% function(d) {return {"@type": "__", types: {}};} %}
      Discourse -> _ (Sentence _):+ {% ([ws1, sentences]) => {
         return sentences.map(([s, ws2]) => s); 
      }%}
    `;

  if (!DRTGrammar) {
    DRTGrammar = FeaturedNearley.compile(DrtSyntax, header);
  }
    
  return DRTGrammar;  
}

class Parser {
  constructor (start = "Discourse", dict = []){
    const grammar = drtGrammar();
    this.parser = new Nearley(grammar, start);
    this.lexer = new Tokenizer();
    this.parser.parser.lexer.use(this.lexer);
    const reserved = this.parser.parser.lexer.keywords
          .filter(word => word.match("^[a-z]") || word.match("^__"))
          .filter((value, index, self) => self.indexOf(value) === index)
          .filter(word => word != "word")
          .map(word => [word.match("^(__)?([a-z]+)(__)?")[2], word, []]);
    // keywords
    this.load(reserved);
    // punctuation
    this.load([
      [" ", "WS"],
      ["\n", "WS"],
      [".", "PERIOD"],
      [",", "COMMA"],
      ["?", "QUESTION"],
      ["'s", "POSS"],
      ["[", "LBRACKET"],
      ["]", "RBRACKET"],
    ]);
    // world/content words
    this.load(dict);
  }

  load(dict) {
    for (let word of dict) {
      this.add(word);
    }
    return this;
  }
  
  add([str, type, value]) {
    this.lexer.push(str, type, value);
    return this;
  }

  feed(code) {
    return this.parser.feed(code);
  }

  complete() {
    return this.parser.complete();
  }

  print() {
    return this.parser.print();
  }

}


function print(state) {
  let {rule} = state;
  let meta = {};
  if (rule.postprocess && rule.postprocess.meta) {
    meta = rule.postprocess.meta;
  }
  let features = (types) => Object
      .entries(types)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
  
  let head = {
    "@type": rule.name,
    types: meta.types,
  };
  
  let tail = rule.symbols.map((symbol, i) => {
    if (symbol.type) {
      return {
        "@type": `%${symbol.type}`
      };
    }
    if (symbol.literal) {
      return {
        "@type": symbol.literal
      }
    }
    return {
      "@type": `${symbol}`,
      "types": meta.conditions ? meta.conditions[i].types : undefined
    }
  });
  
  let dot = state.dot;
  
  let result = [];
  result.push(`${head["@type"]}`);
  if (head["types"]) {
    result.push(`[${features(head["types"])}]`);
  }
  result.push(" →");
  for (let i = 0; i < tail.length; i++) {
    let symbol = tail[i];
    // console.log(symbol);
    result.push(" ");
    if (dot == i) {
      result.push("● ");
    };
    result.push(`${symbol["@type"]}`);
    if (symbol["types"]) {
      result.push(`[${features(symbol["types"])}]`);
    }
  }
  return result.join("");
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
  match: match,
  FeaturedNearley: FeaturedNearley,
  Parser: Parser,
  ancestors: ancestors,
  valid: valid,
  continuous: continuous,
  complete: complete,
  node: node,
  nodes: {
    "Statement": node("Statement"),
    "Sentence": node("Sentence"),
    "Question": node("Question"),
    "S": node("S"),
    "S_": node("S_"),
    "Q": node("Q"),
    "Q_": node("Q_"),
    "NP": node("NP"),
    "PN": node("PN"),
    "VP_": node("VP_"),
    "VP": node("VP"),
    "V": node("V"),
    "AUX": node("AUX"),
    "PRO": node("PRO"),
    "DET": node("DET"),
    "N": node("N"),
    "N_": node("N_"),
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
    "WH": node("WH"),
  }
}
