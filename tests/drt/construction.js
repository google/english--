const Assert = require("assert");
const Forward = require("../../src/logic/forward.js");
const {Reasoner} = require("../../src/logic/fol.js");
const {rewrite} = require("../../src/logic/unify.js");

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
  nodes} = require("../../src/drt/drt.js");

const {
 S, NP, NP_, PN, VP_, VP, V, DET, N, PRO, AUX, RC, RPRO, GAP, 
 Discourse, Sentence
} = nodes;

const Logic = require("../../src/logic/parser.js");
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

  it("Keeps types", function() {
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

    let result = [[], []];

    let m1 = match(matcher1, node);
    if (m1) {
     let name = m1.name.children[0];
     let ref = Referent("u", m1.name.types);
     result[0].push(ref);
     let pn = clone(m1.name);
     pn.ref = ref;
     result[1].push(pn);
     node.children[0] = ref;
    }

    let matcher2 = VP(V(), NP(PN(capture("name"))));
    let m2 = match(matcher2, node);
    // console.log(`] ${node["@type"]}`);
    if (m2) {
     // console.log("hi");
     let name = m2.name.children[0];
     let ref = Referent("v", m2.name.types);
     result[0].push(ref);
     let pn = clone(m2.name);
     pn.ref = ref;
     result[1].push(pn);
     node.children[1].children[0] = ref;
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

  it("CR.PN", function() {
    let node = first(parse("Mel loves Dani."), true);
    let rule = new CRPN();
    let [[u], [mel]] = rule.match(node);

    // One new discourse referents introduced.
    assertThat(u.name).equalsTo("u");
    // Name predicates added.
    assertThat(transcribe(mel)).equalsTo("Mel(u)");
 
    let [[v], [dani]] = rule.match(node.children[1].children[0]);
    // One new discourse referents introduced.
    assertThat(v.name).equalsTo("v");
    // Name predicates added.
    assertThat(transcribe(dani)).equalsTo("Dani(v)");

    // PNs rewritten.
    assertThat(transcribe(node)).equalsTo("u loves v");
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
    let m2 = match(matcher2, node);

    // The types of head[2] agree with the types of the pronoun,
    // so bind it to it.
    if (m2) {
     let ref = this.find(m2.pronoun.types, head);
     if (!ref) {
      throw new Error("Invalid Reference");
     }
     node.children[1].children[0] = ref;
    }
   }
  }

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);
    
    let [[u], [jones]] = new CRPN().match(sentence);
    let [[v], [ulysses]] = new CRPN().match(sentence.children[1].children[0]);

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(node.children[1].children[0], [u, v]);

    assertThat(transcribe(node)).equalsTo("v fascinates u");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Mel loves Dani."), true);
    let node = first(parse("She fascinates him."), true);
    
    let [[u], [mel]] = new CRPN().match(sentence);
    let [[v], [dani]] = new CRPN().match(sentence.children[1].children[0]);

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(node.children[1].children[0], [u, v]);

    assertThat(transcribe(node)).equalsTo("v fascinates u");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates her."), true);

    let [[u], [jones]] = new CRPN().match(sentence);
    let [[v], [ulysses]] = new CRPN().match(sentence.children[1].children[0]);
    
    let rule = new CRPRO();
    try {
     // Ulysses is a -hum and Jones is male, so
     // the pronoun "her" should fail.
     rule.match(node.children[1].children[0], [u, v]);
     throw new Error();
    } catch ({message}) {
     assertThat(message).equalsTo("Invalid Reference");
    }
  });

  class CRID {
   match(node) {
    let head = [];
    let body = [];

    let matcher1 = VP(V(), NP(DET(capture("det")), N(capture("noun"))));
    let m1 = match(matcher1, node);

    if (m1 && m1.det.children[0] == "a") {
     head.push(Referent("d"));
     let n = clone(m1.noun);
     n.ref = Referent("d");
     body.push(n);
     node.children[1] = Referent("d");
    }

    let matcher2 = S(NP(DET(capture("det")), N(capture("noun"))), VP_());
    let m2 = match(matcher2, node);

    if (m2 && m2.det.children[0].toLowerCase() == "a") {
     head.push(Referent("d"));
     let n = clone(m2.noun);
     n.ref = Referent("d");
     body.push(n);
     node.children[0] = Referent("d");
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

    return [head, body];

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
    assertThat(transcribe(body[0])).equalsTo("porsche(d)");

    // Noun predicates added.
    new CRLIN().match(body[0]);
    assertThat(transcribe(body[0])).equalsTo("porsche(d)");

    // Before we compile, we have to pass through the 
    // construction rules for the proper name too.
    new CRPN().match(node);

    assertThat(transcribe(node)).equalsTo("u owns d");
   });

  it("CR.ID", function() {
    let node = first(parse("A man likes Jones."), true);

    let rule = new CRID();
    
    let [head, [id]] = rule.match(node);

    assertThat(transcribe(node)).equalsTo("d likes Jones");

    new CRLIN().match(id);

    assertThat(transcribe(id)).equalsTo("man(d)");

    new CRPN().match(node.children[1].children[0]);

    assertThat(transcribe(node)).equalsTo("d likes v");
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

    // console.log(`> ${node["@type"]}`);
    // console.log(node);

    if (m) {
     let rc = node.children.pop();

     let s = rc.children[1];
     // Binds gap to the referent.
     let object = s.children[1].children[0].children[1];
     if (object.children[0]["@type"] == "GAP") {
      Override.assign(object, node.ref);
     }

     let subject = s.children[0];
     if (subject.children[0]["@type"] == "GAP") {
      Override.assign(subject, node.ref);
     }

     body.push(s);

     let noun = node.children.pop();
     noun.ref = node.ref;
     Override.assign(node, noun);
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
   for (let child of node.children || []) {
    result.push(transcribe(child));
   }
   let suffix = node.ref ? `(${node.ref.name})` : "";
   return result.join(" ").trim() + suffix;
  }

  it("CR.NRC", function() {
    let node = first(parse("Jones owns a book which Smith likes."), true);

    let [h, [jones]] = new CRPN().match(node);
    assertThat(transcribe(jones))
     .equalsTo("Jones(u)");
    assertThat(transcribe(node))
     .equalsTo("u owns a book which Smith likes");

    let [ref, [id]] = new CRID().match(node.children[1].children[0]);
    assertThat(transcribe(node)).equalsTo("u owns d");
    assertThat(transcribe(id)).equalsTo("book which Smith likes(d)");

    let rule = new CRNRC();

    let [head, [rc]] = rule.match(id);
    assertThat(transcribe(id)).equalsTo("book(d)");
    assertThat(transcribe(rc)).equalsTo("Smith likes d");

    new CRLIN().match(id);

    assertThat(transcribe(id)).equalsTo("book(d)");

    assertThat(head.length).equalsTo(0);

    let [h2, [smith]] = new CRPN().match(rc);
    assertThat(transcribe(rc)).equalsTo("u likes d");
    assertThat(transcribe(smith)).equalsTo("Smith(u)");
    
    new CRPN().match(node);

    assertThat(transcribe(node)).equalsTo("u owns d");
   });

  it("CR.NRC", function() {
    let node = first(parse("A man who likes Smith owns a book."), true);

    let [d, [id]] = new CRID().match(node);

    assertThat(transcribe(node)).equalsTo("d owns a book");
    assertThat(transcribe(id)).equalsTo("man who likes Smith(d)");
    assertThat(id.ref.name).equalsTo("d");

    let [b, [rc]] = new CRNRC().match(id);

    assertThat(transcribe(id)).equalsTo("man(d)");
    assertThat(transcribe(rc)).equalsTo("d likes Smith");

    new CRPN().match(rc.children[1].children[0]);

    assertThat(transcribe(rc)).equalsTo("d likes v");

    new CRID().match(node.children[1].children[0]);

    // TODO(goto): introduce newly minted variables
    assertThat(transcribe(node)).equalsTo("d owns d");
  });

  class DRS {
   constructor() {
    this.head = [];
    this.body = [];
    this.rules = [new CRPN(), new CRID(), new CRNRC()];
   }

   feed(node) {
    let queue = [node];

    this.body.push(node);

    while (queue.length > 0) {
     let p = queue.shift();
     // breadth first search: iterate over
     // this level first ...
     for (let rule of this.rules) {
      let [head, body] = rule.match(p);
      this.head.push(...head);
      this.body.push(...body);
      queue.push(...body);
     }
     // ... and recurse.
     let next = (p.children || [])
      .filter(c => c["@type"]);
     queue.push(...next);
    }
   }

   serialize() {
    let result = [];
    let refs = [];
    for (let ref of this.head) {
     refs.push(`${ref.name}`);
    }

    result.push(refs.join(", "));
    result.push("");

    for (let cond of this.body) {
     result.push(transcribe(cond));
    }

    return result.join("\n");
   }
  }

  it("DRS: CRPN", function() {
    let node = first(parse("Mel loves Dani."), true);
    let drs = new DRS();
    drs.feed(node);

    assertThat(drs)
     .equalsTo(`
       u, v

       u loves v
       Mel(u)
       Dani(v)
     `);
  });

  it("DRS: CRID", function() {
    let node = first(parse("A man loves Dani."), true);
    let drs = new DRS();
    drs.feed(node);

    assertThat(drs)
     .equalsTo(`
       d, v

       d loves v
       man(d)
       Dani(v)
     `);
  });

  it("DRS: CRID", function() {
    let node = first(parse("Dani loves a man."), true);
    let drs = new DRS();
    drs.feed(node);

    assertThat(drs)
     .equalsTo(`
       u, d

       u loves d
       Dani(u)
       man(d)
     `);
  });

  it("DRS: CRNRC", function() {
    let node = first(parse("A man who loves Dani fascinates Anna."), true);
    let drs = new DRS();
    drs.feed(node);

    assertThat(drs)
     .equalsTo(`
       d, v, v

       d fascinates v
       man(d)
       d loves v
       Anna(v)
       Dani(v)
     `);
  });

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

  it.skip("Interpreter", function() {
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

  let trim = (str) => str.trim().split("\n").map(line => line.trim()).join("\n");

  function assertThat(x) {
   return {
    equalsTo(y) {

     if (x instanceof DRS) {
      assertThat(x.serialize()).equalsTo(trim(y));
      return;
     }

     Assert.deepEqual(x, y);
    }
   }
  }

});