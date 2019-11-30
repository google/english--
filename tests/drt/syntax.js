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

describe("Syntax", function() {
  
  it.skip("generate", function() {
    let result = grammar();

    const fs = require("fs");
    fs.writeFileSync("./src/drt/english.ne", compile(result));
  });

  it.skip("grammar", function() {
    let result = grammar();

    assertThat(result.length).equalsTo(74);

    let i = 0;

    // Production Rules
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> S[num=@1, stat=@2, tense=@3] _ "."');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "who" _ NP[num=@1, case=+nom, gap=@1] __ VP\'[num=@1, fin=+, stat=@2, gap=-, tense=@3] _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "who" __ AUX[num=sing, fin=+, tense=@4] __ NP[num=@1, case=+nom, gap=-] __ VP[num=@3, fin=+, stat=@2, gap=@1, tense=@4] _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('Sentence -> "is" __ NP[num=sing, case=+nom, gap=-] __ ADJ _ "?"');
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1, stat=@2, tense=@3] -> NP\'[num=@1, case=+nom, gap=-] __ VP\'[num=@1, fin=+, stat=@2, gap=-, tense=@3]');
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, stat=@2, gap=@3, tense=@4] -> NP\'[num=@1, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, stat=@2, gap=-, tense=@4]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, stat=@2, gap=@3, tense=@4] -> NP\'[num=@3, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, stat=@2, gap=-, tense=@4]");
    assertThat(print(result[i++]))
     .equalsTo("S[num=@1, stat=@2, gap=@3, tense=@4] -> NP\'[num=@1, case=+nom, gap=-] __ VP'[num=@1, fin=+, stat=@2, gap=@3, tense=@4]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, stat=@3, gap=@2, tense=fut] -> AUX[num=@1, fin=+, tense=fut] __ VP[num=@1, fin=-, stat=@3, gap=@2, tense=pres]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, stat=@3, gap=@2, tense=@4] -> AUX[num=@1, fin=+, tense=@4] __ \"not\" __ VP[num=@1, fin=-, stat=@3, gap=@2, tense=@4]");
    assertThat(print(result[i++]))
     .equalsTo("VP'[num=@1, fin=+, stat=@3, gap=@2, tense=@4] -> VP[num=@1, fin=+, stat=@3, gap=@2, tense=@4]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] -> V[num=@1, fin=@2, stat=@4, trans=+, tense=@5] WS[gap=@3] NP\'[num=@3, case=-nom, gap=@3]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, stat=@4, gap=-, tense=@5] -> V[num=@1, fin=@2, stat=@4, trans=+, tense=@5] __ NP\'[num=@3, case=-nom, gap=-]");
    assertThat(print(result[i++]))
     .equalsTo("VP[num=@1, fin=@2, stat=@3, gap=-, tense=@4] -> V[num=@1, fin=@2, stat=@3, trans=-, tense=@4]");
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
     .equalsTo('RC[num=@1] -> RPRO[num=@1] __ S[num=@1, stat=@2, gap=@1, tense=@3]');
    // Adjectives
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] -> BE[num=@1, fin=@2] __ ADJ');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] -> BE[num=@1, fin=@2] __ "not" __ ADJ');
    // 3.6 Identity and Predicates
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@6] -> BE[num=@1, fin=@2] __ NP[num=@1, case=@5, gap=@3]');
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] -> BE[num=@1, fin=@2] __ PP');
    assertThat(print(result[i++]))
     .equalsTo('N[num=@1] -> ADJ __ N[num=@1]');
    // Conditionals
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1, stat=@2, tense=@3] -> "if" __ S[num=@1, stat=@2, tense=@3] __ "then" __ S[num=@1, stat=@2, tense=@3]');
    // Sentential Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1, stat=@2, tense=@3] -> S[num=@1, stat=@2, tense=@3] __ "or" __ S[num=@1, stat=@2, tense=@3]');
    // VP Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] -> VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5] __ "or" __ VP[num=@1, fin=@2, stat=@4, gap=@3, tense=@5]');
    // NP Disjunctions
    assertThat(print(result[i++]))
     .equalsTo('NP\'[num=@3, case=@2, gap=-] -> NP[num=@3, case=@2, gap=-] __ "or" __ NP[num=@3, case=@2, gap=-]');
    // Sentential Conjunctions
    assertThat(print(result[i++]))
     .equalsTo('S[num=@1, stat=@2, tense=@3] -> S[num=@1, stat=@2, tense=@3] __ "and" __ S[num=@1, stat=@2, tense=@3]');
    // VP Conjunctions
    assertThat(print(result[i++]))
     .equalsTo('V[num=@1, fin=@2, stat=@4, trans=@3, tense=@5] -> V[num=@1, fin=@2, stat=@4, trans=@3, tense=@5] __ "and" __ V[num=@1, fin=@2, stat=@4, trans=@3, tense=@5]');
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
     .equalsTo('AUX[num=sing, fin=+, tense=pres] -> "does"');
    assertThat(print(result[i++]))
     .equalsTo('AUX[num=plur, fin=+, tense=pres] -> "do"');
    
    assertThat(print(result[i++]))
     .equalsTo('V[trans=+, stat=+] -> "like" "love" "admire" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(result[i++]))
     .equalsTo('V[trans=-, stat=+] -> "love" "stink" "adore"');

    assertThat(print(result[i++]))
     .equalsTo('V[trans=+, stat=-] -> "leave" "reach" "kiss" "hit" "scold" "beat"');
    assertThat(print(result[i++]))
     .equalsTo('V[trans=-, stat=-] -> "leave" "arrive" "walk" "sleep" "come" "shine"');

    assertThat(print(result[i++]))
     .equalsTo('V[num=@1, fin=-, stat=@3, trans=@2, tense=pres] -> V[trans=@2, stat=@3]');

    assertThat(print(result[i++]))
     .equalsTo('V[num=sing, fin=+, stat=@2, trans=@1, tense=pres] -> V[num=sing, fin=-, stat=@2, trans=@1, tense=pres] "s"');
    
    assertThat(print(result[i++]))
     .equalsTo('V[num=plur, fin=+, stat=@2, trans=@1, tense=pres] -> V[num=sing, fin=-, stat=@2, trans=@1, tense=pres]');

    assertThat(print(result[i++]))
     .equalsTo('V[num=@1, fin=+, stat=@2, trans=@3, tense=past] -> V[num=@1, fin=-, stat=@2, trans=@3, tense=pres] "ed"');

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

