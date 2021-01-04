const Assert = require("assert");
const {child} = require("../../src/drt/base.js");

const {
  Nearley, 
  bind, 
  FeaturedNearley, 
  Parser, 
  nodes,
  DrtSyntax} = require("../../src/drt/parser.js");

const {
  Sentence,
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
  RN} = nodes;

const {dict} = require("./dict.js");

describe("Parser", function() {
  it("Basic", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    assertThat(parser.feed("foo")).equalsTo([[[[["foo"]]]]]);
  });

  it.skip("Export", function() {
      const code = FeaturedNearley.compile(DrtSyntax, "", true);

      const fs = require("fs");

      fs.writeFileSync("bin/grammar.js", code);
    //let code = Nearley.generate(`
    //  main -> (statement):+
    //  statement -> "foo" | "bar"
    //`);
     // console.log(code);
  });
    
  it("Incomplete", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    // When there is still a possibility of completing
    // a valid parse, it returns []s.
    assertThat(parser.feed("fo")).equalsTo([]);
  });

  it("Rules", function() {
    let parser = Nearley.from(`
      expression -> number "+" number
      expression -> number "-" number
      expression -> number "*" number
      expression -> number "/" number
      number -> [0-9]:+
    `);

    assertThat(parser.feed("1+1")).equalsTo([[[["1"]], "+", [["1"]]]]);
   });

  it("Postprocessors", function() {
    let parser = Nearley.from(`
      expression -> number "+" number {%
        function([left, op, right]) {
          return {left: left, op: op, right: right};
        }
      %}
      number -> [0-9]:+ {%
        function([number]) {
         return parseInt(number);
        }
      %}
    `);

    assertThat(parser.feed("1+1")).equalsTo([{left: 1, op: "+", right: 1}]);
   });

  it("Reject", function() {
    let parser = Nearley.from(`
      # the first rule always rejects
      number -> [0-4]:+ {% (data, location, reject) => reject %}
      number -> [0-9]:+ {% ([number], location, reject) => "hello" %}
    `);

    assertThat(parser.feed("1")).equalsTo(["hello"]);
   });

  it("Javascript", function() {
    let parser = Nearley.from(`
      @{%
        function foo(num) {
         return parseInt(num);
        }
      %}
      number -> [0-9]:+ {% ([number], location, reject) => foo(number) %}
    `);

    assertThat(parser.feed("1")).equalsTo([1]);
   });

  it("Builtin", function() {
    let parser = Nearley.from(`
      @builtin "whitespace.ne"
      expression -> number _ "+" _ number
      number -> [0-9]:+ {% ([number], location, reject) => parseInt(number) %}
    `);

    assertThat(parser.feed("1 + 1")).equalsTo([[1, null, "+", null, 1]]);
   });

  it("Precedence", function() {
    let grammar = Nearley.compile(`
      @builtin "whitespace.ne"

      @{%
        function op([a, [op], b]) {
         return {a: a, b: b, op: op};
        } 
      %}

      math -> sum {% id %}
      sum -> sum ("+"|"-") product {% op %} 
      sum -> product {% id %}
      product -> product ("*"|"/") exp {% op %}
      product -> exp {% id %}
      exp -> number "^" exp {% op %}
      exp -> number {% id %}
      number -> [0-9]:+ {% ([number]) => parseInt(number) %}
    `);
    assertThat(new Nearley(grammar).feed("1+1"))
     .equalsTo([{a: 1, op: "+", b: 1}]);
    assertThat(new Nearley(grammar).feed("1+2/3"))
     .equalsTo([{a: 1, op: "+", b: {a: 2, op: "/", b: 3}}]);

    let grammar2 = Nearley.compile(`
      @builtin "whitespace.ne"

      @{%
        function op([a, [op], b]) {
         return {a: a, b: b, op: op};
        } 
      %}

      math -> product {% id %}
      product -> product ("*"|"/") sum {% op %}
      product -> sum {% id %}
      sum -> sum ("+"|"-") exp {% op %} 
      sum -> exp {% id %}
      exp -> number "^" exp {% op %}
      exp -> number {% id %}
      number -> [0-9]:+ {% ([number]) => parseInt(number) %}
    `);
    assertThat(new Nearley(grammar2).feed("1+1"))
     .equalsTo([{a: 1, op: "+", b: 1}]);
    assertThat(new Nearley(grammar2).feed("1+2/3"))
     .equalsTo([{a: {a: 1, op: "+", b: 2}, op: "/", b: 3}]);
   });

 });

