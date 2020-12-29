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
    } catch (e) {
      assertThat(e.print().trim()).equalsTo(`
Unexpected "b". Instead, I was expecting to see one of the following:

A "o" token based on:
    main$string$1 → f ● o o
    main$string$1 → ● f o o
    main → ● main$string$1
`.trim());
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

    assertThat(error.print().trim()).equalsTo(`
Unexpected @unknown token: fbar. Instead, I was expecting to see one of the following:

A foo token based on:
    main → ● %foo
`.trim());
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
Unexpected @unknown token: fbar. Instead, I was expecting to see one of the following:

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
Unexpected "b". Instead, I was expecting to see one of the following:

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
  });
  
  it("Autocomplete from null", function() {
    let parser = new Parser("Statement");
    
    let result = [];
    
    let tokens = parser.complete();

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
    return Object.keys(parser.complete());
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

  it("a man ...", function() {
    let parser = new Parser("Statement");

    assertThat(feed(parser, "a man "))
      .equalsTo([
        "WS",
        "POSS",
        "and",
        "or",
        "does",
        "did",
        "will",
        "would",
        "who",
        "behind",
        "__in__",
        "__with__",
        "__for__",
        "__of__",
        "over",
        "under",
        "near",
        "before",
        "after",
        "during",
        "from",
        "to",
        "about",
        "by",
        "has",
        "had",
        "is",
        "was",
        "word",
      ]);
  });

  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
