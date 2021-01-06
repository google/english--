const Assert = require("assert");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");

describe.skip("Wordlist", function() {
  it("Parsing", function() {
    const parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(`
% hello
% world

foo(bar).
foo("bar").
foo(a, b).
foo_bar(a).
`);

    assertThat(parser.results).equalsTo([[
      ["%", " hello"],
      ["%", " world"],
      ["foo", ["bar"]],
      ["foo", ["bar"]],
      ["foo", ["a", "b"]],
      ["foo_bar", ["a"]],
    ]]);
  });

  it("Streaming", function() {
    const parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed("% foo bar\n");
    parser.feed("% hello world\n");

    assertThat(parser.results).equalsTo([[
      ["%", " foo bar"],
      ["%", " hello world"],
    ]]);
  });

  it("Parsing", async () => {
    const fs = require("fs");
    const readline = require("readline");

    const stream = fs.createReadStream("tests/drt/clex_lexicon.pl");

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      // console.log(`Line from file: ${line}`);
      const parser = new Parser(Grammar.fromCompiled(grammar));
      parser.feed(line + "\n");
      let [result] = parser.results;
      if (result.length == 0) {
        continue;
      }
      // console.log(result);
      let [[name]] = result;
      // console.log(name);
      if (name == "%") {
        continue;
      }
      //console.log(result);
      let [[, args]] = result;
      // console.log(args);
      console.log(name + "(" + args.join(", ") + ")");
      // break;
    }
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
