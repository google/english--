const nearley = require("nearley");
const {ParserRules, ParserStart} = require("./grammar.js");

// console.log(grammar);

function parse(code) {
  let parser = new nearley.Parser(ParserRules, ParserStart, {
    keepHistory: true
  });   
  
  // console.log(grammar);
  parser.feed(code);
  return parser.results;
}

module.exports = {
  parse: parse,
}
