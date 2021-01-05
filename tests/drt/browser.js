const Assert = require("assert");
const {dict} = require("./dict.js");

describe("Browser", function() {
  it("source", async function() {
    const {load, parse, Parser, DRS, Rules} = require("../../src/drt/browser.js");
    await load("bin/", async (path) => {
      let content = require("fs").readFileSync(path).toString();
      return Promise.resolve({
        text() {
          return Promise.resolve(content);
        }
      });
    });
    let drs = new DRS(Rules.from());
    assertThat(drs.feed(new Parser().load(dict).feed("John likes Mary.")).print())
      .equalsTo("let a, b\nJohn(a)\nMary(b)\nlikes(a, b)");
  });

  it("compiled", async function() {
    const {load, parse, DRS, Parser, Rules} = require("../../bin/bundle.js");
    await load("bin/", async (path) => {
      let content = require("fs").readFileSync(path).toString();
      return Promise.resolve({
        text() {
          return Promise.resolve(content);
        }
      });
    });
    let drs = new DRS(Rules.from());
    assertThat(drs.feed(new Parser().load(dict).feed("John likes Mary.")).print())
      .equalsTo("let a, b\nJohn(a)\nMary(b)\nlikes(a, b)");
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
