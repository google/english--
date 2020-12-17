const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Error handling", () => {
  it("Report", function() {
    let parser = Nearley.from(`
      main -> "foo"
    `);
    try {
      parser.feed("fbar");
      throw new Error("Expected parse error");
    } catch ({token, tracks}) {
      assertThat(token).equalsTo({value: "b"});
      assertThat(tracks.length).equalsTo(1);
      assertThat(tracks[0].symbol).equalsTo('"o"');
      assertThat(tracks[0].stack.length).equalsTo(3);
      const first = tracks[0].stack[0];
      assertThat(first.rule.toString(first.dot))
        .equalsTo('main$string$1 → "f" ● "o" "o"');
      assertThat(first.dot).equalsTo(1);
      assertThat(first.isComplete).equalsTo(false);
      assertThat(first.rule.symbols).equalsTo([
        {"literal": "f"},
        {"literal": "o"},
        {"literal": "o"},
      ]);
      const second = tracks[0].stack[1];
      assertThat(second.rule.toString(second.dot))
        .equalsTo('main$string$1 →  ● "f" "o" "o"');
      const third = tracks[0].stack[2];
      assertThat(third.rule.toString(third.dot))
        .equalsTo('main →  ● main$string$1');
    }
  });

  function message(error) {
    const {token, loc, start, tracks} = error;
      
    let result = [];
    result.push(`Unexpected ${token.type} token: ${token.value}.`);
    result.push(`Instead, I was expecting to see one of the following:`);
    result.push(``);
    for (let track of tracks) {
      result.push(`A ${track.symbol} token based on:`);
      for (let stack of track.stack) {
        const {rule, dot} = stack;
        const {name, symbols} = rule;
        let tail = [];
        for (let i = 0; i < symbols.length; i++) {
          if (dot == i) {
            tail.push("●");
          }
          const symbol = symbols[i];
          tail.push(`%${symbol.type}`);
        }
        result.push(`    ${name} → ${tail.join(" ")}`);
      }
    }
    result.push(``);
    return result.join("\n");
  }

  it("Invalid Token", function() {
    let parser = Nearley.from(`
      @{%
      const lexer = {
        has(token) {
          return true;
        },
        save() {
        },
        reset(buffer) {
          this.buffer = buffer;
        },
        formatError(token) {
          return "format error: " + token;
        },
        save() {
        },
        next() {
          return {
            type: "@unknown",
            value: this.buffer
          };
        },
      }
      %}
      @lexer lexer
      main -> %foo
    `);

    let error;
    try {
      parser.feed("fbar");
    } catch (e) {
      error = e;      
    }

    const {token, loc, start, tracks} = error;
    assertThat(start).equalsTo("f");
    assertThat(token).equalsTo({
      "type": "@unknown",
      "value": "fbar",
    });
    assertThat(tracks.length).equalsTo(1);
    assertThat(tracks[0].symbol).equalsTo('foo');
    assertThat(tracks[0].stack.length).equalsTo(1);
    const first = tracks[0].stack[0];
    assertThat(first.rule.name).equalsTo("main");
    assertThat(first.dot).equalsTo(0);
    assertThat(first.rule.symbols).equalsTo([
      {type: "foo"}
    ]);
    assertThat(first.rule.toString(first.dot))
      .equalsTo('main →  ● %foo');
    assertThat(message(error).trim()).equalsTo(`
Unexpected @unknown token: fbar.
Instead, I was expecting to see one of the following:

A foo token based on:
    main → ● %foo`.trim());

    
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
