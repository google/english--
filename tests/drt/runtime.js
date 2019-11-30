const {deepEqual} = require("assert");
const {grammar} = require("../../src/drt/parser.js");

describe.only("Runtime", function() {
  it("compile", function() {
    let result = [];

    result.push(`@builtin "whitespace.ne"`);
    result.push(`@include "base.ne"`);
    result.push(``);

    let rules = grammar();

    let name = (term) => {
     if (typeof term == "string") {
      return term;
     } else if (term["@type"] == "Literal") {
      return `"${term.name}"i`;
     } else {
      let result = term.name;
      result = result.replace("'", '_');
      return result;
     }
    };

    for (let {head, tail, prod} of rules) {
     for (let line of tail) {
      let terms = line.map(name).join(" ");
      let types = line.map(term => JSON.stringify(term.types || {}));

      //if (prod) {
      // console.log(prod);
      //}

      result.push(`${name(head)} -> ${terms} {% (d, l, r) => process("${head.name}", ${JSON.stringify(head.types || {})}, d, [${types}], l, r) %}`);

     }
    }

    result.push("WS -> _");

    const fs = require("fs");
    fs.writeFileSync("./tests/drt/test.ne", result.join("\n"));
  });

  
  it("parse", function() {
    const {Parser} = require("nearley");
    const {ParserRules, ParserStart} = require("./test.js");

    let parse = (rule, src) => {
     const parser = new Parser(ParserRules, rule, {
       keepHistory: true
      });
     return parser.feed(src).results[0];
    }

    assertThat(parse("V", "walked")).equalsTo({
      "@type": "V",
      "children": [{
        "@type": "V",
        "children": [{
          "@type": "V",
          "children": ["walk"],
          "types": {
            "stat": "-", 
            "trans": "-",
          },
          "loc": "0",
        }],
        "types": {
          "fin": "-",
          "num": 1,
          "stat": 3,
          "tense": "pres",
          "tp": 4,
          "trans": 2,
        },
        "loc": "0",
      }, "ed", ],
      "types": {
        "fin": "part",
        "num": 1,
        "stat": 2,
        "tense": 5,
        "tp": 4,
        "trans": 3,
      },
      "loc": "0",
    }
    );

    assertThat(parse("WS", " ")).equalsTo([null]);
    assertThat(parse("ADJ", "happy")).equalsTo({
       "@type": "ADJ", 
       "types": {}, 
       "children": ["happy"],
       "loc": "0",
    });
    assertThat(parse("V", "shine")).equalsTo({
       "@type": "V", 
       "types": {
        "stat": "-",
        "trans": "-"
       }, 
       "children": ["shine"],
       "loc": "0",
    });

  });

  function assertThat(x) {
   return {
    equalsTo(y) {
      deepEqual(x, y);
    }
   };
  }

});