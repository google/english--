const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("errors", () => {
  it("Report", function() {
    let parser = Nearley.from(`
      main -> "foo"
    `);
    try {
      parser.feed("bar");
      throw new Error("Expected parse error");
    } catch ({token, expected}) {
      assertThat(token).equalsTo("b");
      assertThat(expected.length).equalsTo(1);
      assertThat(expected[0].symbol).equalsTo('"f"');
      assertThat(expected[0].based).equalsTo([
        'main$string$1 →  ● "f" "o" "o"',
        'main →  ● main$string$1'
      ]);
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
