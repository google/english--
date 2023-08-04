/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Assert = require("assert");
const {Console, transpile} = require("../src/console.js");
const {dict} = require("./dict.js");

function unroll(gen) {
  const result = [];
  for (const item of gen) {
    result.push(item);
  }
  return result;
}

describe("Console", () => {
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
      a = c.
      capital(c).
      capital-of(c, b).
      let d, e: d = e capital(e) capital-of(e, b)?
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

  it("Who is Mel's uncle?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every brother of one's parent is one's uncle.
      Maura is Mel's parent.
      Tio Bo is Maura's brother.
      Who is Mel's uncle?
    `))).equalsTo(["Tio Bo."]);
  });
  
  it("Who is Mel's aunt?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every sister of one's parent is one's aunt.
      Maura is Mel's parent.
      Tio Gordinha is Maura's sister.
      Who is Mel's aunt?
    `))).equalsTo(["Tio Gordinha."]);
  });
  
  it.skip("Who is Mel's uncle?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every husband of a sibling of one's parent is one's uncle.
      Maura is Mel's parent.
      Tio Gordao is Tia Gordinha's husband.
      Tia Gordinha is Maura's sibling.
      Who is Mel's uncle?
    `))).equalsTo(["Tio Gordao."]);
  });
  
  it("Who is Tio Bo's nephew?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every son of one's sibling is one's nephew.
      Mel is Maura's son.
      Maura is Tio Bo's sibling.
      Who is Tio Bo's nephew?
    `))).equalsTo(["Mel."]);
  });
  
  it("Who is Tio Bo's niece?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every daughter of one's sibling is one's niece.
      Denise is Maura's daughter.
      Maura is Tio Bo's sibling.
      Who is Tio Bo's niece?
    `))).equalsTo(["Denise."]);
  });
  
  it.skip("Who is Tio Bo's niece?", () => {
    assertThat(unroll(new Console(dict).load(`
      Every daughter of one's sibling is one's niece.
      Denise is Maura's daughter.
      Lais is Tia Gordinha's daughter.
      Maura is Tio Bo's sibling.
      Tia Gordinha is Tio Bo's sibling.
      Who is Tio Bo's niece?
    `))).equalsTo(["Denise."]);
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
  
  it("Sam is a brazilian engineer.", () => {
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

describe("Queries", () => {
  // TODO(goto): there is something wrong here with the second for-loop
  // because it is reusing the universal added (and only visible to)
  // the previous for-loop.
  it("Who is Maura's sibling?", () => {
    assertThat(`
      Everyone's sibling is a child of one's parent.
      Every child of one's parent is one's sibling.
      Maura is Tio Bo's sibling.
      Who is Maura's sibling?
    `, true)
      .equalsTo(`
      for (let every a, b: sibling(b) sibling-of(b, a)) {
        b = d.
        parent(c).
        parent-of(c, a).
        child(d).
        child-of(d, c).
      }
      for (let every e, f: parent(f) parent-of(f, a) child(e) child-of(e, f)) {
        e = g.
        sibling(g).
        sibling-of(g, a).
      }
      Maura(h).
      Tio-Bo(i).
      h = j.
      sibling(j).
      sibling-of(j, i).
      let k, l: k = l sibling(l) sibling-of(l, h)?
    `);
  });  

  function assertThat(x, transpile) {
    return {
      trim (str) {
        return str
          .trim()
          .split("\n")
          .map(line => line.trim())
          .join("\n");
      },
      equalsTo(expected) {
        if (transpile) {
          Assert.deepEqual(this.trim(new Console(dict).transpile(x)), this.trim(expected));
          return;
        }
        const actual = unroll(new Console(dict).load(x));
        Assert.deepEqual(actual, expected);
      }
    }
  }
});
