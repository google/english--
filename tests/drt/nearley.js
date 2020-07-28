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

  function create(source) {
    let grammar = parse(source);
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar),
                                      {keepHistory: true});

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
     console.log(`Instead of a ${JSON.stringify(error.token)}, I was expecting to see one of the following:`);
     for (let expected of error.expected) {
      console.log(`    A ${expected.symbol} based on:`);
      for (let based of expected.based) {
       console.log(`        ${based}`);
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

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

