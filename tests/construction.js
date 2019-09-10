const Assert = require("assert");
const Forward = require("../src/forward.js");
const {Reasoner} = require("../src/fol.js");
const {rewrite} = require("../src/unify.js");

const {
  parse, 
  parser, 
  term, 
  rule, 
  phrase, 
  space, 
  clone, 
  literal, 
  compile, 
  print, 
  generate, 
  expand, 
  collect, 
  processor, 
  grammar,
  first,
  clean,
  nodes} = require("../src/drt.js");

const {
 S, NP, NP_, PN, VP_, VP, V, DET, N, PRO, AUX, RC, RPRO, GAP, 
 Discourse, Sentence
} = nodes;

const Logic = require("../src/parser.js");
const {
  program, 
  forall, 
  exists, 
  implies, 
  predicate, 
  func,
  binary, 
  constant, 
  and, 
  or, 
  negation,
  argument} = Logic.Parser;

describe("DRT construction", function() {

  it("keeps types", function() {
    let s = first(parse("Mel loves Dani and Anna."), true);
    let subject = S(NP(capture("mel")), VP_());
    assertThat(match(subject, s).mel.types)
     .equalsTo({
       "gen": "male", "num": "sing", "case": "+nom", "gap": "-"});
    let object = S(NP(), VP_(VP(V(), NP(capture("object")))));
    assertThat(match(object, s).object["@type"]).equalsTo("NP");
    assertThat(match(object, s).object.types)
     .equalsTo({
       "case": "-nom", 
       "gap": "-", 
       "gen": "-hum", 
       "num": "plur"
    });
  });

  function toString(node) {
   if (typeof node == "string") {
    return node;
   } else if (node["@type"] == "Referent") {
    return node.name;
   } else if (node["@type"] == "Predicate") {
    return `${node.name}(${node.arguments.map(x => x.name).join(", ")})`;
   }
   let result = [];
   for (let child of node.children || []) {
    result.push(toString(child));
   }
   return result.join(" ").trim();
  }
  
  it("toString", function() {
    assertThat(toString(first(parse("Mel loves Dani."))))
     .equalsTo("Mel loves Dani");
    assertThat(toString(first(parse("A stockbroker who does not love her surprises him."))))
     .equalsTo("A stockbroker who does not love her surprises him");
  });

  let capture = (name) => { return {"@type": "Match", "name": name} };
  
  function match(a, b) {
   if (a["@type"] != b["@type"]) {
    return false;
   }

   let result = {};

   for (let i = 0; i < a.children.length; i++) {
    if (a.children[i]["@type"] == "Match") {
     // console.log(`match ${a.children[i].name}`);
     result[a.children[i].name] = b;
     continue;
    }

    let capture = match(a.children[i], b.children[i]);
    if (!capture) {
     return false;
    }

    result = Object.assign(result, capture);
   }

   return result;
  }

  it("match", function() {
    let s = first(parse("Mel loves Dani."));
    let m1 = S(NP(PN(capture("name"))), VP_());
    assertThat(match(m1, s)).equalsTo({name: PN("Mel")});
    let m2 = S(NP(), VP_(VP(V(), NP(PN(capture("name"))))));
    assertThat(match(m2, s)).equalsTo({name: PN("Dani")});
   });

  let Referent = (name, types = {}, children = []) => { return { 
    "@type": "Referent", 
    "name": name, 
    "types": types, 
    "children": children
   } 
  };

  let arg = (x, free) => argument(Logic.Parser.literal(x), undefined, free);

  class CRPN {
   match(node) {
    let matcher1 = S(NP(PN(capture("name"))), VP_());
    let matcher2 = VP(V(), NP(PN(capture("name"))));

    let result = [[], []];

    let m1 = match(matcher1, node);
    if (m1) {
     let name = m1.name.children[0];
     result[0].push(Referent("u", m1.name.types));
     result[1].push(predicate("Name", [arg("u"), arg(name)]));
     node.children[0] = Referent("u");
    }

    let m2 = match(matcher2, node.children[1].children[0]);
    if (m2) {
     let name = m2.name.children[0];
     result[0].push(Referent("v", m2.name.types));
     result[1].push(predicate("Name", [arg("v"), arg(name)]));
     node.children[1].children[0].children[1] = Referent("v");
    }

    return result;
   }
  }
  
  class Compiler {
   compile(node) {
    // Maps to Logic
    let matcher = S(Referent("", {}, [capture("alpha")]), 
                    VP_(VP(V(capture("verb")), Referent("", {}, [capture("beta")]))));
    let m = match(matcher, node);

    if (!m) {
     return false;
    }

    return predicate(m.verb.children[0], 
                     [arg(m.alpha.name), arg(m.beta.name)]);
   }
  }

  function construct(drs) {
   let crpn = new CRPN();

   for (let root of drs.body || []) {
    let [head, body] = crpn.match(root);
    drs.head = drs.head.concat(head);
    drs.body = drs.body.concat(body);
   }

   let compiler = new Compiler();

   for (let i = 0; i < drs.body.length; i++ ) {
    let result = compiler.compile(drs.body[i]);
    if (result) {
     drs.body[i] = result;
    }
   }
  }

  class Interpreter {
   constructor() {
    this.drs = {head: [], body: []};
   }
   feed(s) {
    this.drs.body.push(first(parse(s), true));
    construct(this.drs);
    return this.drs;
   }
   ask(s) {
    return new Reasoner(rewrite(program(this.drs.body)))
     .go(rewrite(Logic.Rule.of(s)));
   }
  }

  it("CR.PN", function() {
    let node = first(parse("Mel loves Dani."), true);
    let rule = new CRPN();
    let [head, body] = rule.match(node);

    // Two new discourse referents introduced.
    assertThat(head.length).equalsTo(2);
    assertThat(head[0].name).equalsTo("u");
    assertThat(head[1].name).equalsTo("v");

    // Two new conditions added to the body.
    assertThat(body.length).equalsTo(2);

    // Name predicates added.
    assertThat(Forward.stringify(body[0])).equalsTo("Name(u, Mel)");
    assertThat(Forward.stringify(body[1])).equalsTo("Name(v, Dani)");

    // PNs rewritten.
    assertThat(transcribe(node)).equalsTo("u loves v");
   });

  it("Interpreter", function() {
    let interpreter = new Interpreter();
    let drs = interpreter.feed("Mel loves Dani.");

    let stream = interpreter.ask("exists(p) exists(q) exists (r) (Name(p, Mel) && loves(p, q) && Name(q, r))?");

    assertThat(Forward.toString(Logic.Parser.parse(stream.next().value.toString())))
     .equalsTo(Forward.toString(Logic.Parser.parse(`
    Name(u, Mel).
    exists (p = u) exists (q) exists (r) Name(p, Mel).
    loves(u, v).
    exists (p = u) exists (q = v) exists (r) loves(u, q).
    Name(v, Dani).
    exists (p = u) exists (q = v) exists (r = Dani) Name(v, r).
    exists (p = u) exists (q = v) exists (r = Dani) loves(u, q) && Name(q, r).
    exists (p = u) exists (q = v) exists (r = Dani) Name(p, Mel) && loves(p, q) && Name(q, r).
    `)));
  });

  class CRPRO {
   find({gen, num}, head) {
    return head.find((ref) => {
      return ref.types.gen == gen && ref.types.num == num
     });
   }
   match(node, head) {
    let matcher1 = S(NP(PRO(capture("pronoun"))), VP_(capture("?")));
    let m1 = match(matcher1, node);

    if (m1) {
     let ref = this.find(m1.pronoun.types, head);
     if (!ref) {
      throw new Error("Invalid reference");
     }
     node.children[0] = ref;
    }

    let matcher2 = VP(V(), NP(PRO(capture("pronoun"))));
    let m2 = match(matcher2, node.children[1].children[0]);

    // The types of head[2] agree with the types of the pronoun,
    // so bind it to it.
    if (m2) {
     let ref = this.find(m2.pronoun.types, head);
     if (!ref) {
      throw new Error("Invalid Reference");
     }
     node.children[1].children[0].children[1] = ref;
    }
   }
  }

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);
    
    let [head, body] = new CRPN().match(sentence);

    let rule = new CRPRO();
    rule.match(node, head);

    assertThat(transcribe(node)).equalsTo("v fascinates u");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Mel loves Dani."), true);
    let node = first(parse("She fascinates him."), true);
    
    let [head, body] = new CRPN().match(sentence);

    let rule = new CRPRO();
    rule.match(node, head);

    assertThat(transcribe(node)).equalsTo("v fascinates u");
  });

  it("CR.PRO invalid reference", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates her."), true);

    let [head, body] = new CRPN().match(sentence);
    
    let rule = new CRPRO();
    try {
     // Ulysses is a -hum and Jones is male, so
     // the pronoun "her" should fail.
     rule.match(node, head);
     throw new Error();
    } catch ({message}) {
     assertThat(message).equalsTo("Invalid Reference");
    }
  });

  class CRID {
   match(node) {
    let matcher = VP(V(), NP(DET(capture("det")), N(capture("noun"))));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    if (m && m.det.children[0] == "a") {
     head.push(Referent("d"));
     let n = clone(m.noun);
     n.ref = Referent("d");
     body.push(n);
     node.children[1] = Referent("d");
    }

    return [head, body];
   }
  }

  class CRLIN {
   match(node) {
    let matcher = N(capture("noun"));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    if (m && 
        m.noun.ref && 
        m.noun.children.length == 1 &&
        typeof m.noun.children[0] == "string") {
     let name = m.noun.children[0];
     let ref = m.noun.ref.name;

     for (let key in node) {
      delete node[key];
     }
     Override.assign(node, predicate(name, [arg(ref)]));
    }

    return [head, body];
   }
  }

  it("CR.ID", function() {
    let node = first(parse("Jones owns a porsche."), true);

    let rule = new CRID();
    
    let [head, body] = rule.match(node.children[1].children[0]);

    assertThat(transcribe(node)).equalsTo("Jones owns d");

    // One new discourse referents introduced.
    assertThat(head.length).equalsTo(1);
    assertThat(head[0].name).equalsTo("d");

    // Two new conditions added to the body.
    assertThat(body.length).equalsTo(1);
    assertThat(transcribe(body[0])).equalsTo("porsche");

    // Noun predicates added.
    new CRLIN().match(body[0]);
    assertThat(Forward.stringify(body[0])).equalsTo("porsche(d)");

    // Before we compile, we have to pass through the 
    // construction rules for the proper name too.
    new CRPN().match(node);

    assertThat(transcribe(node)).equalsTo("u owns d");

    // PNs rewritten.
    let result = new Compiler().compile(node);

    assertThat(Forward.stringify(result)).equalsTo("owns(u, d)");
   });

  class Override {
   static assign(a, b) {
     for (let key in a) {
      delete a[key];
     }
     Object.assign(a, b);
   }
  }

  class CRNRC {
   match(node) {
    let matcher = N(N(), RC(capture("rc")));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    if (m) {
     // console.log("hi");
     let rc = node.children.pop();

     let s = rc.children[1];
     // Binds gap to the referent.
     s.children[1].children[0].children[1] = node.ref;
     // console.log(JSON.stringify(s, undefined, 2));

     body.push(s);

     let noun = node.children.pop();
     noun.ref = node.ref;
     Override.assign(node, noun);

     // console.log(m.rc);
     // head.push(Referent("d"));
     // body.push(predicate(m.noun.children[0], [arg("d")]));
     // node.children[1].children[0].children[1] = Referent("d");
    }

    return [head, body];
   }
  }

  function transcribe(node) {
   if (typeof node == "string") {
    return node;
   } else if (node["@type"] == "Referent") {
    return node.name;
   }
   let result = [];
   // console.log(node);
   for (let child of node.children || []) {
    // console.log(child);
    result.push(transcribe(child));
   }
   return result.join(" ").trim();
  }

  it("CR.NRC", function() {
    let node = first(parse("Jones owns a book which Smith likes."), true);

    // Breaks into:
    // - Jones(u)
    // - u owns a book which Smith likes.
    let [h, [jones]] = new CRPN().match(node);
    assertThat(Forward.stringify(jones))
     .equalsTo("Name(u, Jones)");
    assertThat(transcribe(node))
     .equalsTo("u owns a book which Smith likes");

    // Breaks into:
    // - Jones(u)
    // - u owns d
    // - N(d) => a book which Smith likes
    let [ref, [id]] = new CRID().match(node.children[1].children[0]);
    assertThat(transcribe(node)).equalsTo("u owns d");
    assertThat(transcribe(id)).equalsTo("book which Smith likes");

    let rule = new CRNRC();

    // Breaks "a book which Smith likes" into:
    //   - N(d) => a book
    //   - Smith likes d.
    let [head, [rc]] = rule.match(id);
    assertThat(transcribe(id)).equalsTo("book");
    assertThat(transcribe(rc)).equalsTo("Smith likes d");

    // Breaks N(d) => a book into:
    //   - book(d)
    new CRLIN().match(id);

    // Noun predicates added.
    assertThat(Forward.stringify(id)).equalsTo("book(d)");

    // One new discourse referents introduced.
    assertThat(head.length).equalsTo(0);

    let [h2, [smith]] = new CRPN().match(rc);
    assertThat(transcribe(rc)).equalsTo("u likes d");
    assertThat(Forward.stringify(smith)).equalsTo("Name(u, Smith)");

    assertThat(Forward.stringify(new Compiler().compile(rc)))
     .equalsTo("likes(u, d)");
    
    new CRPN().match(node);

    assertThat(Forward.stringify(new Compiler().compile(node)))
     .equalsTo("owns(u, d)");
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});