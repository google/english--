const Assert = require("assert");
const moo = require("moo");
const {Parser, Grammar} = require("nearley");
const grammar = require("./attempto.js");
const {Nearley} = require("../../src/drt/parser.js");
const utf8 = require("utf8");
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
    }
    
    next() {
      // console.log(this.tokens);
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
          value["value"] = word;
          // console.log(value);
          return value;
        }
      }
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
      return {};
    }
    reset(chunk, info) {
      // console.log("reset: " + chunk);
      this.buffer += chunk;
    }
    formatError(token) {
      // throw new Error("Unexpected method call: " + token);
      return token;
    }
    has(name) {
      return true;
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
      main -> __ S __ {% ([ws1, s, ws2]) => s %}
      S -> NP _ VP _ "." {% ([np, ws, vp]) => [np, vp]%}
      NP -> %PN {% id %}
      VP -> %V _ NP {% ([v, ws, np]) => [v, np] %}
      _ -> %WS:+ {% id %}
      __ -> %WS:* {% id %}
    `);

    assertThat(parser.feed("Jones  loves  Mary ."))
      .equalsTo([[
        {type: "PN", value: "Jones"},
        [{type: "V", value: "loves"}, {type: "PN", value: "Mary"},]
      ]]);
  });


  function clear(root) {
    delete root.types;
    delete root.loc;
    for (let child of root.children || []) {
      clear(child);
    }
    return root;
  }
  
  function parse(s, start = "S", header) {
    const {Parser} = DRT;
    let parser = new Parser(start, header);
    let results = parser.feed(s);
    console.log(results);
    return clear(results[0]);
  }

  it.skip("Jones loves Mary", function() {
    const tokens = [
      [" ", {type: "WS"}],
      [".", {}],
      ["Jones", {type: "PN"}],
      ["loves", {type: "V"}],
      ["Mary", {type: "PN"}],
    ];
    let header = `
      @{%
        ${Lexer.toString()}
        const lexer = new Lexer(${JSON.stringify(tokens)});
      %}
      @lexer lexer
    `;
    assertThat(parse("Jones loves Mary", "S", header))
      .equalsTo(NP(PN("Jones")));
  });

  it("Jones likes Mary", function() {
    assertThat(parse("Jones likes Mary"))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(VERB("like"), "s"),
                         NP(PN("Mary"))))));
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

    console.log(Object.keys(parts));
    parts["WS"] = /[ \t]+/;
    for (let adv of parts["adv"]) {
      console.log(adv);
    }
    let lexer = moo.compile(parts);
    console.log("done compiling");
    lexer.reset("clip-on cast-off awkwardly ");
    console.log("done reseting");
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