const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley, FeaturedNearley} = require("../../src/drt/parser.js");
const {Tokenizer} = require("../../src/drt/lexer.js");
const DRT = require("../../src/drt/parser.js");
const lexicon = require("../../src/drt/lexicon.js");

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

  it("Tokenizer", () => {
    let lexer = new Tokenizer([
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
    let lexer = new Tokenizer([
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

  it.skip("match", () => {
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
   let lexer = new Tokenizer([
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
    let lexer = new Tokenizer([
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
    let lexer = new Tokenizer([
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
            ${Tokenizer.toString()}
            const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
            ${Tokenizer.toString()}
            const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
            ${Tokenizer.toString()}
            const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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
      return clear(results[0].children[0].children[0]);
    }
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
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
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

  it("brazilian brazilian", function() {
    const tokens = [
      ["brazilian", "word", [{
        "@type": "N",
        "types": {
          "num": "sing",
        }
      }, {
        "@type": "ADJ",
        "types": {}
      }]],
      ["bar", "word", []],  
    ];
    let grammar = FeaturedNearley.compile(`
       main -> N[num=1] ADJ. 

       ADJ[] -> %word.
       N[num=1] -> %word.
    `, `
      @{%
        ${Tokenizer.toString()}
        const lexer = new Tokenizer(${JSON.stringify(tokens)});
      %}
       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("brazilianbrazilian");
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": [{
        "@type": "N",
        "types": {"num": "sing"},
        "children": [{value: "brazilian"}]
      }, {
        "@type": "ADJ",
        "types": {},
        "children": [{value: "brazilian"}]
      }],
      "loc": 0,
      "types": {}
    }]);
  });

  it("Same token type, multiple node types", () => {
    let lexer = new Tokenizer([
      ["brazilian", "word", [{"@type": "ADJ"}]],
      ["brazilian", "word", [{"@type": "N"}]],
    ]);
    lexer.reset("brazilian.");
    assertThat(lexer.next()).equalsTo(token("word", "brazilian", [
      {"@type": "ADJ"},
      {"@type": "N"},
    ]));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("Type conflicts with reserved keyword", () => {
    let lexer = new Tokenizer([
      ["only", "only"],
      ["only", "word", [{"@type": "ADJ"}]],
    ]);
    lexer.reset("only");
    assertThat(lexer.next()).equalsTo(token("only", "only"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it.skip("age-old", function() {
    const tokens = adj.map((word) => {
      return [word, "word", [{
        "@type": "ADJ"
      }]];
    });
    let grammar = FeaturedNearley.compile(`
       main -> ADJ. 

       ADJ[] -> %word.
    `, `
      @{%
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("age-old");
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": [{
        "@type": "ADJ",
        "children": [{value: "age-old"}]
      }],
      "loc": 0,
      "types": {}
    }]);
  });

  it("Jones loves a foo woman.", function() {
    const {Parser} = DRT;
    let parser = new Parser("Statement");
    parser.add(["foo", "word", [{"@type": "ADJ"}]]);
    let results = parser.feed("Jones loves a foo woman.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("a"), N(ADJ("foo"), N("woman")))
                        ))
                 ));
  });
  
  it("longest string", () => {    
    let tokens = new Tokenizer();
    
    tokens.push(" ", "WS", []);
    tokens.push("foo", "word", [{a: 1}]);
    tokens.push("foot", "word", [{b: 2}]);

    assertThat(tokens.has("WS")).equalsTo(true);
    assertThat(tokens.has("word")).equalsTo(true);
    assertThat(tokens.has("every")).equalsTo(false);
    
    assertThat(tokens.longest("bar")).equalsTo(false);
    assertThat(tokens.longest("foo")).equalsTo(undefined);
    assertThat(tokens.longest("f")).equalsTo(undefined);
    assertThat(tokens.longest("foot")).equalsTo("foot");
    assertThat(tokens.longest("foo ")).equalsTo("foo");
    assertThat(tokens.longest("foo hello world")).equalsTo("foo");

    assertThat(tokens.get("foo")).equalsTo(token("word", "foo", [{a: 1}]));
    assertThat(tokens.get("foot")).equalsTo(token("word", "foot", [{b: 2}]));

    tokens.reset("foo foot");
    assertThat(tokens.eat("foo")).equalsTo(token("word", "foo", [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" foot");
    assertThat(tokens.eat(" ")).equalsTo(token("WS", " ", []));
    assertThat(tokens.buffer).equalsTo("foot");
    assertThat(tokens.eat("foot")).equalsTo(token("word", "foot", [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");

    tokens.reset("foo foot");
    assertThat(tokens.next()).equalsTo(token("word", "foo", [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" foot");
    assertThat(tokens.next()).equalsTo(token("WS", " ", []));
    assertThat(tokens.buffer).equalsTo("foot");
    assertThat(tokens.next()).equalsTo(token("word", "foot", [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");

    tokens.reset("foo");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("foo");
    tokens.reset("t");
    assertThat(tokens.next()).equalsTo(token("word", "foot", [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");
    
    tokens.reset("foo");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("foo");
    tokens.reset(" ");
    assertThat(tokens.next()).equalsTo(token("word", "foo", [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" ");
    assertThat(tokens.next()).equalsTo(token("WS", " ", []));
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");
  });

  it("love and lovesick", function() {
    let tokens = new Tokenizer();
    
    tokens.push(" ", "WS", []);
    tokens.push("love", "word", [{a: 1}]);
    tokens.push("lovesick", "word", [{b: 2}]);
    tokens.push("s", "s", []);

    assertThat(tokens.longest("loves ")).equalsTo("love");
  });
  
  it("Jones loves an awesome woman.", function() {
    const {adj_itr} = lexicon;
        
    const tokens = adj_itr.map((word) => [word, "word", [{"@type": "ADJ"}]]);
    const {Parser} = DRT;
    let parser = new Parser("Statement");
    for (let token of tokens) {
      parser.add(token);
    }
    let {lexer} = parser;
    lexer.reset("Jones loves an awesome woman.");
    assertThat(lexer.next()).equalsTo(token("word", "Jones", [{
      "@type": "PN",
      "types": {"gen": "male", "num": "sing"}
    }]));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("word", "love", [{
      "@type": "VERB",
      "types": {"past": "+d", "pres": "+s", "stat": "-", "trans": 1}
    }]));
    assertThat(lexer.next()).equalsTo(token("s", "s"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("an", "an"));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("word", "awesome", [{
      "@type": "ADJ"
    }]));
    assertThat(lexer.next()).equalsTo(token("WS", " "));
    assertThat(lexer.next()).equalsTo(token("word", "woman", [{
      "@type": "N",
      "types": {"gen": "fem", "num": "sing"}
    }]));
    assertThat(lexer.next()).equalsTo(token("PERIOD", "."));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it("Jones loves an awesome woman.", function() {
    const {adj_itr} = lexicon;
    const tokens = adj_itr.map((word) => [word, "word", [{"@type": "ADJ"}]]);
    const {Parser} = DRT;
    let parser = new Parser("Statement");
    
    for (let token of tokens) {
      parser.add(token);
    }
    let results = parser.feed("Jones loves an awesome woman.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("an"), N(ADJ("awesome"), N("woman")))
                        ))
                 ));
  });
  
  it("Jones loves an au-pair.", function() {
    const {noun_sg} = lexicon;

    const tokens = noun_sg.map((word) => [word, "word", [{
      "@type": "N",
      "types": {"num": "sing"}
    }]]);
    
    const {Parser} = DRT;
    let parser = new Parser("Statement");
    
    for (let token of tokens) {
      parser.add(token);
    }
    let results = parser.feed("Jones loves an au-pair.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("an"), N("au-pair"))
                        ))
                 ));
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
    const lexer = new Tokenizer([
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
  
  it("case insensitivity", () => {
    let lexer = new Tokenizer([
      ["foo", "WORD"],
      ["Bar", "WORD"],
      [" ", "WS"],
      [".", "PERIOD"],
    ]);
    lexer.reset("Foobar");
    assertThat(lexer.next()).equalsTo(token("WORD", "Foo"));
    assertThat(lexer.next()).equalsTo(token("WORD", "bar"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it.skip("Generate", async function() {
    this.timeout(500000);
    const fs = require("fs");
    const readline = require("readline");

    const stream = fs.createReadStream("./tests/drt/clex_lexicon.pl");

    const rl = readline.createInterface({
      input: stream,
    });

    let parts = {};
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
      if (name == "prep") {
        break;
      }
    }

    let file = `
module.exports = ${JSON.stringify(parts, undefined, 2)};
`;
    fs.writeFileSync("lexicon.js", file);
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