describe("Binding", function() {
  it("Whitespace", function() {
    let post = bind("VP", {}, [
      {"@type": "V"},
      {"@type": "__"},
      {"@type": "NP"}
    ]);

    assertThat(post([{
      "@type": "V", 
    }, {
      "@type": "__", 
    }, {
      "@type": "NP", 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {},
      "children": [{"@type": "V"}, {"@type": "NP"}]
    });

  });
  
  it.skip("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([]))
    .equalsTo(undefined);
   });

  it.skip("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([null,null]))
      .equalsTo(undefined);

   });

  it("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([{"@type": "V"},{"@type": "DET"}]))
    .equalsTo(undefined);
   });

  it("Rejects based on types", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([{"@type": "V"},{"@type": "DET"}]))
     .equalsTo(undefined);
  });

  it("Rejects based on types", function() {
    let post = bind("NP", {}, [{"@type": "PN", "types": {"num": "sing"}}]);
    assertThat(post([{"@type": "PN", "types": {"num": "plur"}}]))
     .equalsTo(undefined);
  });

  it("Rejects based on conflicting bindings", function() {
    let post = bind("VP", {"num": 1}, [{ 
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "NP", 
        "types": {"num": "plur"}, 
    }]))
    .equalsTo(undefined);
  });

  it("Rejects invalid array entry", function() {
    let post = bind("NP", {"gen": "male"}, [{
       "@type": "PN",
       "types": {"gen": "male"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["-hum", "fem"]}, 
    }]))
    .equalsTo(undefined);
  });

  it("Binds", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"num": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing"},
      }]
    });
  });

  it("Binds keeps free variables", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"gen": 2}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": "male"},
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": -568255581}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "male"},
      }]
    });
  });

  it("Binds tail variable to head", function() {
    let post = bind("NP", {}, [{ 
       "@type": "PN",
       "types": {"gen": "-"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": -1638024502},
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "-"},
      }]
    });
  });

  it.skip("Binds to literals", function() {
    let post = bind("PN", {"num": "sing"});

    assertThat(post(["Sam"]))
    .equalsTo({
      "@type": "PN", 
      "types": {"num": "sing"}, 
      "children": ["Sam"]
    });
  });

  it("Binds multiple", function() {
    let post = bind("NP", {"num": 1, "gen": 2}, [{ 
       "@type": "PN",
       "types": {"num": 1, "gen": 2}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing", "gen": "-hum"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing", "gen": "-hum"},
      }]
    });
  });

  it("Binds multiple", function() {
    let post = bind("S", {"num": 1}, [{ 
       "@type": "NP",
       "types": {"num": 1}
      }, { 
       "@type": "VP_",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "NP", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "VP_", 
        "types": {"num": 2}, 
      }]))
    .equalsTo({
      "@type": "S", 
      "types": {"num": "sing"}, 
      "children": [{
         "@type": "NP", 
         "types": {"num": "sing"},
       }, {
         "@type": "VP_", 
         "types": {"num": 2},
      }]
    });
  });

  it("Binds ignoring extras", function() {
    let post = bind("NP", {"num": 1}, [{ 
       "@type": "PN",
       "types": {"num": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"num": "sing"}, 
      "children": [{
        "@type": "PN", 
        "types": {"num": "sing", "gen": "-hum"},
      }]
    });
  });

  it("Rejects fewer of expected types", function() {
    let post = bind("VP", {}, [{ 
       "@type": "NP",
       "types": {"num": 1, "gen": 2, "case": "-nom", "gap": 3}
    }]);

    assertThat(post([{
      "@type": "NP", 
      "types": {"num": "sing", "gen": "-hum"}, 
    }]))
    .equalsTo(undefined);
  });

  it("Binds to arrays", function() {
    let post = bind("NP", {"gen": 1}, [{
       "@type": "PN",
       "types": {"gen": 1}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["male", "fem"]}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"gen": ["male", "fem"]}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": ["male", "fem"]}, 
      }]
    });
  });

  it("Binds to array entry", function() {
    let post = bind("NP", {"gen": "male"}, [{
       "@type": "PN",
       "types": {"gen": "male"}
    }]);

    assertThat(post([{
      "@type": "PN", 
      "types": {"gen": ["male", "fem"]}, 
    }]))
    .equalsTo({
      "@type": "NP", 
      "types": {"gen": "male"}, 
      "children": [{
        "@type": "PN", 
        "types": {"gen": "male"}, 
      }]
    });
  });

  it("Binds and array entry to a literal", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": ["sing", "plur"]}, 
      }, {
        "@type": "NP", 
        "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": ["sing", "plur"]}, 
        }, {
          "@type": "NP", 
          "types": {"num": "sing"}, 
      }]
    });
  });

  it("Binds and array entry to a literal", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": "sing"}, 
      }, {
        "@type": "NP", 
        "types": {"num": ["sing", "plur"]}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": "sing"}, 
        }, {
          "@type": "NP", 
          "types": {"num": ["sing", "plur"]}, 
      }]
    });
  });

  it("Binds literal to an array entry", function() {
    let post = bind("V", {}, [{
       "@type": "VERB",
       "types": {"ends": ["s", "ch"]}
      }]);

    assertThat(post([{
        "@type": "VERB",
        "types": {"ends": "s"}, 
      }]))
    .equalsTo({
      "@type": "V", 
      "types": {}, 
      "children": [{
          "@type": "VERB", 
          "types": {"ends": "s"}, 
        }]
    });
  });

  it("Binds literal to variable", function() {
    let post = bind("VP", {"num": 1}, [{
       "@type": "V",
       "types": {"num": 1}
      }, {
       "@type": "NP",
       "types": {"num": 1}
      }]);

    assertThat(post([{
        "@type": "V", 
        "types": {"num": 1234}, 
      }, {
        "@type": "NP", 
        "types": {"num": "sing"}, 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {"num": "sing"}, 
      "children": [{
          "@type": "V", 
          "types": {"num": 1234}, 
        }, {
          "@type": "NP", 
          "types": {"num": "sing"}, 
      }]
    });
  });

  it("Numbers", function() {
    let parser = Nearley.from(`
      @builtin "number.ne"
      @builtin "whitespace.ne"
      main -> "foo" _ unsigned_int _ "bar"
    `);

    let result = parser.feed("foo 1 bar");
    assertThat(result).equalsTo([["foo", null, 1, null, "bar"]]);
  });  
});

