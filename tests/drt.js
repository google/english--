const Assert = require("assert");
const peg = require("pegjs");

const nearley = require("nearley");
const grammar = require("./grammar.js");

describe.only("DRT", function() {
  it.only("nearly", function() {
    // Create a Parser object from our grammar.
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    
    // Parse something!
    parser.feed("foo\n");
    
    // parser.results is an array of possible parsings.
    assertThat(parser.results).equalsTo([[[[["foo"], "\n"] ]]]);
  });
   
  it("basic", function() {
    const parser = peg.generate(`
      S = "foo" /
          "bar"                                
    `);
    assertThat(parser.parse("foo")).equalsTo("foo");
    assertThat(parser.parse("bar")).equalsTo("bar");
  });

  let S = (np, vp) => { return {"@type": "Sentence", np: np, vp: vp} };
  let NP = (...args) => { return {"@type": "NounPhrase", children: args} };
  let VP = (vb, np) => { return {"@type": "VerbPhrase", verb: vb, np: np} };
  let PN = (name) => { return {"@type": "ProperName", name: name} };
  let V = (name) => { return {"@type": "Verb", name: name} };
  let PRO = (name) => { return {"@type": "Pronoun", name: name} };
  let DET = (name) => { return {"@type": "Determiner", name: name} };
  let N = (name) => { return {"@type": "Noun", name: name} };

  it("S = NP VP", function() {
    const parser = peg.generate(`
      S = np:NP vp:VP PERIOD {return {"@type": "Sentence", np: np, vp: vp}}
      VP = v:V np:NP { return {"@type": "VerbPhrase", verb: v, np: np}; }
      NP = pn:PN { return { "@type": "NounPhrase", children: [pn]}; } /
           pro:PRO { return { "@type": "NounPhrase", children: [pro]}; } /
           det:DET n:N { return { "@type": "NounPhrase", children: [det, n]}; }

      PN = _ name:names _ { return {"@type": "ProperName", "name": name} }
      V = _ name:verbs _ { return {"@type": "Verb", "name": name} }
      N = _ name:nouns _ { return {"@type": "Noun", "name": name} }

      PRO = _ name:pronous _ { return {"@type": "Pronoun", "name": name} }
      DET = _ name:determiners _ { return {"@type": "Determiner", "name": name} }

      _ = [ ]*

      PERIOD = _ "." _

      names = "Jones" /
              "Mary"

      verbs = "likes" /
              "loves"

      nouns = "book" /
              "man" /
              "woman" /
              "donkey" /
              "car"

      determiners = "a" / "every" / "the" / "some" / "all" / "most"

      pronous = "he" / "him" / "she" / "her" / "it" / "they"

    `);
    assertThat(parser.parse("Jones loves Mary."))
     .equalsTo(S(NP(PN("Jones")), 
                 VP(V("loves"), 
                    NP(PN("Mary")))));
    assertThat(parser.parse("Mary likes Jones."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PN("Jones")))));
    assertThat(parser.parse("Mary likes him."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
    assertThat(parser.parse("she likes him."))
     .equalsTo(S(NP(PRO("she")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
    assertThat(parser.parse("she likes every car."))
     .equalsTo(S(NP(PRO("she")), 
                 VP(V("likes"), 
                    NP(DET("every"), N("car")))));
    assertThat(parser.parse("a man likes a woman."))
     .equalsTo(S(NP(DET("a"), N("man")), 
                 VP(V("likes"), 
                    NP(DET("a"), N("woman")))));
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

