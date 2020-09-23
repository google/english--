const Assert = require("assert");

const {DRS, referent, print} = require("../../src/drt/rules.js");
const DrtParser = require("../../src/drt/parser.js");
const {S, VP_, VP, BE, NP, GAP} = DrtParser.nodes;
const {preprocess} = DrtParser;

const {Forward, normalize, stringify, equals, explain, toString} = require("../../src/logic/forward.js");
const {Reasoner} = require("../../src/logic/fol.js");
const {rewrite} = require("../../src/logic/unify.js");

//const {
//  program, 
//  forall, 
//  exists, 
//  quantifier,
//  implies, 
//  predicate, 
//  func,
//  binary, 
//  literal, 
//  constant, 
//  and, 
//  or, 
//  negation,
//  argument} = Parser;

describe.skip("Logic", function() {

  it("Jones loves Mary.", function() {
    enter("Jones loves Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       loves(pres, a, b).
     `);
  });  

  it("Jones will love Mary.", function() {
    enter("Jones will love Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       love(fut, a, b).
     `);
  });

  it("Jones was happy.", function() {
    enter("Jones was happy.")
     .equalsTo(`
       Jones(a).
       happy(past, a).
     `);
  });

  it("Jones is happy.", function() {
    enter("Jones is happy.")
     .equalsTo(`
       Jones(a).
       happy(pres, a).
     `);
  });

  it("Jones is from Brazil.", function() {
    enter("Jones is from Brazil.")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       from(pres, a, b).
     `);
  });

  it.skip("Jones was from Brazil.", function() {
    enter("Jones was from Brazil.")
     .equalsTo(`
       Sam(a).
       Brazil(b).
       from(past, a, b).
     `);
  });

  it("Every man is mortal.", function() {
    enter("Every man is mortal.")
     .equalsTo(`
       forall (a) man(pres, a) => mortal(pres, a).
     `);
  });

  it("Socrates is a man.", function() {
    enter("Socrates is a man.")
     .equalsTo(`
        Socrates(a).
        man(pres, a).
     `);
  });

  it("Jones was not an engineer.", function() {
    enter("Jones was not an engineer.")
     .equalsTo(`
       Jones(a).
       ~engineer(past, a).
     `);
  });

  it("Jones was not an engineer from Brazil.", function() {
    enter("Jones was not an engineer from Brazil.")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       ~from(pres, a, b) && engineer(pres, a).
     `);
  });

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

  it.skip("Every man is mortal. Socrates is a man. Is Socrates mortal?", function() {
    enter("Every man is mortal. Socrates is a man.")
     .equalsTo(`
        forall (a) man(pres, a) => mortal(pres, a).
        Socrates(b).
        man(pres, b).
     `)
     .query("Is Socrates mortal?")
     .sameAs("exists (a) Socrates(a) && mortal(pres, a).")
     .equalsTo("Socrates is mortal")
     .because(`
        Socrates(b).
        exists (a = b) Socrates(a).
        man(pres, b).
        forall (a = b) man(pres, a) => mortal(pres, a).
        exists (a = b) mortal(pres, b).
        exists (a = b) Socrates(a) && mortal(pres, a).
     `);
  });

  it.skip("Who does Mary like?", function() {
    assertThat(trim(toString(program([query("Who does Mary like?")[0]]))))
     .equalsTo("exists (x) exists (a) Mary(a) && like(pres, a, x).");
  });

  it("Who likes Smith?", function() {
    assertThat(trim(toString(program([query("Who likes Smith?")[0]]))))
     .equalsTo("exists (x) exists (a) Smith(a) && likes(pres, x, a).");
  });

  it("Who liked Smith?", function() {
    assertThat(trim(toString(program([query("Who liked Smith?")[0]]))))
     .equalsTo("exists (x) exists (a) Smith(a) && liked(past, x, a).");
  });

  it("Is Mary happy?", function() {
    assertThat(trim(toString(program([query("Is Mary happy?")[0]]))))
     .equalsTo("exists (a) Mary(a) && happy(pres, a).");
  });

  it("Who likes Smith?", function() {
    let code = [];
    code.push("Jones is happy.");
    code.push("He likes Smith.");

    let drs = compile(parse(code.join(" ")));
    let kb = program(drs[1]);

    assertThat(trim(toString(kb))).equalsTo(trim(`
      Jones(a).
      happy(pres, a).
      Smith(b).
      likes(pres, a, b).
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
       likes(pres, a, b).
       exists (x = a) exists (a = b) likes(pres, x, b).
       exists (x = a) exists (a = b) Smith(a) && likes(pres, x, a).
     `)));

    let ref = next.value.bindings["x@1"];
    assertThat(drs[0][ref.name]).equalsTo("Jones");
    assertThat(answer(drs[0][ref.name])).equalsTo("Jones likes Smith");
  });

  function transpile(node) {
   // console.log(node);
   if (node["@type"] == "Predicate") {
    // console.log(node.children);
    // console.log("hi");
    let args = node.children.map((x) => argument(literal(x.name)));
    args.unshift(argument(literal(node.time || "pres")));
    // console.log(node);
    return predicate(node.name, args);
   } else if (node["@type"] == "PN") {
    return predicate(node.children[0], [argument(literal(node.ref.name))]);
   } else if (node["@type"] == "ADJ") {
    // console.log(node);
    return predicate(node.children[0], [argument(literal(node.time || "pres")), 
                                        argument(literal(node.ref.name))]);
   } else if (node["@type"] == "N") {
    // console.log("hi");
   } else if (node["@type"] == "S") {
    // console.log(node);
    // let verb = node.children[1].children[0].children[0].children[0];
    let verb = node.children[1].children[0].children[0];
    // console.log(verb);
    //if (verb.children["@type"] == "VERB") {
    // let suffix = verb.children.length == 2 ? verb.children[1] : "";
    // let prefix = verb.children[0].children[0];
    // verb = prefix + suffix;
    //} else {
    verb = verb.children[0];
    //}

    if (verb["@type"] == "V" ||
        verb["@type"] == "RN" ||
        verb["@type"] == "PREP") {
     // console.log(verb);
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

    let {types} = node;
    let {tense} = types || {};

    return predicate(verb, [argument(literal(tense || "pres")),
                            argument(literal(first)),
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
    if (s instanceof DRS) {
     // console.log("hi");
    } else if (s["@type"] == "Negation") {
     let x = s.a.head
      .filter(ref => !ref.closure)
      .map(ref => ref.name)
      .join(", ");
     kb.push(negation(spread(compile(s.a)[1])));
    } else if (s["@type"] == "Implication") {
     let x = s.a.head
      .filter(ref => !ref.closure)
      .map(ref => ref.name)
      .join(", ");
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

  function clone(o) {
   return JSON.parse(JSON.stringify(o));
  }

  function query(s) {
   let drs = DRS.from();
   drs.feed(s);
   console.log(drs.print());
  }

  function query2(s) {
   let q = DrtParser.parse(s, "Question")[0];
   // console.log(q);

   // console.log(s);

   // console.log();
   return;

   if (q[0]["@type"] == "BE" && q[0].children[0] == "Is") {
    // console.log("hi");
    let drs = DRS.from();
    let body = S(q[1], VP_(VP(BE("is"), q[2])));
    // console.log(q[1]);
    let b = clone(preprocess(body));
    drs.push(body);
    let result = spread(compile(drs)[1]);
    // console.log(drs.print());
    for (let ref of drs.head) {
     result.quantifiers.push(quantifier("exists", ref.name));
    }

    let answer = () => {
     return print(b);
    };

    // console.log(result);

    return [result, answer];
   }

   let gap = q.length == 5 ? "vp" : "np";

   // console.log(q[3]);

   // console.log(q[1]);

   let np = gap == "vp" ? q[2] : NP(GAP);
   let vp = gap == "vp" ? q[3] : q[1].children[0];
   let drs = DRS.from();
   let x = referent("x");

   let body = S(np, VP_(preprocess(vp)));

   body.types = {tense: vp.types.tense};

   // console.log(body);

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

   // console.log(body);
   // console.log(x);
   // console.log(body.children[0])

   drs.head.push(x);
   drs.push(body);

   // console.log(drs);

   let result = spread(compile(drs)[1]);
   for (let ref of drs.head) {
    result.quantifiers.push(quantifier("exists", ref.name));
   }
   return [result, answer];
  }

  it("John loves Mary. Who loves Mary?", function() {
    enter("John loves Mary.")
     .query("Who loves Mary?")
     .equalsTo("John loves Mary");
  });

  it.skip("John loves Mary. Who does John love?", function() {
    // NOTE(goto): we need to compile verbs into the infinitive
    // to allow this to work.
    enter("John loves Mary.")
     .query("Who does John loves?")
     .equalsTo("John love Mary");
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
       forall (c) likes(pres, c, b) && man(pres, c) => loves(pres, c, a).
       Jones(d).
       likes(pres, d, b).
       man(pres, d).
     `)
     .query("Who loves Brazil?")
     .equalsTo("Jones loves Brazil")
     .because(`
       Brazil(a).
       exists (x) exists (a = a) Brazil(a).
       likes(pres, d, b).
       exists (c = d) likes(pres, c, b).
       man(pres, d).
       exists (c = d) likes(pres, c, b) && man(pres, c).
       forall (c = d) likes(pres, c, b) && man(pres, c) => loves(pres, c, a).
       exists (x = d) exists (a = a) loves(pres, x, a).
       exists (x = d) exists (a = a) Brazil(a) && loves(pres, x, a).
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

  it.skip("A man who loves Mary fascinates Smith. Who fascinates Smith?", function() {
    enter("A man who loves Mary fascinates Smith.")
     .query("Who fascinates Smith?")
     .equalsTo("A man who loves Mary fascinates Smith");
    // NOTE(goto): the following seems wrong.
    enter("A man who loves Mary fascinates Smith.")
     .query("Who loves Mary?")
     .equalsTo("A man who loves Mary loves Mary");
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

  it.skip("Sam is from Brazil. Who is from Brazil?", function() {
    enter("Sam is from Brazil.")
     .query("Who is from Brazil?")
     .equalsTo("Sam is from Brazil");
  });

  it.skip("Sam is a brazilian engineer. Who is a engineer?", function() {
    enter("Sam is a brazilian engineer.")
     .query("Who is a engineer?")
     .equalsTo("Sam is a engineer");
  });

  it.skip("Sam's wife is behind Anna. Who is behind Anna?", function() {
    enter("Sam's wife is behind Anna.")
     .query("Who is behind Anna?")
     .equalsTo("Sam 's wife is behind Anna");
  });

  it.skip("Sam is a brazilian engineer. Every brazilian is from Brazil. Who is from Brazil?", function() {
    enter("Sam is a brazilian engineer. Every brazilian is from Brazil.")
     .equalsTo(`
       Sam(a).
       brazilian(pres, a).
       engineer(pres, a).
       Brazil(b).
       forall (c) brazilian(pres, c) => from(pres, c, b).
     `)
     .query("Who is from Brazil?")
     .sameAs(`
       exists (x) exists (a) Brazil(a) && from(pres, x, a).
     `)
     .equalsTo("Sam is from Brazil");
  });

  it("Jones loved Mary. Who loved Mary?", function() {
    enter("Jones loved Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       loved(past, a, b).
     `)
     .query("Who loved Mary?")
     .sameAs(`
       exists (x) exists (a) Mary(a) && loved(past, x, a).
     `)
     .equalsTo("Jones loved Mary");
  });

  it.skip("Jones will love Mary. Who will love Mary?", function() {
    enter("Jones will love Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       love(fut, a, b).
     `)
     .query("Who will love Mary?")
     //.sameAs("")
     .equalsTo("Jones will love Mary");
  });

  it.skip("Jones was a brazilian engineer. Every brazilian who was an engineer was happy. Was Sam happy?", function() {
    enter("Jones was a brazilian engineer. Every brazilian who was an engineer was happy.")
     .equalsTo(`
       Jones(a).
       brazilian(pres, a).
       engineer(pres, a).
       forall (b) brazilian(pres, b) && engineer(past, b) => happy(past, b).
     `)
     .query("Was Jones happy?")
     .equalsTo("Jones was happy.");
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
      //console.log(toString(program([rewrite(q)])));
      // console.log(toString(program([kb])));
      // console.log(q);
      let result = new Reasoner(rewrite(kb))
       .go(rewrite(q));
      let next = result.next();
      assertThat(next.done).equalsTo(false);
      // console.log(next.value);
      return {
       sameAs(rules) {
        assertThat(trim(toString(program([q])))).equalsTo(trim(rules));
        return this;
       },
       because(c) {
        // assertThat();
        assertThat(trim(next.value.toString())).equalsTo(trim(c));
        return this;
       },
       equalsTo(z) {
        let ref = next.value.bindings["x@1"];
        if (!ref) {
         // If there wasn't a specific entity that we were
         // looking for, just test for truthness.
         let refs = Object.keys(next.value.bindings);
         ref = next.value.bindings[refs[0]];
        }
        Assert.notEqual(ref, undefined, "Should have returned an answer");
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
