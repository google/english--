const Assert = require("assert");
const {dict} = require("../../src/drt/dict.js");

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
    assertThat(drs.feed(new Parser().load(dict).feed("Brian likes Mary.")).print(".\n", false))
      .equalsTo("Brian(a).\nMary(b).\nlike(s0, a, b).\n");
  });

  it.skip("compiled", async function() {
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
    assertThat(drs.feed(new Parser().load(dict).feed("Brian likes Mary.")).print())
      .equalsTo("nBrian(a).\nMary(b).\nlike(s0, a, b).");
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
