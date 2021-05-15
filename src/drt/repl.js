const {KB} = require("logic/src/solver.js");
const {DRS} = require("../../src/drt/drs.js");
const {Rules} = require("../../src/drt/rules.js");
const {dict} = require("./dict.js");
const {Parser} = require("../../src/drt/parser.js");

class Console {
  constructor() {
    this.drs = new DRS(Rules.from());
    this.parser = new Parser("Discourse", dict);
    this.kb = new KB();
  }
  load(code) {
    return this.kb.read(this.transpile(code))
  }

  transpile(code) {
    let sentences = this.parser.feed(code);
    if (sentences.length > 1) {
      throw new Error("Ambiguous input: " + code);
    }
    this.drs.feed(sentences);
    return this.drs.print();
  }
}


module.exports = {
  Console: Console,
  //transpile: transpile,
};
