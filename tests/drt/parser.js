const {deepEqual} = require("assert");
const {grammar, nodes, clean} = require("../../src/drt/parser.js");
const {
 S, NP, NP_, PN, VP_, VP, V, BE, HAVE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP,
 Discourse, Sentence
} = nodes;

const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./../../src/drt/english.js");

const {capture, match, merge, resolve, process, node} = require("./../../src/drt/processor.js");

describe.only("Runtime", function() {
  it("compile", function() {
    let result = [];

    result.push(`@builtin "whitespace.ne"`);
    result.push(`@include "base.ne"`);
    result.push(`@{% const {capture, match, merge, resolve, process, node} = require("./processor.js"); %}`);
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

    for (let rule of rules) {
     let {head, tail, skip, prod} = rule;
     for (let line of tail) {
      let terms = line.map(name).join(" ");
      let types = line.filter(term => term != "null").map(term => JSON.stringify(term.types || {}));

      let body = `process("${head.name}", ${JSON.stringify(head.types || {})}, d, [${types}], l, r)`;

      if (skip) {
       body = `((root) => node("${skip}", Object.assign(root.types, ${JSON.stringify(rule.types)}), root.children[0].children, root.loc))(${body})`;
      } else if (typeof prod == "string") {
       body = `(${prod})(${body})`;
      }

      result.push(`${name(head)} -> ${terms} {% (d, l, r) => ${body} %}`);

     }
    }

    // result.push("WS -> _");

    const fs = require("fs");
    fs.writeFileSync("./src/drt/english.ne", result.join("\n"));
  });

  it("capture", function() {
    // base case
    assertThat(capture({}, {})).equalsTo({});
    // empty child, non-empty conditions
    assertThat(capture({}, {"a": "b"})).equalsTo(false);
    // non-empty child, empty conditions
    assertThat(capture({"a": "b"}, {})).equalsTo(false);
    // matching child and condition
    assertThat(capture({"a": "b"}, {"a": "b"})).equalsTo({});
    // non-matching child and condition
    assertThat(capture({"a": "b"}, {"a": "c"})).equalsTo(false);
    // captured feature
    assertThat(capture({"a": "b"}, {"a": 1})).equalsTo({"1": "b"});
    // two variables
    assertThat(capture({"a": "b", "c": "d"}, {"a": "b", "c": 1})).equalsTo({"1": "d"});
    // e = f is not met
    assertThat(capture({"c": "d"}, {"e": "f"})).equalsTo(false);
    // e = f is met with a variable
    assertThat(capture({"e": 1}, {"e": "f"})).equalsTo({"@1": "f"});
    // captured enumeration
    assertThat(capture({"a": ["b", "c"]}, {"a": 1})).equalsTo({"1": ["b", "c"]});
    // captured enumeration
    assertThat(capture({"a": ["b", "c"]}, {"a": "b"})).equalsTo({});
  });

  it("match", function() {
    assertThat(match([], [])).equalsTo({});
    assertThat(match([1], [])).equalsTo(false);
    assertThat(match([], [1])).equalsTo(false);
    assertThat(match([{}], [{}])).equalsTo({});
    assertThat(match([{"a": "b"}], [{"a": "c"}])).equalsTo(false);
    assertThat(match([{"a": "b"}], [{"a": "b"}])).equalsTo({});
    assertThat(match([{"a": "b"}], [{"a": 1}])).equalsTo({"1": "b"});
    assertThat(match([{"a": "b"}, {"a": "c"}], [{"a": 1}, {"a": 1}])).equalsTo(false);
    assertThat(match([{"a": "b", "c": "d"}], [{"a": 1, "c": 2}])).equalsTo({"1": "b", "2": "d"});
    assertThat(match([{"a": "b"}, {"c": "d"}], [{"a": 1}, {"c": 2}])).equalsTo({"1": "b", "2": "d"});
    assertThat(match([{"a": 1}], [{"a": "b"}])).equalsTo({"@1": "b"});
    assertThat(match([{"c": "d"}], [{"e": "f"}])).equalsTo(false);
    assertThat(match([{"a": 1}, {"a": "b"}], [{"a": "c"}, {"a": "b"}])).equalsTo({"@1": "c"});
    assertThat(match([{"a": 1}, {"a": 2}], [{"a": "b"}, {"a": "c"}])).equalsTo({"@1": "b", "@2": "c"});
    assertThat(match([{}], [""])).equalsTo({});
    assertThat(match([""], [{}])).equalsTo({});
    assertThat(match([{"a": ["b", "c"]}], [{"a": 1}])).equalsTo({"1": ["b", "c"]});
    assertThat(match([{"a": ["b", "c"]}], [{"a": "b"}])).equalsTo({});
     
    // uneven number of features
    assertThat(match([{num: 'sing', stat: '+', gap: '-', tp: '-past', tense: 'pres' }, {}, {}], 
                     [{num: 1, stat: 2, tp: 4, tense: 3}, {}, {}]))
     .equalsTo(false); 
  });

  it("match - two variables binds to a value", function() {
    // two variables binds to a value
    assertThat(match([{"gap": "-"}, {"gap": 1}], [{"gap": 3}, {"gap": 3}])).equalsTo({"1": "-", "3": "-"});
  });


  it("match - same variable, one enumeration", function() {
    assertThat(match([{"num": "sing"}, {}, {"num": ["sing", "plur"]}], [{"num": 1}, {}, {"num": 1}]))
     .equalsTo({"1": "sing"});
  });
  
  it("match", function() {
    assertThat(match([{"a": 3}, {"c": "d"}], [{"a": "b"}, {"c": 3}])).equalsTo({"@3": "b", "3": "d"});
    // return;
    // case: 3 = "+nom" and tense: 3 = "pres" collides (totally different types of features).
    //assertThat(match([{"num": "sing", "case": 3, "gap": "-"},
    //                  {},
    //                  { "num": 'sing', "fin": '+', "stat": '+', "gap": '-', "tp": '-past', "tense": 'pres'}], 
    //                 [{"num": 1, "case": '+nom', "gap": '-' },
    //                  {},
    //                  {"num": 1, "fin": '+', "stat": 2, "gap": '-', "tp": 4, "tense": 3}]))
    // .equalsTo(false);

  });

  it("merge", function() {
    assertThat(merge({}, {})).equalsTo({});
    assertThat(merge({"a": "b"}, {})).equalsTo({"a": "b"});
    assertThat(merge({"a": 1}, {"1": "b"})).equalsTo({"a": "b"});
    assertThat(merge({"a": 1}, {"1": "b"})).equalsTo({"a": "b"});
    assertThat(merge({"a": 1, "b": 2, "c": "d"}, {"1": "foo", "2": "bar"})).equalsTo({"a": "foo", "b": "bar", "c": "d"});

    // there are still open features
    assertThat(merge({"a": 1, "b": 2}, {"2": "c"})).equalsTo({"a": 1, "b": "c"});

    // merging enumerations
    assertThat(merge({"a": 1, "b": 2}, {"2": ["c", "d"]})).equalsTo({"a": 1, "b": ["c", "d"]});
  });

  it("resolve", function() {
    assertThat(resolve({"a": 1}, [{"a": 1}], [{"a": "b"}])).equalsTo({"a": "b"});
    // return;
    assertThat(resolve({"c": 1}, [{"a": 3}, {"c": "d"}], [{"a": "b"}, {"c": 1}])).equalsTo({"c": "d"});
    
    assertThat(resolve({}, [], [])).equalsTo({});
    assertThat(resolve({"a": "b"}, [], [])).equalsTo({"a": "b"});
    assertThat(resolve({"a": "b"}, [{"c": "d"}], [{"c": "d"}])).equalsTo({"a": "b"});
    assertThat(resolve({"a": "b"}, [{"c": "d"}], [{"e": "f"}])).equalsTo(false);
    assertThat(resolve({"a": 1}, [{"c": "d"}], [{"c": 1}])).equalsTo({"a": "d"});
    assertThat(resolve({"a": 1}, [{"a": 1}, {"a": "b"}], [{"a": 1}, {"a": "b"}])).equalsTo({"a": 1});
    assertThat(resolve({"a": 1, "b": 2}, [{"a": 1}, {"a": "b"}, {"b": 2}], [{"a": 1}, {"a": "b"}, {"b": "d"}]))
     .equalsTo({"a": 1, "b": "d"});
    assertThat(resolve({"a": 1}, [], [])).equalsTo({"a": 1});
    assertThat(resolve({"a": 1}, [{"a": "b"}], [{"a": 1}])).equalsTo({"a": "b"});
    assertThat(resolve({"a": 1}, [{"c": ["d", "e"]}], [{"c": 1}])).equalsTo({"a": ["d", "e"]});
  });

  it("process", function() {
    assertThat(process("V", {}, [], [])).equalsTo(node("V"));
    assertThat(process("V", {"a": "b"}, [], [])).equalsTo(node("V", {"a": "b"}));
    assertThat(process("V", {"a": "b"}, [node("E", {"c": "d"})], [{"c": "d"}]))
     .equalsTo(node("V", {"a": "b"}, [node("E", {"c": "d"})]));
    assertThat(process("V", {}, ["stink"], [{}])).equalsTo(node("V", {}, ["stink"]));
    assertThat(process("V", {"a": 1}, [node("E", {"a": "b"})], [{"a": 1}])).equalsTo(node("V", {"a": "b"}, [node("E", {"a": "b"})]));
  });

  it("process: missing data", function() {
    assertThat(process("V", {}, [node("V", {trans: '-', stat: '+' })], [{
       "num": "sing",
       "fin": '-',
       "stat": 2,
       "trans": 1,
       "tp": "-past",
       "tense": "pres"
     }], 0, -1)).equalsTo(-1);
  });

  function parse(src, rule = ParserStart, i = 0) {
   const parser = new Parser(ParserRules, rule, {
     keepHistory: true
    });
   // console.log(ParserStart);
   // console.log(parser.feed(src));
   return parser.feed(src).results[i];
  }

  function first(node) {
   return clean(node.children[0]);
  }

  it("book", function() {
    assertThat(parse("book", "N")).equalsTo({
      "@type": "N",
      "children": ["book"],
      "loc": 0,
      "types": {
        "num": "sing",
         "gen": "-hum"
      }
    });
  });

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
        "stat": "-",
        "tense": "pres",
        "tp": "-past",
        "trans": "-",
      }
    });
  });

  it("walked", function() {
    assertThat(parse("walked", "V")).equalsTo({
      "@type": "V",
      "children": ["walked"],
      "types": {
        "fin": "part",
        "num": -1303940481,
        "stat": "-",
        "tense": -590000754,
        "tp": -590000755,
        "trans": "-",
      },
      "loc": 0,
    });
  });

  it("WS", function() {
    assertThat(parse(" ", "WS")).equalsTo({
      "@type": "WS", 
      "types": { 
        "gap": "-"
      }, 
      "children": [], 
      "loc": 0 
    });
  });

  it("GAP", function() {
    assertThat(clean(parse("", "GAP")))
     .equalsTo(GAP());
  });

  it.skip("GAP - NP", function() {
    assertThat(parse("", "NP_"))
     .equalsTo({
      "@type": "NP", 
      "types": {"gap": "+", "num": 1291680057, "case": -1182885959}, 
      "children": [{"@type": "GAP", "children": [], "loc": 0, "types": {}}],
      "loc": 0 
     });
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
      "loc": 0,
      "types": {
        "case": "+nom",
        "gen": "fem",
        "gap": "-",
        "num": "sing",
      },
      "children": [{
        "@type": "PRO",
        "children": ["she"],
        "loc": 0,
        "types": {
          "case": "+nom",
          "gen": "fem",
          "num": "sing",
          "refl": "-",
        }
      }],
    });
  });

  it("it", function() {
    assertThat(parse("it", "NP")).equalsTo({
      "@type": "NP",
      "loc": 0,
      "types": {
        "case": ["-nom", "+nom"],
        "gap": "-",
        "num": "sing",
        "gen": "-hum",
      },
      "children": [{
        "@type": "PRO",
        "children": ["it"],
        "loc": 0,
        "types": {
          "case": ["-nom", "+nom"],
          "num": "sing",
          "gen": "-hum",
          "refl": "-",
        }
      }],
    });
  });

  it("Jones", function() {
    assertThat(parse("Jones", "PN"))
     .equalsTo({"@type": "PN", "types": {"num": "sing"}, "loc": 0, "children": ["Jones"]});
  });

  it("Jones's", function() {
    assertThat(clean(parse("Jones's wife", "NP_")))
     .equalsTo(NP(DET(PN("Jones"), "'s"), RN("wife")));
  });

  it("loves", function() {
    assertThat(parse("loves", "V"))
     .equalsTo({
       "@type": "V",
       "children": ["loves"],
       "loc": 0,
       "types": {
          "fin": "+",
          "num": "sing",
          "stat": "+",
          "tense": "pres",
          "tp": "-past",
          "trans": "-",
         }
      });
  });

  it("loves", function() {
    assertThat(clean(parse("loves", "S")))
     .equalsTo(S(NP(GAP()), VP_(VP(V("loves")))));
  });

  it("He and she", function() {
    assertThat(clean(parse("he and she", "NP_")))
     .equalsTo(NP(NP(PRO("he")), "and", NP(PRO("she"))));
  });

  it("Jones loves", function() {
    assertThat(clean(parse("Jones loves", "S")))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V("loves")))));
  });

  it("likes her", function() {
    assertThat(clean(parse("likes her", "S")))
      .equalsTo(S(NP(GAP()), VP_(VP(V("likes"), NP(PRO("her"))))));
  });

  it("who likes her", function() {
    assertThat(clean(parse("who likes her", "RC")))
     .equalsTo(RC(RPRO("who"), 
                  S(NP(GAP()), VP_(VP(V("likes"), NP(PRO("her")))))));
  });

  it("a man who likes her", function() {
    assertThat(clean(parse("a man who likes her", "NP_")))
     .equalsTo(NP(DET("a"), N(N("man"), RC(RPRO("who"), 
                                           S(NP(GAP()), VP_(VP(V("likes"), NP(PRO("her")))))))));
  });

  it("she loves", function() {
    assertThat(clean(parse("she loves", "S"))).equalsTo(S(NP(PRO("she")), VP_(VP(V("loves")))));
  });

  it("who she loves", function() {
    assertThat(clean(parse("who she loves", "RC")))
     .equalsTo(RC(RPRO("who"), 
                  S(NP(PRO("she")), VP_(VP(V("loves"), NP(GAP()))))));
  });

  it("he likes it", function() {
    assertThat(clean(parse("he likes it", "S")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("likes"), NP(PRO("it"))))));
  });


  it("Jones loves.", function() {
    assertThat(first(parse("Jones loves.")))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V("loves")))));
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

  it("they love him", function() {
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(first(parse("they love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), NP(PRO("him"))))));
  });

  it("they do not love him", function() {
    assertThat(first(parse("they do not love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", VP(V("love"), NP(PRO("him"))))
                 ));
  });

  it("they do not love the book", function() {
    assertThat(first(parse("they do not love the book.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", 
                     VP(V("love"), NP(DET("the"), N("book"))))
                 ));
  });

  it("he and she love her.", function() {
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(first(parse("he and she love her.")))
     .equalsTo(S(NP(NP(PRO("he")), "and", NP(PRO("she"))),
                 VP_(VP(V("love"), NP(PRO("her"))))));
  });

  it("they love him and her.", function() {
    assertThat(first(parse("they love him and her.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
  });

  it("every man loves a book and a woman.", function() {
    assertThat(first(parse("every man loves a book and a woman.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), 
                        NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
  });

  it("Brazil loves her.", function() {
    assertThat(first(parse("Brazil loves her.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("Brazil loves Italy.", function() {
    assertThat(first(parse("Brazil loves Italy.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PN("Italy"))))));
  });

  it("every man loves Italy and Brazil", function() {
    assertThat(first(parse("every man loves Italy and Brazil.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), 
                           NP(NP(PN("Italy")), "and", NP(PN("Brazil")))
                           ))));
  });

  it("Anna loves a man who loves her.", function() {
    assertThat(first(parse("Anna loves a man who loves her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("man"), 
                             RC(RPRO("who"), 
                                S(NP(GAP()), VP_(VP(V("loves"), NP(PRO("her")))))
                                )))))));
  });

  it("Anna loves a book which surprises her", function() {
    // assertThat(first(parse("Anna loves a book which surprises her.")).length).equalsTo(12);
    assertThat(first(parse("Anna loves a book which surprises her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"), 
                                S(NP(GAP()), VP_(VP(V("surprises"), NP(PRO("her")))))
                                )))))));
  });

  it("Every book which she loves surprises him.", function() {
    assertThat(first(parse("Every book which she loves surprises him.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V("loves"), NP(GAP()))))
                                    ))),
                 VP_(VP(V("surprises"), NP(PRO("him")))
                     )));

  });

  it("Every man who knows her loves her.", function() {
    assertThat(first(parse("Every man who knows her loves her.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V("knows"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V("loves"), NP(PRO("her"))))
                 ));
  });

  it("A stockbroker who does not love her surprises him.", function() {
    assertThat(first(parse("A stockbroker who does not love her surprises him.")))
     .equalsTo(S(NP(DET("A"),
                    N(N("stockbroker"), RC(RPRO("who"), 
                                           S(NP(GAP()),
                                             VP_(AUX("does"), "not", VP(V("love"), NP(PRO("her")))))
                                           ))),
                 VP_(VP(V("surprises"), NP(PRO("him"))))
                 ));

  });

  it("He is happy.", function() {
    assertThat(first(parse("He is happy.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

  it("He is not happy.", function() {
    assertThat(first(parse("He is not happy.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), "not", ADJ("happy")))));
   });

  it("A porsche does not stink", function() {
    assertThat(first(parse("A porsche does not stink.")))
     .equalsTo(S(NP(DET("A"), N("porsche")),
                 VP_(AUX("does"), "not", 
                     VP(V("stink")))));
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat(first(parse("Jones loves a woman who does not love him.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), N(N("woman"), 
                                       RC(RPRO("who"), S(NP(GAP()), 
                                                         VP_(AUX("does"), "not", 
                                                             VP(V("love"), NP(PRO("him"))))
                                                         ))
                                       ))))
                 ));
  });

  it("If Jones owns a book then he likes it.", function() {
    assertThat(first(parse("If Jones owns a book then he likes it.")))
     .equalsTo(S("If", 
                 S(NP(PN("Jones")), VP_(VP(V("owns"), NP(DET("a"), N("book"))))), 
                 "then", 
                 S(NP(PRO("he")), VP_(VP(V("likes"), NP(PRO("it")))))));
  });

  it("every man who owns a book likes it.", function() {
    assertThat(first(parse("every man who owns a book likes it.")))
     .equalsTo(S(NP(DET("every"), N(N("man"), RC(RPRO("who"), 
                                                 S(NP(GAP()), VP_(VP(V("owns"), NP(DET("a"), N("book")))))))), 
                 VP_(VP(V("likes"), NP(PRO("it"))))));
  });

  it("Jones loves her or Smith loves her.", function() {
    assertThat(first(parse("Jones loves her or Smith loves her.")))
     .equalsTo(S(S(NP(PN("Jones")), VP_(VP(V("loves"), NP(PRO("her"))))), 
                 "or", 
                 S(NP(PN("Smith")), VP_(VP(V("loves"), NP(PRO("her")))))));
   });

  it("Mary loves Jones or likes Smith.", function() {
    assertThat(first(parse("Mary loves Jones or likes Smith.")))
     .equalsTo(S(NP(PN("Mary")), 
                 VP_(VP(VP(V("loves"), NP(PN("Jones"))), 
                        "or", 
                        VP(V("likes"), NP(PN("Smith")))))));
   });

  it("Jones or Smith loves her.", function() {
    assertThat(first(parse("Jones or Smith loves her.")))
     .equalsTo(S(NP(NP(PN("Jones")), "or", NP(PN("Smith"))),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("Jones owns and loves a porsche.", function() {
    assertThat(first(parse("Jones owns and loves a porsche.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("owns"), "and", V("loves")), NP(DET("a"), N("porsche"))))));
  });

  it("Mary likes Smith and she loves him.", function() {
    assertThat(first(parse("Mary likes Smith and she loves him.")))
     .equalsTo(S(S(NP(PN("Mary")), VP_(VP(V("likes"), NP(PN("Smith"))))), 
                 "and", 
                 S(NP(PRO("she")), VP_(VP(V("loves"), NP(PRO("him")))))));
  });

  it("Jones is happy.", function() {
    assertThat(first(parse("Jones is happy.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("Jones's wife is happy.", function() {
    assertThat(first(parse("Jones's wife is happy.")))
     .equalsTo(S(NP(DET(PN("Jones"), "'s"), RN("wife")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("Jones owns an unhappy donkey.", function() {
    assertThat(first(parse("Jones owns an unhappy donkey.")))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V("owns"), NP(DET("an"), N(ADJ("unhappy"), N("donkey")))))));
  });

  it("Jones likes a woman with a donkey.", function() {
    assertThat(first(parse("Jones likes a woman with a donkey.")))
     .equalsTo(S(NP(PN("Jones")), 
                 VP_(VP(V("likes"), 
                        NP(DET("a"), N(N("woman"), 
                                       PP(PREP("with"), NP(DET("a"), N("donkey"))
                                          )))))));
  });

  it("Jones is a man.", function() {
    assertThat(first(parse("Jones is a man.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N("man"))))));
  });

  it("Who likes Mary?", function() {
    assertThat(clean(parse("Who likes Mary?")))
     .equalsTo(Sentence("Who", 
                        NP(GAP()), 
                        VP_(VP(V("likes"), NP(PN("Mary")))), 
                        "?"));
  });

  it("Who is happy?", function() {
    assertThat(clean(parse("Who is happy?")))
     .equalsTo(Sentence("Who", 
                        NP(GAP()), 
                        VP_(VP(BE("is"), ADJ("happy"))), 
                        "?"));
  });

  it("Who does Mary like?", function() {
    assertThat(clean(parse("Who does Mary like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(PN("Mary")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Who does the man like?", function() {
    assertThat(clean(parse("Who does the man like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET("the"), N("man")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Who does Smith's brother like?", function() {
    assertThat(clean(parse("Who does Smith's brother like?")))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET(PN("Smith"), "'s"), RN("brother")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Is Mary happy?", function() {
    assertThat(clean(parse("Is Mary happy?")))
     .equalsTo(Sentence("Is", 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it.skip("Sam's wife is Dani", function() {
    assertThat(clean(parse("Sam's wife is Dani")[0]))
     .equalsTo(Sentence("Is", 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("John is a happy man", function() {
    assertThat(first(parse("Jones is a happy man.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N(ADJ("happy"), N("man")))))));
  });

  it("Sam loves Anna and Leo.", function() {
    assertThat(first(parse("Sam loves Anna and Leo.")))
     .equalsTo(S(NP(PN("Sam")),
                 VP_(VP(V("loves"), 
                        NP(NP(PN("Anna")), "and", NP(PN("Leo")))
                        ))));
  });

  it("John is from Brazil", function() {
    assertThat(first(parse("Jones is from Brazil.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it("Every brazilian is from Brazil", function() {
    assertThat(first(parse("Every brazilian is from Brazil.")))
     .equalsTo(S(NP(DET("Every"), N("brazilian")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it("If A is B's parent then B is A's child.", function() {
    assertThat(first(parse("If A is B's parent then B is A's child.")))
     .equalsTo(S("If", 
                 S(NP(PN("A")), VP_(VP(BE("is"), NP(DET(PN("B"), "'s"), RN("parent"))))), 
                 "then", 
                 S(NP(PN("B")), VP_(VP(BE("is"), NP(DET(PN("A"), "'s"), RN("child"))))), 
                 ));
  });

  it("He loves it.", function() {
    assertThat(first(parse("He loves It.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V("loves"), NP(PRO("It"))))));
  });

  it("John loves himself.", function() {
    assertThat(first(parse("John loves himself.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("loves"), NP(PRO("himself"))))));
  });

  it.skip("John is happy with Mary.", function() {
    // TODO(goto): this probably involves second order logic?
    assertThat(first(parse("John is happy with Mary.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("loves"), NP(PRO("himself"))))));
  });

  it("Jones walks.", function() {
    // non-stative verbs
    assertThat(first(parse("Jones walks.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("walks")))));
  });

  it("Jones hits a porsche.", function() {
    // non-stative verbs
    assertThat(first(parse("Jones hits a porsche.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("hits"),
                        NP(DET("a"), N("porsche"))
                        ))));
  });

  it("Jones walked.", function() {
    // past tense
    assertThat(first(parse("Jones walked.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("walked")))));
  });

  it("Jones kissed Anna.", function() {
    // past tense
    assertThat(first(parse("Jones kissed Anna.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("kissed"),
                        NP(PN("Anna"))))));
  });

  it("Jones will walk.", function() {
    // future tense
    assertThat(first(parse("Jones will walk.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V("walk")))));
  });

  it("Jones will kiss Anna.", function() {
    // future tense
    assertThat(first(parse("Jones will kiss Anna.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V("kiss"),
                                     NP(PN("Anna"))))));
  });

  it("Jones did not walk.", function() {
    // past tense
    assertThat(first(parse("Jones did not walk.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("did"), "not", VP(V("walk")))));
  });

  it("Jones was happy.", function() {
    assertThat(first(parse("Jones was happy.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("was"), ADJ("happy")))));
  });

  it("They were happy.", function() {
    assertThat(first(parse("They were happy.")))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("She has walked.", function() {
    assertThat(first(parse("She has walked.")))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("has"), VP(V("walked"))))));
  });

  it("She has kissed him.", function() {
    assertThat(first(parse("She has kissed him.")))
     .equalsTo(S(NP(PRO("She")), 
                 VP_(VP(HAVE("has"), VP(V("kissed"), 
                                        NP(PRO("him")))))));
  });

  it("They have walked.", function() {
    assertThat(first(parse("They have walked.")))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), VP(V("walked"))))));
  });

  it("She had walked.", function() {
    assertThat(first(parse("She had walked.")))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("had"), VP(V("walked"))))));
  });

  it("They had walked.", function() {
    assertThat(first(parse("They had walked.")))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("had"), VP(V("walked"))))));
  });

  it("She had kissed him.", function() {
    assertThat(first(parse("She had kissed him.")))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("had"), VP(V("kissed"), NP(PRO("him")))))));
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
      deepEqual(x, y);
    }
   };
  }

});