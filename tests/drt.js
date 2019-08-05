const Assert = require("assert");
const peg = require("pegjs");

const nearley = require("nearley");
const grammar = require("./grammar.js");

const {S, VP, NP, PN, V, PRO, DET, N, AND} = require("./ast.js");

describe("DRT", function() {

  it.only("compiler compiler", function() {

    let rule = (head = {}, tail = []) => { return {"@type": "Rule", head: head, tail: tail}};
    let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
    let literal = (value) => { return {"@type": "Literal", name: value} };
    let phrase = (head, tail) => { return rule(head, [tail]); };

    let l = (value) => { return literal(value); };

    let space = (space) => { return {"@type": "Space"} };

    assertThat(term("S", {Num: "alpha"}))
     .equalsTo({"@type": "Term", name: "S", types: {Num: "alpha"}});
    assertThat(term("S", {Num: "alpha", Gen: "any", Case: "+nom"}))
     .equalsTo({"@type": "Term", name: "S", types: {Num: "alpha", Gen: "any", Case: "+nom"}});
    assertThat(rule(term("RPRO", {num: "sing/plur", gen: "-hum"}), [literal("which")]))
     .equalsTo({"@type": "Rule", 
        head: {"@type": "Term", name: "RPRO", types: {num: "sing/plur", gen: "-hum"}}, 
        tail: [{"@type": "Literal", name: "which"}]
      });

    const grammar = [];


    // phrase structure rules

    // PS1
    grammar.push(phrase(term("S", {"num": "alpha"}), 
                        [term("NP", {"num": "alpha", "gen": "beta", "case": "+nom"}),
                         term("VP_", {"num": "alpha", "fin": "+"})]));
    
    // PS2
    //grammar.push(rule(term("S", {"num": "alpha", "gap": "NP/num=gama"}), 
    //                  [term("NP", {"num": "{alpha, gama}", "gen": "beta", "case": "+nom", "gap": "NP/num=gama"}),
    //                   term("VP_", {"num": "alpha", "fin": "+", "gap": "-"})]));

    // PS3
    //grammar.push(rule(term("S", {"num": "alpha", "gap": "NP/num=gama"}), 
    //                  [term("NP", {"num": "alpha", "gen": "beta", "case": "+nom", "gap": "-"}),
    //                   term("VP_", {"num": "alpha", "fin": "+", "gap": "NP/num=gama"})]));

    // PS4
    //grammar.push(rule(term("VP_", {"num": "alpha", "fin": "+", "gap": "gama"}), 
    //                  [term("AUX", {"num": "alpha", "fin": "+"}),
    //                   l("not"),
    //                   term("VP", {"num": "sigma", "fin": "-", "gap": "gama"})]));

    // PS5
    grammar.push(phrase(term("VP_", {"num": "alpha", "fin": "+", "gap": "gama"}), 
                        [term("VP", {"num": "alpha", "fin": "+", "gap": "gama"})]));
    
    // PS6
    //grammar.push(rule(term("VP", {"num": "alpha", "fin": "beta", "gap": "gama"}), 
    //                  [term("V", {"num": "alpha", "fin": "beta", "trans": "+"}),
    //                   term("NP", {"num": "gama", "gen": "sigma", "case": "-nom", "gap": "gama"})]));

    // PS7
    grammar.push(phrase(term("VP", {"num": "alpha", "fin": "beta"}), 
                      [term("V", {"num": "alpha", "fin": "beta", "trans": "-"})]));

    // PS8
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama", "gap": "NP/num=alpha"}), 
    //                  [term("GAP", {})]));

    // PS9
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama"}), 
    //                  [term("DET", {"num": "alpha"}),
    //                   term("N", {"num": "alpha", "gen": "beta"})]));

    // PS10
    grammar.push(phrase(term("NP", {"num": "alpha", "gen": "beta"}), 
                        [term("PN", {"num": "alpha", "gen": "beta"}),
                         space()]));

    // PS11
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama"}), 
    //                  [term("PRO", {"num": "alpha", "gen": "beta", "case": "gama"})]));

    // PS12
    //grammar.push(rule(term("NP", {"num": "plur", "gen": "beta", "case": "gama"}), 
    //                  [term("NP", {"num": "sigma", "gen": "theta", "case": "gama"}),
    //                   l("and"),
    //                   term("NP", {"num": "sigma2", "gen": "theta2", "case": "gama"})]));
    
    // PS13
    //grammar.push(rule(term("N", {"num": "alpha", "gen": "beta"}), 
    //                  [term("N", {"num": "alpha", "gen": "beta"}),
    //                   term("RC", {"num": "alpha", "gen": "beta"})]));

    // PS14
    //grammar.push(rule(term("RC", {"num": "alpha", "gen": "beta"}), 
    //                  [term("RPRO", {"num": "alpha", "gen": "beta"}),
    //                   term("S", {"num": "gama", "gap": "NP/num=alpha"})]));


    // return;

    // lexical insertion rules

    // LI1
    //grammar.push(rule(term("DET", {"num": "sing"}), [l("a"), l("every"), l("the"), l("some")]));
    
    // LI2
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "+nom"}), [l("he")]));
    // LI3
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom"}), [l("him")]));
    // LI4
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "+nom"}), [l("she")]));
    // LI5
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom"}), [l("her")]));
    // LI6
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": "-nom/+nom"}), [l("it")]));
    // LI7
    //grammar.push(rule(term("PRO", {"num": "plur", "gen": "male/fem/-hum", "case": "+nom"}), [l("they")]));
    // LI8
    //grammar.push(rule(term("PRO", {"num": "plur", "gen": "male/fem/-hum", "case": "-nom"}), [l("them")]));

    // LI9
    grammar.push(rule(term("PN", {"num": "sing", "gen": "male"}), [l("Jones"), l("Smith"), l("Bill")]));
    // LI10
    //grammar.push(rule(term("PN", {"num": "sing", "gen": "fem"}), [l("Jones"), l("Mary"), l("Anna")]));
    // LI11
    //grammar.push(rule(term("PN", {"num": "sing", "gen": "-hum"}), [l("Ulysses"), l("Anna Karenina")]));

    // LI12
    //grammar.push(rule(term("N", {"num": "sing", "gen": "male"}), [l("stockbroker"), l("man")]));
    // LI13
    //grammar.push(rule(term("N", {"num": "sing", "gen": "fem"}), [l("stockbroker"), l("woman", "widow")]));
    // LI14
    //grammar.push(rule(term("N", {"num": "sing", "gen": "-hum"}), [l("book"), l("horse", "bicycle")]));

    // LI15
    //grammar.push(rule(term("AUX", {"num": "sing", "fin": "+"}), [l("does")]));
    // LI16
    //grammar.push(rule(term("AUX", {"num": "plur", "fin": "+"}), [l("do")]));

    // LI17
    //grammar.push(rule(term("V", {"num": "sing/plur", "trans": "+", "fin": "-"}), 
    //                  [l("like"), l("love"), l("own"), l("fascinate"), l("rotate")]));
    // LI18
    grammar.push(rule(term("V", {"num": "sing/plur", "trans": "-", "fin": "-"}), 
                      [l("stinks"), l("rotates")]));

    // TODO:
    // LI19
    // LI20

    // LI21
    //grammar.push(rule(term("RPRO", {"num": "sing/plur", "gen": "male/fem"}), [l("who")]));
    // LI22
    //grammar.push(rule(term("RPRO", {"num": "sing/plur", "gen": "-hum"}), [l("which")]));

    // console.log(JSON.stringify(grammar, undefined, 2));

    let lines = [];

    lines.push(``);

    lines.push(`@builtin "whitespace.ne"`);

    lines.push(``);

    lines.push(`@{% const node = (type, ...children) => { return {"@type": type, children: children}; }; %}`);

    lines.push(``);

    for (let {head, tail} of grammar) {
     // let line = [];
     lines.push(`${head.name} ->`);
     // line.push(head.name);
     // line.push("->");
     // line.push("\n");
     // console.log(tail);
     for (let i = 0; i < tail.length; i++) {
      let term = tail[i];
      // console.log(term);
      let br = i < (tail.length - 1) ? " |" : "";
      if (term["@type"] == "Literal") {
       lines.push(`  "${term.name}" {% ([n]) => node("${head.name}", n) %}${br}`);
      } else if (Array.isArray(term)) {
       let terms = [];
       let sentence = term.map(x => x["@type"] == "Space" ? "_"  : x.name).join(" ");
       terms.push(`  ${sentence}`);
       let sp = 0;
       let args = term.map(x => x["@type"] == "Space" ? `s${sp++}`  : x.name).join(", ");
       let values = term.filter(x => x["@type"] != "Space").map(x => x.name).join(", ");
       terms.push(`{% ([${args}]) => node("${head.name}", ${values}) %}${br}`);
       // console.log("hi");
       // terms.push("hi");
       // line.push(terms.join(" "));
       lines.push(terms.join(" "));
      }
     }
     // line.push(tail[0]["@type"] == "Literal" ? terms.join(" | ") : terms.join(" "));
    }

    lines.push(``);

    // console.log(lines.join("\n"));

    assertThat(lines.join("\n")).equalsTo(`
@builtin "whitespace.ne"

@{% const node = (type, ...children) => { return {"@type": type, children: children}; }; %}

S ->
  NP VP_ {% ([NP, VP_]) => node("S", NP, VP_) %}
VP_ ->
  VP {% ([VP]) => node("VP_", VP) %}
VP ->
  V {% ([V]) => node("VP", V) %}
NP ->
  PN _ {% ([PN, s0]) => node("NP", PN) %}
PN ->
  "Jones" {% ([n]) => node("PN", n) %} |
  "Smith" {% ([n]) => node("PN", n) %} |
  "Bill" {% ([n]) => node("PN", n) %}
V ->
  "stinks" {% ([n]) => node("V", n) %} |
  "rotates" {% ([n]) => node("V", n) %}
`);

    const fs = require("fs");
    fs.writeFileSync("./tests/foo.ne", lines.join("\n"));
  });

  it.only("tests", function() {
    const grammar = require("./foo.js");

    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed("Smith stinks");
    let node = (type, ...children) => { return {"@type": type, children: children} };
    assertThat(parser.results)
     .equalsTo([node("S", 
                     node("NP", 
                          node("PN", "Smith")),
                     node("VP_", 
                          node("VP", 
                               node("V", "stinks"))))
                ]);
  });

  it.skip("nearly", function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed("foo\n");
    assertThat(parser.results).equalsTo([[[[["foo"], "\n"] ]]]);
  });

  function parse(code) {
   const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
   parser.feed(code);
   return parser.results;
  }

  it("basic", function() { 
   assertThat(parse("Jones likes Mary."))
     .equalsTo([S(NP(PN("Jones")), 
                  VP(V("likes"), 
                     NP(PN("Mary"))))]);
    assertThat(parse("Mary likes Jones."))
     .equalsTo([S(NP(PN("Mary")), 
                  VP(V("likes"), 
                     NP(PN("Jones"))))]);
    assertThat(parse("Mary likes him."))
     .equalsTo([S(NP(PN("Mary")), 
                  VP(V("likes"), 
                     NP(PRO("him"))))]);
    assertThat(parse("she likes him."))
     .equalsTo([S(NP(PRO("she")), 
                  VP(V("likes"), 
                     NP(PRO("him"))))]);
    assertThat(parse("she likes every car."))
     .equalsTo([S(NP(PRO("she")), 
                  VP(V("likes"), 
                     NP(DET("every"), N("car"))))]);
    assertThat(parse("a man likes a woman."))
     .equalsTo([S(NP(DET("a"), N("man")), 
                  VP(V("likes"), 
                     NP(DET("a"), N("woman"))))]);

    assertThat(parse("a man likes a woman and a car."))
     .equalsTo([S(NP(DET("a"), N("man")), 
                 VP(V("likes"), 
                    NP(AND(NP(DET("a"), N("woman")),
                           NP(DET("a"), N("car")))
                       )))]);
    assertThat(parse("a man and a woman likes a car."))
     .equalsTo([S(NP(AND(NP(DET("a"), N("man")),
                         NP(DET("a"), N("woman")))
                     ), 
                  VP(V("likes"), 
                     NP(DET("a"), N("car"))
                     ))]);
    

   });
   
  it("basic", function() {
    const parser = peg.generate(`
      S = "foo" /
          "bar"                                
    `);
    assertThat(parser.parse("foo")).equalsTo("foo");
    assertThat(parser.parse("bar")).equalsTo("bar");
  });

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

