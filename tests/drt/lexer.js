const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley} = require("../../src/drt/parser.js");
const utf8 = require("utf8");

describe("Lexer", function() {
  it("Custom lexer", async function() {
    let parser = Nearley.from(`
       @{%
        const lexer = {
          next() {
            if (this.parsed) {
              return undefined;
            }
            this.parsed = true;
            return {type: "foo", value: "foo"};
          },
          save() {
            return {};
          },
          reset(chunk, info) {
          },
          formatError(token) {
          },
          has(name) {
            return true;
          },
        };
       %}
      @lexer lexer
      main -> %foo
    `);
    parser.feed("foo");
  });
    
  it.skip("Moo", async function() {
    this.timeout(500000);
    const fs = require("fs");
    const readline = require("readline");

    const stream = fs.createReadStream("tests/drt/clex_lexicon.pl");

    const rl = readline.createInterface({
      input: stream,
    });

    let parts = {};
    console.log("loading");
    for await (const line of rl) {
      const parser = new Parser(Grammar.fromCompiled(grammar));
      parser.feed(line + "\n");
      let [result] = parser.results;
      if (result.length == 0) {
        continue;
      }
      let [[name]] = result;
      if (name == "%") {
        continue;
      }
      let [[, args]] = result;
      if (!parts[name]) {
        parts[name] = [];
      }
      parts[name].push(args[0]);
      // console.log(name);
      if (name == "prep") {
        break;
      }
    }

    console.log(Object.keys(parts));
    parts["WS"] = /[ \t]+/;
    for (let adv of parts["adv"]) {
      console.log(adv);
    }
    let lexer = moo.compile(parts);
    console.log("done compiling");
    lexer.reset("clip-on cast-off awkwardly ");
    console.log("done reseting");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("WS");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("WS");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("mn_pl");
    assertThat(lexer.next().type).equalsTo("mn_pl");
    assertThat(lexer.next().type).equalsTo("WS");
    console.log("done testing");
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
