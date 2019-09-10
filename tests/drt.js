const Assert = require("assert");
const {Parser} = require("nearley");
const {
  parse, 
  parser, 
  term, 
  rule, 
  phrase, 
  space, 
  clone, 
  literal, 
  compile, 
  print, 
  generate, 
  expand, 
  collect, 
  processor, 
  grammar} = require("../src/drt.js");

const Logic = require("../src/parser.js");
const {
  program, 
  forall, 
  exists, 
  implies, 
  predicate, 
  func,
  binary, 
  constant, 
  and, 
  or, 
  negation,
  argument} = Logic.Parser;

const Forward = require("../src/forward.js");

const {Reasoner} = require("../src/fol.js");

const {rewrite} = require("../src/unify.js");

describe("Discourse Representation Theory", function() {
  
  it("expand var", function() {
    let rule = phrase(term("S", {"num": 1}),
                      [term("NP", {"num": 1}),
                       term("VP_", {"num": 1})]);

    assertThat(print(rule)).equalsTo("S[num=@1] -> NP[num=@1] VP_[num=@1]");

    let rules = generate(rule);

    assertThat(rules.length).equalsTo(2);
    assertThat(print(rules[0])).equalsTo("S[num=sing] -> NP[num=sing] VP_[num=sing]");
    assertThat(print(rules[1])).equalsTo("S[num=plur] -> NP[num=plur] VP_[num=plur]");
   });

  it("expand", function() {
    let obj = {"A": ["S", "P"], "B": ["X", "Y"]};

    assertThat(expand(obj))
     .equalsTo([{"A": "S", "B": "X"},
                {"A": "S", "B": "Y"},
                {"A": "P", "B": "X"},
                {"A": "P", "B": "Y"}]);

  });

  it("collect", function() {
    let rule = phrase(term("VP", {"num": 1}),
                      [term("V", {"num": 1}),
                       term("NP", {"num": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[num=@1] -> V[num=@1] NP[num=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["sing", "plur"], "2": ["sing", "plur"]});
  });

  it("collects case", function() {
    let rule = phrase(term("VP", {"case": 1}),
                      [term("V", {"case": 1}),
                       term("NP", {"case": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[case=@1] -> V[case=@1] NP[case=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["+nom", "-nom"], "2": ["+nom", "-nom"]});
  });

  it("collects array", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    assertThat(print(rule))
     .equalsTo('PRO[num=sing, case=-nom/+nom] -> "it"');
    assertThat(collect(rule)).equalsTo({"-1": ["-nom", "+nom"]});
    // console.log(rule);
    assertThat(print(rule))
     .equalsTo('PRO[num=sing, case=@-1] -> "it"');
  });

  it("generate", function() {
    let rule = phrase(term("VP", {"num": 1}),
                      [term("V", {"num": 1}),
                       term("NP", {"num": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[num=sing] -> V[num=sing] NP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("VP[num=sing] -> V[num=sing] NP[num=plur]");
    assertThat(print(result[2]))
     .equalsTo("VP[num=plur] -> V[num=plur] NP[num=sing]");
    assertThat(print(result[3]))
     .equalsTo("VP[num=plur] -> V[num=plur] NP[num=plur]");
  });

  it("generate with case", function() {
    let rule = phrase(term("VP", {"case": 1}),
                      [term("V", {"case": 1}),
                       term("NP", {"case": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[case=+nom] -> V[case=+nom] NP[case=+nom]");
    assertThat(print(result[1]))
     .equalsTo("VP[case=+nom] -> V[case=+nom] NP[case=-nom]");
    assertThat(print(result[2]))
     .equalsTo("VP[case=-nom] -> V[case=-nom] NP[case=+nom]");
    assertThat(print(result[3]))
     .equalsTo("VP[case=-nom] -> V[case=-nom] NP[case=-nom]");
  });

  it("generate with fixed values", function() {
    let rule = phrase(term("NP", {"num": "plur"}),
                      [term("NP", {"num": 1}),
                       term("NP", {"num": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("NP[num=plur] -> NP[num=sing] NP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("NP[num=plur] -> NP[num=sing] NP[num=plur]");
    assertThat(print(result[2]))
     .equalsTo("NP[num=plur] -> NP[num=plur] NP[num=sing]");
    assertThat(print(result[3]))
     .equalsTo("NP[num=plur] -> NP[num=plur] NP[num=plur]");
  });

  it("generate with two types", function() {
    let rule = phrase(term("S", {"num": 1}),
                      [term("NP", {"num": 1, "case": "+nom"}),
                       term("VP", {"num": 1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);
    assertThat(print(result[0]))
     .equalsTo("S[num=sing] -> NP[num=sing, case=+nom] VP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("S[num=plur] -> NP[num=plur, case=+nom] VP[num=plur]");
  });

  it("generate with two types and two variables", function() {
    let rule = phrase(term("NP", {"num": 1, "case": 2}),
                      [term("PRO", {"num": 1, "case": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("NP[num=sing, case=+nom] -> PRO[num=sing, case=+nom]");
    assertThat(print(result[1]))
     .equalsTo("NP[num=sing, case=-nom] -> PRO[num=sing, case=-nom]");
    assertThat(print(result[2]))
     .equalsTo("NP[num=plur, case=+nom] -> PRO[num=plur, case=+nom]");
    assertThat(print(result[3]))
     .equalsTo("NP[num=plur, case=-nom] -> PRO[num=plur, case=-nom]");
  });

  it("generate with array values", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo('PRO[num=sing, case=-nom] -> "it"');
    assertThat(print(result[1]))
     .equalsTo('PRO[num=sing, case=+nom] -> "it"');
  });

  it("gender", function() {
    let rule = phrase(term("NP", {"gen": -1}),
                      [term("PRO", {"gen": -1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(3);

    assertThat(print(result[0]))
     .equalsTo("NP[gen=male] -> PRO[gen=male]");
    assertThat(print(result[1]))
     .equalsTo("NP[gen=fem] -> PRO[gen=fem]");
    assertThat(print(result[2]))
     .equalsTo("NP[gen=-hum] -> PRO[gen=-hum]");
  });

  it("transitive verbs", function() {
    let rule = phrase(term("V", {"num": "sing", "trans": "-"}),
                      [literal("likes")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(1);

    assertThat(print(result[0]))
     .equalsTo('V[num=sing, trans=-] -> "likes"');
  });

  it("fin", function() {
    let rule = phrase(term("VP", {"fin": 1}),
                      [term("V", {"fin": 1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo("VP[fin=+] -> V[fin=+]");
    assertThat(print(result[1]))
     .equalsTo("VP[fin=-] -> V[fin=-]");
  });

  it("combines nums with fins", function() {
    let rule = phrase(term("VP'", {"num": 1, "fin": 2}),
                      [term("VP", {"num": 1, "fin": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);

    assertThat(print(result[0]))
     .equalsTo("VP'[num=sing, fin=+] -> VP[num=sing, fin=+]");
    assertThat(print(result[1]))
     .equalsTo("VP'[num=sing, fin=-] -> VP[num=sing, fin=-]");
    assertThat(print(result[2]))
     .equalsTo("VP'[num=plur, fin=+] -> VP[num=plur, fin=+]");
    assertThat(print(result[3]))
     .equalsTo("VP'[num=plur, fin=-] -> VP[num=plur, fin=-]");
  });

  it("generate on tail", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);
    
    assertThat(collect(rule)).equalsTo({"1": ["sing", "plur"]});

    let result = generate(rule);
    assertThat(result.length).equalsTo(2);
    assertThat(print(result[0])).equalsTo("S -> S[num=sing]");
    assertThat(print(result[1])).equalsTo("S -> S[num=plur]");
   });

  it("generate gap", function() {
    let rule = phrase(term("VP", {"num": 1, "gap": 3}),
                      [term("V", {"num": 1, "trans": "+"}),
                       term("NP", {"num": 3, "case": "-nom", "gap": 3})]);

    assertThat(collect(rule)).equalsTo({
      "1": ["sing", "plur"],
      "3": ["sing", "plur"],
     });

    let result = generate(rule);
    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[num=sing, gap=sing] -> V[num=sing, trans=+] NP[num=sing, case=-nom, gap=sing]");
    assertThat(print(result[1]))
     .equalsTo("VP[num=sing, gap=plur] -> V[num=sing, trans=+] NP[num=plur, case=-nom, gap=plur]");
    assertThat(print(result[2]))
     .equalsTo("VP[num=plur, gap=sing] -> V[num=plur, trans=+] NP[num=sing, case=-nom, gap=sing]");
    assertThat(print(result[3]))
     .equalsTo("VP[num=plur, gap=plur] -> V[num=plur, trans=+] NP[num=plur, case=-nom, gap=plur]");

   });

  it("processor", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);

    let rules = generate(rule);

    assertThat(processor(rules[0])).equalsTo(`(args) => node("S", {}, args)`);
   });

  it("processor", function() {
    let rule = phrase(term("PN", {"num": "sing", "gen": "male"}),
                      [literal("Jones")]);

    let rules = generate(rule);

    assertThat(processor(rules[0]))
     .equalsTo(`(args) => node("PN", {"num":"sing","gen":"male"}, args)`);
   });

  it("processor", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);

    assertThat(compile([rule], false))
     .equalsTo(`
S -> 
  S_num_sing {% (args) => node("S", {}, args) %} |
  S_num_plur {% (args) => node("S", {}, args) %}
               `.trim());
  });

  it("custom processor", function() {
    let rule = phrase(term("A"),
                      [term("A", {"num": 1})], "B");

    assertThat(compile([rule], false))
     .equalsTo(`
A -> 
  A_num_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("B", {}, args))(args) %} |
  A_num_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("B", {}, args))(args) %}
               `.trim());
  });

  it("multiple expansions", function() {
    let grammar = [rule(term("A"), [[literal("b")], [literal("c")]])];
    assertThat(compile(grammar, false)).equalsTo(`
A -> 
  "b"i {% (args) => node("A", {}, args) %} |
  "c"i {% (args) => node("A", {}, args) %}
     `.trim());
  });

  it("generate", function() {
    let result = grammar();

    const fs = require("fs");
    fs.writeFileSync("./src/english.ne", compile(clone(result)));
  });

  it("grammar", function() {
    let result = grammar();

    assertThat(result.length).equalsTo(44);

    let i = 0;
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> S[num=@1] _ "."');
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> NP\'[num=@1, gen=@2, case=+nom, gap=-] __ VP\'[num=@1, fin=+, gap=-]');
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, gen=@2, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@3, gen=@2, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, gen=@2, case=+nom, gap=-] __ VP'[num=@1, fin=+, gap=@3]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> AUX[num=@1, fin=+] __ \"not\" __ VP[num=@1, fin=-, gap=@2]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> VP[num=@1, fin=+, gap=@2]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=@3] -> V[num=@1, fin=@2, trans=+] WS[gap=@3] NP\'[num=@3, gen=@4, case=-nom, gap=@3]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=+] __ NP\'[num=@3, gen=@4, case=-nom, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=-]");
    assertThat(print(result[i++]))
     .equalsTo('NP[num=@1, gen=@2, case=@3, gap=@1] -> GAP')
    assertThat(print(result[i++]))
     .equalsTo("NP[num=@1, gen=@2, case=@3, gap=-] -> DET[num=@1] __ N[num=@1, gen=@2]")
    assertThat(print(result[i++]))
     .equalsTo("NP[num=@1, gen=@2, case=@3, gap=-] -> PN[num=@1, gen=@2]")
    assertThat(print(result[i++]))
     .equalsTo('NP[num=@1, gen=@2, case=@3, gap=-] -> PRO[num=@1, gen=@2, case=@3]');
    assertThat(print(result[i++]))
     .equalsTo('NP\'[num=plur, gen=@1, case=@2, gap=-] -> NP[num=@3, gen=@1, case=@2, gap=-] __ "and" __ NP[num=@4, gen=@1, case=@2, gap=-]');
    assertThat(print(result[i++]))
     .equalsTo('NP\'[num=plur, gen=-hum, case=@2, gap=-] -> NP[num=@3, gen=@5, case=@2, gap=-] __ "and" __ NP[num=@4, gen=@6, case=@2, gap=-]');
    assertThat(print(result[i++]))
     .equalsTo("NP'[num=@1, gen=@2, case=@3, gap=@4] -> NP[num=@1, gen=@2, case=@3, gap=@4]");
    assertThat(print(result[i++]))
     .equalsTo('N[num=@1, gen=@2] -> N[num=@1, gen=@2] __ RC[num=@1, gen=@2]');
    assertThat(print(result[i++]))
     .equalsTo('RC[num=@1, gen=@2] -> RPRO[num=@1, gen=@2] __ S[num=@1, gap=@1]');
    assertThat(print(result[i++]))
     .equalsTo('DET[num=sing] -> "a" "every" "the" "some"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, gen=male, case=+nom] -> "he"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, gen=male, case=-nom] -> "him"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, gen=fem, case=+nom] -> "she"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, gen=fem, case=-nom] -> "her"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, gen=-hum, case=-nom/+nom] -> "it"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=+nom] -> "they"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=-nom] -> "them"');
    assertThat(print(result[i++]))
     .equalsTo('PN[num=sing, gen=male] -> "Jones" "John" "Mel" "Leo" "Yuji"');
    assertThat(print(result[i++]))
     .equalsTo('PN[num=sing, gen=fem] -> "Mary" "Dani" "Anna"');
    assertThat(print(result[i++]))
     .equalsTo('PN[num=sing, gen=-hum] -> "Brazil" "Italy" "Ulysses"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=male] -> "stockbroker" "man"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=fem] -> "stockbroker" "woman" "widow"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=-hum] -> "book" "donkey" "horse"');
    assertThat(print(result[i++]))
     .equalsTo('AUX[num=sing, fin=+] -> "does"');
    assertThat(print(result[i++]))
     .equalsTo('AUX[num=plur, fin=+] -> "do"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=+] -> "like" "love" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=-] -> "love" "stink"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing, fin=+, trans=+] -> "likes" "loves" "knows" "owns" "fascinates" "rotates" "surprises"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing, fin=+, trans=-] -> "loves" "stinks"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=plur, fin=+, trans=+] -> "like" "love" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=plur, fin=+, trans=-] -> "love" "stink"');
    assertThat(print(result[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=male/fem] -> "who"');
    assertThat(print(result[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=-hum] -> "which"');
    assertThat(print(result[i++]))
     .equalsTo('GAP -> null');
    
    // "case" makes the distinction between "nominative case"
    // and "non-nominative case", respectively, he/she and
    // him/her.

    // "fin" makes the distinction between "infinitival" and
    // "finite" verb forms (- and +, respectively). 
    // "infinitival" verb forms are used with negations.

    // console.log(compile(result));
  });

  function node(type, ...children) {
   return {"@type": type, "children": children} 
  }

  let S = (...children) => node("S", ...children);
  let NP = (...children) => node("NP", ...children);
  let NP_ = (...children) => node("NP'", ...children);
  let PN = (...children) => node("PN", ...children);
  let VP_ = (...children) => node("VP'", ...children);
  let VP = (...children) => node("VP", ...children);
  let V = (...children) => node("V", ...children);
  let DET = (...children) => node("DET", ...children);
  let N = (...children) => node("N", ...children);
  let PRO = (...children) => node("PRO", ...children);
  let AUX = (...children) => node("AUX", ...children);
  let RC = (...children) => node("RC", ...children);
  let RPRO = (...children) => node("RPRO", ...children);
  let GAP = (...children) => node("GAP", ...children);
  let Discourse = (...children) => node("Discourse", ...children);
  let Sentence = (...children) => node("Sentence", ...children);

  function clean(node) {
   if (Array.isArray(node)) {
    for (let entry of node) {
     if (entry) {
      clean(entry);
     }
    }
   } else if (typeof node == "object") {
    delete node.types;
    clean(node.children);
   }
   return node;
  }

  function first(results, types = false) {
   let root = clone(results[0]).children[0];
   return types ? root : clean(root);
  }

  it("parse", function() {
    assertThat(first(parse("Jones loves.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("Mary loves.")))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("Anna loves.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("John stinks.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("a man loves.")))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("every donkey stinks.")))
     .equalsTo(S(NP(DET("every"), N("donkey")),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("the woman loves.")))
     .equalsTo(S(NP(DET("the"), N("woman")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("he loves.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("she loves.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("it stinks.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("it does not stink.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
    assertThat(first(parse("the book does not stink.")))
     .equalsTo(S(NP(DET("the"), N("book")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
    assertThat(first(parse("he loves her.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
    assertThat(first(parse("she loves the book.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves"), NP(DET("the"), N("book"))))));
    assertThat(first(parse("every man loves her.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
    assertThat(first(parse("every man loves John.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PN("John"))))));
    assertThat(first(parse("she does not love.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(AUX("does"), "not", VP(V("love")))));
    assertThat(first(parse("she does not love him.")))
     .equalsTo(S(NP(PRO("she")),
                  VP_(AUX("does"), "not", 
                      VP(V("love"), NP(PRO("him"))))));
    assertThat(first(parse("John does not like the book.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(AUX("does"), "not", 
                     VP(V("like"), NP(DET("the"), N("book"))))));
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(first(parse("they love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), NP(PRO("him"))))));
    assertThat(first(parse("they do not love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", VP(V("love"), NP(PRO("him"))))
                 ));
    assertThat(first(parse("they do not love the book.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", 
                     VP(V("love"), NP(DET("the"), N("book"))))
                 ));
    
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(first(parse("he and she love her.")))
     .equalsTo(S(NP(NP(PRO("he")), "and", NP(PRO("she"))),
                 VP_(VP(V("love"), NP(PRO("her"))))));
    assertThat(first(parse("they love him and her.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
    assertThat(first(parse("every man loves a book and a woman.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), 
                        NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
    assertThat(first(parse("Brazil loves her.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
    assertThat(first(parse("Brazil loves Italy.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PN("Italy"))))));
    assertThat(first(parse("every man loves Italy and Brazil.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), 
                           NP(NP(PN("Italy")), "and", NP(PN("Brazil")))
                           ))));

    assertThat(first(parse("Anna loves a man who loves her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("man"), 
                             RC(RPRO("who"), 
                                S(NP(GAP()), VP_(VP(V("loves"), NP(PRO("her")))))
                                )))))));
    
    // assertThat(first(parse("Anna loves a book which surprises her.")).length).equalsTo(12);
    assertThat(first(parse("Anna loves a book which surprises her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"), 
                                S(NP(GAP()), VP_(VP(V("surprises"), NP(PRO("her")))))
                                )))))));
    
    assertThat(first(parse("Every book which she loves surprises him.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V("loves"), NP(GAP()))))
                                    ))),
                 VP_(VP(V("surprises"), NP(PRO("him")))
                     )));

    assertThat(first(parse("Every man who knows her loves her.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V("knows"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V("loves"), NP(PRO("her"))))
                 ));

    assertThat(first(parse("A stockbroker who does not love her surprises him.")))
     .equalsTo(S(NP(DET("A"),
                    N(N("stockbroker"), RC(RPRO("who"), 
                                           S(NP(GAP()),
                                             VP_(AUX("does"), "not", VP(V("love"), NP(PRO("her")))))
                                           ))),
                 VP_(VP(V("surprises"), NP(PRO("him"))))
                 ));

   });

  it("errors", function() {
    assertThat("foo").failsAt(0, "f");
    assertThat("A stockbroker who do not love her surprises him.").failsAt(20, " ");
  });

  it("debug", function() {
    parse("Anna loves a man who loves her.");
    parse("Every book which she loves surprises him.");
    parse("A stockbroker who does not love her surprises him.");
    parse("A stockbroker who Mel likes loves him.");
  });

  it("discourse", function() {
    assertThat(clean(parse("Anna loves John. John loves Anna. A man loves her.", "Discourse")[0]))
     .equalsTo(Discourse(Sentence(S(NP(PN("Anna")),
                                    VP_(VP(V("loves"), NP(PN("John")))))
                                  ),
                         Sentence(S(NP(PN("John")),
                                    VP_(VP(V("loves"), NP(PN("Anna")))))
                                  ),
                         Sentence(S(NP(DET("A"), N("man")),
                                    VP_(VP(V("loves"), NP(PRO("her")))))
                                  )
                         ));
   });

  it.skip("extensible proper names", function() {
    assertThat(first(parse("Sam loves her.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("Sam loves Dani.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani")))))));
    assertThat(first(parse("Sam and Dani love Anna and Leo.")))
     .equalsTo(S(NP_(NP(PN("Sam")), "and", NP(PN("Dani"))),
                 VP_(VP(V("love"), 
                        NP_(NP(PN("Anna")), "and", NP(PN("Leo")))
                        ))));
    assertThat(first(parse("Sam Goto loves Dani Fonsechi.")))
     .equalsTo(S(NP_(NP(PN("Sam Goto"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani Fonsechi")))))));
  });

  it("autocomplete", function() {
   //const parser = new Parser(ParserRules, ParserStart, {
   //  keepHistory: true
   // });
   //parser.feed("");
   // console.log(parser.table[0].states);
   // for (let row of parser.table) {
   //  console.log(row.wants);
   // }
  });

  it("ambiguities", function() {
     assertThat(parse("Mel loves Dani.").length).equalsTo(1);
     // TODO(goto): investigate why there are 6 possible interpretations.
     // This is possibly related to the expansions of gender / number.
     assertThat(parse("Anna loves a man.", "Sentence").length).equalsTo(1);
     assertThat(parse("A man loves Dani.", "Sentence").length).equalsTo(1);
     assertThat(parse("Mel loves a book.", "Sentence").length).equalsTo(1);
     assertThat(parse("Mel loves a book and Dani.", "Sentence").length).equalsTo(1);
     assertThat(parse("Mel and Dani love Anna and Leo.", "Sentence").length).equalsTo(1);
     // console.log(JSON.stringify(parse("Mel and Dani like Brazil.", "Sentence")[1], undefined, 2));
     //assertThat(parse("Mel and Dani like Brazil.", "Sentence").length).equalsTo(1);
     //assertThat(parse("Yuji and Mel like Dani.", "Sentence").length).equalsTo(1);
     //assertThat(parse("Anna loves a man who loves her.", "Sentence").length).equalsTo(6);
   });

  it("keeps types", function() {
    let s = first(parse("Mel loves Dani and Anna."), true);
    let subject = S(NP(capture("mel")), VP_());
    assertThat(match(subject, s).mel.types)
     .equalsTo({
       "gen": "male", "num": "sing", "case": "+nom", "gap": "-"});
    let object = S(NP(), VP_(VP(V(), NP(capture("object")))));
    assertThat(match(object, s).object["@type"]).equalsTo("NP");
    assertThat(match(object, s).object.types)
     .equalsTo({
       "case": "-nom", 
       "gap": "-", 
       "gen": "-hum", 
       "num": "plur"
    });
  });

  function toString(node) {
   if (typeof node == "string") {
    return node;
   } else if (node["@type"] == "Referent") {
    return node.name;
   } else if (node["@type"] == "Predicate") {
    return `${node.name}(${node.arguments.map(x => x.name).join(", ")})`;
   }
   let result = [];
   for (let child of node.children || []) {
    result.push(toString(child));
   }
   return result.join(" ").trim();
  }
  
  it("toString", function() {
    assertThat(toString(first(parse("Mel loves Dani."))))
     .equalsTo("Mel loves Dani");
    assertThat(toString(first(parse("A stockbroker who does not love her surprises him."))))
     .equalsTo("A stockbroker who does not love her surprises him");
  });

  let capture = (name) => { return {"@type": "Match", "name": name} };
  
  function match(a, b) {
   if (a["@type"] != b["@type"]) {
    return false;
   }

   let result = {};

   for (let i = 0; i < a.children.length; i++) {
    if (a.children[i]["@type"] == "Match") {
     // console.log(`match ${a.children[i].name}`);
     result[a.children[i].name] = b;
     continue;
    }

    let capture = match(a.children[i], b.children[i]);
    if (!capture) {
     return false;
    }

    result = Object.assign(result, capture);
   }

   return result;
  }

  it("match", function() {
    let s = first(parse("Mel loves Dani."));
    let m1 = S(NP(PN(capture("name"))), VP_());
    assertThat(match(m1, s)).equalsTo({name: PN("Mel")});
    let m2 = S(NP(), VP_(VP(V(), NP(PN(capture("name"))))));
    assertThat(match(m2, s)).equalsTo({name: PN("Dani")});
   });

  let Referent = (name, types, children = []) => { return { 
    "@type": "Referent", 
    "name": name, 
    "types": types, 
    "children": children
   } 
  };

  let arg = (x, free) => argument(Logic.Parser.literal(x), undefined, free);

  class CRPN {
   match(node) {
    let matcher1 = S(NP(PN(capture("name"))), VP_());
    let matcher2 = VP(V(), NP(PN(capture("name"))));

    let result = [[], []];

    let m1 = match(matcher1, node);
    if (m1) {
     let name = m1.name.children[0];
     result[0].push(Referent("u", m1.name.types));
     result[1].push(predicate("Name", [arg("u"), arg(name)]));
     node.children[0] = Referent("u");
    }

    let m2 = match(matcher2, node.children[1].children[0]);
    if (m2) {
     let name = m2.name.children[0];
     result[0].push(Referent("v", m2.name.types));
     result[1].push(predicate("Name", [arg("v"), arg(name)]));
     node.children[1].children[0].children[1] = Referent("v");
    }

    return result;
   }
  }
  
  class Compiler {
   compile(node) {
    // Maps to Logic
    let matcher = S(Referent("", {}, [capture("alpha")]), 
                    VP_(VP(V(capture("verb")), Referent("", {}, [capture("beta")]))));
    let m = match(matcher, node);

    if (!m) {
     return false;
    }

    return predicate(m.verb.children[0], 
                     [arg(m.alpha.name), arg(m.beta.name)]);
   }
  }

  function construct(drs) {
   let crpn = new CRPN();

   for (let root of drs.body || []) {
    let [head, body] = crpn.match(root);
    drs.head = drs.head.concat(head);
    drs.body = drs.body.concat(body);
   }

   let compiler = new Compiler();

   for (let i = 0; i < drs.body.length; i++ ) {
    let result = compiler.compile(drs.body[i]);
    if (result) {
     drs.body[i] = result;
    }
   }
  }

  class Interpreter {
   constructor() {
    this.drs = {head: [], body: []};
   }
   feed(s) {
    this.drs.body.push(first(parse(s), true));
    construct(this.drs);
    return this.drs;
   }
   ask(s) {
    return new Reasoner(rewrite(program(this.drs.body)))
     .go(rewrite(Logic.Rule.of(s)));
   }
  }

  it("CR.PN", function() {
    let interpreter = new Interpreter();
    let drs = interpreter.feed("Mel loves Dani.");

    // Two new discourse referents introduced.
    assertThat(drs.head.length).equalsTo(2);
    assertThat(drs.head[0].name).equalsTo("u");
    assertThat(drs.head[1].name).equalsTo("v");

    // Two new conditions added to the body.
    assertThat(drs.body.length).equalsTo(3);

    // Proper names rewritten.
    assertThat(Forward.stringify(drs.body[0])).equalsTo("loves(u, v)");
    assertThat(Forward.stringify(drs.body[1])).equalsTo("Name(u, Mel)");
    assertThat(Forward.stringify(drs.body[2])).equalsTo("Name(v, Dani)");

    let stream = interpreter.ask("exists(p) exists(q) exists (r) (Name(p, Mel) && loves(p, q) && Name(q, r))?");

    assertThat(Forward.toString(Logic.Parser.parse(stream.next().value.toString())))
     .equalsTo(Forward.toString(Logic.Parser.parse(`
    Name(u, Mel).
    exists (p = u) exists (q) exists (r) Name(p, Mel).
    loves(u, v).
    exists (p = u) exists (q = v) exists (r) loves(u, q).
    Name(v, Dani).
    exists (p = u) exists (q = v) exists (r = Dani) Name(v, r).
    exists (p = u) exists (q = v) exists (r = Dani) loves(u, q) && Name(q, r).
    exists (p = u) exists (q = v) exists (r = Dani) Name(p, Mel) && loves(p, q) && Name(q, r).
    `)));
  });

  it("CR.PRO", function() {
    let interpreter = new Interpreter();
    let drs = interpreter.feed("Jones owns Ulysses.");
    
    let node = first(parse("It fascinates him."), true);
    
    let matcher1 = S(NP(PRO(capture("pronoun"))), VP_(capture("?")));
    let m1 = match(matcher1, node);
    assertThat(m1.pronoun.children[0]).equalsTo("It");
    assertThat(m1.pronoun.types)
     .equalsTo({"case": "+nom", "gen": "-hum", "num": "sing"});
    assertThat(drs.head[1].types).equalsTo({"gen": "-hum", "num": "sing"});

    // The types of head[1] agree with the types of the pronoun,
    // so bind it to it.
    node.children[0] = drs.head[1];

    let matcher2 = VP(V(), NP(PRO(capture("pronoun"))));
    let m2 = match(matcher2, node.children[1].children[0]);
    assertThat(m2.pronoun.children[0]).equalsTo("him");
    assertThat(m2.pronoun.types)
     .equalsTo({"case": "-nom", "gen": "male", "num": "sing"});
    assertThat(drs.head[0].types).equalsTo({"gen": "male", "num": "sing"});

    // The types of head[2] agree with the types of the pronoun,
    // so bind it to it.
    node.children[1].children[0].children[1] = drs.head[0];

    let result = new Compiler().compile(node);

    assertThat(Forward.stringify(result))
     .equalsTo("fascinates(v, u)");
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    },
    failsAt(offset, token) {
     try {
      parse(x);
      throw Error("expected failure");
     } catch (e) {
      // console.log(e);
      assertThat(e.offset).equalsTo(offset);
      assertThat(e.token.value).equalsTo(token);
     }
    }
   }
  }

});

