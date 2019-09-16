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

describe("Grammar", function() {
  
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

    assertThat(result.length).equalsTo(51);

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
    // Adjectives
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ ADJ');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ "not" __ ADJ');
    // Conditionals
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> "if" __ S[num=@1] __ "then" __ S[num=@1]');
    // Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> S[num=@1] __ "or" __ S[num=@1]');
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
      assertThat(e.offset).equalsTo(offset);
      assertThat(e.token.value).equalsTo(token);
     }
    }
   }
  }
});

