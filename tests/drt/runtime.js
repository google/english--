const {deepEqual} = require("assert");
const {grammar, nodes, clean} = require("../../src/drt/parser.js");
const {
 S, NP, NP_, PN, VP_, VP, V, BE, HAVE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP,
 Discourse, Sentence
} = nodes;

const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./test.js");

describe("Runtime", function() {
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

    for (let {head, tail, skip, prod} of rules) {
     for (let line of tail) {
      let terms = line.map(name).join(" ");
      let types = line.map(term => JSON.stringify(term.types || {}));

      let body = `process("${head.name}", ${JSON.stringify(head.types || {})}, d, [${types}], l, r)`;

      if (skip) {
       body = `((root) => node("${skip}", root.types, root.children[0].children, root.loc))(${body})`;
      } else if (typeof prod == "string") {
       body = `(${prod})(${body})`;
      }

      result.push(`${name(head)} -> ${terms} {% (d, l, r) => ${body} %}`);

     }
    }

    result.push("WS -> _");

    const fs = require("fs");
    fs.writeFileSync("./tests/drt/test.ne", result.join("\n"));
  });


  function parse(src, rule = ParserStart) {
   const parser = new Parser(ParserRules, rule, {
     keepHistory: true
    });
   return clean(parser.feed(src).results[0]).children[0];
  }

  it.skip("parse", function() {

    console.log(JSON.stringify(parse("walks", "V"), undefined, 2));

    assertThat(parse("walks", "V")).equalsTo({
      "@type": "V",
      "children": ["walks"],
      "loc": 0,
      "types": {
        "fin": "+",
        "num": "sing",
        "stat": 2,
        "tense": "pres",
        "tp": "-past",
        "trans": 1,
      }
    });

    assertThat(parse("walked", "V")).equalsTo({
      "@type": "V",
      "children": ["walked"],
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

    assertThat(parse(" ", "WS")).equalsTo([null]);
    assertThat(parse("happy", "ADJ")).equalsTo({
       "@type": "ADJ", 
       "types": {}, 
       "children": ["happy"],
       "loc": "0",
    });

    assertThat(parse("shine", "V")).equalsTo({
       "@type": "V", 
       "types": {
        "stat": "-",
        "trans": "-"
       }, 
       "children": ["shine"],
       "loc": "0",
    });

    assertThat(parse("she", "NP")).equalsTo({
      "@type": "NP",
      "children": [{
        "@type": "PRO",
        "children": ["she"],
        "loc": 0,
        "types": {
          "case": "+nom",
          "num": "sing",
          "refl": "-",
        }
      }],
      "loc": 0,
      "types": {
        "case": 3,
        "gap": "-",
        "num": 1,
      }
    });
  });

  it("He likes her", function() {
    assertThat(parse("He likes her."))
     .equalsTo(S(NP(PRO("He")), 
                 VP_(VP(V("likes"), 
                        NP(PRO("her"))))));
  });

  it("Jones loves.", function() {
    assertThat(parse("Jones loves."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves")))));
  });

  it("Mary loves", function() {
    assertThat(parse("Mary loves."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("loves")))));
  });

  it("Anna loves.", function() {
    assertThat(parse("Anna loves."))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves")))));
  });

  it("John stinks", function() {
    assertThat(parse("John stinks."))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("stinks")))));
  });

  it("a man loves", function() {
    assertThat(parse("a man loves."))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(VP(V("loves")))));
  });

  it("every donkey stinks", function() {
    assertThat(parse("every donkey stinks."))
     .equalsTo(S(NP(DET("every"), N("donkey")),
                 VP_(VP(V("stinks")))));
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
      deepEqual(x, y);
    }
   };
  }

});