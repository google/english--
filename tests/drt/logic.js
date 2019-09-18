const Assert = require("assert");

const {DRS} = require("../../src/drt/rules.js");

const {Parser, Rule} = require("../../src/logic/parser.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../../src/logic/forward.js");
const {Reasoner} = require("../../src/logic/fol.js");
const {rewrite} = require("../../src/logic/unify.js");

const {
  program, 
  forall, 
  exists, 
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
    let verb = node.children[1].children[0].children[0].children[0];
    if (verb["@type"] == "RN" ||
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

    for (let s of drs.body) {
     kb.push(transpile(s));
    }

    for (let sub of drs.subs) {
     if (sub["@type"] == "Implication") {
      let x = sub.a.head
       .filter(ref => !ref.closure)
       .map(ref => ref.name)
       .join("");
      // console.log();
      kb.push(forall(x, 
                     implies(spread(compile(sub.a)),
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
      Smith(e).
      likes(e, f).
      from(f, Brazil).
      man(f).
      Mary(g).
      forall (h) man(h) => loves(h, g).
    `));

    let result = new Reasoner(rewrite(kb))
     .go(rewrite(Rule.of("exists (x) loves(x, g) && from(x, Brazil).")));

    let next = result.next();
    assertThat(next.done).equalsTo(false);
    assertThat(toString(Parser.parse(next.value.toString())))
     .equalsTo(toString(Parser.parse(`
       man(f).
       exists (h = f) man(h).
       forall (h = f) man(h) => loves(h, g).
       exists (x = f) loves(x, g).
       from(f, Brazil).
       exists (x = f) loves(x, g) && from(x, Brazil).
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