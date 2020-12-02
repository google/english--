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
  class Lexer {
    constructor(tokens) {
      this.buffer = "";
      this.tokens = tokens;

      this.tokens.sort(([a], [b]) => {
        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        }
        return 0;
      });

      this.tokens.map(([key, value]) => {
        value["value"] = key;
      });
    }
    
    next() {
      // console.log(this.tokens);
      //console.log("next");
      //console.log(this.buffer);
      let p = 0;
      let q = this.tokens.length - 1;
      while (p <= q) {
        let m = p + Math.floor((q - p) / 2);
        let [word, value] = this.tokens[m];
        let result = this.match(word);
        // console.log(`p=${p} q=${q} m=${m} ${this.buffer} and ${word}? ${result}`);
        if (result == -1) {
          p = m + 1;
        } else if (result == 1) {
          q = m - 1;
        } else {
          // console.log("found a match!");
          let n = m + 1;
          // console.log(n);
          while (n < this.tokens.length) {
            let [next] = this.tokens[n];
            let buffer = this.buffer;
            if (this.match(next) == 0) {
              word = this.tokens[n][0];
              value = this.tokens[n][1];
              n++;
              continue;
            } else if (next.substring(0, buffer.length) == buffer) {
              return undefined;
            } else {
              break;
            }
          }
          this.eat(word);
          //console.log("eat: ");
          ///console.log(value);
          return value;
        }
      }
      // console.log("eat: oops, need more food!");
      return undefined;
    }
    match(word) {
      let head = this.buffer.substring(0, word.length);
      if (word < head) {
        return -1;
      } else if (word > head) {
        return 1;
      }
      return 0;
    }
    eat(word) {
      if (!this.buffer.startsWith(word)) {
        throw new Error("can't eat " + word);
      }
      this.buffer = this.buffer.substring(word.length);
      return true;
    }
    save() {
      // console.log("saving");
      return {};
    }
    reset(chunk, info) {
      // console.log("reset: " + chunk);
      this.buffer += chunk;
    }
    formatError(token) {
      // console.log("formatError");
      // throw new Error("Unexpected method call: " + token);
      return token;
    }
    has(name) {
      for (let [key, {type}] of this.tokens) {
        if (name == type) {
          return true;
        }
      }
      return false;
    }
  }

  const tokens = [
        [" ", {type: "WS", value: " "}],
        [".", {value: "."}],
        ["bar", {value: "bar"}],
        ["man", {type: "WORD", value: "man"}],
        ["foo", {type: "WORD", value: "foo"}],
        ["football", {type: "WORD", value: "football"}],
  ];
  
  it("Lexer", () => {
    let lexer = new Lexer(tokens);
    lexer.reset("foofoo foo.");
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "foo"});
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "foo"});
    assertThat(lexer.next()).equalsTo({type: "WS", value: " "});
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "foo"});
    assertThat(lexer.next()).equalsTo({value: "."});
    assertThat(lexer.next()).equalsTo(undefined);
  });

  it("match", () => {
    let lexer = new Lexer(tokens);
    lexer.reset("foo");
    assertThat(lexer.match("foo")).equalsTo(0);
    assertThat(lexer.match("bar")).equalsTo(-1);
    assertThat(lexer.match("football")).equalsTo(1);
  });

  it("next", () => {
    let lexer = new Lexer(tokens);
    lexer.reset("man");
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "man"});
    assertThat(lexer.next()).equalsTo(undefined);

    lexer.reset("bar man");
    assertThat(lexer.next()).equalsTo({value: "bar"});
    assertThat(lexer.next()).equalsTo({type: "WS", value: " "});
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "man"});
    assertThat(lexer.next()).equalsTo(undefined);

    lexer.reset("foo");
    assertThat(lexer.next()).equalsTo(undefined);
    lexer.reset("bar");
    assertThat(lexer.next()).equalsTo({type: "WORD", value: "foo"});
    assertThat(lexer.next()).equalsTo({value: "bar"});
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
      {type: "WORD", value: "man"}
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
      {value: "bar"}
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
      [{type: "WORD", value: "foo"}],
      [{value: "bar"}],
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
    assertThat(parser.feed("b")).equalsTo([[{type: "WORD", value: "foo"}]]);
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
     .equalsTo([[{type: "WORD", value: "football"}]]);
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
     .equalsTo([[{type: "WORD", value: "football"}]]);
  });

  it("Jones loves Mary.", () => {
    const tokens = [
      [" ", {type: "WS"}],
      [".", {}],
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
        {type: "PN", value: "Jones"},
        [{type: "V", value: "loves"}, {type: "PN", value: "Mary"},]
      ]]);
  });

  function clear(root) {
    delete root.types;
    delete root.loc;
    // console.log(root);
    for (let i = 0; i < (root.children || []).length; i++) {
      let child = root.children[i];
      if (child["value"]) {
        //  delete child.value.kind;
        // console.log(child.value);
        root.children[i] = child.value;
        continue;
      }
      clear(child);
    }
    return root;
  }

  function create(start = "Statement", header, footer, body) {
    const {Parser} = DRT;
    let parser = new Parser(start, header, footer, body);
    return (s) => {
      let results = parser.feed(s);
      return clear(results[0].children[0].children[0]);
    }
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
  
  it.skip("Peter", function() {
    assertThat(parse("Peter", "NP", header, footer))
      .equalsTo(NP(PN("Peter")));
  });

  it("a", function() {
    assertThat(parse("a", "DET", header, footer))
      .equalsTo(DET("a"));
  });

  it("Jones loves Mary", function() {
    assertThat(parse("Jones loves Mary.", "Statement", header, ""))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
  });

  it.only("Jones loves Mary", function() {
    const keywords = [
      "a","an", "the", "every", "some", "no", "all", "most", "many",
      "only", "not", "majority", "of", "minority", "at", "least",
      "more", "than", "fewer", "exactly",
      "then", "who", "and", "or", "he", "him", "she", "her",
      "they", "them", "himself", "herself", "itself", "does", "did",
      "will", "would", "which", "is", "are", "was", "were", "be", "been",
      "have", "has", "had", "s", "es", "ies", "ed", "d", "ied", "led", "red",
      "behind", "over", "under", "near", "during", "from", "to", "about",
      "by",
      "happy", "unhappy", "foolish", "fast", "beautiful", "mortal", "brazilian",
      "married",
      "Socrates", "Jones", "John", "Smith", "Mary", "Brazil", "Ulysses",
      "man", "men", "woman", "weman", "girl", "book", "telescope", "donkey",
      "horse", "cat", "porsche", "engineer", "dish", "witch", "judge",
      "brother", "father", "husband", "sister", "mother", "wife",
      "beat", "listen", "own", "walk", "sleep", "stink", "leave", "left",
      "come", "came", "give", "gave", "kiss", "box", "watch", "crash",
      "like", "seize", "tie", "free", "love", "surprise", "fascinate",
      "admire", "ski", "echo", "play", "decay", "enjoy", "cr", "appl",
      "cop", "repl", "tr", "compel", "defer", 
    ].map((keyword) => [keyword, {type: keyword}]);

    const dict = [
      [" ", {type: "WS"}],
      [".", {type: "PERIOD"}],
      ["?", {type: "QUESTION"}],
      ["'s", {type: "POSS"}],
      
      ["if", {type: "__if__"}],
      ["do", {type: "__do__"}],
      ["in", {type: "__in__"}],
      ["with", {type: "__with__"}],
      ["of", {type: "__of__"}],
      ["for", {type: "__for__"}],
      
      // ["s", {type: "s"}],
      ///["Jones", {type: "PN"}],
      //["love", {type: "V"}],
      // ["Mary", {type: "PN"}],
      ["Peter", {type: "PN"}],
      ["dog", {type: "N"}],
      // ["man", {type: "N"}],
    ];
    
    const header = `
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(dict.concat(keywords))});
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
    `;
        
    assertThat(parse("every man loves Mary.", "Statement", header, footer))
      .equalsTo(S(NP(DET("every"), N("man")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
    
    assertThat(parse("some man loves Mary.", "Statement", header, footer))
      .equalsTo(S(NP(DET("some"), N("man")),
                  VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));

    assertThat(parse("he loves her.", "Statement", header, footer))
      .equalsTo(S(NP(PRO("he")),
                  VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  
    assertThat(parse("she loves herself.", "Statement", header, footer))
      .equalsTo(S(NP(PRO("she")),
                  VP_(VP(V(VERB("love"), "s"), NP(PRO("herself"))))));

    assertThat(parse("she loves a man.", "Statement", header, footer))
      .equalsTo(S(NP(PRO("she")),
                  VP_(VP(V(VERB("love"), "s"),
                         NP(DET("a"), N("man"))))));

    // return;
    
  
    assertThat(parse("she loves a man who loves her.", "Statement", header, footer))
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

  it("Jones loves a dog.", () => {
    const lexer = new Lexer([
      [" ", {type: "WS"}],
      [".", {}],
      ["a", {}],
      ["Jones", {type: "PN"}],
      ["loves", {type: "V"}],
      ["happy", {type: "ADJ"}],
      ["bar", {type: "ADJ"}],
      ["Mary", {type: "PN"}],
      ["dog", {type: "N"}],
    ]);
    lexer.reset("Jones loves a dog.");
    assertThat(lexer.next()).equalsTo({"type": "PN", "value": "Jones"});
    assertThat(lexer.next()).equalsTo({"type": "WS", "value": " "});
    assertThat(lexer.next()).equalsTo({"type": "V", "value": "loves"});
    assertThat(lexer.next()).equalsTo({"type": "WS", "value": " "});
    assertThat(lexer.next()).equalsTo({"value": "a"});
    assertThat(lexer.next()).equalsTo({"type": "WS", "value": " "});
    assertThat(lexer.next()).equalsTo({"type": "N", "value": "dog"});
    assertThat(lexer.next()).equalsTo({"value": "."});
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
