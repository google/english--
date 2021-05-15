const {KB} = require("logic/src/solver.js");
const {DRS} = require("../../src/drt/drs.js");
const {Rules} = require("../../src/drt/rules.js");
const {dict} = require("./dict.js");
const {Parser} = require("../../src/drt/parser.js");

class REPL {
  constructor() {
    this.kb = new KB();
  }
  read(code) {
    return this.kb.read(transpile(code))
  }
}

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

module.exports = {
  REPL: REPL,
  transpile: transpile,
};
