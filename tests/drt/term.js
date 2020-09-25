const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe.only("Term Logic", function() {

  // https://cis.temple.edu/~pwang/Writing/NAL-Specification.pdf
  const grammar = `
      @builtin "whitespace.ne"
      @builtin "number.ne"

      main -> _ (sentence _):+ {%
                ([ws1, sentences, ws2]) => {
                   return sentences.flat().filter(x => x != null);
                } 
      %}
  
      sentence -> judgment _ "." {% id %}
      sentence -> question _ "?" {% id %}
    
      question -> statement {%
        ([[s, copula, p]]) => {
          return {
            "@type": "Question",  
            "s": s, 
            "op": copula, 
            "p": p, 
          }
        }
      %}

      question -> "?" __ copula __ term {%
        ([arg, ws1, copula, ws2, term]) => {
          return {
            "@type": "Question",  
            "s": "?", 
            "op": copula, 
            "p": term, 
          }
        }
      %}

      question -> term __ copula __ "?" {%
        ([term, ws1, copula, ws2, arg]) => {
          return {
            "@type": "Question",  
            "s": term, 
            "op": copula, 
            "p": "?", 
          }
        }
      %}

      judgment -> statement _ truthvalue:? {%
        ([[s, copula, p], ws, truthvalue]) => {
          let [f, c] = truthvalue || [0, 0];
          return {
            "@type": "Statement",  
            "s": s, 
            "op": copula, 
            "p": p, 
            "f": f,
            "c": c
          };
        }
      %}

      statement -> term __ copula __ term {% 
        ([a, ws1, copula, ws2, b]) => {
            return [a, copula, b];
        } 
      %}

      truthvalue -> "<" _ unsigned_decimal _ "," _ unsigned_decimal _ ">"  {% 
                     ([lt, ws1, f, ws2, sep, ws3, c, ws4, gt]) => [f, c]
      %}

      copula -> "->" {% id %}

      term -> word {% id %}

      word -> [a-z]:+ {% ([args]) => args.join("") %}
    `;

  it("Basic", function() {
     let parser = Nearley.from(grammar);
      assertThat(parser.feed("foo -> bar.")).equalsTo([[a("foo").typeOf("bar")]]);
  });

  it("Two", function() {
     let parser = Nearley.from(grammar);
     assertThat(parser.feed("foo -> bar. hello -> world."))
          .equalsTo([[
              a("foo").typeOf("bar"),
              a("hello").typeOf("world"),
          ]]);
  });

  function a(s) {
    return {
      typeOf(p, f = 0, c = 0) {
        return {
            "@type": "Statement",
            "s": s,
            "op": "->",
            "p": p,
            "f": f,
            "c": c
        };
      }
    }
  }

  function is(s) {
    return {
      a(p, f = 0, c = 0) {
        return {
            "@type": "Question",
            "s": s,
            "op": "->",
            "p": p
        };
      }
    }
  }

  it("Many", function() {
     let parser = Nearley.from(grammar);
     assertThat(parser.feed(`
         mammal -> animal. 
         dolphin -> mammal.
         human -> mammal.
     `)).equalsTo([[
         a("mammal").typeOf("animal"),
         a("dolphin").typeOf("mammal"),
         a("human").typeOf("mammal"),
     ]]);
  });

  it("Truth Values", function() {
     let parser = Nearley.from(grammar);
      assertThat(parser.feed("foo -> bar <0.1, 2>."))
          .equalsTo([[a("foo").typeOf("bar", 0.1, 2)]]);
  });

  it("Is Foo a Bar?", function() {
     let parser = Nearley.from(grammar);
      assertThat(parser.feed("foo -> bar?"))
          .equalsTo([[is("foo").a("bar")]]);
  });

  it("Which ? is a Bar?", function() {
     let parser = Nearley.from(grammar);
      assertThat(parser.feed("? -> bar?"))
          .equalsTo([[is("?").a("bar")]]);
  });

  it("Is Foo a ??", function() {
     let parser = Nearley.from(grammar);
      assertThat(parser.feed("foo -> ??"))
          .equalsTo([[is("foo").a("?")]]);
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      }
    }
  }
});

