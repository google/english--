const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Natural Logic", function() {
  const grammar = `
      @builtin "whitespace.ne"
      @builtin "number.ne"

      main -> _ statements _ {%
        ([ws0, statements, ws1]) => statements 
      %}

      # main -> _ "main" _ head _ block _ {%
      #   ([ws0, drs, ws1, head, ws2, block]) => [head, block] 
      # %}

      head -> "(" _ ")" {% () => [] %}
      head -> "(" _ expression _ ")" {% ([p1, ws1, expression]) => expression %}
      head -> "(" _ declaration _ ")" {% ([p1, ws1, declaration]) => declaration %}

      #block -> expression _ "." {% 
      #  ([statement]) => {
      #    return [statement];
      #  } 
      #%}

      statements -> statement (_ statement):* {% 
        ([statement, statements = []]) => {
          let others = statements.map(([ws, statement]) => statement);
          // console.log(others);
          return [statement].concat(others);
        } 
      %}

      statement -> "{" _ (statement _):* "}" {% 
        ([p1, ws, statements]) => {
          return statements.map(([statement]) => statement);
        } 
      %}
  
      statement -> expression _ "." {% id %}
      statement -> declaration _ "." {% id %}

      expression -> predicate {% id %}

      expression -> expression (_ "," _ expression):* _ "and" _ expression {%
        ([exp1, exp2, ws3, and, ws4, expr3]) => {
          let result = ["and", exp1, expr3];
          result.splice(2, 0, ...exp2.map(([ws1, and, ws2, expr]) => expr));
          return result;
        }
      %}

      expression -> expression _ "or" _ expression {%
        ([exp1, ws1, or, ws2, expr2]) => {
          return ["or", exp1, expr2];
        }
      %}

      #expression -> "not" _ expression {%
      #  ([not, ws1, expr]) => {
      #    return ["not", expr];
      #  }
      #%}

      predicate -> word _ args {% ([pred, ws, args]) => [pred, args] %}
      args -> "(" _ ")" {% () => [] %}
      args -> "(" _ word _ ("," _ word _):* ")" {% 
        ([p1, ws1, ref, ws2, list, p2]) => {
          return [ref].concat(list.map(([comma, ws, ref]) => ref));
        } 
      %}

      declaration -> "let" _ word (_ "," _ word):* (_ ":" _ expression):? {% 
        ([letty, ws1, ref, refs, expr]) => {
          let [ws4, col, ws5, block] = expr || [];
          let vars = [ref].concat(refs.map(([ws2, comma, ws3, ref]) => ref));
          return ["let", vars, block];
        } 
      %}

      statement -> copula _ head _ statement {%
        ([copula, ws1, head, ws2, statement]) => [copula, head, statement] 
      %}

      statement -> "not" _ statement {%
        ([not, ws1, statement]) => ["not", statement] 
      %}

      statement -> statement _ copula _ statement {%
        ([block1, ws1, copula, ws2, block2]) => [copula, block1, block2] 
      %}

      statement -> "if" _ head _ "then" _ statement {%
        ([iffy, ws1, head, ws2, then, ws3, block]) => ["if", head, block] 
      %}

      statement -> "if" _ expression _ "then" _ statement {%
        ([iffy, ws1, expression, ws2, then, ws3, block]) => ["if", expression, block] 
      %}

      copula -> "every" {% id %}
             |  "some" {% id %}
             |  "or" {% id %}
     
      word -> [a-zA-Z]:+ {% ([args]) => args.join("") %}
    `;

  let drs = (head = [], block = []) => [[head, block]];
  let arg = (name, expr = []) => [name, expr]; 
  let pred = (name, args = []) => [name, args]; 
  let quant = (name, args = [], block = []) => [name, args, block]; 
  let every = (args = [], block = []) => quant("every", args, block); 
  let some = (args = [], block = []) => quant("some", args, block); 
  let and = (...args) => ["and", ...args]; 
  let iffy = (head, block) => ["if", head, block]; 
  let not = (block) => ["not", block]; 
  let or = (head, block) => ["or", head, block]; 
  let letty = (a, b) => ["let", a, b]; 

  let parse = (code) => Nearley.from(grammar).feed(code);

  it("P().", function() {
    assertThat(parse("P()."))
      .equalsTo([[pred("P")]]);
  });

  it("P(a).", function() {
    assertThat(parse("P(a)."))
      .equalsTo([[pred("P", ["a"])]]);
  });

  it("P(a, b).", function() {
    assertThat(parse("P(a, b)."))
      .equalsTo([[pred("P", ["a", "b"])]]);
  });

  it("let a: P(a).", function() {
    assertThat(parse("let a: P(a)."))
      .equalsTo([[letty(["a"], pred("P", ["a"]))]]);
  });

  it("P(a). Q(b).", function() {
    assertThat(parse("P(a). Q(b)."))
      .equalsTo([[pred("P", ["a"]), pred("Q", ["b"])]]);
  });

  it("P(a) and Q(b).", function() {
    assertThat(parse("P(a) and Q(b)."))
      .equalsTo([[and(pred("P", ["a"]), pred("Q", ["b"]))]]);
  });

  it.skip("P(a) or Q(b).", function() {
    assertThat(parse("P(a) or Q(b)."))
      .equalsTo([[or(pred("P", ["a"]), pred("Q", ["b"]))]]);
  });

  it("let a.", function() {
    assertThat(parse("let a."))
      .equalsTo([[letty(["a"])]]);
  });

  it("let a: P(a) and Q(a).", function() {
    assertThat(parse("let a: P(a) and Q(a)."))
      .equalsTo([[letty(["a"], and(pred("P", ["a"]), pred("Q", ["a"])))]]);
  });

  it("let a, b: P(a, b).", function() {
    assertThat(parse("let a, b: P(a, b)."))
      .equalsTo([[letty(["a", "b"], pred("P", ["a", "b"]))]]);
  });

  it("{ P(a). }", function() {
    assertThat(parse("{ P(a). }"))
      .equalsTo([[[pred("P", ["a"])]]]);
  });

  it("P(a). { Q(a). } R(a).", function() {
    assertThat(parse("P(a). { Q(b). } R(c)."))
      .equalsTo([[
        pred("P", ["a"]),
        [pred("Q", ["b"])],
        pred("R", ["c"]),
      ]]);
  });
  
  it("every() {}", function() {
    assertThat(parse("every() {}"))
      .equalsTo([[every()]]);
  });

  it("every (let x) P(x).", function() {
    assertThat(parse("every (let x) P(x)."))
      .equalsTo([[every(letty(["x"]), pred("P", ["x"]))]]);
  });

  it("every (let x) { P(x). Q(x). }", function() {
    assertThat(parse("every (let x) {P(x). Q(x).}"))
      .equalsTo([[every(letty(["x"]), [pred("P", ["x"]), pred("Q", ["x"])])]]);
  });

  it("some (let x) P(x).", function() {
    assertThat(parse("some (let x) P(x)."))
      .equalsTo([[some(letty(["x"]), pred("P", ["x"]))]]);
  });

  it("every (let x: A(x)) B(x).", function() {
    assertThat(parse("every (let x: A(x)) B(x)."))
      .equalsTo([[every(letty(["x"], pred("A", ["x"])), pred("B", ["x"]))]]);
  });

  it("every (let x: A(x) and B(x)) C(x).", function() {
    assertThat(parse("every (let x: A(x) and B(x)) C(x)."))
      .equalsTo([[every(letty(["x"], and(pred("A", ["x"]),
                                         pred("B", ["x"]))),
                        pred("C", ["x"]))]]);
  });

  it("if P(a) then Q(a).", function() {
    assertThat(parse("if P(a) then Q(a)."))
      .equalsTo([[iffy(pred("P", ["a"]), pred("Q", ["a"]))]]);
  });

  it("if P(a) and Q(a) then R(a).", function() {
    assertThat(parse("if P(a) and Q(a) then R(a)."))
      .equalsTo([[iffy(and(pred("P", ["a"]),
                           pred("Q", ["a"])),
                       pred("R", ["a"]))]]);
  });

  it("if (P(a), Q(a) and R(a)) then S(a).", function() {
    assertThat(parse("if (P(a), Q(a) and R(a)) then S(a)."))
      .equalsTo([[iffy(and(pred("P", ["a"]),
                           pred("Q", ["a"]),
                           pred("R", ["a"])),
                       pred("S", ["a"]))]]);
  });

  it("if (let x: P(x)) then Q(x).", function() {
    assertThat(parse("if (let x: P(x)) then Q(x)."))
      .equalsTo([[iffy(letty(["x"], pred("P", ["x"])),
                       pred("Q", ["x"]))]]);
  });

  it("if (let x: P(x)) then { Q(x). }", function() {
    assertThat(parse("if (let x: P(x)) then { Q(x). }"))
      .equalsTo([[iffy(letty(["x"], pred("P", ["x"])),
                       [pred("Q", ["x"])])]]);
  });

  it("if (let x: P(x) and R(x)) then { Q(x). }", function() {
    assertThat(parse("if (let x: P(x) and R(x)) then { Q(x). }"))
      .equalsTo([[iffy(letty(["x"], and(pred("P", ["x"]),
                                               pred("R", ["x"]))),
                       [pred("Q", ["x"])])]]);
  });

  it("not { P(a). }", function() {
    assertThat(parse("not { P(a). }"))
      .equalsTo([[not([pred("P", ["a"])])]]);
  });

  it("not P(a).", function() {
    assertThat(parse("not P(a)."))
      .equalsTo([[not(pred("P", ["a"]))]]);
  });

  it("not P(a) and Q(a).", function() {
    assertThat(parse("not P(a) and Q(a)."))
      .equalsTo([[not(and(pred("P", ["a"]),
                          pred("Q", ["a"])
                         ))]]);
  });

  it("{ P(a). } or { Q(a). }", function() {
    assertThat(parse("{ P(a). } or { Q(a). }"))
      .equalsTo([[or([pred("P", ["a"])], [pred("Q", ["a"])])]]);
  });

  it("P(a) or Q(a).", function() {
    assertThat(parse("P(a) or Q(a)."))
      .equalsTo([[or(pred("P", ["a"]), pred("Q", ["a"]))]]);
  });

  it("P(a) and Q(a).", function() {
    assertThat(parse("P(a) and Q(a)."))
      .equalsTo([[and(pred("P", ["a"]), pred("Q", ["a"]))]]);
  });

  it("P(a), Q(a) and R(a).", function() {
    assertThat(parse("P(a), Q(a) and R(a)."))
      .equalsTo([[and(pred("P", ["a"]),
                             pred("Q", ["a"]),
                             pred("R", ["a"]),
                     )]]);
  });

  it("let x: A(x). let y: B(y).", function() {
    assertThat(parse(`
      let x: A(x).
      let y: B(y).
    `)).equalsTo([[
      letty(["x"], pred("A", ["x"])),
      letty(["y"], pred("B", ["y"])),
    ]]);
  });
  
  it("Jones likes Mary.", function() {
    assertThat(parse(`
      let u: Jones(u).
      let v: Mary(v).
      likes(u, v).
    `)).equalsTo([[
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Mary", ["v"])),
      pred("likes", ["u", "v"]),
    ]]);
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat(parse(`
      let u: Jones(u).
      let v: Ulysses(v).
      owns(u, v).
      fascinates(v, u).
    `)).equalsTo([[
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Ulysses", ["v"])),
      pred("owns", ["u", "v"]),
      pred("fascinates", ["v", "u"]),
    ]]);
  });

  it("Jones does not like Mary.", function() {
    assertThat(parse(`
      let u: Jones(u).
      let v: Mary(v).
      not { 
        like(u, v). 
      }
    `)).equalsTo([[
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Mary", ["v"])),
      not([pred("like", ["u", "v"])]),
    ]]);
  });

  it("Every man owns a book about Brazil.", function() {
    assertThat(parse(`
      let a: Brazil(a).
      every (let x: man(x)) {
        let c: book(c).
        owns(x, c).
        about(c, a).
      }
    `)).equalsTo([[
      letty(["a"], pred("Brazil", ["a"])),
      every(letty(["x"], pred("man", ["x"])), [
        letty(["c"], pred("book", ["c"])),
        pred("owns", ["x", "c"]),
        pred("about", ["c", "a"]),
      ]),
    ]]);
  });

  it("Every man who likes Smith loves Mary.", function() {
    assertThat(parse(`
      let a: Smith(a).
      let b: Mary(b).
      every (let x: man(x) and likes(x, a)) {
        loves(x, b).
      }
    `)).equalsTo([[
      letty(["a"], pred("Smith", ["a"])),
      letty(["b"], pred("Mary", ["b"])),
      every(letty(["x"], and(pred("man", ["x"]), pred("likes", ["x", "a"]))), [
        pred("loves", ["x", "b"]),
      ]),
    ]]);
  });
  
  it("Every man loves every woman from Brazil.", function() {
    assertThat(parse(`
      let a: Brazil(a).
      every (let x: man(x)) {
        every (let y: woman(y) and from(y, a)) {
          loves(x, y).
        }
      }
    `)).equalsTo([[
      letty(["a"], pred("Brazil", ["a"])),
      every(letty(["x"], pred("man", ["x"])), [
        every(letty(["y"], and(pred("woman", ["y"]), pred("from", ["y", "a"]))), [
          pred("loves", ["x", "y"]),
        ]),
      ]),
    ]]);
  });

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat(parse(`
      every (let x: man(x)) {
        mortal(x).
      }
      let u: Socrates(u).
      man(u).
    `)).equalsTo([[
      every(letty(["x"], pred("man", ["x"])), [pred("mortal", ["x"])]),
      letty(["u"], pred("Socrates", ["u"])),
      pred("man", ["u"]),
    ]]);
  });

  it("If Mary likes John then John likes Mary.", function() {
    assertThat(parse(`
      if (let x, y: Mary(x), John(y) and likes(x, y)) then { 
        likes(y, x).
      }
    `)).equalsTo([[
      iffy(letty(["x", "y"], and(pred("Mary", ["x"]),
                                 pred("John", ["y"]),
                                 pred("likes", ["x", "y"]))),
           [pred("likes", ["y", "x"])]),
    ]]);
  });

  it("Jones likes Mary or loves Smith.", function() {
    assertThat(parse(`
      let p: Jones(p).
      let q: Mary(q).
      let r: Smith(r).
      {
        likes(p, q). 
      } or {
        loves(p, r).
      }
    `)).equalsTo([[
      letty(["p"], pred("Jones", ["p"])),
      letty(["q"], pred("Mary", ["q"])),
      letty(["r"], pred("Smith", ["r"])),
      or([pred("likes", ["p", "q"])], [
        pred("loves", ["p", "r"])
      ]),
    ]]);
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      },
    }
  }
});

