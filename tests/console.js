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

  it.skip("Is Sam happy about Brazil?", () => {
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
       c = d.
       person(d).
       happy(c) happy-about(c, a)?
    `, true);
    assertThat(unroll(new Console(dict).load(code))).equalsTo(["Yes."]);
  });

  it("Sam loves Dani. Who loves Dani??", () => {
    // We are missing the eventuality parameter inside the question.
    assertThat(new Console(dict).transpile(`
      Sam loves Dani.
      Who loves Dani?
    `)).equalsTo(`
      Dani(a).
      Sam(b).
      love(s0, b, a).
      let c: love(c, a)?
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
      Brazil(a).
      Brasilia(b).
      b = c.
      capital(c).
      capital-of(c, a).
      let d, e: d = e capital(e) capital-of(e, a)?
    `, true);
    assertThat(unroll(new Console(dict).load(code))).equalsTo(["Brasilia."]);
  });

  it("Mel is the father of Leo?", () => {
    assertThat(unroll(new Console(dict).load(`
      Mel is the father of Leo.
      What is the father of Leo?
    `))).equalsTo(["Mel."]);
  });

  it.skip("Is Brazil a country which borders Argentina?", () => {
    assertThat(unroll(new Console(dict).load(`
      Brazil is a country in South America.
      Brazil borders Argentina.
      Is Brazil a country which borders Argentina?
    `))).equalsTo(["Yes."]);
  });

  it.skip("", () => {
    const {dict} = require("../src/large.js");
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
  
  it.skip("Sam is a brazilian engineer.", () => {
    const {dict} = require("../src/large.js");
    const console = new Console(dict);
    assertThat(unroll(console.load(`Sam is a brazilian engineer.`))).equalsTo([]);
    // We should be able to write "Sam is brazilian and an engineer".
    // We should be able to write "Sam is brazilian engineer who works at Google".
    assertThat(console.transpile(`Sam is a brazilian engineer.`)).equalsTo(`
      a = c.
      brazilian-engineer(c).
      engineer(c).
    `, true);
    assertThat(console.transpile(`Sam works at Google on the Web Platform.`)).equalsTo(`
      Google(d).
      Web-Platform(e).
      work-on(s0, e).
      work(s0, a).
      work-at(s0, d).
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
    
  it("Penguins are birds that do not fly. Do penguins fly?", () => {
    const {dict} = require("../src/large.js");
    // NOTE(goto): the state of "flying" messes up the question.
    assertThat(new Console(dict).transpile(`
      Penguins are birds that do not fly. Do penguins fly?
    `.trim()))
      .equalsTo(`
       for (let every a: penguin(a)) {
         not (
           fly(s0, a).
         ).
         bird(a).
       }
       for (let every b: penguin(b)) {
         fly(b).
       }
       ?
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
