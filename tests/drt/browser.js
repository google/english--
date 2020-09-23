const Assert = require("assert");

const {load, parse, DRS, Rules} = require("../../src/drt/main.js");

describe("Browser", function() {
    it("main", async function() {
        await load("bin/", async (path) => {
            let content = require("fs").readFileSync(path).toString();
            return Promise.resolve({
                text() {
                    return Promise.resolve(content);
                }
            });
        });
        assertThat(parse("John likes Mary.").length).equalsTo(1);
        let drs = new DRS(Rules.from());
        assertThat(drs.feed("John likes Mary.").print())
          .equalsTo("drs(a, b) {\nJohn(a)\nMary(b)\na likes b\n}");
    });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
