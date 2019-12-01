const {deepEqual} = require("assert");
const {grammar, nodes, clean} = require("../../src/drt/parser.js");
const {
 S, NP, NP_, PN, VP_, VP, V, BE, HAVE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP,
 Discourse, Sentence
} = nodes;

const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./test.js");

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
   return parser.feed(src).results[0];
  }

  function first(node) {
   return clean(node.children[0]);
  }

  it("stink", function() {
    assertThat(parse("stink", "V")).equalsTo({
      "@type": "V",
      "children": ["stink"],
      "loc": 0,
      "types": {
        "stat": "+",
        "trans": "-"
      }
    });
  });

  it("walks", function() {
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
  });

  it("walked", function() {
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
    });
  });

  it("whitespace", function() {
    assertThat(parse(" ", "WS")).equalsTo([null]);
  });

  it("happy", function() {
    assertThat(parse("happy", "ADJ")).equalsTo({
       "@type": "ADJ", 
       "types": {}, 
       "children": ["happy"],
       "loc": "0",
    });
  });

  it("shine", function() {
    assertThat(parse("shine", "V")).equalsTo({
       "@type": "V", 
       "types": {
        "stat": "-",
        "trans": "-"
       }, 
       "children": ["shine"],
       "loc": "0",
    });
  });

  it("she", function() {
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
    assertThat(first(parse("He likes her.")))
     .equalsTo(S(NP(PRO("He")), 
                 VP_(VP(V("likes"), 
                        NP(PRO("her"))))));
  });

  it("Jones loves.", function() {
    assertThat(first(parse("Jones loves.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves")))));
  });

  it("Mary loves", function() {
    assertThat(first(parse("Mary loves.")))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("loves")))));
  });

  it("Anna loves.", function() {
    assertThat(first(parse("Anna loves.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves")))));
  });

  it("John stinks", function() {
    assertThat(first(parse("John stinks.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("stinks")))));
  });

  it("a man loves", function() {
    assertThat(first(parse("a man loves.")))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(VP(V("loves")))));
  });

  it("every donkey stinks", function() {
    assertThat(first(parse("every donkey stinks.")))
     .equalsTo(S(NP(DET("every"), N("donkey")),
                 VP_(VP(V("stinks")))));
  });

  it("the woman loves.", function() {
    assertThat(first(parse("the woman loves.")))
     .equalsTo(S(NP(DET("the"), N("woman")),
                 VP_(VP(V("loves")))));
  });

  it("he loves", function() {
    assertThat(first(parse("he loves.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves")))));
  });

  it("she loves", function() {
    assertThat(first(parse("she loves.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves")))));
  });

  it("it stinks.", function() {
    assertThat(first(parse("it stinks.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(VP(V("stinks")))));
  });

  it("it does not stink.", function() {
    assertThat(first(parse("it does not stink.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
  });

  it("the book does not stink.", function() {
    assertThat(first(parse("the book does not stink.")))
     .equalsTo(S(NP(DET("the"), N("book")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
  });

  it("he loves her.", function() {
    assertThat(first(parse("he loves her.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("she loves the book", function() {
    assertThat(first(parse("she loves the book.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves"), NP(DET("the"), N("book"))))));
  });

  it("every man loves her.", function() {
    assertThat(first(parse("every man loves her.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("every man loves John.", function() {
    assertThat(first(parse("every man loves John.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PN("John"))))));
  });

  it("shes does not love.", function() {
    assertThat(first(parse("she does not love.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(AUX("does"), "not", VP(V("love")))));
  });

  it("she does not love him.", function() {
    assertThat(first(parse("she does not love him.")))
     .equalsTo(S(NP(PRO("she")),
                  VP_(AUX("does"), "not", 
                      VP(V("love"), NP(PRO("him"))))));
  });

  it("John does not like the book.", function() {
    assertThat(first(parse("John does not like the book.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(AUX("does"), "not", 
                     VP(V("like"), NP(DET("the"), N("book"))))));
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
      deepEqual(x, y);
    }
   };
  }

});