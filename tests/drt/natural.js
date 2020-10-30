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
      #head -> "(" _ referent _ (":" _ expression _):? ("," _ referent _):* ")" {% 
      #  ([p1, ws1, ref, ws2, conds, list, p2]) => {
      #    let [col, ws, conds1] = conds || [false, false, []];
      #    return [[ref, conds1]].concat(list.map(([comma, ws, ref]) => [ref, []]));
      #  } 
      #%}
      
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
  let iffy = (a, b) => ["if", a, b]; 
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

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat(parse(`
      main(let u) {
        every (let x: man(x)) mortal(x).
        Socrates(u).
      }
    `)).equalsTo(drs(letty(["u"]), [
      every(letty(["x"], pred("man", ["x"])), [pred("mortal", ["x"])]),
      pred("Socrates", ["u"]),
    ]));
  });

  it("If Mary likes John then John likes Mary.", function() {
    assertThat(parse(`
      main() {
        if ({Mary(x).}) then likes(y, x).
      }
    `)).equalsTo(drs([], [
      iffy([pred("Mary", ["x"])], [pred("likes", ["y", "x"])]),
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

