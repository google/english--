const Assert = require("assert");
const {Nearley, FeaturedNearley, Parser} = require("../../src/drt/parser.js");

describe.skip("Error handling", () => {

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
    assertThat(message(error).trim()).equalsTo(`
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
    assertThat(message(e).trim()).equalsTo(`
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
      assertThat(message(e).trim()).equalsTo(`
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

    let tracks = parser.tracks();
    assertThat(message({tracks: tracks}).trim())
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
    let tracks = parser.tracks();
    assertThat(message({tracks: tracks}).trim())
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

    let tracks = parser.tracks();
    assertThat(message({tracks: tracks}).trim())
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

    let tracks = parser.tracks();
    assertThat(message({tracks: tracks}).trim())
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
    let tracks = parser.tracks();
    assertThat(parser.parser.lexer.buffer).equalsTo("f");
    assertThat(message({tracks: tracks}).trim())
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

    assertThat(message({tracks: parser.tracks()}).trim())
      .equalsTo(`
A word token based on:
    FOO → ● %word
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
    
    assertThat(message({tracks: parser.tracks()}).trim())
      .equalsTo(`
A word token based on:
    BAR → ● %word
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

    assertThat(message({tracks: parser.tracks()}).trim())
      .equalsTo(`
A word token based on:
    FOO → ● %word
    main[] → ● FOO[a=1] BAR[b=2]
`.trim());
    
  });

  it("Parser", () => {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
    assertThat(parser.parser.track(tracks[0]).trim()).equalsTo(`
A __if__ token based on:
    S[num=1, gap=-, tp=2, tense=3] → ● %__if__ __ S[] __ %then __ S[]
    S_[num=1, gap=-, tp=2, tense=3] → ● S[num=1, gap=-, tp=2, tense=3]
    Statement[] → ● S_[] _ %PERIOD
`.trim());
  });
  
  it("Types Match", () => {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
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

    assertThat(tracks[30].stack.length).equalsTo(7);
    const pro = tracks[30].stack[0];
    assertThat(pro.rule.name).equalsTo("PRO");
    assertThat(pro.rule.postprocess.meta.types)
      .equalsTo({"case": "-nom", "gen": "male", "num": "sing", "refl": "+"});
    const np = tracks[30].stack[1];
    assertThat(np.rule.name).equalsTo("NP");
    assertThat(np.rule.postprocess.meta.conditions[np.dot].types)
      .equalsTo({"case": "3", "gen": "2", "num": 1});
  });

});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
