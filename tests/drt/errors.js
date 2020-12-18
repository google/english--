const Assert = require("assert");
const {Nearley, FeaturedNearley, Parser} = require("../../src/drt/parser.js");

describe("Error handling", () => {

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

  function print(track) {
    const result = [];
    result.push(`A ${track.symbol} token based on:`);
    for (let stack of track.stack) {
      const {rule, dot} = stack;
      const {name, symbols} = rule;
      let tail = [];
      const postprocessor = rule.postprocess;
      let head = name;
      if (postprocessor && postprocessor.meta) {
        head += `[${postprocessor.meta}]`;
      }
      for (let i = 0; i < symbols.length; i++) {
        if (dot == i) {
          tail.push("●");
        }
        const symbol = symbols[i];
        // console.log(symbol);
        if (typeof symbol == "string") {
          tail.push(symbol);
        } else if (symbol.literal) {
          tail.push(symbol.literal);
        } else if (symbol.type) {
          tail.push(`%${symbol.type}`);
        }
      }
      result.push(`    ${head} → ${tail.join(" ")}`);
    }
    return result.join("\n");
  }
  
  function message(error) {
    const {token, tracks} = error;
      
    let result = [];
    if (token) {
      if (token.type) {
        result.push(`Unexpected ${token.type} token: ${token.value}.`);
      } else {
        result.push(`Unexpected "${token.value}".`);
      }
      result.push(`Instead, I was expecting to see one of the following:`);
      result.push(``);
    }
    for (let track of tracks) {
      result.push(print(track));
    }
    result.push(``);
    return result.join("\n");
  }

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
          f.meta = 1;
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
    main[1] → ● FOO
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
    main → ● FOO
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
    main → FOO ● BAR
    main → ● FOO BAR
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
    main → ● FOO BAR
`.trim());
    
  });

  it("Parser", () => {
    let parser = new Parser("Statement");
    const tracks = parser.parser.tracks();
    assertThat(print(tracks[0]).trim()).equalsTo(`
A __if__ token based on:
    S → ● %__if__ __ S __ %then __ S
    S_ → ● S
    Statement → ● S_ _ %PERIOD
`.trim());

    assertThat(tracks[0].stack.length).equalsTo(3);
    assertThat(tracks[0].stack[0].rule.name).equalsTo("S");
    assertThat(tracks[0].stack[0].rule.symbols).equalsTo([{
      "type": "__if__"
    }, "__", "S", "__", {
      "type": "then"
    }, "__", "S"]);
    // assertThat(tracks[0].stack[0].rule.postprocess.meta).equalsTo({});
  });
  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
