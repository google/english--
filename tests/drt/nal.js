const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Non Axiomatic Logic", function() {

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
          let [f, c] = truthvalue || [1, 1];
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

      word -> [a-zA-Z]:+ {% ([args]) => args.join("") %}
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
      typeOf(p, f = 1, c = 1) {
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
      a(p, f = 1, c = 1) {
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

  function parse(program) {
    return Nearley.from(grammar).feed(program);      
  }

  function unify(a, b) {
    if (a == "?" && b != "?") {
      return b;
    } else if (a != "?" && b =="?") {
      return a;
    }
    return false;
  }
    
  function given(program) {
      return {
          is(q, path = []) {
              if (path.find(({s, p}) => s == q.s && p == q.p)) {
                  // cycle
                  return false;
              }
              let next = path.concat([q]);
              for (let {s, op, p, f, c} of program) {
                  if (s == q.s && unify(p, q.p)) {
                      // unify on superclass.
                      return unify(p, q.p);
                  } else if (p == q.p && unify(s, q.s)) {
                      // unify on subclass.
                      return unify(s, q.s);
                  } else if (s == q.s && p == q.p) {
                      // statement matches.
                      return {f: f, c: c};
                  } else if (p == q.p) {
                      let ded = this.is({s: q.s, p: s}, next);
                      if (ded) {
                          // deduction.
                          return deduction({f: f, c: c}, ded);
                      }
                      let ind = this.is({s: s, p: q.s}, next);
                      if (ind) {
                          // induction.
                          return induction({f: f, c: c}, ind);
                      }
                  } else if (s == q.p) {
                      let abd = this.is({s: q.s, p: p}, next);
                      if (abd) {
                          // console.log("hi");
                          // abduction.
                          return abduction({f: f, c: c}, abd);
                      }
                  }
              }
              return false;
          }
      }
  }
     
  function not(x) {
      return 1 - x;      
  }
    
  function and(...x) {
      let result = 1;
      for (let arg of x) {
          result *= arg;
      }
      return result;      
  }

  function or(...x) {
      let result = 1;
      for (let arg of x) {
          result *= (1 - arg);
      }
      return 1 - result; 
  }

  function deduction(t1, t2) {
      let f1 = t1.f;
      let f2 = t2.f;
      let c1 = t1.c;
      let c2 = t2.c;
      
      return {f: f1 * f2, c: f1 * c1 * f2 * c2};
  }

  const k = 1;
    
  function abduction(t1, t2) {
      let f1 = t1.f;
      let f2 = t2.f;
      let c1 = t1.c;
      let c2 = t2.c;
      
      return {f: f2, c: (f1 * c1 * c2)/(f1 * c1 * c2 + k)};
  }

  function induction(t1, t2) {
      let f1 = t1.f;
      let f2 = t2.f;
      let c1 = t1.c;
      let c2 = t2.c;
      
      return {f: f1, c: (c1 * f2 * c2)/(c1 * f2 * c2 + k)};
  }

  function exemplification(t1, t2) {
      let f1 = t1.f;
      let f2 = t2.f;
      let c1 = t1.c;
      let c2 = t2.c;
      
      return {f: 1, c: (f1 * c1 * f2 * c2)/(f1 * c1 * f2 * c2 + k)};
  }

  it("S -> M. S -> M?", function() {
     let [program] = parse(`
       S -> M.
     `);
     let [[q]] = parse("S -> M?");
     assertThat(given(program).is(q)).isTrue();
  });

  it("S -> M. M -> P. S -> P?", function() {
     let [program] = parse(`
       S -> M.
       M -> P.
     `);
     let [[q]] = parse("S -> P?");
     assertThat(given(program).is(q)).isTrue();
  });

  it("A -> B. B -> C. C -> D. A -> D?", function() {
     let [program] = parse(`
       A -> B.
       B -> C.
       C -> D.
     `);
     let [[q]] = parse("A -> D?");
     assertThat(given(program).is(q)).isTrue();
  });

  it("A -> B. B -> C. C -> A?", function() {
     let [program] = parse(`
       A -> B.
       B -> C.
     `);
     let [[q]] = parse("C -> A?");
     assertThat(given(program).is(q)).evalsTo({f: 1, c: 0.33});
  });

  it("A -> B. B -> C. X -> B?", function() {
     let [program] = parse(`
       A -> B.
       B -> C.
     `);
     let [[q]] = parse("X -> B?");
     assertThat(given(program).is(q)).equalsTo(false);
  });

  it("A -> B. A -> ??", function() {
     let [program] = parse(`
       A -> B.
     `);
     let [[q]] = parse("A -> ??");
     assertThat(given(program).is(q)).equalsTo("B");
  });

  it("A -> B. ? -> B?", function() {
     let [program] = parse(`
       A -> B.
     `);
     let [[q]] = parse("? -> B?");
     assertThat(given(program).is(q)).equalsTo("A");
  });
  
  it.skip("A -> B. B -> C. A -> ??", function() {
     let [program] = parse(`
       A -> B.
       B -> C.
     `);
     let [[q]] = parse("A -> ??");
     // Gives B instead, which makes sense, but maybe
     // isn't sufficient as A -> C is valid too?
     assertThat(given(program).is(q)).equalsTo("C");
  });

  it("S -> P <0.8, 0.9>. S -> P?", function() {
     let [program] = parse(`
       S -> P <0.8, 0.9>.
     `);
     let [[q]] = parse("S -> P?");
     assertThat(given(program).is(q)).evalsTo({f: 0.8, c: 0.9});
  });

  it("S -> M. M -> P. S -> P?", function() {
     let [program] = parse(`
       S -> M <0.8, 0.9>.
       M -> P <0.8, 0.9>.
     `);
     let [[q]] = parse("S -> P?");
     // deduction
     assertThat(given(program).is(q)).evalsTo({f: 0.64, c: 0.52});
  });

  it("S -> M. P -> M. S -> P?", function() {
     let [program] = parse(`
       S -> M <0.8, 0.9>.
       P -> M <0.8, 0.9>.
     `);
     let [[q]] = parse("S -> P?");
     // abduction
     assertThat(given(program).is(q)).evalsTo({f: 0.80, c: 0.39});
  });

  it("M -> P. M -> S. S -> P?", function() {
     let [program] = parse(`
       M -> P <0.8, 0.9>.
       M -> S <0.8, 0.9>.
     `);
     let [[q]] = parse("S -> P?");
     // induction
     assertThat(given(program).is(q)).evalsTo({f: 0.64, c: 0.13});
  });

  it.skip("P -> M. M -> S. S -> P?", function() {
     // TODO(goto): this returns an proof, but unclear to me
     // from what happen. we should save the path and verify
     // what it did. we will probably have multiple ways to
     // prove the same thing and will probably have to make a
     // determination of what's the right one to pick.
     let [program] = parse(`
       P -> M <0.8, 0.9>.
       M -> S <0.8, 0.9>.
     `);
     let [[q]] = parse("S -> P?");
     // exemplification
     assertThat(given(program).is(q)).evalsTo({f: 0.64, c: 0.13});
  });


  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      },
      isTrue() {
        this.evalsTo({f: 1, c: 1});
      },
      evalsTo(y) {
        Assert.deepEqual(x.f.toPrecision(2), y.f.toPrecision(2));
        Assert.deepEqual(x.c.toPrecision(2), y.c.toPrecision(2));
      }
    }
  }
});

