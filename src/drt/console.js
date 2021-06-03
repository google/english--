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
    yield * this.kb.read(this.transpile(code))
  }

  transpile(code) {
    const parser = new Parser("Discourse", this.dict);
    let sentences = parser.feed(code);
    if (sentences.length > 1) {
      throw new Error("Ambiguous input: " + code);
    }
    return this.drs.feed(sentences);
  }
}


module.exports = {
  Console: Console,
};
