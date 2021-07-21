const Assert = require("assert");
const {Console, transpile} = require("../src/console.js");
const {dict} = require("./dict.js");

describe("Console", () => {

  function unroll(gen) {
    const result = [];
    for (const item of gen) {
      result.push(item);
    }
    return result;
  }
  
  it("Sam is happy. Is Sam happy?", () => {
    const code = `
      Sam is happy. Is Sam happy?
    `;
    assertThat(new Console(dict).transpile(code))
      .equalsTo(`
       Sam(a).
       happy(a).
       happy(a)?
    `, true);
    assertThat(unroll(new Console(dict).load(code)))
      .equalsTo(["Yes."]);
  });

  it("Sam is happy. Is Dani happy?", () => {
    assertThat(unroll(new Console(dict).load(`
      Sam is happy. Is Dani happy?
    `))).equalsTo(["I don't know."]);
  });

  it("Is Sam happy about Brazil?", () => {
    const code = `
      Every person who is brazilian is happy about Brazil.
      Sam is brazilian.
      Sam is a person.
      Is Sam happy about Brazil?
    `;
    assertThat(new Console(dict).transpile(code)).equalsTo(`
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
    assertThat(unroll(new Console(dict).load(code))).equalsTo(["Yes."]);
  });

  it("Sam is happy. Is Sam happy?", () => {
    // We are missing the eventuality parameter inside the question.
    assertThat(new Console(dict).transpile(`
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
    assertThat(new Console(dict).transpile(code)).equalsTo(`
      Brasilia(a).
      Brazil(b).
      capital(a).
      capital-of(a, b).
      let c: capital(c) capital-of(c, b)?
    `, true);
    assertThat(unroll(new Console(dict).load(code))).equalsTo(["Brasilia."]);
  });

  it("Mel is the father of Leo?", () => {
    assertThat(unroll(new Console(dict).load(`
      Mel is the father of Leo.
      What is the father of Leo?
    `))).equalsTo(["Mel."]);
  });

  it("Is Brazil a country which borders Argentina?", () => {
    assertThat(unroll(new Console(dict).load(`
      Brazil is a country in South America.
      Brazil borders Argentina.
      Is Brazil a country which borders Argentina?
    `))).equalsTo(["Yes."]);
  });

  it("", () => {
    const {dict} = require("../src/dict.js");
    const console = new Console(dict);
    // Does Sam work? <- wrong bindings
    // What is Sam interested in? <- syntax error
    assertThat(console.transpile(`
      Sam is a brazilian engineer.
      He works at Google on the Web Platform.
      He is interested in Compilers.
      He likes every area of Computer Science.
    `)).equalsTo(`
      Sam(a).
      brazilian-engineer(a).
      engineer(a).
      Web-Platform(b).
      Google(c).
      work-on(s0, b).
      work-at(s0, c).
      work(s0, a).
      Compilers(d).
      interest-in(s1, d).
      interest(s1, e, c).
      Computer-Science(f).
      for (let every g: area(g) area-of(g, f)) {
        like(s2, f, g).
      }
    `, true);        
  });
  
  it("What is the capital of Brazil?", () => {
    const {dict} = require("../src/dict.js");
    const console = new Console(dict);
    assertThat(unroll(console.load(`Sam is a brazilian engineer.`))).equalsTo([]);
    // We should be able to write "Sam is brazilian and an engineer".
    // We should be able to write "Sam is brazilian engineer who works at Google".
    assertThat(console.transpile(`Sam is a brazilian engineer.`)).equalsTo(`
      brazilian-engineer(a).
      engineer(a).
    `, true);
    assertThat(console.transpile(`Sam works at Google on the Web Platform.`)).equalsTo(`
      Web-Platform(b).
      Google(c).
      work-on(s0, b).
      work-at(s0, c).
      work(s0, a).
    `, true);        
    assertThat(unroll(console.load(`Who is an engineer?`))).equalsTo(["Sam."]);
    assertThat(unroll(console.load(`Is Sam an engineer?`))).equalsTo(["Yes."]);
    assertThat(unroll(console.load(`Is Sam brazilian?`))).equalsTo(["I don't know."]);
    assertThat(console.transpile(`Is Sam brazilian?`)).equalsTo(`
      brazilian(a)?
    `, true);    
    assertThat(unroll(console.load(`What is the capital of Brazil?`))).equalsTo(["I don't know."]);
    assertThat(unroll(console.load(`Brasilia is the capital of Brazil.`))).equalsTo([]);
    assertThat(unroll(console.load(`What is the capital of Brazil?`))).equalsTo(["Brasilia."]);
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