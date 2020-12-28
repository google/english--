const Assert = require("assert");
const {
  match,
  autocomplete, ancestors, valid, continuous,
  Nearley,
  FeaturedNearley,
  Parser} = require("../../src/drt/parser.js");

describe("Autocomplete", () => {

  it("Report", function() {
    let parser = Nearley.from(`
      main -> "foo"
    `);
    try {
      parser.feed("fbar");
      throw new Error("Expected parse error");
    } catch ({token, tracks}) {
      assertThat(token).equalsTo({value: "b"});
      assertThat(tracks.length).equalsTo(1);
      assertThat(tracks[0].symbol).equalsTo('"o"');
      assertThat(tracks[0].stack.length).equalsTo(3);
      const first = tracks[0].stack[0];
      assertThat(first.rule.toString(first.dot))
        .equalsTo('main$string$1 → "f" ● "o" "o"');
      assertThat(first.dot).equalsTo(1);
      assertThat(first.isComplete).equalsTo(false);
      assertThat(first.rule.symbols).equalsTo([
        {"literal": "f"},
        {"literal": "o"},
        {"literal": "o"},
      ]);
      const second = tracks[0].stack[1];
      assertThat(second.rule.toString(second.dot))
        .equalsTo('main$string$1 →  ● "f" "o" "o"');
      const third = tracks[0].stack[2];
      assertThat(third.rule.toString(third.dot))
        .equalsTo('main →  ● main$string$1');
    }
  });

  it("Invalid Token", function() {
    let parser = Nearley.from(`
      @{%
      const lexer = {
        has(token) {
          return true;
        },
        save() {
        },
        reset(buffer) {
          this.buffer = buffer;
        },
        formatError(token) {
          return "format error: " + token;
        },
        save() {
        },
        next() {
          return {
            type: "@unknown",
            value: this.buffer
          };
        },
      }
      %}
      @lexer lexer
      main -> %foo
    `);

    let error;
    try {
      parser.feed("fbar");
    } catch (e) {
      error = e;
    }

    const {token, loc, start, tracks} = error;
    assertThat(start).equalsTo("f");
    assertThat(token).equalsTo({
      "type": "@unknown",
      "value": "fbar",
    });
    assertThat(tracks.length).equalsTo(1);
    assertThat(tracks[0].symbol).equalsTo('foo');
    assertThat(tracks[0].stack.length).equalsTo(1);
    const first = tracks[0].stack[0];
    assertThat(first.rule.name).equalsTo("main");
    assertThat(first.dot).equalsTo(0);
    assertThat(first.rule.symbols).equalsTo([
      {type: "foo"}
    ]);
    assertThat(first.rule.toString(first.dot))
      .equalsTo('main →  ● %foo');
    assertThat(error.print().trim()).equalsTo(`
Unexpected @unknown token: fbar.
Instead, I was expecting to see one of the following:

A foo token based on:
    main → ● %foo`.trim());
  });

  it("Bigger grammar and rule metadata", function() {
    let parser = Nearley.from(`
      @{%
      const lexer = {
        has(token) {
          return true;
        },
        save() {
        },
        reset(buffer) {
          this.buffer = buffer;
        },
        formatError(token) {
          return "format error: " + token;
        },
        save() {
        },
        next() {
          return {
            type: "@unknown",
            value: this.buffer
          };
        },
      }
      %}
      @lexer lexer
      main -> FOO {% function() { 
          const f = () => {};
          f.meta = {types: {a: 1}, conditions: [{types: {}}]};
          return f; 
        }() 
      %}
      FOO -> %foo
    `);

    try {
      parser.feed("fbar");
      throw new Error("Expected parse error");
    } catch (e) {
      assertThat(e.print().trim()).equalsTo(`
Unexpected @unknown token: fbar.
Instead, I was expecting to see one of the following:

A foo token based on:
    FOO → ● %foo
    main[a=1] → ● FOO[]
`.trim());
    }
  });

  it("Messages for literals", function() {
    let parser = Nearley.from(`
      main -> "foo"
    `);

    try {
      parser.feed("fbar");
      throw new Error("Expected parse error");
    } catch (e) {
      assertThat(e.print().trim()).equalsTo(`
Unexpected "b".
Instead, I was expecting to see one of the following:

A "o" token based on:
    main$string$1 → f ● o o
    main$string$1 → ● f o o
    main → ● main$string$1
`.trim());
    }
  });
  
  it("Autocomplete from null", function() {
    let parser = Nearley.from(`
      main -> FOO
      FOO -> "foo"
    `);

    assertThat(parser.print().trim())
      .equalsTo(`
A "f" token based on:
    FOO$string$1 → ● f o o
    FOO → ● FOO$string$1
    main → ● FOO\
      `.trim());
  });

  it("Autocomplete from feed", function() {
    let parser = Nearley.from(`
      main -> FOO
      FOO -> "foo"
    `);

    parser.feed("f");
    assertThat(parser.print().trim())
      .equalsTo(`
A "o" token based on:
    FOO$string$1 → f ● o o
    FOO$string$1 → ● f o o
    FOO → ● FOO$string$1
    main → ● FOO\
      `.trim());
  });

  it("Autocomplete from null with mutiple", function() {
    let parser = Nearley.from(`
      main -> FOO
      FOO -> "foo"
      FOO -> "bar"
    `);

    assertThat(parser.print().trim())
      .equalsTo(`
A "f" token based on:
    FOO$string$1 → ● f o o
    FOO → ● FOO$string$1
    main → ● FOO
A "b" token based on:
    FOO$string$2 → ● b a r
    FOO → ● FOO$string$2
    main → ● FOO
    `.trim());
  });
  
  it("Autocomplete null with %tokens", function() {
    let parser = Nearley.from(`
      @{%
      const lexer = {
        has(token) {
          return true;
        },
        save() {
        },
        reset(buffer) {
          this.buffer = buffer;
        },
        formatError(token) {
          return "format error: " + token;
        },
        save() {
        },
        next() {
        },
      }
      %}
      @lexer lexer
      main -> FOO
      FOO -> %foo
      FOO -> %bar
    `);

    assertThat(parser.print().trim())
      .equalsTo(`
A foo token based on:
    FOO → ● %foo
    main → ● FOO
A bar token based on:
    FOO → ● %bar
    main → ● FOO
    `.trim());
  });
  
  it("Autocomplete feed with %tokens", function() {
    let parser = Nearley.from(`
      @{%
      const lexer = {
        has(token) {
          return true;
        },
        save() {
        },
        reset(buffer) {
          this.buffer = buffer;
        },
        formatError(token) {
          return "format error: " + token;
        },
        save() {
        },
        next() {
        },
      }
      %}
      @lexer lexer
      main -> FOO
      FOO -> %foo
      FOO -> %bar
    `);

    parser.feed("f");
    assertThat(parser.parser.lexer.buffer).equalsTo("f");
    assertThat(parser.print().trim())
      .equalsTo(`
A foo token based on:
    FOO → ● %foo
    main → ● FOO
A bar token based on:
    FOO → ● %bar
    main → ● FOO
    `.trim());
  });

  it("Features", () => {
    const header = `
       @{%
         const lexer = {
           has(name) {
             return true;
           },
           reset(chunk, state) {
           },
           save() {
           },
           formatError(e) {
           },
           next() {
           },
         };
       %}

       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `;
    let grammar = FeaturedNearley.compile(`
       main -> FOO[a=1].
       FOO[a=1] -> %word.
    `, header);

    let parser = new Nearley(grammar, "main");

    assertThat(parser.print().trim())
      .equalsTo(`
A word token based on:
    FOO[a=1] → ● %word
    main[] → ● FOO[a=1]
`.trim());
    
  });
  
  it("Features with feed", () => {
    const header = `
       @{%
         const lexer = {
           has(name) {
             return true;
           },
           reset(chunk, state) {
             this.buffer = chunk;
           },
           save() {
           },
           formatError(e) {
           },
           next() {
             if (this.done) {
               return undefined;
             }
             this.done = true;
             return {
               type: "word", 
               value: "foo", 
               tokens: [{"@type": "FOO", "types": {"a": 1}}]
             };
           },
         };
       %}

       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `;
    let grammar = FeaturedNearley.compile(`
       main -> FOO[a=1] BAR[b=2].
       FOO[a=1] -> %word.
       BAR[b=2] -> %word.
    `, header);

    let parser = new Nearley(grammar, "main");

    parser.feed("foo");
    
    assertThat(parser.print().trim())
      .equalsTo(`
A word token based on:
    BAR[b=2] → ● %word
    main[] → FOO[a=1] ● BAR[b=2]
    main[] → ● FOO[a=1] BAR[b=2]
`.trim());
    
  });
  
  it("Features", () => {
    const header = `
       @{%
         const lexer = {
           has(name) {
             return true;
           },
         };
       %}

       @lexer lexer
    `;
    let grammar = FeaturedNearley.compile(`
       main -> FOO[a=1] BAR[b=2].
       FOO[a=1] -> %word.
       BAR[b=2] -> %word.
    `, header);

    let parser = new Nearley(grammar, "main");

    assertThat(parser.print().trim())
      .equalsTo(`
A word token based on:
    FOO[a=1] → ● %word
    main[] → ● FOO[a=1] BAR[b=2]
`.trim());
    
  });

  it("Parser", () => {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
    assertThat(parser.parser.track(tracks[0]).trim()).equalsTo(`
A __if__ token based on:
    S[num=1, gap=-, tp=2, tense=3] → ● %__if__ __ S[num=1, gap=-, tp=2, tense=3] __ %then __ S[num=1, gap=-, tp=2, tense=3]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());
  });
  
  it("Types Match", () => {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
    assertThat(tracks.length).equalsTo(53);
    // This is an invalid track, because the features don't match up.
    assertThat(parser.parser.track(tracks[30]).trim()).equalsTo(`
A himself token based on:
    PRO[num=sing, gen=male, case=-nom, refl=+] → ● %himself
    NP[num=1, gen=2, case=3, gap=-] → ● PRO[num=1, gen=2, case=3]
    S[num=1, gap=np, tp=3, tense=4] → ● NP[num=1, gen=2, case=+nom, gap=-] __ VP_[num=1, fin=+, gap=np, tp=3, tense=4]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %or __ S[num=5, gap=-, tp=2, tense=3]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %and __ S[num=5, gap=-, tp=2, tense=3]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());

    const track = tracks[30];
    assertThat(track.stack.length).equalsTo(7);
    const top = 0;
    const pro = track.stack[top];
    assertThat(pro.rule.name).equalsTo("PRO");
    assertThat(pro.rule.postprocess.meta.types)
      .equalsTo({"case": "-nom", "gen": "male", "num": "sing", "refl": "+"});
    let next = 1;
    const np = track.stack[next];
    assertThat(np.rule.name).equalsTo("NP");
    assertThat(np.rule.postprocess.meta.conditions[np.dot].types)
      .equalsTo({"case": "3", "gen": "2", "num": 1});

    const tail1 = track.stack[top].rule.postprocess.meta; 
    const head1 = track.stack[next].rule.postprocess.meta; 
    
    let result1 = match(head1.type, head1.types, head1.conditions, [{
      "@type": tail1.type,
      "types": tail1.types,
    }], undefined, "reject!", true);
    
    assertThat(result1.types["case"]).equalsTo("-nom");

    const third = track.stack[2].rule.postprocess.meta; 
    
    let result2 = match(third.type, third.types, third.conditions,
                        [result1], undefined, "reject!", true);

    // rejected based on the nominative case.
    assertThat(result2).equalsTo("reject!");

    function conflicts(stack) {
      let top = 0;
      while (!stack[top].rule.postprocess ||
             !stack[top].rule.postprocess.meta) {
        top++;
      }

      let right = [];
      if (stack[top].right) {
        right = [stack[top].right.data];
      };
      
      const meta = stack[top].rule.postprocess.meta; 
      let tail = {
        "@type": meta.type,
        "types": meta.types,
        "conditions": meta.conditions,
      };

      let result = match(tail.type, tail.types, tail.conditions,
                         right, undefined, false, true);
      if (!result) {
        // console.log("top conflicts");
        return true;
      }
      // console.log();
      //console.log(tail);
      for (let i = (top + 1); i < stack.length; i++) {
        let head = stack[i].rule.postprocess.meta;
        //console.log(`Going up: ${i}!`);
        //console.log(head);
        //console.log(tail);
        //let left = [];
        //if (stack[i - 1].right) {
        //  left = stack[i - 1].right.data;
        //};
        //console.log(left);
        let result = match(head.type, head.types, head.conditions,
                           [tail], undefined, false, true);
        if (!result) {
          //console.log("rejected!");
          //console.log(i);
          return true;
        }
        tail = result;
      }
      return false;
    }

    assertThat(conflicts(tracks[30].stack)).equalsTo(true);

    assertThat(parser.parser.track(tracks[0]).trim()).equalsTo(`
A __if__ token based on:
    S[num=1, gap=-, tp=2, tense=3] → ● %__if__ __ S[num=1, gap=-, tp=2, tense=3] __ %then __ S[num=1, gap=-, tp=2, tense=3]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());

    assertThat(conflicts(tracks[0].stack)).equalsTo(false);

    assertThat(parser.parser.track(tracks[21]).trim()).equalsTo(`
A word token based on:
    PN[gen=2] → ● %word
    PN[gen=2] → ● PN[] __ PN[]
    NP[num=sing, gen=2, case=3, gap=-] → ● PN[gen=2]
    S[num=1, gap=np, tp=3, tense=4] → ● NP[num=1, gen=2, case=+nom, gap=-] __ VP_[num=1, fin=+, gap=np, tp=3, tense=4]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %or __ S[num=5, gap=-, tp=2, tense=3]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %and __ S[num=5, gap=-, tp=2, tense=3]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());

    assertThat(conflicts(tracks[21].stack)).equalsTo(true);

    assertThat(parser.parser.track(tracks[33]).trim()).equalsTo(`
A WS token based on:
    __$ebnf$1 → ● %WS
    __ → ● __$ebnf$1
    S[num=1, gap=-, tp=3, tense=4] → NP[num=1, gen=2, case=+nom, gap=-] ● __ VP_[num=1, fin=+, gap=-, tp=3, tense=4]
    S[num=1, gap=-, tp=3, tense=4] → ● NP[num=1, gen=2, case=+nom, gap=-] __ VP_[num=1, fin=+, gap=-, tp=3, tense=4]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %or __ S[num=5, gap=-, tp=2, tense=3]
    S[num=1, gap=-, tp=2, tense=3] → ● S[num=4, gap=-, tp=2, tense=3] __ %and __ S[num=5, gap=-, tp=2, tense=3]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());

    assertThat(conflicts(tracks[33].stack)).equalsTo(true);

    // let completions = tracks.filter(([stack]) => conflicts(stack));

    // console.log(completions);
    
    for (let i = 0; i < tracks.length; i++) {
      if (!conflicts(tracks[i].stack)) {
        // console.log(i);
        //console.log(track.stack);
      }
      // break;
    }
    
  });

  it("Tables", function() {
    let parser = Nearley.from(`
      main -> bar "foobar"
      bar -> "hello"
      bar -> "world"
      bar -> null
    `);
    assertThat(parser.print().trim())
      .equalsTo(`
A "h" token based on:
    bar$string$1 → ● h e l l o
    bar → ● bar$string$1
    main → ● bar main$string$1
A "w" token based on:
    bar$string$2 → ● w o r l d
    bar → ● bar$string$2
    main → ● bar main$string$1
A "f" token based on:
    main$string$1 → ● f o o b a r
    main → bar ● main$string$1
    main → ● bar main$string$1
`.trim());
  });

  
  it("Typed Tables", function() {
    let grammar = FeaturedNearley.compile(`
       S_ -> S[gap=-].
       S[gap=1] -> NP[gap=1] VP[].
       S[gap=np] -> NP[gap=np] VP[].
       NP[gap=-] -> DET[] N[].
       NP[gap=np] -> GAP.
       GAP -> null.
       DET[] -> NP[gap=-] %POSS.
       DET[] -> %a.
       DET[] -> %every.
     `, `
      @{% const lexer = { has(name) { return true; }, }; %}
      @lexer lexer
    `);

    let parser = new Nearley(grammar, "S_");    
    let result = [];

    let tracks = parser.tracks();
    //assertThat(tracks.length).equalsTo(4);
    //console.log(print(tracks[0].stack[0]));
    //console.log(ancestors(tracks[0].stack[0])[0]);
    let path = ancestors(tracks[0].stack[0])[0];
    // console.log(valid(path));
    
    //for (let line of ancestors(tracks[0].stack[0])[0]) {
    //  console.log(print(line));
    //}
    
    //return;
    
    //let paths2 = ancestors(parser.tracks()[2].stack[0]);
    //assertThat(valid(paths2[0])).equalsTo(false);

    //let paths0 = ancestors(parser.tracks()[0].stack[0]);
    //assertThat(valid(paths0[0])).equalsTo(true);
    // return;

    // console.log(path);
    //let track = parser.tracks()[1];
    //console.log(`A ${track.symbol} token based on:`);
    //let p = ancestors(track.stack[0])[0];
    //console.log(continuous(p));
    //for (let line of p) {
    //  console.log(`    ${print(line)}`);
    //}
    //return;
    for (let track of parser.tracks()) {
      //console.log("hi");
      for (let path of ancestors(track.stack[0])) {
        if (!valid(path)) {
          continue;
        }
        if (!continuous(path)) {
          // console.log(print(path));
          continue;
        }
        // console.log(path);
        //console.log(`A ${track.symbol} token based on:`);
        for (let line of path) {
          //console.log(`    ${print(line)}`);
        }
      }
    }
    
    // console.log();
    
  });
  
  it("Autocomplete from null", function() {
    let parser = new Parser("Statement");
    
    let result = [];
    
    let tokens = autocomplete(parser);

    // There are 24 ways to start a sentence.
    assertThat(Object.keys(tokens)).equalsTo([
      // conditionals
      "__if__",
      // quantifiers
      "a",
      "an",
      "the",
      "every",
      "some",
      "no",
      "all",
      "most",
      "many",
      "only",
      "not",
      "at",
      "more",
      "fewer",
      "exactly",
      "unsigned_int",
      // TODO(goto): proper names can be words.
      // we should probably change that.
      "word",
      "name",
      // pronouns.
      "he",
      "she",
      "it",
      "they",
      "WS",
    ]);;
    
  });
  
  function feed(parser, str) {
    parser.feed(str);
    return Object.keys(autocomplete(parser));
  };
  
  it("Autocomplete from one token", function() {
    let parser = new Parser("Statement");
    // There is just a single way to follow an "at": a space.
    assertThat(feed(parser, "at")).equalsTo([
      // at has to be followed by a space!
      "WS",
    ]);
  });
  
  it("Autocomplete with two tokens", function() {
    let parser = new Parser("Statement");
    
    assertThat(feed(parser, "at ")).equalsTo([
      "WS",
      "least",
      "most",
    ]);
  });
  
  it("Autocomplete with 6 tokens", function() {
    let parser = new Parser("Statement");
    assertThat(feed(parser, "at least 3 ")).equalsTo([
      "WS", "word",
    ]);
  });

  it("Autocomplete streaming", function() {
    let parser = new Parser("Statement");
    assertThat(feed(parser, "at")).equalsTo(["WS"]);
    assertThat(feed(parser, " ")).equalsTo(["WS", "least", "most"]);
    assertThat(feed(parser, "least")).equalsTo(["WS"]);
    assertThat(feed(parser, " ")).equalsTo(["WS", "unsigned_int"]);
    assertThat(feed(parser, "3")).equalsTo(["WS"]);
    assertThat(feed(parser, " ")).equalsTo(["WS", "word"]);
  });

  it("Ancestors", function() {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
    let all = ancestors(tracks[1].stack[0]);
    assertThat(all.length).equalsTo(5);
  });

  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
