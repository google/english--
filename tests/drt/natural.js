const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Natural Logic", function() {
  const grammar = `
      @builtin "whitespace.ne"
      @builtin "number.ne"

      main -> _ drs _ {% ([ws1, drs, ws2]) => drs %}

      drs -> "drs" _ head _ body {%
        ([drs, ws1, head, ws2, body]) => [head, body] 
      %}

      head -> "(" _ ")" {% () => [] %}
      head -> "(" _ referent _ (":" _ expression _):? ("," _ referent _):* ")" {% 
        ([p1, ws1, ref, ws2, conds, list, p2]) => {
          let [col, ws, conds1] = conds || [false, false, []];
          return [[ref, conds1]].concat(list.map(([comma, ws, ref]) => [ref, []]));
        } 
      %}
      
      referent -> word {% id %}

      body -> expression _ "." {% 
        ([statement]) => {
          return [statement];
        } 
      %}

      body -> "{" _ (statement _):* "}" {% 
        ([p1, ws, statements]) => {
          return statements.map(([statement]) => statement);
        } 
      %}
  
      statement -> expression _ "." {% id %}
      expression -> predicate {% id %}
      expression -> body {% id %}
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

      statement -> quantifier _ head _ body {%
        ([quantifier, ws1, head, ws2, body]) => [quantifier, head, body] 
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

  let drs = (head = [], body = []) => [[head, body]];
  let arg = (name, expr = []) => [name, expr]; 
  let pred = (name, args = []) => [name, args]; 
  let quant = (name, args = [], body = []) => [name, args, body]; 
  let every = (args = [], body = []) => quant("every", args, body); 
  let some = (args = [], body = []) => quant("some", args, body); 
  let and = (a, b) => ["and", a, b]; 
  let parse = (code) => Nearley.from(grammar).feed(code);

  it("Basic", function() {
    assertThat(parse("drs(){}")).equalsTo(drs());
    assertThat(parse(" drs( ) { } ")).equalsTo(drs());
  });

  it("Head", function() {
    assertThat(parse("drs(a) {}")).equalsTo(drs([arg("a")]));
    assertThat(parse("drs(a, b) {}")).equalsTo(drs([arg("a"), arg("b")]));
    assertThat(parse("drs(a, b, c) {}")).equalsTo(drs([arg("a"), arg("b"), arg("c")]));
    assertThat(parse("drs( a ,b ) {}")).equalsTo(drs([arg("a"), arg("b")]));
    assertThat(parse("drs(a) {}")).equalsTo(drs([arg("a")]));
  });

  it("Body", function() {
    assertThat(parse("drs(){ P(a). }")).equalsTo(drs([], [pred("P", ["a"])]));
    assertThat(parse("drs(){ P(). }")).equalsTo(drs([], [pred("P")]));
    assertThat(parse("drs(){ P(a). Q(b). R(). }"))
      .equalsTo(drs([], [pred("P", ["a"]), pred("Q", ["b"]), pred("R")]));
    assertThat(parse("drs(){ P() and Q(). }"))
      .equalsTo(drs([], [and(pred("P"), pred("Q"))]));
    assertThat(parse("drs(){ every() {} }"))
      .equalsTo(drs([], [every()]));
    assertThat(parse("drs(){ every(x) P(x). }"))
      .equalsTo(drs([], [every([arg("x")], [pred("P", ["x"])])]));
    assertThat(parse("drs(){ every(x) {P(x). Q(x).} }"))
      .equalsTo(drs([], [every([arg("x")], [pred("P", ["x"]), pred("Q", ["x"])])]));
    assertThat(parse("drs(){ some(x) P(x). }"))
      .equalsTo(drs([], [some([arg("x")], [pred("P", ["x"])])]));
    assertThat(parse("drs(){ every(x: A(x)) B(x). }"))
      .equalsTo(drs([], [every([arg("x", pred("A", ["x"]))],
                               [pred("B", ["x"])])]));
    assertThat(parse("drs(){ every(x: A(x) and B(x)) C(x). }"))
      .equalsTo(drs([], [every([arg("x", and(pred("A", ["x"]), pred("B", ["x"])))],
                               [pred("C", ["x"])])]));
    assertThat(parse("drs(){ every(x: {A(x).}) B(x). }"))
      .equalsTo(drs([], [every([arg("x", [pred("A", ["x"])])],
                               [pred("B", ["x"])])]));
  });

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat(parse(`
      drs(u) {
        every(x: man(x)) mortal(x).
        Socrates(u).
      }
    `)).equalsTo(drs([arg("u")], [
      every([arg("x", pred("man", ["x"]))], [pred("mortal", ["x"])]),
      pred("Socrates", ["u"]),
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

