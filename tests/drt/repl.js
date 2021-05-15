const Assert = require("assert");
const {KB} = require("logic/src/solver.js");
const {DRS} = require("../../src/drt/drs.js");
const {Rules} = require("../../src/drt/rules.js");
const {dict} = require("./dict.js");
const {Parser} = require("../../src/drt/parser.js");

describe("REPL", () => {

  function transpile(code) {
    let drs = new DRS(Rules.from());
    let parser = new Parser("Discourse", dict);
    let sentences = parser.feed(code);
    if (sentences.length > 1) {
      throw new Error("Ambiguous input: " + code);
    }
    drs.feed(sentences);
    return drs.print();
  }
  
  it("Sam is happy. Is Sam happy?", () => {
    const code = `
      Sam is happy. Is Sam happy?
    `;
    assertThat(transpile(code))
      .equalsTo(`
       Sam(a).
       happy(a).
       happy(a)?
    `, true);
    assertThat(new KB().read(transpile(code)))
      .equalsTo([{}]);
  });

  it("Is Sam happy about Brazil?", () => {
    const code = `
      Every person who is brazilian is happy about Brazil.
      Sam is brazilian.
      Sam is a person.
      Is Sam happy about Brazil?
    `;
    assertThat(transpile(code)).equalsTo(`
       Brazil(a).
       for (let every b: person(b) brazilian(b)) {
         happy(b).
         happy-about(b, a).
       }
       Sam(c).
       brazilian(c).
       person(c).
       happy(c) happy-about(c, a)?
    `, true);
    assertThat(new KB().read(transpile(code))).equalsTo([{}]);
  });

  it("Sam is happy. Is Sam happy?", () => {
    // We are missing the eventuality parameter inside the question.
    assertThat(transpile(`
      Sam loves Dani.
      Who loves Dani?
    `)).equalsTo(`
      Sam(a).
      Dani(b).
      love(s0, a, b).
      let c: love(c, b)?
    `, true);
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
      equalsTo(y, trim = false) {
        if (trim) {
          Assert.deepEqual(this.trim(x), this.trim(y));
        } else {
          Assert.deepEqual(x, y);
        }
      }
    }
  }
});
