const Assert = require("assert");

const {DRS, referent, print} = require("../../src/drt/rules.js");
const DrtParser = require("../../src/drt/parser.js");
const {S, VP_} = DrtParser.nodes;
const {clone} = DrtParser;

const {Parser, Rule} = require("../../src/logic/parser.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../../src/logic/forward.js");
const {Reasoner} = require("../../src/logic/fol.js");
const {rewrite} = require("../../src/logic/unify.js");

const {
  program, 
  forall, 
  exists, 
  quantifier,
  implies, 
  predicate, 
  func,
  binary, 
  literal, 
  constant, 
  and, 
  or, 
  negation,
  argument} = Parser;

describe("Logic", function() {

  it.skip("Who from Brazil loves Mary?", function() {
    let code = [];
    code.push("Jones is happy.");
    code.push("He loves Smith.");
    code.push("He likes Smith's brother.");
    code.push("Smith likes a man from Brazil.");
    code.push("Every man loves Mary.");
    let drs = compile(parse(code.join(" ")));
    let kb = program(drs[1]);
    assertThat(trim(toString(kb))).equalsTo(trim(`
      Jones(a).
      happy(a).
      Smith(b).
      loves(a, b).
      likes(a, c).
      brother(c, b).
      likes(b, d).
      from(d, Brazil).
      man(d).
      Mary(e).
      forall (f) man(f) => loves(f, e).
    `));

    let result = new Reasoner(rewrite(kb))
     .go(rewrite(Rule.of("exists (x) loves(x, e) && from(x, Brazil).")));

    let next = result.next();
    assertThat(next.done).equalsTo(false);
    assertThat(toString(Parser.parse(next.value.toString())))
     .equalsTo(toString(Parser.parse(`
       man(d).
       exists (f = d) man(f).
       forall (f = d) man(f) => loves(f, e).
       exists (x = d) loves(x, e).
       from(d, Brazil).
       exists (x = d) loves(x, e) && from(x, Brazil).
     `)));
  });

  function transpile(node) {
   if (node["@type"] == "Predicate") {
    return predicate(node.name, [argument(literal(node.ref.name))]);
   } else if (node["@type"] == "PN" || node["@type"] == "ADJ") {
    return predicate(node.children[0], [argument(literal(node.ref.name))]);
   } else if (node["@type"] == "N") {
   } else if (node["@type"] == "S") {
    let verb = node.children[1].children[0].children[0].children[0];
    if (verb["@type"] == "V" ||
        verb["@type"] == "RN" ||
        verb["@type"] == "PREP") {
     verb = verb.children[0];
    }
    let first = node.children[0].name;
    let second = node.children[1].children[0].children[1];
    if (second["@type"] == "Referent") {
     second = second.name;
    } else if (second.children[0]["@type"] == "Referent") {
     second = second.children[0].name;
    } else if (second["@type"] == "NP") {
     second = second.children[0].children[0];
    } 
    return predicate(verb, [argument(literal(first)),
                            argument(literal(second))]);
   }
   throw new Error("Unknown type: " + node["@type"]);
  }

  function compile(drs) {
   let kb = [];

   let refs = {};
   for (let ref of drs.head) {
    refs[ref.name] = ref.value;
   }

   for (let s of drs.body) {
    if (s["@type"] == "Implication") {
     let x = s.a.head
      .filter(ref => !ref.closure)
      .map(ref => ref.name)
      .join("");
     kb.push(forall(x, implies(spread(compile(s.a)[1]),
                               spread(compile(s.b)[1]))));
    } else {
     // console.log(s);
     kb.push(transpile(s));
    }
   }
   
   return [refs, kb];
  }

  function spread(list) {
   if (list.length == 1) {
    return list[0];
   }
     
   return and(list.shift(), spread(list));
  }

  it("Spread", function() {
    let rules = [literal("a"), literal("b"), literal("c")];

    assertThat(spread(rules))
     .equalsTo(and(literal("a"),
                   and(literal("b"),
                       literal("c"))));
    
  });

  it("Who does Mary like?", function() {
    assertThat(trim(toString(program([query("Who does Mary like?")[0]]))))
     .equalsTo("exists (x) exists (a) Mary(a) && like(a, x).");
  });

  it("Who likes Smith?", function() {
    assertThat(trim(toString(program([query("Who likes Smith?")[0]]))))
     .equalsTo("exists (x) exists (a) Smith(a) && likes(x, a).");
  });

  function query(s) {
   let q = DrtParser.parse(s)[0].children;
   let gap = q.length == 5 ? "vp" : "np";
   let np = gap == "vp" ? q[2] : q[1];
   let vp = gap == "vp" ? q[3] : q[2].children[0];
   let drs = DRS.from();
   let x = referent("x");
   let body = S(np, VP_(vp));


   let b = clone(body);

   let answer = (x) => {
    if (gap == "np") {
     b.children[0] = x;
    } else {
     b.children[1].children[0].children[1] = x;
    }
    // console.log(gap);
    // console.log(print(b));
    // console.log(x);
    return print(b);
   };

   if (gap == "vp") {
    vp.children[1] = x;
   } else {
    body.children[0] = x;
   }
   drs.head.push(x);
   drs.push(body);
   let result = spread(compile(drs)[1]);
   for (let ref of drs.head) {
    result.quantifiers.push(quantifier("exists", ref.name));
   }
   return [result, answer];
  }

  it("Who likes Smith?", function() {
    let code = [];
    code.push("Jones is happy.");
    code.push("He likes Smith.");
    let drs = compile(parse(code.join(" ")));
    let kb = program(drs[1]);

    assertThat(trim(toString(kb))).equalsTo(trim(`
      Jones(a).
      happy(a).
      Smith(b).
      likes(a, b).
    `));

    let [q, answer] = query("Who likes Smith?");
    let result = new Reasoner(rewrite(kb))
     .go(rewrite(q));

    let next = result.next();
    assertThat(next.done).equalsTo(false);
    assertThat(toString(Parser.parse(next.value.toString())))
     .equalsTo(toString(Parser.parse(`
       Smith(b).
       exists (x) exists (a = b) Smith(a).
       likes(a, b).
       exists (x = a) exists (a = b) likes(x, b).
       exists (x = a) exists (a = b) Smith(a) && likes(x, a).
     `)));

    let ref = next.value.bindings["x@1"];
    assertThat(drs[0][ref.name]).equalsTo("Jones");
    assertThat(answer(drs[0][ref.name])).equalsTo("Jones likes Smith");
  });

  it("John loves Mary. Who loves Mary?", function() {
    assertThat(tell("John loves Mary.").ask("Who loves Mary?"))
     .equalsTo("John loves Mary");
  });

  it("John loves Mary. Who does John love?", function() {
    // NOTE(goto): we need to compile verbs into the infinitive
    // to allow this to work.
    assertThat(tell("John loves Mary.").ask("Who does John loves?"))
     .equalsTo("John loves Mary");
  });

  it("A man loves Mary. Who loves Mary?", function() {
    assertThat(tell("A man loves Mary.").ask("Who loves Mary?"))
     .equalsTo("A man loves Mary");
  });

  it("A man from Brazil loves Mary. Who loves Mary?", function() {
    assertThat(tell("A man from Brazil loves Mary.").ask("Who loves Mary?"))
     .equalsTo("A man from Brazil loves Mary");
  });

  function tell(code) {
    let drs = compile(parse(code));
    let kb = program(drs[1]);

    return {
     ask(y) {
      let [q, answer] = query(y);
      let result = new Reasoner(rewrite(kb))
       .go(rewrite(q));
      let next = result.next();
      assertThat(next.done).equalsTo(false);
      let ref = next.value.bindings["x@1"];
      // console.log(drs[0]);
      return answer(drs[0][ref.name]);
     }
    }
  }

  function parse(code) {
   let drs = DRS.from();
   
   for (let s of code.split(".")) {
    if (s == "") {
     continue;
    }
    drs.feed(s.trim() + ".");
   }
   return drs;
  }

  function trim (str) {
   return str
    .trim()
    .split("\n")
    .map(line => line.trim())
    .join("\n");
  }

  function assertThat(x) { 
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});