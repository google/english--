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

describe.only("Syntax", function() {
  
  it("generate", function() {
    let result = grammar();

    const fs = require("fs");
    fs.writeFileSync("./src/drt/english.ne", compile(clone(result)));
  });

  it.only("grammar", function() {
    let result = grammar();

    assertThat(result.length).equalsTo(70);

    let i = 0;

    // Production Rules
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> S[num=@1] _ "."');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "who" _ NP[num=@1, case=+nom, gap=@1] __ VP\'[num=@1, fin=+, gap=-] _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "who" __ AUX[num=sing, fin=+] __ NP[num=@1, case=+nom, gap=-] __ VP[num=@3, fin=+, gap=@1] _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "is" __ NP[num=sing, case=+nom, gap=-] __ ADJ _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> NP\'[num=@1, case=+nom, gap=-] __ VP\'[num=@1, fin=+, gap=-]');
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@3, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, case=+nom, gap=-] __ VP'[num=@1, fin=+, gap=@3]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> AUX[num=@1, fin=+] __ \"not\" __ VP[num=@1, fin=-, gap=@2]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> VP[num=@1, fin=+, gap=@2]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=@3] -> V[num=@1, fin=@2, trans=+] WS[gap=@3] NP\'[num=@3, case=-nom, gap=@3]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=+] __ NP\'[num=@3, case=-nom, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=-]");
    assertThat(print(result[i++]))
     .equalsTo('NP[num=@1, case=@3, gap=@1] -> GAP')
    assertThat(print(result[i++]))
     .equalsTo("NP[num=@1, case=@3, gap=-] -> DET[num=@1] __ N[num=@1]");
    assertThat(print(result[i++]))
     .equalsTo("NP[num=@1, case=@3, gap=-] -> PN[num=@1]");
    assertThat(print(result[i++]))
     .equalsTo('NP[num=@1, case=@3, gap=-] -> PRO[num=@1, case=@3, refl=@4]');
    assertThat(print(result[i++]))
     .equalsTo('NP\'[num=plur, case=@2, gap=-] -> NP[num=@3, case=@2, gap=-] __ "and" __ NP[num=@4, case=@2, gap=-]');
    assertThat(print(result[i++]))
     .equalsTo("NP'[num=@1, case=@3, gap=@4] -> NP[num=@1, case=@3, gap=@4]");
    assertThat(print(result[i++]))
     .equalsTo('N[num=@1] -> N[num=@1] __ RC[num=@1]');
    assertThat(print(result[i++]))
     .equalsTo('RC[num=@1] -> RPRO[num=@1] __ S[num=@1, gap=@1]');
    // Adjectives
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ ADJ');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ "not" __ ADJ');
    // 3.6 Identity and Predicates
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ NP[num=@1, case=@5, gap=@3]');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> BE[num=@1, fin=@2] __ PP');
    assertThat(print(result[i++]))
     .equalsTo('N[num=@1] -> ADJ __ N[num=@1]');
    // Conditionals
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> "if" __ S[num=@1] __ "then" __ S[num=@1]');
    // Sentential Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> S[num=@1] __ "or" __ S[num=@1]');
    // VP Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, gap=@3] -> VP[num=@1, fin=@2, gap=@3] __ "or" __ VP[num=@1, fin=@2, gap=@3]');
    // NP Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('NP\'[num=@3, case=@2, gap=-] -> NP[num=@3, case=@2, gap=-] __ "or" __ NP[num=@3, case=@2, gap=-]');
    // Sentential Conjunctions
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1] -> S[num=@1] __ "and" __ S[num=@1]');
    // VP Conjunctions
    assertThat(print(result[i++]))
     .equalsTo('V[num=@1, fin=@2, trans=@3] -> V[num=@1, fin=@2, trans=@3] __ "and" __ V[num=@1, fin=@2, trans=@3]');
    // Non-pronomial possessive phrases
    assertThat(print(result[i++]))
     .equalsTo('NP[num=@1, case=@3, gap=-] -> DET[num=sing, rn=+] __ RN[num=@1]');
    assertThat(print(result[i++]))
     .equalsTo('DET[num=sing, rn=+] -> PN[num=@1] "\'s"');

    // Noun propositional phrases
    assertThat(print(result[i++]))
     .equalsTo('N[num=@1] -> N[num=@1] __ PP');
    assertThat(print(result[i++]))
     .equalsTo('PP -> PREP __ NP[num=@1, case=@3, gap=-]');
    
    // Insertion Rules
    assertThat(print(result[i++]))
     .equalsTo('DET[num=sing] -> "a" "an" "every" "the" "some"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=+nom, refl=-] -> "he"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom, refl=-] -> "him"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=+nom, refl=-] -> "she"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom, refl=-] -> "her"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom/+nom, refl=-] -> "it"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=plur, case=+nom, refl=-] -> "they"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=plur, case=-nom, refl=-] -> "them"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing] -> "stockbroker" "man" "engineer" "brazilian"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing] -> "stockbroker" "woman" "widow" "engineer" "brazilian"');
    assertThat(print(result[i++]))
     .equalsTo('N[num=sing] -> "book" "donkey" "horse" "porsche"');
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
     .equalsTo('RPRO[num=sing/plur] -> "who"');
    assertThat(print(result[i++]))
     .equalsTo('RPRO[num=sing/plur] -> "which"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom, refl=+] -> "himself"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom, refl=+] -> "herself"');
    assertThat(print(result[i++]))
     .equalsTo('PRO[num=sing, case=-nom, refl=+] -> "itself"');
    assertThat(print(result[i++]))
     .equalsTo('GAP -> null');
    assertThat(print(result[i++]))
     .equalsTo('ADJ -> "happy" "unhappy" "handsome" "beautiful" "fast" "slow" "mortal" "brazilian"');
    assertThat(print(result[i++]))
     .equalsTo('BE[num=sing, fin=@1] -> "is"');
    assertThat(print(result[i++]))
     .equalsTo('BE[num=plur, fin=@1] -> "are"');
    assertThat(print(result[i++]))
     .equalsTo('RN[num=sing] -> "husband" "father" "brother"');
    assertThat(print(result[i++]))
     .equalsTo('RN[num=sing] -> "wife" "mother" "sister"');
    assertThat(print(result[i++]))
     .equalsTo('RN[num=sing] -> "parent" "child" "sibling"');
    assertThat(print(result[i++]))
     .equalsTo('PREP -> "behind" "in" "over" "under" "near" "before" "after" "during" "from" "to" "of" "about" "by" "for" "with"');
    assertThat(print(result[i++]))
     .equalsTo("PN[num=sing] -> FULLNAME");
    assertThat(print(result[i++]))
     .equalsTo("PN[num=sing] -> VAR");
    
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

