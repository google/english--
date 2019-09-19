const Assert = require("assert");

const {DRS, referent} = require("../../src/drt/rules.js");
const DrtParser = require("../../src/drt/parser.js");
const {S, VP_} = DrtParser.nodes;

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

  function transpile(node) {
   if (node["@type"] == "Predicate") {
    return predicate(node.name, [argument(literal(node.ref.name))]);
   } else if (node["@type"] == "PN" || node["@type"] == "ADJ") {
    return predicate(node.children[0], [argument(literal(node.ref.name))]);
   } else if (node["@type"] == "S") {
    // console.log(node);
    let verb = node.children[1].children[0].children[0].children[0];
    // console.log(verb);
    if (verb["@type"] == "V" ||
        verb["@type"] == "RN" ||
        verb["@type"] == "PREP") {
     verb = verb.children[0];
    }
    let first = node.children[0].name;
    // console.log(node.children[0]);
    //console.log(node.children[1].children[0].children[0]);
    // console.log(node.children[1]);
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

    for (let s of drs.body) {
     kb.push(transpile(s));
    }

    for (let sub of drs.subs) {
     if (sub["@type"] == "Implication") {
      let x = sub.a.head
       .filter(ref => !ref.closure)
       .map(ref => ref.name)
       .join("");
      kb.push(forall(x, implies(spread(compile(sub.a)),
                                spread(compile(sub.b)))));
     }
    }

    return kb;
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
    assertThat(trim(toString(program([query("Who does Mary like?")]))))
     .equalsTo("exists (x) exists (a) Mary(a) && like(a, x).");
  });

  it("Who likes Smith?", function() {
    assertThat(trim(toString(program([query("Who likes Smith?")]))))
     .equalsTo("exists (x) exists (a) Smith(a) && likes(x, a).");
  });

  function query(s) {
   let q = DrtParser.parse(s)[0].children;
   let gap = q.length == 5 ? "vp" : "np";
   let np = gap == "vp" ? q[2] : q[1];
   let vp = gap == "vp" ? q[3] : q[2].children[0];
   // console.log(vp);
   let drs = new DRS();
   let x = referent("x");
   let body = S(np, VP_(vp));
   if (gap == "vp") {
    vp.children[1] = x;
   } else {
    body.children[0] = x;
   }
   drs.head.push(x);
   drs.push(body);
   let result = spread(compile(drs));
   for (let ref of drs.head) {
    result.quantifiers.push(quantifier("exists", ref.name));
   }
   return result;
  }

  it("Who from Brazil loves Mary?", function() {
    let code = [];
    code.push("Jones is happy.");
    code.push("He loves Smith.");
    code.push("He likes Smith's brother.");
    code.push("Smith likes a man from Brazil.");
    code.push("Every man loves Mary.");
    let kb = program(compile(parse(code.join(" "))));
    assertThat(trim(toString(kb))).equalsTo(trim(`
      Jones(a).
      happy(a).
      Smith(b).
      loves(a, b).
      Smith(c).
      likes(a, d).
      brother(d, c).
      likes(b, e).
      from(e, Brazil).
      man(e).
      Mary(f).
      forall (g) man(g) => loves(g, f).
    `));

    let result = new Reasoner(rewrite(kb))
     .go(rewrite(Rule.of("exists (x) loves(x, f) && from(x, Brazil).")));

    let next = result.next();
    assertThat(next.done).equalsTo(false);
    assertThat(toString(Parser.parse(next.value.toString())))
     .equalsTo(toString(Parser.parse(`
       man(e).
       exists (g = e) man(g).
       forall (g = e) man(g) => loves(g, f).
       exists (x = e) loves(x, f).
       from(e, Brazil).
       exists (x = e) loves(x, f) && from(x, Brazil).
     `)));
  });

  it("Who likes Smith?", function() {
    let code = [];
    code.push("Jones is happy.");
    code.push("He likes Smith.");
    let kb = program(compile(parse(code.join(" "))));
    assertThat(trim(toString(kb))).equalsTo(trim(`
      Jones(a).
      happy(a).
      Smith(b).
      likes(a, b).
    `));

    let result = new Reasoner(rewrite(kb))
     .go(rewrite(query("Who likes Smith?")));

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
  });

  function parse(code) {
   let drs = new DRS();
   
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