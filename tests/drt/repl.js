const Assert = require("assert");
const {Console, transpile} = require("../../src/drt/repl.js");

describe("Console", () => {
  
  it("Sam is happy. Is Sam happy?", () => {
    const code = `
      Sam is happy. Is Sam happy?
    `;
    assertThat(new Console().transpile(code))
      .equalsTo(`
       Sam(a).
       happy(a).
       happy(a)?
    `, true);
    assertThat(new Console().load(code))
      .equalsTo([{}]);
  });

  it("Is Sam happy about Brazil?", () => {
    const code = `
      Every person who is brazilian is happy about Brazil.
      Sam is brazilian.
      Sam is a person.
      Is Sam happy about Brazil?
    `;
    assertThat(new Console().transpile(code)).equalsTo(`
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
    assertThat(new Console().load(code)).equalsTo([{}]);
  });

  it("Sam is happy. Is Sam happy?", () => {
    // We are missing the eventuality parameter inside the question.
    assertThat(new Console().transpile(`
      Sam loves Dani.
      Who loves Dani?
    `)).equalsTo(`
      Sam(a).
      Dani(b).
      love(s0, a, b).
      let c: love(c, b)?
    `, true);
  });

  it("What is the capital of Brazil?", () => {
    const code = `
      Brasilia is the capital of Brazil.
      What is the capital of Brazil?
      // Brazil borders all countries in South-America.
      // Every country in South-America is beautiful.
      // Argentina is a country in South-America.
      // NOTES: 
      // - Does Brazil border Argentina? is missing the eventuality
      // - South America can't be used because of the spaces
      // - Which countries border Brazil?
    `;
    assertThat(new Console().transpile(code)).equalsTo(`
      Brasilia(a).
      Brazil(b).
      capital(a).
      capital-of(a, b).
      let c: capital(c) capital-of(c, b)?
    `, true);
    assertThat(new Console().load(code)).equalsTo([{"c": "a"}]);
  });
  
  it("What is the capital of Brazil?", () => {
    const console = new Console();
    assertThat(console.load(`Brasilia is the capital of Brazil.`)).equalsTo([]);
    assertThat(console.load(`What is the capital of Brazil?`)).equalsTo([{"c": "a"}]);
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
