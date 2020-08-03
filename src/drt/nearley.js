const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");

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

module.exports = {
 Nearley: Nearley,
 bind: bind,
}