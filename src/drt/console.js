const {KB} = require("logic/src/solver.js");
const {DRS} = require("../../src/drt/drs.js");
const {Rules} = require("../../src/drt/rules.js");
const {Parser} = require("../../src/drt/parser.js");

class Console {
  constructor(dict) {
    this.drs = new DRS(Rules.from());
    this.kb = new KB();
    this.dict = dict;
  }

  *load(code) {
    const parser = new Parser("Discourse", this.dict);
    let sentences = parser.feed(code);

    if (sentences.length > 1) {
      throw new Error("Ambiguous input: " + code);
    }

    for (let sentence of sentences[0]) {
      const nodes = this.drs.feed([[sentence]]);
      const type = sentence.children[0]["@type"];
      if (type == "Statement") {
        const statement = this.drs.print(undefined, undefined, nodes);
        this.kb.read(statement).next();
      } else if (type == "Question") {
        const q = this.drs.print(undefined, undefined, nodes);
        const result = this.kb.read(q);
        const first = result.next();
        if (first.done) {
          yield "I don't know.";
        } else if (Object.keys(first.value).length == 0) {
          yield "Yes.";
        } else {
          const [key] = Object.values(first.value)[0];
          const ref = this.drs.head.find((el) => el.name == key);
          const value = ref.value || "Yes";
          yield `${value}.`;
          for (let answer of result) {
            const key = Object.values(answer)[0];
            const ref = this.drs.head.find((el) => el.name == key);
            yield `${value}.`;
          }
        }
      }
    }
  }

  transpile(code) {
    const parser = new Parser("Discourse", this.dict);
    let sentences = parser.feed(code);
    if (sentences.length > 1) {
      throw new Error("Ambiguous input: " + code);
    }
    const nodes = this.drs.feed(sentences);
    return this.drs.print(undefined, undefined, nodes);
  }
}


module.exports = {
  Console: Console,
};
