const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe.only("Natural Logic", function() {
  const grammar = `
      @builtin "whitespace.ne"
      @builtin "number.ne"

      main -> _ drs _ {% ([ws1, drs, ws2]) => drs %}

      drs -> "main" _ head _ block {%
        ([drs, ws1, head, ws2, block]) => [head, block] 
      %}

      head -> "(" _ ")" {% () => [] %}
      head -> "(" _ expression _ ")" {% ([p1, ws1, expression]) => expression %}
      head -> "(" _ declaration _ ")" {% ([p1, ws1, declaration]) => declaration %}
      referent -> word {% id %}

      block -> expression _ "." {% 
        ([statement]) => {
          return [statement];
        } 
      %}

      block -> "{" _ (statement _):* "}" {% 
        ([p1, ws, statements]) => {
          return statements.map(([statement]) => statement);
        } 
      %}
  
      statement -> expression _ "." {% id %}
      statement -> declaration _ "." {% id %}
      expression -> predicate {% id %}
      # expression -> "(" _ expression _ ")" {% ([p1, ws1, expression]) => expression %}
      expression -> block {% id %}
      # the expression below is ambiguous. we need to figure out
      # how to break out of this
      expression -> expression _ "and" _ expression {%
        ([exp1, ws1, and, ws2, exp2]) => ["and", exp1, exp2]
      %}
      predicate -> word _ args {% ([pred, ws, args]) => [pred, args] %}
      args -> "(" _ ")" {% () => [] %}
      args -> "(" _ referent _ ("," _ referent _):* ")" {% 
        ([p1, ws1, ref, ws2, list, p2]) => {
          return [ref].concat(list.map(([comma, ws, ref]) => ref));
        } 
      %}

      declaration -> "let" _ word (_ "," _ word):* (_ ":" _ expression):? {% 
        ([letty, ws1, ref, refs, expr]) => {
          let [ws4, col, ws5, block] = expr || [];
          // console.log(value);
          let vars = [ref].concat(refs.map(([ws2, comma, ws3, ref]) => ref));
          return ["let", vars, block];
        } 
      %}

      statement -> quantifier _ head _ block {%
        ([quantifier, ws1, head, ws2, block]) => [quantifier, head, block] 
      %}

      statement -> "if" _ head _ "then" _ block {%
        ([iffy, ws1, head, ws2, then, ws3, block]) => ["if", head, block] 
      %}

      statement -> "not" _ head _ block {%
        ([not, ws1, head, ws2, block]) => ["not", head, block] 
      %}

      statement -> "if" _ expression _ "then" _ block {%
        ([iffy, ws1, expression, ws2, then, ws3, block]) => ["if", expression, block] 
      %}

      quantifier -> "every" {% id %}
                 |  "some" {% id %}

      statement -> term __ copula __ term {% 
        ([a, ws1, copula, ws2, b]) => {
            return [a, copula, b];
        } 
      %}

      copula -> "->" {% id %}

      term -> word {% id %}

      word -> [a-zA-Z]:+ {% ([args]) => args.join("") %}
    `;

  let drs = (head = [], block = []) => [[head, block]];
  let arg = (name, expr = []) => [name, expr]; 
  let pred = (name, args = []) => [name, args]; 
  let quant = (name, args = [], block = []) => [name, args, block]; 
  let every = (args = [], block = []) => quant("every", args, block); 
  let some = (args = [], block = []) => quant("some", args, block); 
  let and = (a, b) => ["and", a, b]; 
  let iffy = (head, block) => ["if", head, block]; 
  let not = (head, block) => ["not", head, block]; 
  let letty = (a, b) => ["let", a, b]; 
  let parse = (code) => Nearley.from(grammar).feed(code);

  it("Basic", function() {
    assertThat(parse("main(){}")).equalsTo(drs());
    assertThat(parse(" main( ) { } ")).equalsTo(drs());
  });

  it("Let", function() {
    assertThat(parse("main() { let a: P(a). }"))
      .equalsTo(drs([], [letty(["a"], pred("P", ["a"]))]));
    assertThat(parse("main() { let a. }")).equalsTo(drs([], [letty(["a"])]));
    assertThat(parse("main() { let a: P(a) and Q(a). }"))
      .equalsTo(drs([], [letty(["a"], and(pred("P", ["a"]), pred("Q", ["a"])))]));
    assertThat(parse("main() { let a, b: P(a, b). }"))
      .equalsTo(drs([], [letty(["a", "b"], pred("P", ["a", "b"]))]));
    assertThat(parse("main() { let a, b: {P(a, b).}. }"))
      .equalsTo(drs([], [letty(["a", "b"], [pred("P", ["a", "b"])])]));
    assertThat(parse("main(let a: P(a)) { Q(a). }"))
      .equalsTo(drs(letty(["a"], pred("P", ["a"])), [pred("Q", ["a"])]));
  });

  it("Head", function() {
    assertThat(parse("main(let a) {}")).equalsTo(drs(letty(["a"])));
    assertThat(parse("main(let a, b) {}")).equalsTo(drs(letty(["a", "b"])));
    assertThat(parse("main(let a, b, c) {}")).equalsTo(drs(letty(["a", "b", "c"])));
    assertThat(parse("main( let a ,b ) {}")).equalsTo(drs(letty(["a", "b"])));
  });

  it("Predicates", function() {
    assertThat(parse("main() { P(a). }")).equalsTo(drs([], [pred("P", ["a"])]));
    assertThat(parse("main() { P(). }")).equalsTo(drs([], [pred("P")]));
    assertThat(parse("main() { P(a). Q(b). R(). }"))
      .equalsTo(drs([], [pred("P", ["a"]), pred("Q", ["b"]), pred("R")]));
    assertThat(parse("main() { P() and Q(). }"))
      .equalsTo(drs([], [and(pred("P"), pred("Q"))]));
  });

  it("Every", function() {
    assertThat(parse("main() { every () {} }"))
      .equalsTo(drs([], [every()]));
    assertThat(parse("main() { every (let x) P(x). }"))
      .equalsTo(drs([], [every(letty(["x"]), [pred("P", ["x"])])]));
    assertThat(parse("main() { every (let x) {P(x). Q(x).} }"))
      .equalsTo(drs([], [every(letty(["x"]), [pred("P", ["x"]), pred("Q", ["x"])])]));
    assertThat(parse("main() { some (let x) P(x). }"))
      .equalsTo(drs([], [some(letty(["x"]), [pred("P", ["x"])])]));
    assertThat(parse("main() { every (let x: A(x)) B(x). }"))
      .equalsTo(drs([], [every(letty(["x"], pred("A", ["x"])),
                               [pred("B", ["x"])])]));
    assertThat(parse("main() { every (let x: A(x) and B(x)) C(x). }"))
      .equalsTo(drs([], [every(letty(["x"], and(pred("A", ["x"]), pred("B", ["x"]))),
                               [pred("C", ["x"])])]));
    assertThat(parse("main() { every (let x: {A(x).}) B(x). }"))
      .equalsTo(drs([], [every(letty(["x"], [pred("A", ["x"])]),
                               [pred("B", ["x"])])]));
  });

  it("If", function() {
    assertThat(parse("main() { if P(a) then Q(a). }"))
      .equalsTo(drs([], [iffy(pred("P", ["a"]), [pred("Q", ["a"])])]));
    assertThat(parse("main() { if P(a) and Q(a) then R(a). }"))
      .equalsTo(drs([], [iffy(and(pred("P", ["a"]), pred("Q", ["a"])), [pred("R", ["a"])])]));
    assertThat(parse("main() { if ({P(a). Q(a).}) then R(a). }"))
      .equalsTo(drs([], [iffy([pred("P", ["a"]), pred("Q", ["a"])], [pred("R", ["a"])])]));
    assertThat(parse("main() { if (let x: P(x)) then Q(x). }"))
      .equalsTo(drs([], [iffy(letty(["x"], pred("P", ["x"])), [pred("Q", ["x"])])]));
    assertThat(parse("main() { if (let x: P(x)) then { Q(x). } }"))
      .equalsTo(drs([], [iffy(letty(["x"], pred("P", ["x"])), [pred("Q", ["x"])])]));
  });

  it("Not", function() {
    assertThat(parse("main() { not () { P(a). } }"))
      .equalsTo(drs([], [not([], [pred("P", ["a"])])]));
  });

  it("Jones likes Mary.", function() {
    assertThat(parse(`
      main() {
        let u: Jones(u).
        let v: Mary(v).
        likes(u, v).
      }
    `)).equalsTo(drs([], [
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Mary", ["v"])),
      pred("likes", ["u", "v"]),
    ]));
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat(parse(`
      main() {
        let u: Jones(u).
        let v: Ulysses(v).
        owns(u, v).
        fascinates(v, u).
      }
    `)).equalsTo(drs([], [
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Ulysses", ["v"])),
      pred("owns", ["u", "v"]),
      pred("fascinates", ["v", "u"]),
    ]));
  });

  it("Jones does not like Mary.", function() {
    assertThat(parse(`
      main() {
        let u: Jones(u).
        let v: Mary(v).
        not() { 
          like(u, v). 
        }
      }
    `)).equalsTo(drs([], [
      letty(["u"], pred("Jones", ["u"])),
      letty(["v"], pred("Mary", ["v"])),
      not([], [pred("like", ["u", "v"])]),
    ]));
  });

  it("Every man owns a book about Brazil.", function() {
    assertThat(parse(`
      main() {
        let a: Brazil(a).
        every (let x: man(x)) {
          let c: book(c).
          owns(x, c).
          about(c, a).
        }
      }
    `)).equalsTo(drs([], [
      letty(["a"], pred("Brazil", ["a"])),
      every(letty(["x"], pred("man", ["x"])), [
        letty(["c"], pred("book", ["c"])),
        pred("owns", ["x", "c"]),
        pred("about", ["c", "a"]),
      ]),
    ]));
  });

  it("Every man who likes Smith loves Mary.", function() {
    assertThat(parse(`
      main() {
        let a: Smith(a).
        let b: Mary(b).
        every (let x: {man(x). likes(x, a).}) {
          loves(x, b).
        }
      }
    `)).equalsTo(drs([], [
      letty(["a"], pred("Smith", ["a"])),
      letty(["b"], pred("Mary", ["b"])),
      every(letty(["x"], [pred("man", ["x"]), pred("likes", ["x", "a"])]), [
        pred("loves", ["x", "b"]),
      ]),
    ]));
  });

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat(parse(`
      main() {
        every (let x: man(x)) {
          mortal(x).
        }
        let u: Socrates(u).
        man(u).
      }
    `)).equalsTo(drs([], [
      every(letty(["x"], pred("man", ["x"])), [pred("mortal", ["x"])]),
      letty(["u"], pred("Socrates", ["u"])),
      pred("man", ["u"]),
    ]));
  });

  it("If Mary likes John then John likes Mary.", function() {
    assertThat(parse(`
      main() {
        if (let x, y: {Mary(x). John(y). likes(x, y).}) then { 
          likes(y, x).
        }
      }
    `)).equalsTo(drs([], [
      iffy(letty(["x", "y"], [pred("Mary", ["x"]),
                              pred("John", ["y"]),
                              pred("likes", ["x", "y"])]),
           [pred("likes", ["y", "x"])]),
    ]));
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      },
    }
  }
});

