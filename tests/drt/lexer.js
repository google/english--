const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley, FeaturedNearley} = require("../../src/drt/parser.js");
const {Tokenizer} = require("../../src/drt/lexer.js");
const DRT = require("../../src/drt/parser.js");
const lexicon = require("../../src/drt/lexicon.js");
const {dict} = require("./dict.js"); 

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
    assertThat(lexer.next()).equalsTo(token("WORD", "foo", 0));
    assertThat(lexer.next()).equalsTo(token("WORD", "foo", 3));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 6));
    assertThat(lexer.next()).equalsTo(token("WORD", "foo", 7));
    assertThat(lexer.next()).equalsTo(token("PERIOD", ".", 10));
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
    assertThat(lexer.next()).equalsTo(token("foo", "foo", 0));
    assertThat(lexer.next()).equalsTo(token("bar", "bar", 3));
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
    assertThat(lexer.next()).equalsTo(token("WORD", "foo", 0));
    assertThat(lexer.next()).equalsTo(token("bar", "bar", 3));
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

  // TODO(goto): set up adjective orders?
  // https://qz.com/773738/how-non-english-speakers-are-taught-this-crazy-english-grammar-rule-you-know-but-youve-never-heard-of/
  
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
      [token("WORD", "foo", 0)],
      [token("bar", "bar", 3)],
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
        token("PN", "Jones", 0), [token("V", "loves", 6), token("PN", "Mary", 12)]
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
      token("WORD", "brazilian", 0, [{
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

  function parse(s, start = "Statement") {
    const {Parser} = DRT;
    let parser = new Parser(start, dict);
    let results = parser.feed(s);
    if (start == "Statement") {
      return clear(results[0].children[0].children[0]);
    }
    if (results.length == 0) {
      return {};
    }
    return clear(results[0]);
  }

  const dict2 = [
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
      "types": {}
    }]);
  });

  it("Same token type, multiple node types", () => {
    let lexer = new Tokenizer([
      ["brazilian", "word", [{"@type": "ADJ"}]],
      ["brazilian", "word", [{"@type": "N"}]],
    ]);
    lexer.reset("brazilian.");
    assertThat(lexer.next()).equalsTo(token("word", "brazilian", 0, [
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
      "types": {}
    }]);
  });

  it("Jones loves a foo woman.", function() {
    const {Parser} = DRT;
    let parser = new Parser("Statement", dict);
    parser.add(["foo", "word", [{"@type": "ADJ"}]]);
    let results = parser.feed("Jones loves a foo woman.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("a"), N(ADJ("foo"), N("woman")))
                        ))
                 ));
  });

  it("girlfriend", function() {
    const {noun_sg} = lexicon;

    const tokens = noun_sg.map((word) => [word, "word", [{
      "@type": "N",
      "types": {"num": "sing"}
    }]]);
    
    let tokenizer = new Tokenizer();

    for (let [word, type, types] of tokens) {
      tokenizer.push(word, type, types);
    }

    tokenizer.reset("girlfriend");

    assertThat(tokenizer.next()).equalsTo({
      tokens: [{
        "@type": "N",
        types: {
          num: "sing"
        }
      }],
      "@type": "%word",
      "type": "word",
      "value": "girlfriend",
      "loc": 0,
    });
  });
  
  it("longest string", () => {    
    let tokens = new Tokenizer();
    
    tokens.push(" ", "WS", []);
    tokens.push("foo", "word", [{a: 1}]);
    tokens.push("foot", "word", [{b: 2}]);

    tokens.reset("foo foot");
    assertThat(tokens.eat("foo").get("foo"))
      .equalsTo(token("word", "foo", 0, [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" foot");
    assertThat(tokens.eat(" ").get(" "))
      .equalsTo(token("WS", " ", 3, []));
    assertThat(tokens.buffer).equalsTo("foot");
    assertThat(tokens.eat("foot").get("foot"))
      .equalsTo(token("word", "foot", 4, [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");
    
    assertThat(tokens.has("WS")).equalsTo(true);
    assertThat(tokens.has("word")).equalsTo(true);
    assertThat(tokens.has("every")).equalsTo(false);
    
    assertThat(tokens.longest("bar")).equalsTo(false);
    assertThat(tokens.longest("foo")).equalsTo(undefined);
    assertThat(tokens.longest("f")).equalsTo(undefined);
    assertThat(tokens.longest("foot")).equalsTo("foot");
    assertThat(tokens.longest("foo ")).equalsTo("foo");
    assertThat(tokens.longest("foo hello world")).equalsTo("foo");

    assertThat(tokens.get("foo")).equalsTo(token("word", "foo", 5, [{a: 1}]));
    assertThat(tokens.get("foot")).equalsTo(token("word", "foot", 4, [{b: 2}]));

    tokens.reset("foo foot");
    assertThat(tokens.next()).equalsTo(token("word", "foo", 8, [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" foot");
    assertThat(tokens.next()).equalsTo(token("WS", " ", 11, []));
    assertThat(tokens.buffer).equalsTo("foot");
    assertThat(tokens.next()).equalsTo(token("word", "foot", 12, [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");

    tokens.reset("foo");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("foo");
    tokens.reset("t");
    assertThat(tokens.next()).equalsTo(token("word", "foot", 16, [{b: 2}]));
    assertThat(tokens.buffer).equalsTo("");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("");
    
    tokens.reset("foo");
    assertThat(tokens.next()).equalsTo(undefined);
    assertThat(tokens.buffer).equalsTo("foo");
    tokens.reset(" ");
    assertThat(tokens.next()).equalsTo(token("word", "foo", 20, [{a: 1}]));
    assertThat(tokens.buffer).equalsTo(" ");
    assertThat(tokens.next()).equalsTo(token("WS", " ", 23, []));
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
    let parser = new Parser("Statement", dict);
    
    for (let token of tokens) {
      parser.add(token);
    }
    let {lexer} = parser;
    lexer.reset("Jones loves an awesome woman.");
    assertThat(lexer.next()).equalsTo(token("word", "Jones", 0, [{
      "@type": "PN",
      "loc": 0,
      "types": {"gen": "?", "num": "?"}
    }]));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 5));
    assertThat(lexer.next()).equalsTo(token("word", "love", 6, [{
      "@type": "VERB",
      "types": {"past": "+d", "pres": "+s", "stat": "-", "trans": 1}
    }]));
    assertThat(lexer.next()).equalsTo(token("s", "s", 10));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 11));
    assertThat(lexer.next()).equalsTo(token("an", "an", 12));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 14));
    assertThat(lexer.next()).equalsTo(token("word", "awesome", 15, [{
      "@type": "ADJ"
    }]));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 22));
    assertThat(lexer.next()).equalsTo(token("word", "woman", 23, [{
      "@type": "N",
      "types": {"gen": "fem", "num": "sing"}
    }]));
    assertThat(lexer.next()).equalsTo(token("PERIOD", ".", 28));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it("Jones loves an awesome woman.", function() {
    const {adj_itr} = lexicon;
    const tokens = adj_itr.map((word) => [word, "word", [{"@type": "ADJ"}]]);
    const {Parser} = DRT;
    let parser = new Parser("Statement", dict);
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
    let parser = new Parser("Statement", dict);
    
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
  
  it("Mel likes Yuji's girlfriend.", function() {
    const {noun_sg} = lexicon;

    const tokens = noun_sg.map((word) => [word, "word", [{
      "@type": "N",
      "types": {"num": "sing"}
    }]]);
    
    const {Parser} = DRT;
    let parser = new Parser("Statement", dict);
    
    for (let token of tokens) {
      parser.add(token);
    }
    let results = parser.feed("Mel likes Yuji's girlfriend.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Mel")),
                  VP_(VP(V(VERB("like"), "s"),
                         NP(DET(NP(PN("Yuji")), "'s"), N("girlfriend"))
                        ))
                 ));
  });

  it.skip("every porsche", function() {
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

  let token = (type, value, loc = 0, tokens = []) => {
    return {
      "@type": "%" + type,
      "type": type,
      "value": value,
      "loc": loc,
      "tokens": tokens,
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
    assertThat(lexer.next()).equalsTo(token("PN", "Jones", 0));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 5));
    assertThat(lexer.next()).equalsTo(token("V", "loves", 6));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 11));
    assertThat(lexer.next()).equalsTo(token("DET", "a", 12));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 13));
    assertThat(lexer.next()).equalsTo(token("N", "dog", 14));
    assertThat(lexer.next()).equalsTo(token("PERIOD", ".", 17));
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
    assertThat(lexer.next()).equalsTo(token("word", "Foobar", 0, [{
      "@type": "PN",
      "loc": 0,
      "types": {"gen": "?", "num": "?"}
    }]));
    assertThat(lexer.next()).equalsTo(undefined);
  });
  
  it("Proper names", () => {
    let lexer = new Tokenizer([
      ["foo", "WORD"],
      ["Bar", "WORD"],
      [" ", "WS"],
      [".", "PERIOD"],
    ]);
    lexer.reset("Sam Goto");
    assertThat(lexer.next()).equalsTo(token("word", "Sam", 0, [{
      "@type": "PN",
      "loc": 0,
      "types": {"gen": "?", "num": "?"}
    }]));
    assertThat(lexer.next()).equalsTo(token("WS", " ", 3));
    assertThat(lexer.next()).equalsTo(token("word", "Goto", 4, [{
      "@type": "PN",
      "loc": 4,
      "types": {"gen": "?", "num": "?"}
    }]));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("numbers", () => {
    let lexer = new Tokenizer([
      ["foo", "WORD"],
      ["Bar", "WORD"],
      [" ", "WS"],
      [".", "PERIOD"],
    ]);
    lexer.reset("3010");
    assertThat(lexer.next()).equalsTo(token("UNSIGNED_INT", "3010"));
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("Jones loves Sam.", function() {
    const {Parser} = DRT;
    let parser = new Parser("Statement", dict);
    let tokenizer = parser.parser.parser.lexer.tokenizer;

    tokenizer.reset("Hello");
    assertThat(tokenizer.next()).equalsTo(token("word", "Hello", 0, [{
      "@type": "PN",
      "loc": 0,
      "types": {"gen": "?", "num": "?"}
    }]));

    tokenizer.reset("He ");
    assertThat(tokenizer.next()).equalsTo(token("he", "He", 5));
    assertThat(tokenizer.next()).equalsTo(token("WS", " ", 7));

    tokenizer.reset("Sam");
    assertThat(tokenizer.next()).equalsTo(token("word", "Sam", 8, [{
      "@type": "PN",
      "loc": 8,
      "types": {"gen": "?", "num": "?"}
    }]));
    
    let results = parser.feed("Jones loves Sam.");
    assertThat(clear(results[0].children[0].children[0]))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(PN("Sam"))
                        ))
                 ));
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
