const Assert = require("assert");

const {Rules} = require("../../src/drt/rules.js");
const {DRS} = require("../../src/drt/drs.js");
const {Parser} = require("../../src/drt/parser.js");
const {dict} = require("./dict.js");
const {Tokenizer} = require("../../src/drt/lexer.js");

describe("Kinship", function() {
  it.skip("If a woman is married to a man then the woman is the man's wife.", function() {
    // TODO: This isn't right. The "the" isn't resolving correctly.
    assertThat("If a woman is married to a man then the woman is the man's wife.")
      .equalsTo(`
        if (let a, b and woman(a) and married(a) and man(b) and married-to(a, b)) {
          let c, d
          c = d
          woman(c)
          wife(d, the)
        }
    `);
  });
  
  it.skip("If a woman is a man's wife then the woman is married to the man.", function() {
    assertThat("If a woman is a man's wife then the woman is married to the man.")
      .equalsTo(`
       if (let a, b and a = b and woman(a) and wife(b, a)) {
         let c, d
         woman(c)
         married(c)
         man(d)
         married-to(c, d)
       }
    `);
  });

  it("If a woman is a man's wife then the woman is married to the man.", function() {
    assertThat("If a woman is married to a man then the man is married to the woman.")
      .equalsTo(`
       if (let a, b and woman(a) and married(a) and man(b) and married-to(a, b)) {
         let c, d
         man(c)
         married(c)
         woman(d)
         married-to(c, d)
       }
    `);
  });

  it("If a man is a brother of a person's father then the man is the person's uncle.", function() {
    assertThat("If a man is a brother of a person's father then the man is the person's uncle.")
      .equalsTo(`
       if (let a, b and a = b and man(a) and father(b, a a)) {
         let c, d
         c = d
         man(c)
         uncle(d, the)
       }
    `);
  });

  it("Mel is married to Dani.", function() {
    assertThat(`
      Mel is married to Dani. 
      Fabio is Mel's brother.
      Denise is Mel's sister.
      Maura is Mel's mother.
      If a woman is married to a man then the woman is the man's wife.
    `);
  });
});

function assertThat(x) { 
  return {
    trim (str) {
      return str
        .trim()
        .split("\n")
        .map(line => line.trim())
        .join("\n");
    },
    equalsTo(y) {
      let drs = new DRS(Rules.from());
      let parser = new Parser("Discourse", dict);
      let sentences = parser.feed(x);
      drs.feed(sentences);
      Assert.deepEqual(drs.print(), this.trim(y));
    }
  }
}
