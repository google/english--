const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley, FeaturedNearley} = require("../../src/drt/parser.js");
const {Lexer} = require("../../src/drt/lexer.js");
const DRT = require("../../src/drt/parser.js");
const {
  Statement,
  Question,
  S,
  S_,
  NP,
  PN,
  VP_,
  VP,
  V,
  AUX,
  PRO,
  DET,
  N,
  RC,
  RPRO,
  GAP,
  BE,
  ADJ,
  PREP,
  PP,
  VERB,
  HAVE,
  RN} = DRT.nodes;

describe("Lexer", function() {

  it("Lexer", () => {
    let lexer = new Lexer([
      ["foo", "WORD"],
      [" ", "WS"],
      [".", "PERIOD"],
    ]);
    lexer.reset("foofoo foo.");
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("PERIOD", "."));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("longest string: direct next isnt a substring", () => {
    let lexer = new Lexer([
      ["foo", "a"],
      ["the", "a"],
      ["them", "a"],
      ["then", "a"],
    ]);
    lexer.reset("then");
    assertThat(lexer.next()).equalsTo(token("a", "then"));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it.skip("if Mary is happy then Jones is happy.", () => {
    let lexer = new Lexer([
      [" ", "word"],
      [".", "word"],
      ["the", "word"],
      ["them", "word"],
      ["if", "word"],
      ["Mary", "word"],
      ["is", "word"],
      ["happy", "word"],
      ["then", "word"],
      ["Jones", "word"],
    ]);
    lexer.reset("if Mary is happy then Jones is happy.");
    assertThat(lexer.next()).equalsTo(token("word", "if"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "Mary"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "is"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "happy"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "then"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "Jones"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "is"));
    assertThat(lexer.next()).equalsTo(token("word", " "));
    assertThat(lexer.next()).equalsTo(token("word", "happy"));
    assertThat(lexer.next()).equalsTo(token("word", "."));
    
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("match", () => {
    let lexer = new Lexer([
      ["bar"],
      ["foo"],
      ["football"],
    ]);
    lexer.reset("foo");
    assertThat(lexer.match("foo")).equalsTo(0);
    assertThat(lexer.match("bar")).equalsTo(-1);
    assertThat(lexer.match("football")).equalsTo(1);
  });

  it("longest string: needs more to be seen", () => {
   let lexer = new Lexer([
     ["bar", "bar"],
     ["foo", "foo"],
     ["football", "football"],
    ]);
    
    lexer.reset("foo");
    assertThat(lexer.next()).equalsTo(undefined);
    lexer.reset("bar");
    assertThat(lexer.next()).equalsTo(token("foo", "foo"));
    assertThat(lexer.next()).equalsTo(token("bar", "bar"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("longest string", () => {
    let lexer = new Lexer([
      ["a", "a"],
      ["he", "he"],
      ["her", "her"],
      ["herself", "herself"],
    ]);
    
    lexer.reset("herself");
    assertThat(lexer.next()).equalsTo(token("herself", "herself"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("next", () => {
    let lexer = new Lexer([
      [" ", "WS"],
      [".", "PERIOD"],
      ["bar", "bar"],
      ["man", "WORD"],
      ["foo", "WORD"],
      ["football", "WORD"],
    ]);
    
    lexer.reset("foo");
    assertThat(lexer.next()).equalsTo(undefined);
    lexer.reset("bar");
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("bar", "bar"));
    assertThat(lexer.next()).equalsTo(undefined);

    return;
    
    lexer.reset("man");
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "man"});
    assertThat(lexer.next()).equalsTo(undefined);

    lexer.reset("bar man");
    assertThat(lexer.next()).equalsTo({value: "bar"});
    assertThat(lexer.next()).equalsTo({type: "WS", value: " "});
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "man"});
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("man", () => {
    const tokens = [
      ["man", "WORD"],
    ];

    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("man")).equalsTo([[
      token("WORD", "man")
    ]]);
  });
  
  it("bar", () => {
    const tokens = [
      ["bar", "bar"],
    ];
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> "bar"
    `);
    assertThat(parser.feed("bar")).equalsTo([[
      token("bar", "bar")
    ]]);
  });

  it("foobar", () => {
    const tokens = [
      ["foo", "WORD"],
      ["bar", "bar"],
    ];
    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> (%WORD | "bar"):+
    `);
    assertThat(parser.feed("foobar")).equalsTo([[[
      [token("WORD", "foo")],
      [token("bar", "bar")],
    ]]]);
  });
  
  it("f, o, o, b", () => {
    const tokens = [
      ["foo", "WORD"],
      ["bar", "bar"],
      ["football", "WORD"],
    ];
    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("f")).equalsTo([]);
    assertThat(parser.feed("o")).equalsTo([]);
    assertThat(parser.feed("o")).equalsTo([]);
    assertThat(parser.feed("b")).equalsTo([[token("WORD", "foo")]]);
  });

  it("football", () => {
    const tokens = [
      ["foo", "WORD"],
      ["bar", "bar"],
      ["football", "WORD"],
    ];
    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("football"))
      .equalsTo([[token("WORD", "football")]]);
  });

  it("foot, ball", () => {
    const tokens = [
      ["foo", "WORD"],
      ["bar", "bar"],
      ["football", "WORD"],
    ];
    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("foot"))
     .equalsTo([]);
    assertThat(parser.feed("ball"))
      .equalsTo([[token("WORD", "football")]]);
  });

  it("Jones loves Mary.", () => {
    const tokens = [
      [" ", "WS"],
      [".", "PERIOD"],
      ["Jones", "PN"],
      ["loves", "V"],
      ["Mary", "PN"],
    ];

    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> _ S _ {% ([ws1, s, ws2]) => s %}
      S -> NP __ VP _ "." {% ([np, ws, vp]) => [np, vp]%}
      NP -> %PN {% id %}
      VP -> %V __ NP {% ([v, ws, np]) => [v, np] %}
      _ -> %WS:* {% id %}
      __ -> %WS:+ {% id %}
    `);

    assertThat(parser.feed("Jones loves Mary ."))
      .equalsTo([[
        token("PN", "Jones"), [token("V", "loves"), token("PN", "Mary")]
      ]]);
  });

  it("brazilian", () => {
    const tokens = [
      ["brazilian", "WORD", [{type: "N"}]],
    ];

    let parser = Nearley.from(`
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("brazilian")).equalsTo([[
      token("WORD", "brazilian", [{
        "type": "N",
      }])
    ]]);
  });

  function clear(root) {
    delete root.types;
    delete root.loc;
    // console.log(root);
    for (let i = 0; i < (root.children || []).length; i++) {
      let child = root.children[i];
      // console.log(child["tokens"]);
      // console.log("hi");
      if (child["value"]) {
        root.children[i] = child.value;
        continue;
      }
      clear(child);
    }
    return root;
  }

  function parse(s, start = "Statement", header, footer, body, all) {
    const {Parser} = DRT;
    let parser = new Parser(start, header, footer, body);
    let results = parser.feed(s);
    if (start == "Statement") {
      // console.log(results);
      return clear(results[0].children[0].children[0]);
    }
    // console.log(results);
    return clear(results[0]);
  }

  const dict = [
    [" ", {type: "WS"}],
    [".", {}],
    ["s", {}],
    ["a", {}],
    ["Jones", {type: "PN"}],
    ["love", {type: "V"}],
    ["happy", {type: "ADJ"}],
    ["Mary", {type: "PN"}],
    ["Peter", {type: "PN"}],
    ["dog", {type: "N"}],
  ];
    
  it("Typed Tokens", function() {
    const tokens = [
      ["foo", "word", [{
        "@type": "N",
        "types": {
          "num": "sing",
        }
      }]],
      ["bar", "word", [{
        "@type": "ADJ",
        "types": {"foo": "bar"}
      }]],  
    ];
    let grammar = FeaturedNearley.compile(`
       main -> N[num=1] ADJ. 

       ADJ[] -> %word.
       N[num=1] -> %word.
    `, `
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("foobar");
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": [{
        "@type": "N",
        "types": {"num": "sing"},
        "children": [{value: "foo"}]
      }, {
        "@type": "ADJ",
        "types": {"foo": "bar"},
        "children": [{value: "bar"}]
      }],
      "loc": 0,
      "types": {}
    }]);
  });

  it("every porsche", function() {
    assertThat(parse("every porsche", "NP"))
      .equalsTo(NP(DET("every"), N("porsche")));
  });

  it.skip("a", function() {
    assertThat(parse("a", "DET"))
      .equalsTo(DET("a"));
  });

  it("Jones loves Mary", function() {
    assertThat(parse("Jones loves Mary.", "Statement"))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
  });

  it("she loves herself.", () => {
    assertThat(parse("she loves herself.", "Statement"))
      .equalsTo(S(NP(PRO("she")),
                  VP_(VP(V(VERB("love"), "s"), NP(PRO("herself"))))));
  });
  
  it("Jones loves Mary", function() {        
    assertThat(parse("every man loves Mary.", "Statement"))
      .equalsTo(S(NP(DET("every"), N("man")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
    
    assertThat(parse("some man loves Mary.", "Statement"))
      .equalsTo(S(NP(DET("some"), N("man")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
    // return;
    assertThat(parse("he loves her.", "Statement"))
      .equalsTo(S(NP(PRO("he")),
                  VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));

    return;
    
    assertThat(parse("she loves a man.", "Statement"))
      .equalsTo(S(NP(PRO("she")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("a"), N("man"))))));
    
    assertThat(parse("she loves a man who loves her.", "Statement"))
      .equalsTo(S(NP(PRO("she")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("a"),
                            N(N("man"), RC(RPRO("who"),
                                           S(NP(GAP()),
                                             VP_(VP(V(VERB("love"), "s"),
                                                    NP(PRO("her")))
                                                 ))
                                          )))))));
  });

  it.skip("Jones loves a dog", function() {
    assertThat(parse("Jones loves a dog.", "Statement"))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"), NP(DET("a"), N("dog"))))));
  });

  let token = (type, value, tokens = []) => {
    return {
      "type": type,
      "value": value,
      "tokens": tokens
    };
  };
    
  it("Jones loves a dog.", () => {
    const lexer = new Lexer([
      [" ", "WS"],
      [".", "PERIOD"],
      ["a", "DET"],
      ["Jones", "PN"],
      ["loves", "V"],
      ["happy", "ADJ"],
      ["bar", "ADJ"],
      ["Mary", "PN"],
      ["dog", "N"],
    ]);
    lexer.reset("Jones loves a dog.");
    assertThat(lexer.next()).equalsTo(token("PN", "Jones"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("V", "loves"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("DET", "a"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("N", "dog"));
    assertThat(lexer.next()).equalsTo(token("PERIOD", "."));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it.skip("Moo", async function() {
    this.timeout(500000);
    const fs = require("fs");
    const readline = require("readline");

    const stream = fs.createReadStream("tests/drt/clex_lexicon.pl");

    const rl = readline.createInterface({
      input: stream,
    });

    let parts = {};
    // console.log("loading");
    for await (const line of rl) {
      const parser = new Parser(Grammar.fromCompiled(grammar));
      parser.feed(line + "\n");
      let [result] = parser.results;
      if (result.length == 0) {
        continue;
      }
      let [[name]] = result;
      if (name == "%") {
        continue;
      }
      let [[, args]] = result;
      if (!parts[name]) {
        parts[name] = [];
      }
      parts[name].push(args[0]);
      // console.log(name);
      if (name == "prep") {
        break;
      }
    }

    // console.log(Object.keys(parts));
    parts["WS"] = /[ \t]+/;
    for (let adv of parts["adv"]) {
      console.log(adv);
    }
    let lexer = moo.compile(parts);
    // console.log("done compiling");
    lexer.reset("clip-on cast-off awkwardly ");
    // console.log("done reseting");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("WS");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("WS");
    assertThat(lexer.next().type).equalsTo("adj_itr");
    assertThat(lexer.next().type).equalsTo("mn_pl");
    assertThat(lexer.next().type).equalsTo("mn_pl");
    assertThat(lexer.next().type).equalsTo("WS");
    console.log("done testing");
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
