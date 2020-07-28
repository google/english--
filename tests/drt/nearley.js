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
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    parser.reportError = function(token) {
     var message = this.lexer.formatError(token, "Invalid syntax") + "\n";
     message += "Unexpected " + (token.type ? token.type + " token: " : "");
     message +=
     JSON.stringify(token.value !== undefined ? token.value : token) + "\n";
     return JSON.stringify({message: message, token: token});
    };

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

  it("error", function() {
    let parser = create(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);

    try {
     parser.feed("bah");
     assertThat(parser.results).equalsTo();
    } catch (e) {
     let {token} = JSON.parse(e.message);
     assertThat(token).equalsTo({value: "h"});
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

