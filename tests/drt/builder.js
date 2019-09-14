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
  nodes} = require("../../src/drt/parser.js");

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

describe("DRT Builder", function() {

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

    let root = first(parse("Mel owns a book."), true);
    assertThat(root.children[1].children[0].children[1].types)
     .equalsTo({"case": "-nom", "gap": "-", "gen": "-hum", "num": "sing"});
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
    if (typeof a.children[i] == "string") {
     if (a.children[i] != b.children[i]) {
      return false;
     }
    } else if (a.children[i]["@type"] == "Match") {
     result[a.children[i].name] = b;
     continue;
    } else {
     let capture = match(a.children[i], b.children[i]);
     if (!capture) {
      return false;
     }

     result = Object.assign(result, capture);
    }
   }

   return result;
  }

  it("match", function() {
    let s = first(parse("Mel loves Dani."));
    let m1 = S(NP(PN(capture("name"))), VP_());
    assertThat(match(m1, s)).equalsTo({name: PN("Mel")});
    let m2 = S(NP(), VP_(VP(V(), NP(PN(capture("name"))))));
    assertThat(match(m2, s)).equalsTo({name: PN("Dani")});

    let m3 = S(NP(), VP_(AUX("does"), "not", VP(capture("vp"))));
    let s3 = first(parse("Jones does not love Smith."));
    assertThat(transcribe(match(m3, s3).vp))
     .equalsTo("love Smith");
   });

  class Referent {
   constructor(name, types) {
    this.name = name;
    this.types = types;
   }
  }

  let arg = (x, free) => argument(Logic.Parser.literal(x), undefined, free);

  class Compiler {
   compile(node) {
    // Maps to Logic
    let matcher = S(REF("", {}, [capture("alpha")]), 
                    VP_(VP(V(capture("verb")), REF("", {}, [capture("beta")]))));
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

  class Ids {
   constructor() {
    this.gen = (function*() {
      let i = 0;
      while (true) {
       let char = i % 26;
       let round = Math.floor(i / 26);
       yield `${String.fromCharCode(97 + char)}${round > 0 ? round : ""}`;
       i++;
      }
     })();
   }
   get() {
    return this.gen.next().value;
   }
  }

  it("ids", function() {
    let ids = new Ids();
    // First 26 characters are from a-z
    assertThat(ids.get()).equalsTo("a");
    assertThat(ids.get()).equalsTo("b");
    assertThat(ids.get()).equalsTo("c");
    for (let i = 0; i < (25 - 3); i++) {
     // kills the next 22 chars
     ids.get();
    }
    assertThat(ids.get()).equalsTo("z");
    assertThat(ids.get()).equalsTo("a1");
    assertThat(ids.get()).equalsTo("b1");
  });

  class Rule {
   constructor(ids) {
    this.ids = ids || new Ids();
   }

   id() {
    return this.ids.get();
   }
  }

  class CRPN extends Rule {
   match(node) {
    let matcher1 = S(NP(PN(capture("name"))), VP_());

    let result = [[], []];

    let m1 = match(matcher1, node);
    if (m1) {
     let name = m1.name.children[0];
     let ref = new Referent(this.id(), m1.name.types);
     result[0].push(ref);
     let pn = clone(m1.name);
     pn.ref = ref;
     result[1].push(pn);
     node.children[0] = ref;
    }

    let matcher2 = VP(V(), NP(PN(capture("name"))));
    let m2 = match(matcher2, node);
    if (m2) {
     let name = m2.name.children[0];
     let ref = new Referent(this.id(), m2.name.types);
     result[0].push(ref);
     let pn = clone(m2.name);
     pn.ref = ref;
     result[1].push(pn);
     node.children[1].children[0] = ref;
    }

    return result;
   }
  }
  
  it("CR.PN", function() {
    let node = first(parse("Mel loves Dani."), true);
    let rule = new CRPN();
    let [[u], [mel]] = rule.match(node);

    // One new discourse referents introduced.
    assertThat(u.name).equalsTo("a");
    // Name predicates added.
    assertThat(transcribe(mel)).equalsTo("Mel(a)");
 
    let [[v], [dani]] = rule.match(node.children[1].children[0]);
    // One new discourse referents introduced.
    assertThat(v.name).equalsTo("b");
    // Name predicates added.
    assertThat(transcribe(dani)).equalsTo("Dani(b)");

    // PNs rewritten.
    assertThat(transcribe(node)).equalsTo("a loves b");
   });

  class CRPRO extends Rule {
   find({gen, num}, refs) {
    return refs.find((ref) => {
      return ref.types.gen == gen && ref.types.num == num
     });
   }
   match(node, refs) {
    // console.log("hi");
    let head = [];
    let body = [];
    let matcher1 = S(NP(PRO(capture("pronoun"))), VP_(capture("?")));
    let m1 = match(matcher1, node);

    if (m1) {
     let u = this.find(m1.pronoun.types, refs);
     if (!u) {
      // console.log(refs);
      throw new Error("Invalid reference: " + transcribe(node));
     }
     node.children[0] = u;
    }

    let matcher2 = VP(V(), NP(PRO(capture("pronoun"))));
    let m2 = match(matcher2, node);

    // The types of head[2] agree with the types of the pronoun,
    // so bind it to it.
    if (m2) {
     let ref = this.find(m2.pronoun.types, refs);
     if (!ref) {
      throw new Error("Invalid Reference: " + transcribe(node));
     }
     node.children[1].children[0] = ref;
    }
    return [head, body];
   }
  }

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);

    let crpn = new CRPN();
    let [[u], [jones]] = crpn.match(sentence);
    let [[v], [ulysses]] = crpn.match(sentence.children[1].children[0]);

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(node.children[1].children[0], [u, v]);

    assertThat(transcribe(node)).equalsTo("b fascinates a");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Mel loves Dani."), true);
    let node = first(parse("She fascinates him."), true);
    
    let crpn = new CRPN();
    let [[u], [mel]] = crpn.match(sentence);
    let [[v], [dani]] = crpn.match(sentence.children[1].children[0]);

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(node.children[1].children[0], [u, v]);

    assertThat(transcribe(node)).equalsTo("b fascinates a");
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
     assertThat(message).equalsTo("Invalid Reference: fascinates her");
    }
  });

  class CRID extends Rule {
   match(node) {
    let head = [];
    let body = [];

    let matcher1 = VP(V(), NP(DET(capture("det")), N(capture("noun"))));
    let m1 = match(matcher1, node);

    if (m1 && m1.det.children[0] == "a") {
     let ref = new Referent(this.id(), m1.noun.types);
     head.push(ref);
     let n = clone(m1.noun);
     n.ref = ref;
     body.push(n);
     node.children[1] = ref;
    }

    let matcher2 = S(NP(DET(capture("det")), N(capture("noun"))), VP_());
    let m2 = match(matcher2, node);

    if (m2 && m2.det.children[0].toLowerCase() == "a") {
     let ref = new Referent(this.id());
     head.push(ref);
     let n = clone(m2.noun);
     n.ref = ref;
     body.push(n);
     node.children[0] = ref;
    }

    return [head, body];
   }
  }

  class CRLIN extends Rule {
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
     let u = m.noun.ref.name;

     for (let key in node) {
      delete node[key];
     }
     Override.assign(node, predicate(name, [arg(u)]));
    }

    return [head, body];
   }
  }

  it("CR.ID", function() {
    let ids = new Ids();

    let node = first(parse("Jones owns a porsche."), true);

    let rule = new CRID(ids);
    
    let [head, body] = rule.match(node.children[1].children[0]);

    assertThat(transcribe(node)).equalsTo("Jones owns a");

    // One new discourse referents introduced.
    assertThat(head.length).equalsTo(1);
    assertThat(head[0].name).equalsTo("a");

    // Two new conditions added to the body.
    assertThat(body.length).equalsTo(1);
    assertThat(transcribe(body[0])).equalsTo("porsche(a)");

    // Noun predicates added.
    new CRLIN(ids).match(body[0]);
    assertThat(transcribe(body[0])).equalsTo("porsche(a)");

    // Before we compile, we have to pass through the 
    // construction rules for the proper name too.
    new CRPN(ids).match(node);

    assertThat(transcribe(node)).equalsTo("b owns a");
   });

  it("CR.ID", function() {
    let ids = new Ids();

    let node = first(parse("A man likes Jones."), true);

    let rule = new CRID(ids);
    
    let [head, [id]] = rule.match(node);

    assertThat(transcribe(node)).equalsTo("a likes Jones");

    new CRLIN(ids).match(id);

    assertThat(transcribe(id)).equalsTo("man(a)");

    new CRPN(ids).match(node.children[1].children[0]);

    assertThat(transcribe(node)).equalsTo("a likes b");
  });


  class Override {
   static assign(a, b) {
     for (let key in a) {
      delete a[key];
     }
     Object.assign(a, b);
   }
  }

  class CRNRC extends Rule {
   match(node) {
    let matcher = N(N(), RC(capture("rc")));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    if (m) {
     let rc = node.children.pop();

     let s = rc.children[1];
     // Binds gap to the referent.
     let object = s.children[1].children[0].children[1];
     if (object.children[0]["@type"] == "GAP") {
      object.children[0] = node.ref;
     }

     let subject = s.children[0];
     if (subject.children[0]["@type"] == "GAP") {
      subject.children[0] = node.ref;
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
   } else if (node instanceof Referent) {
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
    let ids = new Ids();

    let node = first(parse("Jones owns a book which Smith likes."), true);

    let [h, [jones]] = new CRPN(ids).match(node);
    assertThat(transcribe(jones))
     .equalsTo("Jones(a)");
    assertThat(transcribe(node))
     .equalsTo("a owns a book which Smith likes");

    let [ref, [id]] = new CRID(ids).match(node.children[1].children[0]);
    assertThat(transcribe(node)).equalsTo("a owns b");
    assertThat(transcribe(id)).equalsTo("book which Smith likes(b)");

    let rule = new CRNRC(ids);

    let [head, [rc]] = rule.match(id);
    assertThat(transcribe(id)).equalsTo("book(b)");
    assertThat(transcribe(rc)).equalsTo("Smith likes b");

    new CRLIN(ids).match(id);

    assertThat(transcribe(id)).equalsTo("book(b)");

    assertThat(head.length).equalsTo(0);

    let [h2, [smith]] = new CRPN(ids).match(rc);
    assertThat(transcribe(rc)).equalsTo("c likes b");
    assertThat(transcribe(smith)).equalsTo("Smith(c)");
    
    new CRPN(ids).match(node);

    assertThat(transcribe(node)).equalsTo("a owns b");
   });

  it("CR.NRC", function() {
    let ids = new Ids();

    let node = first(parse("A man who likes Smith owns a book."), true);

    let [d, [id]] = new CRID(ids).match(node);

    assertThat(transcribe(node)).equalsTo("a owns a book");
    assertThat(transcribe(id)).equalsTo("man who likes Smith(a)");
    assertThat(id.ref.name).equalsTo("a");

    let [b, [rc]] = new CRNRC(ids).match(id);

    assertThat(transcribe(id)).equalsTo("man(a)");
    assertThat(transcribe(rc)).equalsTo("a likes Smith");

    new CRPN(ids).match(rc.children[1].children[0]);

    assertThat(transcribe(rc)).equalsTo("a likes b");

    new CRID(ids).match(node.children[1].children[0]);

    // TODO(goto): introduce newly minted variables
    assertThat(transcribe(node)).equalsTo("a owns c");
  });

  class CRNEG extends Rule {
   match(node) {
    let matcher = S(NP(), VP_(AUX("does"), "not", VP(capture("vp"))));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    if (!m) {
     return [head, body];
    }

    // console.log("hi");

    // let name = m.noun.children[0];
    // let ref = m.noun.ref.name;

    //for (let key in node) {
    // delete node[key];
    //}

    // Override.assign(node, predicate(name, [arg(ref)]));

    return [head, body];
   }
  }

  it.skip("CR.NEG", function() {
    let ids = new Ids();

    let node = first(parse("Jones does not own a porsche."), true);

    new CRNEG(ids).match(node);

    return;

    let [d, [id]] = new CRID(ids).match(node);

    assertThat(transcribe(node)).equalsTo("a owns a book");
    assertThat(transcribe(id)).equalsTo("man who likes Smith(a)");
    assertThat(id.ref.name).equalsTo("a");

    let [b, [rc]] = new CRNRC(ids).match(id);

    assertThat(transcribe(id)).equalsTo("man(a)");
    assertThat(transcribe(rc)).equalsTo("a likes Smith");

    new CRPN(ids).match(rc.children[1].children[0]);

    assertThat(transcribe(rc)).equalsTo("a likes b");

    new CRID(ids).match(node.children[1].children[0]);

    // TODO(goto): introduce newly minted variables
    assertThat(transcribe(node)).equalsTo("a owns c");
  });

  class DRS {
   constructor(rules) {
    this.head = [];
    this.body = [];
    let ids = new Ids();
    this.rules = rules ? rules :
     [new CRPN(ids), 
      new CRID(ids), 
      new CRNRC(ids), 
      new CRPRO(ids)];
   }

   feed(s) {
    let node = first(parse(s), true);

    let queue = [node];

    this.body.push(node);

    while (queue.length > 0) {
     let p = queue.shift();
     // breadth first search: iterate over
     // this level first ...
     for (let rule of this.rules) {
      let [head, body] = rule.match(p, this.head);
      this.head.push(...head);
      this.body.push(...body);
      queue.push(...body);
     }
     // ... and recurse.
     let next = (p.children || [])
      .filter(c => c["@type"]);
     queue.push(...next);
    }

    return this;
   }

   print() {
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

  it("DRS", function() {
    class TestRule extends Rule {
     match(node) {
      return [[], []];
     }
    }

    let drs = new DRS([new TestRule()]);

    drs.feed("Mel loves Dani.");

    assertThat(drs.head).equalsTo([]);
    assertThat(drs.body.length).equalsTo(1);
    assertThat(transcribe(drs.body[0]))
      .equalsTo("Mel loves Dani");
  });

  it("Mel loves Dani.", function() {
    assertThat("Mel loves Dani.", true)
     .equalsTo(true, `
       a, b

       a loves b
       Mel(a)
       Dani(b)
    `);
  });

  it("A man loves Dani.", function() {
    assertThat("A man loves Dani.")
     .equalsTo(true, `
       a, b

       a loves b
       man(a)
       Dani(b)
     `);
  });

  it("Dani loves a man.", function() {
    assertThat("Dani loves a man.")
     .equalsTo(true, `
       a, b

       a loves b
       Dani(a)
       man(b)
     `);
  });

  it("A man who loves Dani fascinates Anna.", function() {
    assertThat("A man who loves Dani fascinates Anna.")
     .equalsTo(true, `
       a, b, c

       a fascinates b
       man(a)
       a loves c
       Anna(b)
       Dani(c)
     `);
  });

  it("Mel loves a book which fascinates Anna.", function() {
    assertThat("Mel loves a book which fascinates Anna.")
     .equalsTo(true, `
       a, b, c

       a loves b
       Mel(a)
       book(b)
       b fascinates c
       Anna(c)
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(true, `
       a, b, c

       a owns b
       Jones(a)
       book(b)
       c loves b
       Smith(c)
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(true, `
       a, b

       a owns b
       Jones(a)
       book(b)
       b fascinates a
     `);
  });

  it("A man who fascinates Dani loves a book which fascinates Anna.", function() {
    assertThat("A man who fascinates Dani loves a book which fascinates Anna.")
     .equalsTo(true, `
       a, b, c, d

       a loves b
       man(a)
       a fascinates c
       book(b)
       b fascinates d
       Dani(c)
       Anna(d)
     `);
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat("Jones owns Ulysses. It fascinates him.")
     .equalsTo(true, `
       a, b

       a owns b
       Jones(a)
       Ulysses(b)
       b fascinates a
     `);
  });

  it("Mel owns a book.", function() {
    assertThat("Mel owns a book. It fascinates him.")
     .equalsTo(true, `
       a, b

       a owns b
       Mel(a)
       book(b)
       b fascinates a
     `);
  });

  it("Mel owns a book. It fascinates him. Dani loves him.", function() {
    assertThat("Mel owns a book. It fascinates him. Dani loves him.")
     .equalsTo(true, `
       a, b, c

       a owns b
       Mel(a)
       book(b)
       b fascinates a
       c loves a
       Dani(c)
     `);
  });

  function trim (str) {
   return str
    .trim()
    .split("\n")
    .map(line => line.trim())
    .join("\n");
  };

  function assertThat(x) { 
  return {
    equalsTo(y, z) {
     if (!z) {
       Assert.deepEqual(x, y);
       return;
     }

     let drs = new DRS();

     for (let s of x.split(".")) {
      if (s == "") {
       continue;
      }
      drs.feed(s.trim() + ".");
     }
     assertThat(drs.print()).equalsTo(trim(z));
    }
   }
  }

});