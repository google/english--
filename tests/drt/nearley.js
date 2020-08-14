const Assert = require("assert");
const {child} = require("../../src/drt/rules.js");

const {
  Nearley, 
  bind, 
  FeaturedNearley, 
  Parser, 
  nodes} = require("../../src/drt/nearley.js");

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
  RN} = nodes;

describe("Nearley", function() {
  it("Basic", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);
    assertThat(parser.feed("foo")).equalsTo([[[[["foo"]]]]]);
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

  it("Error", function() {
    let parser = Nearley.from(`
      main -> (statement):+
      statement -> "foo" | "bar"
    `);

    try {
     parser.feed("bah");
     throw new Error();
    } catch (error) {
     // console.log(error);
     // console.log(`Instead of a ${JSON.stringify(error.token)}, I was expecting to see one of the following:`);
     for (let expected of error.expected) {
      // console.log(`    A ${expected.symbol} based on:`);
      for (let based of expected.based) {
       // console.log(`        ${based}`);
      } 
     }
    }
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

 });

describe("Binding", function() {
  it("Whitespace", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);

    assertThat(post([{
        "@type": "V", 
      }, null, {
        "@type": "NP", 
    }]))
    .equalsTo({
      "@type": "VP", 
      "types": {},
      "children": [{"@type": "V"}, {"@type": "NP"}]
    });

  });
  
  it("Rejects based on length", function() {
    let post = bind("VP", {}, [{"@type": "V"}, {"@type": "NP"}]);
    assertThat(post([]))
    .equalsTo(undefined);
   });

  it("Rejects based on length", function() {
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

  it("Binds to literals", function() {
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
});

describe("FeaturedNearley", function() {
  it("Rejects at Runtime", function() {
    let parser = Nearley.from(`
      @builtin "whitespace.ne"

      @{% ${bind.toString()} %}

      S -> NP _ VP {%
        bind("S", {"num": 1}, [{
          "@type": "NP",
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

  it("Nearley features", function() {
    let parser = new FeaturedNearley();

    let result = parser.feed(`
      foo[num=1] -> bar hello[gender=male].
      hello -> world.
      a -> "hi".
      a -> b "c" d.
      S -> NP _ VP_.
      PRO[gen=-hum, case=[+nom, -nom]] -> "it".
    `);

    let term = (name, types = {}) => {
     return {name: name, types: types};
    };

    assertThat(result).equalsTo([[{
        "head": term("foo", {"num": 1}),
        "tail": [term("bar"), term("hello", {"gender": "male"})]
       }, {
        "head": term("hello"), 
        "tail": [term("world")]
       }, {
        "head": term("a"), 
        "tail": ["\"hi\""]
       }, {
        "head": term("a"), 
        "tail": [term("b"), "\"c\"", term("d")]
       }, {
        "head": term("S"), 
        "tail": [term("NP"), term("_"), term("VP_")]
       }, {
        "head": term("PRO", {"case": ["+nom", "-nom"], "gen": "-hum"}), 
        "tail": ["\"it\""]
       }]]);
  });
});

function clear(root) {
 if (!root) {
  return;
 }
 delete root.types;
 delete root.loc;
 for (let child of root.children || []) {
  clear(child);
 }
 return root;
}

function parse(s, start = "Statement", raw = false, skip = true) {
 // console.log(start);
 let parser = new Parser(start);
 let results = parser.feed(s);

 if (raw) {
  return results[0];
 }

 let result = clear(results[0]);

 if (skip) {
  return child(result, 0, 0);
 }

 return result;
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

  it("She likes him.", function() {
    assertThat(parse("She likes him."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("She likes her.", function() {
    assertThat(parse("She likes her."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("her"))))));
   });

  it("He likes it.", function() {
    assertThat(parse("He likes it."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
   });

  it("They like it.", function() {
    assertThat(parse("They like it."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("like")), NP(PRO("it"))))));
   });

  it("She likes them.", function() {
    assertThat(parse("She likes them."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("them"))))));
   });

  it("Jones does not love Mary", function() {
    assertThat(parse("Jones does not love Mary."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PN("Mary"))))));
   });

  it("He does not love her", function() {
    assertThat(parse("He does not love her."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
   });

  it("They do not love her", function() {
    assertThat(parse("They do not love her."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("It does not love them", function() {
    assertThat(parse("It does not love them."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(AUX("does"), 
                     "not", 
                     VP(V(VERB("love")), NP(PRO("them"))))));
  });

  it("He likes a book.", function() {
    assertThat(parse("He likes a book."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("a"), N("book"))))));
   });

  it("He likes every book.", function() {
    assertThat(parse("He likes every book."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(DET("every"), N("book"))))));
   });

  it("Every man likes him.", function() {
    assertThat(parse("Every man likes him."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
   });

  it("A woman likes him.", function() {
    assertThat(parse("A woman likes him."))
     .equalsTo(S(NP(DET("A"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("The woman likes him.", function() {
    assertThat(parse("The woman likes him."))
     .equalsTo(S(NP(DET("The"), N("woman")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))));
  });

  it("Jones and Mary like him.", function() {
    assertThat(parse("Jones and Mary like him."))
     .equalsTo(S(NP(NP(PN("Jones")), "and", NP(PN("Mary"))),
                 VP_(VP(V(VERB("like")), NP(PRO("him"))))));
  });

  it("He likes Jones and Mary.", function() {
    assertThat(parse("He likes Jones and Mary."))
     .equalsTo(S(NP(PRO("He")),
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

  it("Every man who likes Brazil likes a woman which likes Jones.", function() {
    assertThat(parse("Every man who likes Brazil likes a woman who likes Jones."))
     .equalsTo(S(NP(DET("Every"), 
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

   it("Jones is happy.", function() {
    assertThat(parse("Jones is happy."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

   it("They are happy.", function() {
    assertThat(parse("They are happy."))
     .equalsTo(S(NP(PRO("They")),
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

  it("If Mary is happy then Jones is happy.", function() {
    assertThat(parse("If Mary is happy then Jones is happy."))
     .equalsTo(S("If",
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
                           N(N("book"), 
                             PP(PREP("about"), NP(PN("Brazil"))))
                           )))));
  });

  it("Jones likes a book from Brazil", function() {
    assertThat(parse("Jones likes a book from Brazil."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("book"), 
                             PP(PREP("from"), NP(PN("Brazil"))))
                           )))));
  });

  it("Jones likes a girl with a telescope.", function() {
    assertThat(parse("Jones likes a girl with a telescope."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("like"), "s"),
                        NP(DET("a"), 
                           N(N("girl"), 
                             PP(PREP("with"), NP(DET("a"), N("telescope"))))
                           )))));
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
                                         PP(PREP("from"), NP(PN("Brazil"))))))
                                ))
                           )))
                 ));
  });

  it("Jones's sister is Mary", function() {
    assertThat(parse("Jones's sister is Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), RN("sister")),
                 VP_(VP(BE("is"), NP(PN("Mary"))))));
  });

  it("Jones's sister is not Mary", function() {
    assertThat(parse("Jones's sister is not Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), RN("sister")),
                 VP_(VP(BE("is"), "not", NP(PN("Mary"))))));
  });

  it("Jones walks.", function() {
    assertThat(parse("Jones walks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("walk"), "s")))));
  });

  it("They walk.", function() {
    assertThat(parse("They walk."))
     .equalsTo(S(NP(PRO("They")),
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

  it("They were happy.", function() {
   assertThat(parse("They were happy."))
    .equalsTo(S(NP(PRO("They")),
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

  it("They kissed Mary.", function() {
    assertThat(parse("They kissed Mary."))
     .equalsTo(S(NP(PRO("They")),
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

  it("They have walked.", function() {
    assertThat(parse("They have walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("They had walked.", function() {
    assertThat(parse("They had walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("Jones has not walked.", function() {
    assertThat(parse("Jones has not walked."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(HAVE("has"), "not", VP(V(VERB("walk"), "ed"))))));
  });

  it("They have not walked.", function() {
    assertThat(parse("They have not walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), "not", VP(V(VERB("walk"), "ed"))))));
  });

  it("They left Brazil.", function() {
    assertThat(parse("They left Brazil."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("left")),
                        NP(PN("Brazil"))))));
  });

  it("They have left Brazil.", function() {
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

  it("He likes Jones and Mary.", function() {
    assertThat(parse("He likes Jones and Mary."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(NP(PN("Jones")), "and", NP(PN("Mary")))
                        ))));
   });

  it("He likes Jones's brother.", function() {
    assertThat(parse("He likes Jones's brother."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(DET(NP(PN("Jones")), "'s"), RN("brother"))
                        ))));
   });

  it("Jones's wife or Smith's brother loves Mary.", function() {
    assertThat(parse("Jones's wife or Smith's brother loves Mary."))
     .equalsTo(S(NP(NP(DET(NP(PN("Jones")), "'s"), RN("wife")), 
                    "or", 
                    NP(DET(NP(PN("Smith")), "'s"), RN("brother"))),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Mary"))))
                 ));
   });

});

describe("Questions", function() {
  it("Who walks?", function() {
    assertThat(parse("Who walks?", "Question", false, false))
     .equalsTo(Question("Who", VP_(VP(V(VERB("walk"), "s"))), "?"));
  });

  it("Who likes Mary?", function() {
    assertThat(parse("Who likes Mary?", "Question", false, false))
     .equalsTo(Question("Who", VP_(VP(V(VERB("like"), "s"),
                                      NP(PN("Mary")))), "?"));
  });

  it("Who does not love Mary?", function() {
    assertThat(parse("Who does not love Mary?", "Question", false, false))
     .equalsTo(Question("Who", VP_(AUX("does"), 
                                   "not", 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });

  it("Who will walk?", function() {
    assertThat(parse("Who will walk?", "Question", false, false))
     .equalsTo(Question("Who", VP_(AUX("will"), 
                                   VP(V(VERB("walk")))), "?"));
  });

  it("Who will love Mary?", function() {
    assertThat(parse("Who will love Mary?", "Question", false, false))
     .equalsTo(Question("Who", VP_(AUX("will"), 
                                   VP(V(VERB("love")),
                                      NP(PN("Mary")))), "?"));
  });

  it("Who liked Mary?", function() {
    assertThat(parse("Who liked Mary?", "Question", false, false))
     .equalsTo(Question("Who", VP_(VP(V(VERB("like"), "d"),
                                      NP(PN("Mary")))), "?"));
  });
});

describe("DRT Verbs", function() {
  it("Verbs", function() {
    // https://parentingpatch.com/third-person-singular-simple-present-verbs/
    // https://www.lawlessenglish.com/learn-english/grammar/simple-past-regular-verbs/

    // Third person plural for regular verbs
    assertThat(parse("walk", "V", false, false)).equalsTo(V(VERB("walk")));

    // Third person for regular verbs
    assertThat(parse("listens", "V", false, false)).equalsTo(V(VERB("listen"), "s"));
    assertThat(parse("walks", "V", false, false)).equalsTo(V(VERB("walk"), "s"));

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
  it("He likes it.", function() {
    assertThat(parse("He likes it."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("it"))))));
  });


  it("Jones loves.", function() {
    assertThat(parse("Jones loves."))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s")))));
  });

  it("He likes her.", function() {
    assertThat(parse("He likes her."))
     .equalsTo(S(NP(PRO("He")), 
                 VP_(VP(V(VERB("like"), "s"), 
                        NP(PRO("her"))))));
  });

  it("Jones stinks.", function() {
    assertThat(parse("Jones stinks."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("A man loves.", function() {
    assertThat(parse("A man loves."))
     .equalsTo(S(NP(DET("A"), N("man")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("Every donkey stinks.", function() {
    assertThat(parse("Every book stinks."))
     .equalsTo(S(NP(DET("Every"), N("book")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("The woman loves.", function() {
    assertThat(parse("The woman loves."))
     .equalsTo(S(NP(DET("The"), N("woman")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("He loves.", function() {
    assertThat(parse("He loves."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("She loves", function() {
    assertThat(parse("She loves."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("love"), "s")))));
  });

  it("It stinks.", function() {
    assertThat(parse("It stinks."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(VP(V(VERB("stink"), "s")))));
  });

  it("It does not stink.", function() {
    assertThat(parse("It does not stink."))
     .equalsTo(S(NP(PRO("It")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("The book does not stink.", function() {
    assertThat(parse("The book does not stink."))
     .equalsTo(S(NP(DET("The"), N("book")),
                 VP_(AUX("does"), "not", VP(V(VERB("stink"))))));
  });

  it("He loves her.", function() {
    assertThat(parse("He loves her."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("She loves the book.", function() {
    assertThat(parse("She loves the book."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(V(VERB("love"), "s"), NP(DET("the"), N("book"))))));
  });

  it("Every man loves her.", function() {
    assertThat(parse("Every man loves her."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PRO("her"))))));
  });

  it("Every man loves Jones.", function() {
    assertThat(parse("Every man loves Jones."))
     .equalsTo(S(NP(DET("Every"), N("man")),
                 VP_(VP(V(VERB("love"), "s"), NP(PN("Jones"))))));
  });

  it("She does not love.", function() {
    assertThat(parse("She does not love."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(AUX("does"), "not", VP(V(VERB("love"))))));
  });

  it("She does not love him.", function() {
    assertThat(parse("She does not love him."))
     .equalsTo(S(NP(PRO("She")),
                  VP_(AUX("does"), "not", 
                      VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("Jones does not like the book.", function() {
    assertThat(parse("Jones does not like the book."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(AUX("does"), "not", 
                     VP(V(VERB("like")), NP(DET("the"), N("book"))))));
  });

  it("They love him.", function() {
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(parse("They love him."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("love")), NP(PRO("him"))))));
  });

  it("They do not love him.", function() {
    assertThat(parse("They do not love him."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), "not", VP(V(VERB("love")), NP(PRO("him"))))
                 ));
  });

  it("They do not love the book", function() {
    assertThat(parse("They do not love the book."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(AUX("do"), "not", 
                     VP(V(VERB("love")), NP(DET("the"), N("book"))))
                 ));
  });

  it("He and she love her.", function() {
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(parse("He and she love her."))
     .equalsTo(S(NP(NP(PRO("He")), "and", NP(PRO("she"))),
                 VP_(VP(V(VERB("love")), NP(PRO("her"))))));
  });

  it("They love him and her.", function() {
    assertThat(parse("They love him and her."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("love")), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
  });

  it("Every man loves a book and a woman.", function() {
    assertThat(parse("Every man loves a book and a woman."))
     .equalsTo(S(NP(DET("Every"), N("man")),
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
    assertThat(parse("Every man loves Mary and Brazil."))
     .equalsTo(S(NP(DET("Every"), N("man")),
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

  it("Every book which she loves surprises him.", function() {
    assertThat(parse("Every book which she loves surprises him."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V(VERB("love"), "s"), NP(GAP()))))
                                    ))),
                 VP_(VP(V(VERB("surprise"), "s"), NP(PRO("him")))
                     )));

  });

  it("Every man who knows her loves her.", function() {
    assertThat(parse("Every man who loves her likes him."))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V(VERB("love"), "s"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("like"), "s"), NP(PRO("him"))))
                 ));
   });

  it("A man who does not love her watches him.", function() {
    assertThat(parse("A man who does not love her watches him."))
     .equalsTo(S(NP(DET("A"),
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(AUX("does"), "not", VP(V(VERB("love")), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V(VERB("watch"), "es"), NP(PRO("him"))))
                 ));

  });

  it("He is happy.", function() {
    assertThat(parse("He is happy."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

  it("He is not happy.", function() {
    assertThat(parse("He is not happy."))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), "not", ADJ("happy")))));
   });

  it("A book does not stink.", function() {
    assertThat(parse("A man does not stink."))
     .equalsTo(S(NP(DET("A"), N("man")),
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

  it("If Jones owns a book then he likes it.", function() {
    assertThat(parse("If Jones loves a book then he likes it."))
     .equalsTo(S("If", 
                 S(NP(PN("Jones")), VP_(VP(V(VERB("love"), "s"), NP(DET("a"), N("book"))))), 
                 "then", 
                 S(NP(PRO("he")), VP_(VP(V(VERB("like"), "s"), NP(PRO("it")))))));
  });

  it("Every man who loves a book likes it.", function() {
    assertThat(parse("Every man who loves a book likes it."))
     .equalsTo(S(NP(DET("Every"), 
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
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), RN("wife")),
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
                        NP(DET("a"), N(N("woman"), 
                                       PP(PREP("with"), NP(DET("a"), N("donkey"))
                                          )))))));
  });

  it("Jones is a man.", function() {
    assertThat(parse("Jones is a man."))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N("man"))))));
  });

  it("Who likes Mary?", function() {
    assertThat(parse("Who likes Mary?", "Question", false, false))
     .equalsTo(Question("Who", 
                        VP_(VP(V(VERB("like"), "s"), NP(PN("Mary")))), 
                        "?"));
  });

  it("Who is happy?", function() {
    assertThat(parse("Who is happy?", "Question", false, false))
     .equalsTo(Question("Who", 
                        VP_(VP(BE("is"), ADJ("happy"))), 
                        "?"));
  });

  it("Who does Mary like?", function() {
    assertThat(parse("Who does Mary like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("does"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who will Mary like?", function() {
    assertThat(parse("Who will Mary like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("will"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who would Mary like?", function() {
    assertThat(parse("Who would Mary like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("would"),
                        NP(PN("Mary")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who would they like?", function() {
    assertThat(parse("Who do they like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("do"),
                        NP(PRO("they")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who did they like?", function() {
    assertThat(parse("Who did they like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("did"),
                        NP(PRO("they")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who does the man like?", function() {
    assertThat(parse("Who does the man like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("does"),
                        NP(DET("the"), N("man")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Who does Smith's brother like?", function() {
    assertThat(parse("Who does Smith's brother like?", "Question", false, false))
     .equalsTo(Question("Who", 
                        AUX("does"),
                        NP(DET(NP(PN("Smith")), "'s"), RN("brother")), 
                        V(VERB("like")), 
                        "?"));
  });

  it("Is Mary happy?", function() {
    assertThat(parse("Is Mary happy?", "Question", false, false))
     .equalsTo(Question(BE("Is"), 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("Was Mary happy?", function() {
    assertThat(parse("Was Mary happy?", "Question", false, false))
     .equalsTo(Question(BE("Was"), 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("Are they happy?", function() {
    assertThat(parse("Are they happy?", "Question", false, false))
     .equalsTo(Question(BE("Are"), 
                        NP(PRO("they")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("Were they happy?", function() {
    assertThat(parse("Were they happy?", "Question", false, false))
     .equalsTo(Question(BE("Were"), 
                        NP(PRO("they")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("Jones's wife is Mary.", function() {
    assertThat(parse("Jones's wife is Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), RN("wife")),
                 VP_(VP(BE("is"), NP(PN("Mary"))))));
  });

  it("Jones's wife was Mary.", function() {
    assertThat(parse("Jones's wife was Mary."))
     .equalsTo(S(NP(DET(NP(PN("Jones")), "'s"), RN("wife")),
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

  it("Every brazilian is from Brazil", function() {
    assertThat(parse("Every brazilian is from Brazil."))
     .equalsTo(S(NP(DET("Every"), N("brazilian")),
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

  it("He loves it.", function() {
    assertThat(parse("He loves it."))
     .equalsTo(S(NP(PRO("He")),
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

  it("They were happy.", function() {
    assertThat(parse("They were happy."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(BE("were"), ADJ("happy")))));
  });

  it("She has walked.", function() {
    assertThat(parse("She has walked."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("has"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She has kissed him.", function() {
    assertThat(parse("She has kissed him."))
     .equalsTo(S(NP(PRO("She")), 
                 VP_(VP(HAVE("has"), VP(V(VERB("kiss"), "ed"), 
                                        NP(PRO("him")))))));
  });

  it("They have walked.", function() {
    assertThat(parse("They have walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("have"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She had walked.", function() {
    assertThat(parse("She had walked."))
     .equalsTo(S(NP(PRO("She")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("They had walked.", function() {
    assertThat(parse("They had walked."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(HAVE("had"), VP(V(VERB("walk"), "ed"))))));
  });

  it("She had kissed him.", function() {
    assertThat(parse("She had kissed him."))
     .equalsTo(S(NP(PRO("She")),
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

  it("They ski.", function() {
    // third person plural present conjugation of verbs ending in "a, i, o, u".
    // https://conjugator.reverso.net/conjugation-english-verb-ski.html
    assertThat(parse("They ski."))
     .equalsTo(S(NP(PRO("They")),
                 VP_(VP(V(VERB("ski"))))));
  });

  it("She played.", function() {
    assertThat(parse("She played."))
     .equalsTo(S(NP(PRO("She")),
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

});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
