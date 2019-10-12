const Assert = require("assert");

const {DRS, referent, print} = require("../../src/drt/rules.js");
const DrtParser = require("../../src/drt/parser.js");
const {S, VP_, VP, BE} = DrtParser.nodes;
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

  it("Is Mary happy?", function() {
    assertThat(trim(toString(program([query("Is Mary happy?")[0]]))))
     .equalsTo("exists (a) Mary(a) && happy(a).");
  });

  function query(s) {
   let q = DrtParser.parse(s)[0].children;

   if (q[0] == "Is") {
    let drs = DRS.from();
    let body = S(q[1], VP_(VP(BE("is"), q[2])));
    let b = clone(body);
    drs.push(body);
    let result = spread(compile(drs)[1]);
    for (let ref of drs.head) {
     result.quantifiers.push(quantifier("exists", ref.name));
    }

    let answer = () => {
     return print(b);
    };

    return [result, answer];
   }

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
    enter("John loves Mary.")
     .query("Who loves Mary?")
     .equalsTo("John loves Mary");
  });

  it("John loves Mary. Who does John love?", function() {
    // NOTE(goto): we need to compile verbs into the infinitive
    // to allow this to work.
    enter("John loves Mary.")
     .query("Who does John loves?")
     .equalsTo("John loves Mary");
  });

  it("A man loves Mary. Who loves Mary?", function() {
    enter("A man loves Mary.")
     .query("Who loves Mary?")
     .equalsTo("A man loves Mary");
  });

  it("A man from Brazil loves Mary. Who loves Mary?", function() {
    enter("A man from Brazil loves Mary.")
     .query("Who loves Mary?")
     .equalsTo("A man from Brazil loves Mary");
  });

  it("A man loves Mary. He likes Brazil. Who likes Brazil?", function() {
    enter("A man loves Mary. He likes Brazil.")
     .query("Who likes Brazil?")
     .equalsTo("A man likes Brazil");
  });

  it("Jones loves Mary. He likes Brazil. Who likes Brazil?", function() {
    enter("Jones loves Mary. She likes Brazil.")
     .query("Who likes Brazil?")
     .equalsTo("Mary likes Brazil");
  });

  it("Every man who likes Mary loves Brazil. Jones is a man who likes Mary. Who loves Brazil?", function() {
    enter("Every man who likes Mary loves Brazil. Jones is a man who likes Mary.")
     .equalsTo(`
       Brazil(a).
       Mary(b).
       forall (c) likes(c, b) && man(c) => loves(c, a).
       Jones(d).
       likes(d, b).
       man(d).
     `)
     .query("Who loves Brazil?")
     .equalsTo("Jones loves Brazil")
     .because(`
       Brazil(a).
       exists (x) exists (a = a) Brazil(a).
       likes(d, b).
       exists (c = d) likes(c, b).
       man(d).
       exists (c = d) likes(c, b) && man(c).
       forall (c = d) likes(c, b) && man(c) => loves(c, a).
       exists (x = d) exists (a = a) loves(x, a).
       exists (x = d) exists (a = a) Brazil(a) && loves(x, a).
     `);
   });

  it("Jones's wife is happy. Who is happy??", function() {
    enter("Jones's wife is happy.")
     .query("Who is happy?")
     .equalsTo("Jones 's wife is happy");
  });

  it("Jones admires a woman who likes him. Who likes Jones?", function() {
    enter("Jones admires a woman who likes him.")
     .query("Who likes Jones?")
     .equalsTo("a woman who likes him likes Jones");
  });

  it("A man who loves Dani fascinates Anna. Who fascinates Anna?", function() {
    enter("A man who loves Dani fascinates Anna.")
     .query("Who fascinates Anna?")
     .equalsTo("A man who loves Dani fascinates Anna");
    enter("A man who loves Dani fascinates Anna.")
     .query("Who loves Dani?")
     .equalsTo("A man who loves Dani loves Dani");
  });

  it("Jones owns a book which Smith loves. Who owns a book?", function() {
    enter("Jones owns a book which Smith loves.")
     .query("Who owns a book?")
     .equalsTo("Jones owns a book");
  });

  it("Jones is a man who loves Mary. Who loves Mary?", function() {
    enter("Jones is a man who loves Mary.")
     .query("Who loves Mary?")
     .equalsTo("Jones loves Mary");
  });

  it("Every man is mortal. Socrates is a man. Is Socrates mortal?", function() {
    enter("Every man is mortal. Socrates is a man.")
     .equalsTo(`
        forall (a) man(a) => mortal(a).
        Socrates(b).
        man(b).
     `)
     .query("Is Socrates mortal?")
     .equalsTo("Socrates is mortal")
     .because(`
        Socrates(b).
        exists (a = b) Socrates(a).
        man(b).
        forall (a = b) man(a) => mortal(a).
        exists (a = b) mortal(b).
        exists (a = b) Socrates(a) && mortal(a).
     `);
  });

  it("Sam is from Brazil. Who is from Brazil?", function() {
    enter("Sam is from Brazil.")
     .query("Who is from Brazil?")
     .equalsTo("Sam is from Brazil");
  });

  it("Sam is a brazilian engineer. Who is a engineer?", function() {
    enter("Sam is a brazilian engineer.")
     .query("Who is a engineer?")
     .equalsTo("Sam is a engineer");
  });

  it("Sam's wife is behind Anna. Who is behind Anna?", function() {
    enter("Sam's wife is behind Anna.")
     .query("Who is behind Anna?")
     .equalsTo("Sam 's wife is behind Anna");
  });

  it("Sam is a brazilian engineer. Every brazilian is from Brazil. Who is from Brazil?", function() {
    enter("Sam is a brazilian engineer. Every brazilian is from Brazil.")
     .query("Who is from Brazil?")
     .equalsTo("Sam is from Brazil");
  });

  // maybe we need to introduce variables?
  // how do we express the following?
  // if "a" is "b"'s child then "b" is "a"'s parent.
  // if "a" is a child of "b" then "b" is a parent of "a".
  // if a person is a child of other person then the former is the parent of the latter.
  // if a person "a" is a child of a person "b" then "b" is parent of "a".
  // if a person (a) is a child of a person (b) then (b) is parent of (a).
  

  function enter(code) {
    let drs = compile(parse(code));
    let kb = program(drs[1]);

    return {
     equalsTo(a) {
      assertThat(trim(toString(kb))).equalsTo(trim(a));
      return this;
     },
     query(y) {
      let [q, answer] = query(y);
      let result = new Reasoner(rewrite(kb))
       .go(rewrite(q));
      let next = result.next();
      assertThat(next.done).equalsTo(false);
      let ref = next.value.bindings["x@1"];
      return {
       because(c) {
        // assertThat();
        assertThat(trim(next.value.toString())).equalsTo(trim(c));
        return this;
       },
       equalsTo(z) {
        assertThat(answer(ref && drs[0][ref.name])).equalsTo(z);
        return this;
       }
      }
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
    .filter(line => line != "")
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