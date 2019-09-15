const Assert = require("assert");

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
  grammar,
  first,
  clean,
  nodes} = require("../../src/drt/parser.js");

const {
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, PRO, AUX, RC, RPRO, GAP, ADJ,
 Discourse, Sentence
} = nodes;

describe("DRT Parser", function() {
  
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
    fs.writeFileSync("./src/drt/english.ne", compile(clone(result)));
  });

  it("grammar", function() {
    let result = grammar();

    assertThat(result.length).equalsTo(49);

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
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ ADJ');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ "not" __ ADJ');
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
     .equalsTo('PN[num=sing, gen=male] -> "Jones" "John" "Mel" "Leo" "Yuji" "Smith"');
    assertThat(print(result[i++]))
     .equalsTo('PN[num=sing, gen=fem] -> "Mary" "Dani" "Anna"');
    assertThat(print(result[i++]))
     .equalsTo('PN[num=sing, gen=-hum] -> "Brazil" "Italy" "Ulysses"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=male] -> "stockbroker" "man"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=fem] -> "stockbroker" "woman" "widow"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing, gen=-hum] -> "book" "donkey" "horse" "porsche"');
    assertThat(print(result[i++]))
     .equalsTo('AUX[num=sing, fin=+] -> "does"');
    assertThat(print(result[i++]))
     .equalsTo('AUX[num=plur, fin=+] -> "do"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=+] -> "like" "love" "admire" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=-] -> "love" "stink" "adore"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing, fin=+, trans=+] -> "likes" "loves" "admires" "knows" "owns" "fascinates" "rotates" "surprises"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=sing, fin=+, trans=-] -> "loves" "stinks" "adores"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=plur, fin=+, trans=+] -> "like" "love" "admire" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(result[i++]))
     .equalsTo('V[num=plur, fin=+, trans=-] -> "love" "stink" "adore"');
    assertThat(print(result[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=male/fem] -> "who"');
    assertThat(print(result[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=-hum] -> "which"');
    assertThat(print(result[i++]))
     .equalsTo('GAP -> null');
    assertThat(print(result[i++]))
     .equalsTo('ADJ -> "happy" "unhappy" "foolish" "fat"');
    assertThat(print(result[i++]))
     .equalsTo('BE[num=sing, fin=@1] -> "is"');
    assertThat(print(result[i++]))
     .equalsTo('BE[num=plur, fin=@1] -> "are"');
    
    // "case" makes the distinction between "nominative case"
    // and "non-nominative case", respectively, he/she and
    // him/her.

    // "fin" makes the distinction between "infinitival" and
    // "finite" verb forms (- and +, respectively). 
    // "infinitival" verb forms are used with negations.

    // console.log(compile(result));
  });

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

