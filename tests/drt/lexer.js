const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley} = require("../../src/drt/parser.js");
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

  const tokens = [
    [" ", {type: "WS", value: " "}],
    [".", {type: "PERIOD", value: "."}],
    ["bar", {type: "bar", value: "bar"}],
    ["man", {type: "WORD", value: "man"}],
    ["foo", {type: "WORD", value: "foo"}],
    ["football", {type: "WORD", value: "football"}],
  ];
  
  it("Lexer", () => {
    let lexer = new Lexer(tokens);
    lexer.reset("foofoo foo.");
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token( "WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("WORD", "foo"));
    assertThat(lexer.next()).equalsTo(token("PERIOD", "."));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("longest string: direct next isnt a substring", () => {
    let lexer = new Lexer([
      ["foo", {type: "a", value: "foo"}],
      ["the", {type: "a", value: "the"}],
      ["them", {type: "a", value: "them"}],
      ["then", {type: "a", value: "then"}],
    ]);
    lexer.reset("then");
    assertThat(lexer.next()).equalsTo(token("a", "then"));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it("if Mary is happy then Jones is happy.", () => {
    let lexer = new Lexer([
      [" ", {type: "word", value: "WS"}],
      [".", {type: "word", value: "."}],
      ["the", {type: "word", value: "the"}],
      ["them", {type: "word", value: "them"}],
      ["if", {type: "word", value: "if"}],
      ["Mary", {type: "word", value: "Mary"}],
      ["is", {type: "word", value: "is"}],
      ["happy", {type: "word", value: "happy"}],
      ["then", {type: "word", value: "happy"}],
      ["Jones", {type: "word", value: "happy"}],
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
    let lexer = new Lexer(tokens);
    lexer.reset("foo");
    assertThat(lexer.match("foo")).equalsTo(0);
    assertThat(lexer.match("bar")).equalsTo(-1);
    assertThat(lexer.match("football")).equalsTo(1);
  });

  it("longest string: needs more to be seen", () => {
   let lexer = new Lexer([
     ["bar", {"type": "bar", value: "bar"}],
     ["foo", {"type": "foo", value: "foo"}],
     ["football", {"type": "football", value: "football"}],
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
      ["a", {type: "a", value: "a"}],
      ["he", {type: "he", value: "he"}],
      ["her", {type: "her", value: "her"}],
      ["herself", {type: "herself", value: "herself"}],
    ]);
    
    lexer.reset("herself");
    assertThat(lexer.next()).equalsTo(token("herself", "herself"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("next", () => {
    let lexer = new Lexer([
      [" ", {type: "WS", value: " "}],
      [".", {value: "."}],
      ["bar", {type: "bar", value: "bar"}],
      ["man", {type: "WORD", value: "man"}],
      ["foo", {type: "WORD", value: "foo"}],
      ["football", {type: "WORD", value: "football"}],
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
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
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
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
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
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("f")).equalsTo([]);
    assertThat(parser.feed("o")).equalsTo([]);
    assertThat(parser.feed("o")).equalsTo([]);
    assertThat(parser.feed("b")).equalsTo([[{
      "@type": "%WORD",
      type: "WORD",
      value: "foo",
      "types": {}
    }]]);
  });

  it("football", () => {
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("football"))
      .equalsTo([[{
        "@type": "%WORD",
        "type": "WORD",
        "value": "football",
        "types": {},
      }]]);
  });

  it("foot, ball", () => {
    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
      main -> %WORD
    `);
    assertThat(parser.feed("foot"))
     .equalsTo([]);
    assertThat(parser.feed("ball"))
      .equalsTo([[{
        "@type": "%WORD",
        "type": "WORD",
        "value": "football",
        "types": {},
      }]]);
  });

  it("Jones loves Mary.", () => {
    const tokens = [
      [" ", {type: "WS"}],
      [".", {type: "PERIOD"}],
      ["Jones", {type: "PN"}],
      ["loves", {type: "V"}],
      ["Mary", {type: "PN"}],
    ];

    let parser = Nearley.from(`
      @{%
        ${Lexer.toString()}
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
        {"@type": "%PN", type: "PN", value: "Jones", types: {}},
        [{"@type": "%V", type: "V", value: "loves", types: {}},
         {"@type": "%PN", type: "PN", value: "Mary", types: {}},]
      ]]);
  });

  function clear(root) {
    delete root.types;
    delete root.loc;
    // console.log(root);
    for (let i = 0; i < (root.children || []).length; i++) {
      let child = root.children[i];
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

  const header = `
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(dict)});
        // NOTE(goto): this only gets called once per test
        // so gets reused. We need to figure out why and fix it.
        // console.log("new lexer");
        // throw new Error("foobar");
      %}
      @lexer lexer
      _ -> %WS:* {% function(d) {return null;} %}
      __ -> %WS:+ {% function(d) {return null;} %}
    `;

  const footer = `
      PN[num=sing, gen=male] -> %PN.
      ADJ -> %ADJ.
      ADJ -> "bar".
      N[num=sing, gen=male] -> %N.
      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> %V.
    `;
  
  it.skip("foo", () => {
    const header = `
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify([
           ["foo", {value: "foo"}],
         ])});
      %}
      @lexer lexer
    `;
    assertThat(parse("foo", "MAIN", header, ``, `MAIN -> "foo".`))
      .equalsTo({"@type": "MAIN", children: ["foo"]});
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
    assertThat(parse("Jones loves a dog.", "Statement", header, footer))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"), NP(DET("a"), N("dog"))))));
  });

  let token = (type, value) => {
    return {
      "@type": "%" + type,
      "type": type,
      "value": value,
      "types": {},
    };
  };
    
  it("Jones loves a dog.", () => {
    const lexer = new Lexer([
      [" ", {type: "WS"}],
      [".", {type: "PERIOD"}],
      ["a", {type: "DET"}],
      ["Jones", {type: "PN"}],
      ["loves", {type: "V"}],
      ["happy", {type: "ADJ"}],
      ["bar", {type: "ADJ"}],
      ["Mary", {type: "PN"}],
      ["dog", {type: "N"}],
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