describe("FeaturedNearley", function() {
  it("Parse", function() {
    let parser = new FeaturedNearley();
    let grammar = parser.feed(`
      S[a=1] -> NP[b=2] _ VP[c=3].
    `);
    
    assertThat(grammar).equalsTo([[{
      "head": {
        "name": "S",
        "types": {"a": 1}
      },
      "tail": [{
        "name": "NP",
        "types": {"b": 2}        
      }, {
        "name": "_",
        "types": {}        
      }, {
        "name": "VP",
        "types": {"c": 3}        
      }]
    }]]);
    
  });

  it("Generate", function() {
    let grammar = FeaturedNearley.generate(`
      S[a=1] -> NP[b=2] _ VP[c=3].
    `);
    
    assertThat(grammar).equalsTo(`
S -> NP _ VP {%
  bind("S", {"a":1}, [
    {"@type": "NP", "types": {"b":2}}, 
    {"@type": "_", "types": {}}, 
    {"@type": "VP", "types": {"c":3}}, 
  ])
%}
`.trim());
    
  });

  it("whitespace", function() {
    let parser = new Parser("_");
    let results = parser.feed(" ");
    assertThat(results).equalsTo([{
      "@type": "_",
      "types": {},
    }]);
  });
  
  it("tokens", function() {
    let parser = new Parser("Discourse");
    parser.load(dict);
    let results = parser.feed("Jones likes Mary.");
    assertThat(results.length).equalsTo(1);
    //assertThat(clear(results[0][0]))
    //  .equalsTo({});
    //console.log(parser.parser.print());
    //assertThat(parser.parser.tracks()).equalsTo();
  });

  it.skip("Rejects at Runtime", function() {
    let parser = Nearley.from(`
      @builtin "whitespace.ne"

      S -> NP _ VP {%
        bind("S", {"num": 1}, [{
            "@type": "NP",
            "types": {"num": 1}
          }, {
            "@type": "_",
            "types": {"num": 1}
          }, {
            "@type": "VP",
            "types": {"num": 1}
          }])
      %}
      VP -> V _ NP {% 
        bind("VP", {"num": "sing"}, [{
           "@type": "V",
          }, {
            "@type": "_",
            "types": {"num": 1}
          }, {
           "@type": "NP",
          }]) 
      %}
      NP -> PN {% 
        bind("NP", {"num": 1}, [{ 
           "@type": "PN",
           "types": {"num": 1}
        }]) 
      %}
      PN -> "Sam" {% bind("PN", {"num": "sing"}) %}
      PN -> "Dani" {% bind("PN", {"num": "sing"}) %}
      V -> "likes" {% bind("V", {"num": "sing"}) %}
    `);

    let result = parser.feed("Sam likes Dani");
    let node = (type, ...children) => { 
      return {"@type": type, "children": children} 
    };

    assertThat(result[0].types).equalsTo({
      "num": "sing"
    });

    function clear(root) {
      delete root.types;
      delete root.loc;
      for (let child of root.children || []) {
        clear(child);
      }
      return root;
    }

    assertThat(clear(result[0]))
     .equalsTo(node("S",
                    node("NP", node("PN", "Sam")),
                    node("VP", 
                         node("V", "likes"), 
                         node("NP", node("PN", "Dani"))))
               );
  });

  it.skip("Numbers", function() {
    let grammar = FeaturedNearley.compile(`
      main -> "foo" _ unsigned_int _ "bar".
    `, `
      @builtin "whitespace.ne"
      @builtin "number.ne"
    `);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("foo 1 bar");
    
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": ["foo", 1, "bar"],
      "types": {}
    }]);
  });

  it("Tokens", function() {
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
             if (this.parsed) {
               return;
             }
             this.parsed = true;
             return {
               "@type": "%foo",
               "value": "foo", 
               "type": "foo",
               "tokens": [{
                 "@type": "foo", 
                 "types": {}
               }]
             };
           },
         };
       %}

       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `;
    let grammar = FeaturedNearley.compile(`
       main -> %foo.
    `, header);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("foo");
    
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": [{
        "@type": "%foo",
        "type": "foo",
        "value": "foo",
        "tokens": [{
          "@type": "foo",
          "types": {},
        }]
      }],
      "types": {}
    }]);
  });
  
  it("Typed Tokens", function() {
    const header = `
       @{%
         const lexer = {
           has(name) {
             return true;
           },
           reset(chunk, state) {
             this.i = 0;
           },
           save() {
           },
           next() {
             // console.log("next");
             this.i++;
             if (this.i == 3) {
               return undefined;
             }
             return {
               "value": "foo", 
               "type": "word",
               "tokens": [{
                 "@type": "N", 
                 "types": {}
               }, {
                 "@type": "ADJ", 
                 "types": {}
               }]
             };
           },
         };
       %}

       # Pass your lexer object using the @lexer option:
       @lexer lexer
    `;
    let grammar = FeaturedNearley.compile(`
       main -> ADJ N.
       ADJ[] -> %word.
       N[] -> %word.
    `, header);

    let parser = new Nearley(grammar, "main");

    let result = parser.feed("foobar");
    assertThat(result).equalsTo([{
      "@type": "main",
      "children": [{
        "@type": "ADJ",
        "children": [{"value": "foo"}],
        "types": {
        }
      }, {
        "@type": "N",
        "children": [{"value": "foo"}],
        "types": {
        }
      }],
      "types": {}
    }]);
  });

});

function clear(root) {
  if (!root) {
    return;
  }

  delete root.types;
  delete root.loc;
  root.children = (root.children || [])
    .filter((child) => (child["@type"] != "_" && child["@type"] != "__"));

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

function parse(s, start = "Discourse", raw = false, skip = true) {
  let parser = new Parser(start);
  parser.load(dict);
  let results = parser.feed(s);

  assertThat(results.length).equalsTo(1);
  
  if (raw) {
    return results[0];
  }
 
  if (skip) {
    let result = clear(results[0][0]);
    return child(result, 0, 0, 0);
  }

  // console.log(results[0]);
  // console.log(results);
  return clear(results[0]);
}

describe("Statements", function() {

  it("Jones likes Mary.", function() {
    assertThat(parse("Jones likes Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(PN("Mary"))))));
  });

  it.skip("Jones like Mary", function() {
    let parser = DRTParser.from();
    try {
     parser.feed("Jones like Mary.");
     throw new Error("expected error");
    } catch (error) {
     // We only realize there is an error when we
     // see the ".", because it commits to the end
     // of the sentence and we don't have any option
     // that works. That's unfortunate, because
     // the number disagreement between the verb and
     // the subject could've been caught earlier :(
     assertThat(error.token).equalsTo(".");
    }
   });

  it("Jones likes him.", function() {
    assertThat(parse("Jones likes him."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("she likes him.", function() {
    assertThat(parse("she likes him."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("she likes her.", function() {
    assertThat(parse("she likes her."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("her"))))));
   });

  it("he likes it.", function() {
    assertThat(parse("he likes it."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
   });

  it("they like it.", function() {
    assertThat(parse("they like it."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("like")), NP(PRO("it"))))));
   });

  it("she likes them.", function() {
    assertThat(parse("she likes them."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("them"))))));
   });

  it("Jones does not love Mary", function() {
    assertThat(parse("Jones does not love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PN("Mary"))))));
   });

  it("he does not love her", function() {
    assertThat(parse("he does not love her."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
   });

  it("they do not love her", function() {
    assertThat(parse("they do not love her."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("it does not love them", function() {
    assertThat(parse("it does not love them."))
     .equalsTo(S(NP(PRO("it")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("them"))))));
  });

  it("he likes a book.", function() {
    assertThat(parse("he likes a book."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("a"), N("book"))))));
   });

  it("he likes every book.", function() {
    assertThat(parse("he likes every book."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("every"), N("book"))))));
   });

  it("every man likes him.", function() {
    assertThat(parse("every man likes him."))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("a woman likes him.", function() {
    assertThat(parse("a woman likes him."))
     .equalsTo(S(NP(DET("a"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("the woman likes him.", function() {
    assertThat(parse("the woman likes him."))
     .equalsTo(S(NP(DET("the"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("Jones and Mary like him.", function() {
    assertThat(parse("Jones and Mary like him."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(PRO("him"))))));
  });

  it("he likes Jones and Mary.", function() {
    assertThat(parse("he likes Jones and Mary."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(NP(PN("Jones")), 
                           "and", 
                           NP(PN("Mary")))))));
  });

  it("Jones likes a book which Mary likes.", function() {
    assertThat(parse("Jones likes a book which Mary likes."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"),
                                S(NP(PN("Mary")), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(GAP()))))
                                )))
                        ))));
   });

  it("Jones likes a woman which likes Mary.", function() {
    assertThat(parse("Jones likes a book which likes Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"),
                                S(NP(GAP()), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(PN("Mary")))))
                                )))
                        ))));
   });

  it("every man who likes Brazil likes a woman which likes Jones.", function() {
    assertThat(parse("every man who likes Brazil likes a woman who likes Jones."))
     .equalsTo(S(NP(DET("every"), 
                    N(N("man"), 
                      RC(RPRO("who"),
                         S(NP(GAP()),
                           VP_(VP(V(VERB("like"), "s"), NP(PN("Brazil")))))
                         ))),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("woman"), 
                             RC(RPRO("who"),
                                S(NP(GAP()), 
                                  VP_(VP(V(VERB("like"), "s"), 
                                         NP(PN("Jones")))))
                                )))
                        ))));
   });

  it("Jones is unhappy.", function() {
    assertThat(parse("Jones is unhappy."))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(BE("is"), ADJ("unhappy")))));
  });
  
  it("Jones is an unhappy foolish man.", function() {
    assertThat(parse("Jones is an unhappy foolish man."))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(BE("is"), NP(DET("an"),
                                      N(ADJ("unhappy"),
                                        N(ADJ("foolish"), N("man"))))))));
  });

  it("they are happy.", function() {
    assertThat(parse("they are happy."))
      .equalsTo(S(NP(PRO("they")),
                  VP_(VP(BE("are"), ADJ("happy")))));
  });
  
  it("Jones likes a woman who is happy.", function() {
    assertThat(parse("Jones likes a woman who is happy."))
      .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("woman"), 
                             RC(RPRO("who"),
                                S(NP(GAP()), 
                                  VP_(VP(BE("is"), ADJ("happy"))))
                                )))
                        ))));
   });

  it("Jones is a man.", function() {
    assertThat(parse("Jones is a man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), 
                        NP(DET("a"), N("man"))))));
  });

  it("Jones is not a woman.", function() {
    assertThat(parse("Jones is not a woman."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"),
                        "not",
                        NP(DET("a"), N("woman"))))));
  });

  it("if Mary is happy then Jones is happy.", function() {
    assertThat(parse("if Mary is happy then Jones is happy."))
     .equalsTo(S("if",
                 S(NP(PN("Mary")), VP_(VP(BE("is"), ADJ("happy")))),
                 "then",
                 S(NP(PN("Jones")), VP_(VP(BE("is"), ADJ("happy")))),
                 ));
  });

  it("Jones and Mary like a book.", function() {
    assertThat(parse("Jones and Mary like a book."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(DET("a"), N("book"))))));
  });

  it("Jones likes Mary and Brazil.", function() {
    assertThat(parse("Jones likes Mary and Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                     NP(NP(PN("Mary")), "and", NP(PN("Brazil")))
                        ))));
  });

  it("Jones likes Brazil and he likes Mary.", function() {
    assertThat(parse("Jones likes Brazil and he likes Mary."))
     .equalsTo(S(S(NP(PN("Jones")),
                   VP_(VP(V(VERB("like"), "s"), NP(PN("Brazil"))))),
                 "and",
                 S(NP(PRO("he")),
                   VP_(VP(V(VERB("like"), "s"), NP(PN("Mary"))))),
                 ));
  });

  it("Jones likes himself", function() {
    assertThat(parse("Jones likes himself."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(PRO("himself"))))));
  });

  it("Jones's book is foolish", function() {
    assertThat(parse("Jones's book is foolish."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("book")),
                 VP_(VP(BE("is"), ADJ("foolish")))));
  });

  it("Mary likes Jones's book", function() {
    assertThat(parse("Mary likes Jones's book."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET(NP(PN("Jones")), "'s"), N("book"))))));
  });

  it("Jones likes a book about Brazil", function() {
    assertThat(parse("Jones likes a book about Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("book"), PP(PREP("about"), NP(PN("Brazil"))))
                          )))));
  });

  it("Jones likes a book from Brazil", function() {
    assertThat(parse("Jones likes a book from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("book"), PP(PREP("from"), NP(PN("Brazil"))))), 
                       ))));
  });

  it("Jones likes a girl with a telescope.", function() {
    assertThat(parse("Jones likes a girl with a telescope."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("girl"), 
                             PP(PREP("with"), NP(DET("a"), N("telescope")))))
                       ))));
  });

  it("Jones is from Brazil.", function() {
    assertThat(parse("Jones is from Brazil."))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(BE("is"), 
                         PP(PREP("from"), NP(PN("Brazil")))))));
  });

  it("Jones is not from Brazil.", function() {
    assertThat(parse("Jones is not from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), "not",
                        PP(PREP("from"), NP(PN("Brazil")))))));
  });

  it("Jones likes a girl who is from Brazil.", function() {
    assertThat(parse("Jones likes a girl who is from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"), 
                           N(N("girl"), 
                             RC(RPRO("who"),
                                S(NP(GAP()),
                                  VP_(VP(BE("is"), 
                                         PP(PREP("from"), NP(PN("Brazil"))
                                           ))))
                                ))
                           )))
                 ));
  });

  it("Jones's sister is Mary", function() {
    assertThat(parse("Jones's sister is Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("sister")),
                 VP_(VP(BE("is"), NP(PN("Mary"))))));
  });

  it("Jones's sister is not Mary", function() {
    assertThat(parse("Jones's sister is not Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("sister")),
                 VP_(VP(BE("is"), "not", NP(PN("Mary"))))));
  });

  it("Jones walks.", function() {
    assertThat(parse("Jones walks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "s")))));
  });

  it("Jones walks to Brazil.", function() {
    assertThat(parse("Jones walks to Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V(VERB("walk"), "s"),
                          PP(PREP("to"), NP(PN("Brazil"))))
                       ))));
  });

  it("they walk.", function() {
    assertThat(parse("they walk."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("walk"))))));
   });

  it("Jones walked.", function() {
    assertThat(parse("Jones walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "ed")))));
   });

  it("Jones will walk.", function() {
    assertThat(parse("Jones will walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("walk"))))));
  });

  it("Jones would walk.", function() {
    assertThat(parse("Jones would walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("would"), VP(V(VERB("walk"))))));
  });

  it("Jones does not walk.", function() {
    assertThat(parse("Jones does not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones did not walk.", function() {
    assertThat(parse("Jones did not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("did"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones would not walk.", function() {
    assertThat(parse("Jones would not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("would"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones will not walk.", function() {
    assertThat(parse("Jones will not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones was happy.", function() {
   assertThat(parse("Jones was happy."))
    .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("was"), ADJ("happy")))));
  });

  it("they were happy.", function() {
   assertThat(parse("they were happy."))
    .equalsTo(S(NP(PRO("they")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("Jones loves Mary.", function() {
    assertThat(parse("Jones loves Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(PN("Mary"))))));
  });

  it("Jones will love Mary.", function() {
    assertThat(parse("Jones will love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), 
                     VP(V(VERB("love")),
                        NP(PN("Mary"))))));
  });

  it("Jones will not love Mary.", function() {
    assertThat(parse("Jones will not love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not",
                     VP(V(VERB("love")),
                        NP(PN("Mary"))))));
  });

  it("Jones kissed Mary.", function() {
    assertThat(parse("Jones kissed Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("they kissed Mary.", function() {
    assertThat(parse("they kissed Mary."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("Jones has walked.", function() {
    assertThat(parse("Jones has walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("has"), VP(V(VERB("walk"), "ed"))))));
  });

  it("Jones had walked.", function() {
    assertThat(parse("Jones had walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("they have walked.", function() {
    assertThat(parse("they have walked."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("they had walked.", function() {
    assertThat(parse("they had walked."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("Jones has not walked.", function() {
    assertThat(parse("Jones has not walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("has"), "not", VP(V(VERB("walk"), "ed"))))));
  });

  it("they have not walked.", function() {
    assertThat(parse("they have not walked."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(HAVE("have"), "not", VP(V(VERB("walk"), "ed"))))));
  });

  it.skip("They left Brazil.", function() {
    assertThat(parse("they left Brazil."))
      .equalsTo(S(NP(PRO("they")),
                  VP_(VP(V(VERB("left")),
                         NP(PN("Brazil"))))));
  });

  it.skip("They have left Brazil.", function() {
    assertThat(parse("They have left Brazil."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), 
                        VP(V(VERB("left")),
                           NP(PN("Brazil")))))));
  });

  it("Jones and Mary like him.", function() {
    assertThat(parse("Jones and Mary like him."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(PRO("him"))))));
   });

  it("he likes Jones and Mary.", function() {
    assertThat(parse("he likes Jones and Mary."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(NP(PN("Jones")), "and", NP(PN("Mary")))
                        ))));
   });

  it("he likes Jones's brother.", function() {
    assertThat(parse("he likes Jones's brother."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET(NP(PN("Jones")), "'s"), N("brother"))
                        ))));
   });

  it.skip("Jones's wife or Smith's brother loves Mary.", function() {
    assertThat(parse("Jones's wife or Smith's brother loves Mary."))
     .equalsTo(S(NP(NP(DET(NP(PN("Jones")), "'s"), N("wife")), 
                    "or", 
                    NP(DET(NP(PN("Smith")), "'s"), N("brother"))),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))
                 ));
   });

});

describe("Questions", function() {
  it("who walks?", function() {
    assertThat(parse("who walks?", "Question", false, false))
     .equalsTo(Question("who", VP_(VP(V(VERB("walk"), "s"))), "?"));
  });

  it("who likes Mary?", function() {
    assertThat(parse("who likes Mary?", "Question", false, false))
     .equalsTo(Question("who", VP_(VP(V(VERB("like"), "s"),
                                      NP(PN("Mary")))), "?"));
  });

  it("who does not love Mary?", function() {
    assertThat(parse("who does not love Mary?", "Question", false, false))
     .equalsTo(Question("who", VP_(AUX("does"), 
                                   "not", 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });

  it("who will walk?", function() {
    assertThat(parse("who will walk?", "Question", false, false))
     .equalsTo(Question("who", VP_(AUX("will"), 
                                   VP(V(VERB("walk")))), "?"));
  });

  it("who will love Mary?", function() {
    assertThat(parse("who will love Mary?", "Question", false, false))
     .equalsTo(Question("who", VP_(AUX("will"), 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });

  it("who liked Mary?", function() {
    assertThat(parse("who liked Mary?", "Question", false, false))
     .equalsTo(Question("who", VP_(VP(V(VERB("like"), "d"),
                                      NP(PN("Mary")))), "?"));
  });
});

describe("Generalized Quantifiers", function() {
  it("every man is happy.", function() {
    assertThat(parse("every man is happy."))
      .equalsTo(S(NP(DET("every"), N("man")),
                  VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("all men are mortal.", function() {
    assertThat(parse("all men are mortal."))
      .equalsTo(S(NP(DET("all"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("no engineer is happy.", function() {
    assertThat(parse("no engineer is happy."))
      .equalsTo(S(NP(DET("no"), N("engineer")),
                  VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("most men are mortal.", function() {
    assertThat(parse("most men are mortal."))
      .equalsTo(S(NP(DET("most"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("some men are mortal.", function() {
    assertThat(parse("some men are mortal."))
      .equalsTo(S(NP(DET("some"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("not all men are mortal.", function() {
    assertThat(parse("not all men are mortal."))
      .equalsTo(S(NP(DET("not", "all"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("many men are mortal.", function() {
    assertThat(parse("many men are mortal."))
      .equalsTo(S(NP(DET("many"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("only men are mortal.", function() {
    assertThat(parse("only men are mortal."))
      .equalsTo(S(NP(DET("only"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("the majority of men are mortal.", function() {
    assertThat(parse("the majority of men are mortal."))
      .equalsTo(S(NP(DET("the", "majority", "of"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it("the minority of men are mortal.", function() {
    assertThat(parse("the minority of men are mortal."))
      .equalsTo(S(NP(DET("the", "minority", "of"), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("at least 5 men are mortal.", function() {
    assertThat(parse("at least 5 men are mortal."))
      .equalsTo(S(NP(DET("at", "least", 5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("at most 5 men are mortal.", function() {
    assertThat(parse("at most 5 men are mortal."))
      .equalsTo(S(NP(DET("at", "most", 5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("more than 5 men are mortal.", function() {
    assertThat(parse("more than 5 men are mortal."))
      .equalsTo(S(NP(DET("more", "than", 5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("fewer than 5 men are mortal.", function() {
    assertThat(parse("fewer than 5 men are mortal."))
      .equalsTo(S(NP(DET("fewer", "than", 5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("exactly 5 men are mortal.", function() {
    assertThat(parse("exactly 5 men are mortal."))
      .equalsTo(S(NP(DET("exactly", 5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });

  it.skip("5 men are mortal.", function() {
    assertThat(parse("5 men are mortal."))
      .equalsTo(S(NP(DET(5), N("men")),
                  VP_(VP(BE("are"), ADJ("mortal")))));
  });
});

describe.skip("Plural Morphology", function() {
  it("Plural", function() {
    assertThat(parse("brazilians", "N", false, false))
      .equalsTo(N(N("brazilian"), "s"));
    assertThat(parse("engineers", "N", false, false))
      .equalsTo(N(N("engineer"), "s"));
    assertThat(parse("cats", "N", false, false))
      .equalsTo(N(N("cat"), "s"));
    assertThat(parse("witches", "N", false, false))
      .equalsTo(N(N("witch"), "es"));
    assertThat(parse("dishes", "N", false, false))
      .equalsTo(N(N("dish"), "es"));
  });
});

describe("DRT Verbs", function() {
  it.skip("Verbs", function() {
    // https://parentingpatch.com/third-person-singular-simple-present-verbs/
    // https://www.lawlessenglish.com/learn-english/grammar/simple-past-regular-verbs/

    // Third person plural for regular verbs
    assertThat(parse("walk", "V", false, false)).equalsTo(V(VERB("walk")));

    // Third person for regular verbs
    // assertThat(parse("walks", "V", false, false)).equalsTo(V(VERB("walk"), "s"));
    // assertThat(parse("listens", "V", false, false)).equalsTo(V(VERB("listen"), "s"));
    // return;

    // Third person present for verbs ending in s, x, ch, sh
    assertThat(parse("kisses", "V", false, false)).equalsTo(V(VERB("kiss"), "es"));
    assertThat(parse("boxes", "V", false, false)).equalsTo(V(VERB("box"), "es"));
    assertThat(parse("watches", "V", false, false)).equalsTo(V(VERB("watch"), "es"));
    assertThat(parse("crashes", "V", false, false)).equalsTo(V(VERB("crash"), "es"));

    // Third person present for verbs ending in e
    assertThat(parse("frees", "V", false, false)).equalsTo(V(VERB("free"), "s"));    
    assertThat(parse("ties", "V", false, false)).equalsTo(V(VERB("tie"), "s"));    
    assertThat(parse("loves", "V", false, false)).equalsTo(V(VERB("love"), "s"));

    // Third person present ending in vow + y
    assertThat(parse("plays", "V", false, false)).equalsTo(V(VERB("play"), "s"));

    // Third person present ending in consonant + y
    assertThat(parse("applies", "V", false, false)).equalsTo(V(VERB("appl"), "ies"));
    assertThat(parse("copies", "V", false, false)).equalsTo(V(VERB("cop"), "ies"));
    assertThat(parse("replies", "V", false, false)).equalsTo(V(VERB("repl"), "ies"));
    assertThat(parse("tries", "V", false, false)).equalsTo(V(VERB("tr"), "ies"));

    // Third person for verbs where the final syllable is stressed
    assertThat(parse("compels", "V", false, false)).equalsTo(V(VERB("compel"), "s"));    
    assertThat(parse("defers", "V", false, false)).equalsTo(V(VERB("defer"), "s"));

    // Third person past for verbs ending in s, x, ch, sh
    assertThat(parse("kissed", "V", false, false)).equalsTo(V(VERB("kiss"), "ed"));

    // Past tense for regular verbs
    assertThat(parse("listened", "V", false, false)).equalsTo(V(VERB("listen"), "ed"));
    assertThat(parse("walked", "V", false, false)).equalsTo(V(VERB("walk"), "ed"));

    // Past tense for verbs ending in s, x, ch, sh
    assertThat(parse("kissed", "V", false, false)).equalsTo(V(VERB("kiss"), "ed"));
    assertThat(parse("boxed", "V", false, false)).equalsTo(V(VERB("box"), "ed"));
    assertThat(parse("watched", "V", false, false)).equalsTo(V(VERB("watch"), "ed"));
    assertThat(parse("crashed", "V", false, false)).equalsTo(V(VERB("crash"), "ed"));

    // Past tense for verbs ending in e
    assertThat(parse("freed", "V", false, false)).equalsTo(V(VERB("free"), "d"));
    assertThat(parse("tied", "V", false, false)).equalsTo(V(VERB("tie"), "d"));
    assertThat(parse("loved", "V", false, false)).equalsTo(V(VERB("love"), "d"));

    // Past tense for verbs ending in i, o
    assertThat(parse("skied", "V", false, false)).equalsTo(V(VERB("ski"), "ed"));    
    assertThat(parse("echoed", "V", false, false)).equalsTo(V(VERB("echo"), "ed"));    

    // Past tense for verbs ending in consonant + y
    assertThat(parse("applied", "V", false, false)).equalsTo(V(VERB("appl"), "ied"));
    assertThat(parse("tried", "V", false, false)).equalsTo(V(VERB("tr"), "ied"));

    // Past tense for verbs ending in vowel + y
    assertThat(parse("played", "V", false, false)).equalsTo(V(VERB("play"), "ed"));    
    assertThat(parse("enjoyed", "V", false, false)).equalsTo(V(VERB("enjoy"), "ed"));    

    // Past tense for verbs where the final syllable is stressed
    assertThat(parse("compelled", "V", false, false)).equalsTo(V(VERB("compel"), "led"));    
    assertThat(parse("deferred", "V", false, false)).equalsTo(V(VERB("defer"), "red"));

    // Past tense for verbs that are irregular.
    assertThat(parse("left", "V", false, false)).equalsTo(V(VERB("left")));
    assertThat(parse("came", "V", false, false)).equalsTo(V(VERB("came")));
  });

  it("will not kiss Jones", function() {
    let {tense, tp} = parse("Mary will not kiss Jones", "S", true, false).types;
    assertThat(tense).equalsTo("fut");
    assertThat(tp).equalsTo("-past");
    assertThat(parse("will not kiss Jones", "VP_", false, false))
     .equalsTo(VP_(AUX("will"), "not", VP(V(VERB("kiss")), NP(PN("Jones")))));
  });

  it.skip("did not kiss Mary", function() {
    let {tense, tp} = parse("did not kiss Mary", "VP_", true, false).types;
    assertThat(tense).equalsTo("fut");
    assertThat(tp).equalsTo("-past");
    assertThat(parse("will not kiss Jones", "VP_", false, false))
     .equalsTo(VP_(AUX("will"), "not", VP(V(VERB("kiss")), NP(PN("Jones")))));
  });
});

describe("Backwards compatibility", function() {
  it("he likes it.", function() {
    assertThat(parse("he likes it."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
  });


  it("Jones loves.", function() {
    assertThat(parse("Jones loves."))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s")))));
  });

  it("he likes her.", function() {
    assertThat(parse("he likes her."))
     .equalsTo(S(NP(PRO("he")), 
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(PRO("her"))))));
  });

  it("Jones stinks.", function() {
    assertThat(parse("Jones stinks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("a man loves.", function() {
    assertThat(parse("a man loves."))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("every donkey stinks.", function() {
    assertThat(parse("every book stinks."))
     .equalsTo(S(NP(DET("every"), N("book")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("the woman loves.", function() {
    assertThat(parse("the woman loves."))
     .equalsTo(S(NP(DET("the"), N("woman")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("he loves.", function() {
    assertThat(parse("he loves."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("she loves", function() {
    assertThat(parse("she loves."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("it stinks.", function() {
    assertThat(parse("it stinks."))
     .equalsTo(S(NP(PRO("it")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("it does not stink.", function() {
    assertThat(parse("it does not stink."))
     .equalsTo(S(NP(PRO("it")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("the book does not stink.", function() {
    assertThat(parse("the book does not stink."))
     .equalsTo(S(NP(DET("the"), N("book")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("he loves her.", function() {
    assertThat(parse("he loves her."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("she loves the book.", function() {
    assertThat(parse("she loves the book."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("love"), "s"), NP(DET("the"), N("book"))))));
  });

  it("every man loves her.", function() {
    assertThat(parse("every man loves her."))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("every man loves Jones.", function() {
    assertThat(parse("every man loves Jones."))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Jones"))))));
  });

  it("she does not love.", function() {
    assertThat(parse("she does not love."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(AUX("does"), "not", VP(V(VERB("love"))))));
  });

  it("she does not love him.", function() {
    assertThat(parse("she does not love him."))
     .equalsTo(S(NP(PRO("she")),
                  VP_(AUX("does"), "not", 
                      VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("Jones does not like the book.", function() {
    assertThat(parse("Jones does not like the book."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), "not", 
                     VP(V(VERB("like")), NP(DET("the"), N("book"))))));
  });

  it("they love him.", function() {
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(parse("they love him."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("they do not love him.", function() {
    assertThat(parse("they do not love him."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", VP(V(VERB("love")), NP(PRO("him"))))
                 ));
  });

  it("they do not love the book", function() {
    assertThat(parse("they do not love the book."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", 
                     VP(V(VERB("love")), NP(DET("the"), N("book"))))
                 ));
  });

  it("he and she love her.", function() {
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(parse("he and she love her."))
     .equalsTo(S(NP(NP(PRO("he")), "and", NP(PRO("she"))),
                 VP_(VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("they love him and her.", function() {
    assertThat(parse("they love him and her."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("love")), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
  });

  it("every man loves a book and a woman.", function() {
    assertThat(parse("every man loves a book and a woman."))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), 
                        NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
  });

  it("Brazil loves her.", function() {
    assertThat(parse("Brazil loves her."))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("Brazil loves Mary.", function() {
    assertThat(parse("Brazil loves Mary."))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))));
  });

  it("every man loves Italy and Brazil", function() {
    assertThat(parse("every man loves Mary and Brazil."))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), 
                        NP(NP(PN("Mary")), "and", NP(PN("Brazil")))
                        ))));
  });

  it("Mary loves a man who loves her.", function() {
    assertThat(parse("Mary loves a man who loves her."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(DET("a"), 
                           N(N("man"), 
                             RC(RPRO("who"), 
                                S(NP(GAP()), VP_(VP(V(VERB("love"), "s"), 
                                                    NP(PRO("her")))))
                                )))))));
  });

  it("Mary loves a book which surprises her", function() {
    assertThat(parse("Mary loves a book which likes her."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"),
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"), 
                                S(NP(GAP()), VP_(VP(V(VERB("like"), "s"), NP(PRO("her")))))
                                )))))));
  });

  it("every book which she loves surprises him.", function() {
    assertThat(parse("every book which she loves surprises him."))
     .equalsTo(S(NP(DET("every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V(VERB("love"), "s"), NP(GAP()))))
                                    ))),
                 VP_(VP(V(VERB("surprise"), "s"), NP(PRO("him")))
                     )));

  });

  it("every man who knows her loves her.", function() {
    assertThat(parse("every man who loves her likes him."))
     .equalsTo(S(NP(DET("every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V(VERB("love"), "s"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))
                 ));
   });

  it("a man who does not love her watches him.", function() {
    assertThat(parse("a man who does not love her watches him."))
     .equalsTo(S(NP(DET("a"),
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(AUX("does"), "not", VP(V(VERB("love")), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("watch"), "es"), NP(PRO("him"))))
                 ));

  });

  it("he is happy.", function() {
    assertThat(parse("he is happy."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

  it("he is not happy.", function() {
    assertThat(parse("he is not happy."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(BE("is"), "not", ADJ("happy")))));
   });

  it("a book does not stink.", function() {
    assertThat(parse("a man does not stink."))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(AUX("does"), "not", 
                     VP(V(VERB("stink"))))));
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat(parse("Jones loves a woman who does not love him."))
   .equalsTo(S(NP(PN("Jones")),
               VP_(VP(V(VERB("love"), "s"),
                      NP(DET("a"), 
                         N(N("woman"), 
                           RC(RPRO("who"), 
                              S(NP(GAP()), 
                                VP_(AUX("does"), "not", 
                                    VP(V(VERB("love")), NP(PRO("him"))))
                                ))
                           ))))
               ));
   });

  it("if Jones owns a book then he likes it.", function() {
    assertThat(parse("if Jones loves a book then he likes it."))
     .equalsTo(S("if", 
                 S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s"), NP(DET("a"), N("book"))))), 
                 "then", 
                 S(NP(PRO("he")), VP_(VP(V(VERB("like"), "s"), NP(PRO("it")))))));
  });

  it("every man who loves a book likes it.", function() {
    assertThat(parse("every man who loves a book likes it."))
     .equalsTo(S(NP(DET("every"), 
                    N(N("man"), 
                      RC(RPRO("who"), 
                         S(NP(GAP()), 
                           VP_(VP(V(VERB("love"), "s"), 
                                  NP(DET("a"), N("book")))))))), 
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
   });

  it("Jones loves her or Mary loves her.", function() {
    assertThat(parse("Jones loves her or Mary loves her."))
     .equalsTo(S(S(NP(PN("Jones")), 
                   VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))), 
                 "or", 
                 S(NP(PN("Mary")), 
                   VP_(VP(V(VERB("love"), "s"), NP(PRO("her")))))));
   });

  it.skip("Mary loves Jones or likes Smith.", function() {
    assertThat(parse("Mary loves Jones or likes Brazil."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP_(VP(VP(V("loves"), NP(PN("Jones"))), 
                        "or", 
                        VP(V("likes"), NP(PN("Smith")))))));
   });

  it("Jones or Smith loves her.", function() {
    assertThat(parse("Jones or Smith loves her."))
     .equalsTo(S(NP(NP(PN("Jones")), "or", NP(PN("Smith"))),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it.skip("Jones likes and loves a porsche.", function() {
    assertThat(parse("Jones likes and loves a porsche."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("owns"), "and", V("loves")), NP(DET("a"), N("porsche"))))));
  });

  it("Jones likes.", function() {
    try {
     assertThat(parse("Jones likes."));
     // This should be an error as opposed to undefined.
    } catch (e) {
    }
  });

  it.skip("Jones likes and loves Mary.", function() {
    assertThat(parse("Jones likes and loves Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("likes"), "and", V("loves")), NP(PN("Mary"))))));
  });

  it("Mary likes Smith and she loves him.", function() {
    assertThat(parse("Mary likes Smith and she loves him."))
     .equalsTo(S(S(NP(PN("Mary")), 
                   VP_(VP(V(VERB("like"), "s"), NP(PN("Smith"))))), 
                 "and", 
                 S(NP(PRO("she")), 
                   VP_(VP(V(VERB("love"), "s"), NP(PRO("him")))))));
  });

  it("Jones is happy.", function() {
    assertThat(parse("Jones is happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("Jones's wife is happy.", function() {
    assertThat(parse("Jones's wife is happy."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("wife")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it.skip("Jones's wife likes and loves Mary.", function() {
    assertThat(first(parse("Jones's wife likes and loves Mary.")))
     .equalsTo(S(NP(DET(PN("Jones"), "'s"), N("wife")),
                 VP_(VP(V(V("likes"), "and", V("loves")), NP(PN("Mary"))))));
  });

  it("Jones and Smith love Mary and Brazil.", function() {
    assertThat(parse("Jones and Smith love Mary and Brazil."))
     .equalsTo(S(NP(NP(PN("Jones")), 
                    "and", 
                    NP(PN("Smith"))),
                 VP_(VP(V(VERB("love")), 
                        NP(NP(PN("Mary")), 
                           "and", 
                           NP(PN("Brazil")))))));
  });

  it.skip("Jones's wife and Smith's brother like and love Mary.", function() {
    assertThat(parse("Jones's wife and Smith's brother like and love Mary."))
     .equalsTo(S(NP(NP(DET(PN("Jones"), "'s"), N("wife")), 
                    "and", 
                    NP(DET(PN("Smith"), "'s"), N("brother"))),
                 VP_(VP(V(V("like"), "and", V("love")), NP(PN("Mary"))))));
  });

  it("Jones owns an unhappy donkey.", function() {
    assertThat(parse("Jones owns an unhappy donkey."))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V(VERB("own"), "s"), NP(DET("an"), N(ADJ("unhappy"), N("donkey")))))));
  });

  it("Jones likes a woman with a donkey.", function() {
    assertThat(parse("Jones likes a woman with a donkey."))
     .equalsTo(S(NP(PN("Jones")), 
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET("a"),
                           N(N("woman"), 
                             PP(PREP("with"), NP(DET("a"), N("donkey"))))
                          )))));
  });

  it("Jones is a man.", function() {
    assertThat(parse("Jones is a man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N("man"))))));
  });

  it("who likes Mary?", function() {
    assertThat(parse("who likes Mary?", "Question", false, false))
     .equalsTo(Question("who", 
                        VP_(VP(V(VERB("like"), "s"), NP(PN("Mary")))), 
                        "?"));
  });

  it("who is happy?", function() {
    assertThat(parse("who is happy?", "Question", false, false))
     .equalsTo(Question("who", 
                        VP_(VP(BE("is"), ADJ("happy"))), 
                        "?"));
  });

  it("who does Mary like?", function() {
    assertThat(parse("who does Mary like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("does"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who will Mary like?", function() {
    assertThat(parse("who will Mary like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("will"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who would Mary like?", function() {
    assertThat(parse("who would Mary like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("would"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who would they like?", function() {
    assertThat(parse("who do they like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("do"),
                        NP(PRO("they")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who did they like?", function() {
    assertThat(parse("who did they like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("did"),
                        NP(PRO("they")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who does the man like?", function() {
    assertThat(parse("who does the man like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("does"),
                        NP(DET("the"), N("man")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("who does Smith's brother like?", function() {
    assertThat(parse("who does Smith's brother like?", "Question", false, false))
     .equalsTo(Question("who", 
                        AUX("does"),
                        NP(DET(NP(PN("Smith")), "'s"), N("brother")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("is Mary happy?", function() {
    assertThat(parse("is Mary happy?", "Question", false, false))
     .equalsTo(Question(BE("is"), 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("was Mary happy?", function() {
    assertThat(parse("was Mary happy?", "Question", false, false))
     .equalsTo(Question(BE("was"), 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("are they happy?", function() {
    assertThat(parse("are they happy?", "Question", false, false))
     .equalsTo(Question(BE("are"), 
                        NP(PRO("they")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("were they happy?", function() {
    assertThat(parse("were they happy?", "Question", false, false))
     .equalsTo(Question(BE("were"), 
                        NP(PRO("they")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("Jones's wife is Mary.", function() {
    assertThat(parse("Jones's wife is Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("wife")),
                 VP_(VP(BE("is"), NP(PN("Mary"))))));
  });

  it("Jones's wife was Mary.", function() {
    assertThat(parse("Jones's wife was Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), N("wife")),
                 VP_(VP(BE("was"), NP(PN("Mary"))))));
  });

  it("John is a happy man", function() {
    assertThat(parse("Jones is a happy man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N(ADJ("happy"), N("man")))))));
  });

  it("Mary loves Jones and Smith.", function() {
    assertThat(parse("Mary loves Jones and Smith."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("love"), "s"), 
                        NP(NP(PN("Jones")), "and", NP(PN("Smith")))
                        ))));
  });

  it("John is from Brazil", function() {
    assertThat(parse("Jones is from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it("every brazilian is from Brazil", function() {
    assertThat(parse("every brazilian is from Brazil."))
     .equalsTo(S(NP(DET("every"), N("brazilian")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it.skip("If A is B's parent then B is A's child.", function() {
    assertThat(first(parse("If A is B's parent then B is A's child.")))
     .equalsTo(S("If", 
                 S(NP(PN("A")), VP_(VP(BE("is"), NP(DET(PN("B"), "'s"), N("parent"))))), 
                 "then", 
                 S(NP(PN("B")), VP_(VP(BE("is"), NP(DET(PN("A"), "'s"), N("child"))))), 
                 ));
  });

  it("he loves it.", function() {
    assertThat(parse("he loves it."))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("it"))))));
  });

  it("Jones loves himself.", function() {
    assertThat(parse("Jones loves himself."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("himself"))))));
  });

  it.skip("John is happy with Mary.", function() {
    // TODO(goto): this probably involves second order logic?
    assertThat(parse("Jones is happy with Mary."))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("loves"), NP(PRO("himself"))))));
  });

  it("Jones walks.", function() {
    // non-stative verbs
    assertThat(parse("Jones walks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "s")))));
  });

  it("Jones likes a porsche.", function() {
    // non-stative verbs
    assertThat(parse("Jones likes a porsche."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), N("porsche"))
                        ))));
  });

  it("Jones walked.", function() {
    // past tense
    assertThat(parse("Jones walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "ed")))));
  });

  it("Jones kissed Mary.", function() {
    // past tense
    assertThat(parse("Jones kissed Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Mary"))))));
  });

  it("Jones will walk.", function() {
    // future tense
    assertThat(parse("Jones will walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("walk"))))));
  });

  it("Jones will kiss Mary.", function() {
    // future tense
    assertThat(parse("Jones will kiss Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), VP(V(VERB("kiss")), NP(PN("Mary"))))));
  });

  it("Jones will not kiss Mary.", function() {
    // future tense
    assertThat(parse("Jones will not kiss Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("will"), "not", VP(V(VERB("kiss")), 
                                            NP(PN("Mary"))))));
  });

  it("Jones did not walk.", function() {
    // past tense
    assertThat(parse("Jones did not walk."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("did"), "not", VP(V(VERB("walk"))))));
  });

  it("Jones was happy.", function() {
    assertThat(parse("Jones was happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("was"), ADJ("happy")))));
  });

  it("they were happy.", function() {
    assertThat(parse("they were happy."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("she has walked.", function() {
    assertThat(parse("she has walked."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(HAVE("has"), VP(V(VERB("walk"), "ed"))))));
  });

  it("she has kissed him.", function() {
    assertThat(parse("she has kissed him."))
     .equalsTo(S(NP(PRO("she")), 
                 VP_(VP(HAVE("has"), VP(V(VERB("kiss"), "ed"), 
                                        NP(PRO("him")))))));
  });

  it("they have walked.", function() {
    assertThat(parse("they have walked."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("she had walked.", function() {
    assertThat(parse("she had walked."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("they had walked.", function() {
    assertThat(parse("they had walked."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("she had kissed him.", function() {
    assertThat(parse("she had kissed him."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(HAVE("had"), VP(V(VERB("kiss"), "ed"), NP(PRO("him")))))));
  });

  it("Jones skied.", function() {
    // past tense of verbs ending in "a, i, o, u".
    assertThat(parse("Jones skied."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("ski"), "ed")))));
  });

  it("Jones skis.", function() {
    // third person present conjugation of verbs ending in "a, i, o, u".
    // https://conjugator.reverso.net/conjugation-english-verb-ski.html
    assertThat(parse("Jones skis."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("ski"), "s")))));
  });

  it("they ski.", function() {
    // third person plural present conjugation of verbs ending in "a, i, o, u".
    // https://conjugator.reverso.net/conjugation-english-verb-ski.html
    assertThat(parse("they ski."))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V(VERB("ski"))))));
  });

  it("she played.", function() {
    assertThat(parse("she played."))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V(VERB("play"), "ed")))));
  });

  it("Mary kissed Jones.", function() {
    assertThat(parse("Mary kissed Jones."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V(VERB("kiss"), "ed"),
                        NP(PN("Jones"))))));
  });

  it.skip("Mary knows Jones.", function() {
    assertThat(parse("Mary knows Jones."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("knows"),
                        NP(PN("Jones"))))));
  });

  it("Mary has loved Anna.", function() {
    assertThat(parse("Mary has loved Jones."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(HAVE("has"), 
                        VP(V(VERB("love"), "d"), 
                           NP(PN("Jones")))))));
  });

  it("Mary was an engineer.", function() {
    assertThat(parse("Mary was an engineer."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(BE("was"),
                        NP(DET("an"), N("engineer"))))));
  });

  it("Mary was not an engineer.", function() {
    assertThat(parse("Mary was not an engineer."))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(BE("was"), "not",
                        NP(DET("an"), N("engineer"))))));
  });

  it("Sam Goto kissed Dani.", function() {
    assertThat(parse("Sam Goto kissed Dani."))
      .equalsTo(S(NP(PN(PN("Sam"), PN("Goto"))),
                  VP_(VP(V(VERB("kiss"), "ed"),
                         NP(PN("Dani"))))));
  });

  it("Jones travelled from Brazil to Italy.", function() { 
    assertThat(parse("Jones travelled from Brazil to Italy."))
      .equalsTo(S(NP(PN("Jones")),
                  VP_(VP(V(V(V(VERB("travelled")),
                             PP(PREP("from"), NP(PN("Brazil")))),
                           PP(PREP("to"), NP(PN("Italy"))))
                        )))) ;
  });

  it("Sam Goto kissed in Brazil Dani.", function() {
    assertThat(parse("Sam Goto kissed in Brazil Dani."))
      .equalsTo(S(NP(PN(PN("Sam"), PN("Goto"))),
                  VP_(VP(V(V(VERB("kiss"), "ed"),
                           PP(PREP("in"), NP(PN("Brazil")))),
                         NP(PN("Dani"))))));
  });
    
  it("Sam made a reservation for Cascal for Dani.", function() {
    assertThat(parse("Sam made a reservation for Cascal for Dani."))
      .equalsTo(S(NP(PN("Sam")),
                  VP_(VP(V(VERB("made")),
                         NP(DET("a"),
                            N(N(N("reservation"),
                                PP(PREP("for"), NP(PN("Cascal")))),
                              PP(PREP("for"), NP(PN("Dani")))
                             ))))));

  });

  it.skip("Mel likes Yuji's girlfriend.", function() {
    assertThat(parse("Mel likes Yuji's girlfriend."))
      .equalsTo(S(NP(PN(PN("Sam"), PN("Goto"))),
                  VP_(VP(V(VERB("kiss"), "ed"),
                         PP([
                           [PREP("in"), NP(PN("Brazil"))]
                         ]),
                         NP(PN("Dani"))))));
  });

});


function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
