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
  let NP = (pn) => { return {"@type": "NounPhrase", pn: pn} };
  let VP = (vb, np) => { return {"@type": "VerbPhrase", verb: vb, np: np} };
  let PN = (name) => { return {"@type": "ProperName", name: name} };
  let V = (name) => { return {"@type": "Verb", name: name} };

  it.only("S = NP VP", function() {
    const parser = peg.generate(`
      S = np:NP vp:VP {return {"@type": "Sentence", np: np, vp: vp}}
      VP = _ v:V _ np:NP _ { return {"@type": "VerbPhrase", verb: v, np: np}; }
      NP = _ pn:PN _ { return { "@type": "NounPhrase", pn: pn}; }
      PN = name:names { return {"@type": "ProperName", "name": name} }
      V = name:verbs { return {"@type": "Verb", "name": name} }
      _ = [ ]*
      names = "Jones" /
              "Mary"
      verbs = "likes" /
              "loves"
    `);
    assertThat(parser.parse("Jones loves Mary"))
     .equalsTo(S(NP(PN("Jones")), 
                 VP(V("loves"), 
                    NP(PN("Mary")))));
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

