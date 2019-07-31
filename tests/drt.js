const Assert = require("assert");
const peg = require("pegjs");

describe.only("DRT", function() {
  it("basic", function() {
    const parser = peg.generate(`
      S = "foo" /
          "bar"                                
    `);
    assertThat(parser.parse("foo")).equalsTo("foo");
    assertThat(parser.parse("bar")).equalsTo("bar");
  });

  let S = (np, vp) => { return {"@type": "Sentence", np: np, vp: vp} };
  let NP = (pn) => { return {"@type": "NounPhrase", np: pn} };
  let VP = (vb, np) => { return {"@type": "VerbPhrase", verb: vb, np: np} };
  let PN = (name) => { return {"@type": "ProperName", name: name} };
  let V = (name) => { return {"@type": "Verb", name: name} };
  let PRO = (name) => { return {"@type": "Pronoun", name: name} };

  it.only("S = NP VP", function() {
    const parser = peg.generate(`
      S = np:NP vp:VP {return {"@type": "Sentence", np: np, vp: vp}}
      VP = v:V np:NP { return {"@type": "VerbPhrase", verb: v, np: np}; }
      NP = pn:PN { return { "@type": "NounPhrase", np: pn}; } /
           pro:PRO { return { "@type": "NounPhrase", np: pro}; }
      PN = _ name:names _ { return {"@type": "ProperName", "name": name} }
      V = _ name:verbs _ { return {"@type": "Verb", "name": name} }
      PRO = _ name:pronous _ { return {"@type": "Pronoun", "name": name} }

      _ = [ ]*

      names = "Jones" /
              "Mary"
      verbs = "likes" /
              "loves"
      pronous = "he" / "him" / "she" / "her" / "it" / "they" /
                "He" / "Him" / "She" / "Her" / "It" / "They"

    `);
    assertThat(parser.parse("Jones loves Mary"))
     .equalsTo(S(NP(PN("Jones")), 
                 VP(V("loves"), 
                    NP(PN("Mary")))));
    assertThat(parser.parse("Mary likes Jones"))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PN("Jones")))));
    assertThat(parser.parse("Mary likes him"))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
    assertThat(parser.parse("She likes him"))
     .equalsTo(S(NP(PRO("She")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

