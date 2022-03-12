const Assert = require("assert");

const {Rules} = require("../src/rules.js");
const {DRS} = require("../src/drs.js");
const {Parser} = require("../src/parser.js");
const {dict} = require("./dict.js");
const {Tokenizer} = require("../src/lexer.js");

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
       if (man(b) woman(a) married(a) married-to(a, b)) {
         woman(d).
         man(c).
         married(c).
         married-to(c, d).
       }
    `);
  });

  it.skip("If a man is a brother of a person's father then the man is the person's uncle.", function() {
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

  it.skip("Every uncle is a male relative who is a sibling of a parent.", function() {
    assertThat("Every uncle is a male relative who is either a sibling of a parent or a person who is married to a sibling of a parent.")
      .equalsTo(`
        for (let every a: uncle(a)) {
          a = b.
          male-relative(b).
          relative(b).
          either (
            b = e.
            sibling(e).
            parent(f).
            sibling-of(e, f).
          ) or (
            b = g.
            person(g).
            married(g).
          ).
          parent(c).
          sibling(d).
          male-relative-of(b, c).
          male-relative-to(b, d).
       }
    `);
  });

  it.skip("Every uncle is a male relative who is either [a sibling of a parent] or [a husband of [a sibling of a parent]].", function() {
    assertThat("Every uncle is a male relative who is either [a sibling of a parent] or [a husband of [a sibling of a parent]].")
      .equalsTo(`
        for (let every a: uncle(a)) {
          a = b.
          male-relative(b).
          relative(b).
          either (
            b = c.
            sibling(c).
            parent(d).
            sibling-of(c, d).
          ) or (
            b = e.
            husband(e).
            parent(g).
            sibling(f).
            husband-of(e, f).
            sibling-of(f, g).
          ).
        }
    `);
  });

  it.skip("Everyone's uncle is a male relative who is either [a sibling of a parent] or [a husband of [a sibling of a parent]].", () => {
    assertThat("Everyone's uncle is a male relative who is either [a sibling of a parent] or [a husband of [a sibling of a parent]].")
      .equalsTo(`
       for (let every a) {
         for (let every b: uncle(b, a)) {
           b = c.
           male-relative(c).
           relative(c).
           either (
             c = d.
             sibling(d).
             parent(e).
             sibling-of(d, e).
           ) or (
             c = f.
             husband(f).
             parent(h).
             sibling(g).
             husband-of(f, g).
             sibling-of(g, h).
           ).
         }
       }
    `);
  });
  
  it.skip("Everyone's uncle is one's male relative who is either [a sibling of one's parent] or [a husband of [a sibling of one's parent]].", () => {
    assertThat("Everyone's uncle is one's male relative who is either [a sibling of one's parent] or [a husband of [a sibling of one's parent]].")
      .equalsTo(`
       for (let every a) {
         for (let every b: uncle(b, a)) {
           b = f.
           sibling(d).
           male-relative(f).
           relative(f, a).
           either (
             f = c.
             parent(e, a).
             sibling-of(d, e).
           ) or (
             f = e.
             husband(f).
             parent(h, a).
             sibling(g).
             husband-of(f, g).
             sibling-of(g, h).
           ).
         }
       }
    `);
  });
  
  it("Every husband of a sibling of one's parent is one's uncle.", () => {
    assertThat("Every husband of [a sibling of one's parent] is one's uncle.")
      .equalsTo(`
       for (let every a) {
         for (let every b: sibling(d) parent(c, a) husband(b) husband-of(b, d) sibling-of(d, c)) {
           b = e.
           uncle(e, a).
         }
       }
    `);
  });
  
  it("Every sibling of one's parent is one's uncle.", () => {
    assertThat("Every sibling of one's parent is one's uncle.")
      .equalsTo(`
       for (let every a) {
         for (let every b: sibling(b) parent(c, a) sibling-of(b, c)) {
           b = d.
           uncle(d, a).
         }
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
      Assert.deepEqual(this.trim(drs.print()), this.trim(y));
    }
  }
}
