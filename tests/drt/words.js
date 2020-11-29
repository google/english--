const Assert = require("assert");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");

describe("Attempto", function() {
  it("Parsing", function() {
    const parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(`
% hello
% world
foo(bar).
foo("bar").
foo(a, b).
`);

    assertThat(parser.results).equalsTo([[
      ["%", " hello"],
      ["%", " world"],
      ["foo", ["bar"]],
      ["foo", ["bar"]],
      ["foo", ["a", "b"]],
    ]]);
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
