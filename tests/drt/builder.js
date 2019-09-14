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
   if (!b || a["@type"] != b["@type"]) {
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

    let head = [];
    let body = [];
    let result = node;

    let m1 = match(matcher1, node);
    if (m1) {
     let name = m1.name.children[0];
     let ref = new Referent(this.id(), m1.name.types);
     head.push(ref);
     let pn = m1.name;
     pn.ref = ref;
     body.push(pn);
     node.children[0] = ref;
    }

    let matcher2 = VP(V(), NP(PN(capture("name"))));
    let m2 = match(matcher2, node);
    if (m2) {
     let name = m2.name.children[0];
     let ref = new Referent(this.id(), m2.name.types);
     head.push(ref);
     let pn = m2.name;
     pn.ref = ref;
     body.push(pn);
     result.children[1].children[0] = ref;
    }

    return [head, body, [], []];
   }
  }

  class Referent {
   constructor(name, types) {
    this["@type"] = "Referent";
    this["types"] = types;
    this.name = name;
   }
  }

  function print(node) {
   return transcribe(node);
  }

  function child(node, ...path) {
   let result = node;
   for (let i of path) {
    result = result.children[i];
   }
   return result;
  }

  it("CR.PN", function() {
    let node = first(parse("Mel loves Dani."), true);
    let rule = new CRPN();
    let [[u], [mel]] = rule.match(node);

    // One new discourse referents introduced.
    assertThat(u.name).equalsTo("a");
    // Name predicates added.
    assertThat(print(mel)).equalsTo("Mel(a)");
 
    assertThat(print(node)).equalsTo("a loves Dani");

    let [[v], [dani]] = rule.match(child(node, 1, 0));
    // One new discourse referents introduced.
    assertThat(v.name).equalsTo("b");
    // Name predicates added.
    assertThat(print(dani)).equalsTo("Dani(b)");

    // PNs rewritten.
    assertThat(print(node)).equalsTo("a loves b");
   });

  class CRPRO extends Rule {
   find({gen, num}, refs) {
    return refs.find((ref) => {
      return ref.types.gen == gen && ref.types.num == num
     });
   }
   match(node, refs) {
    let head = [];
    let body = [];
    let matcher1 = S(NP(PRO(capture("pronoun"))), VP_(capture("?")));
    let m1 = match(matcher1, node);

    if (m1) {
     let u = this.find(m1.pronoun.types, refs);
     if (!u) {
      throw new Error("Invalid reference: " + m1.pronoun.children[0]);
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
      throw new Error("Invalid Reference: " + m2.pronoun.children[0]);
     }
     node.children[1].children[0] = ref;
    }
    return [head, body, [], []];
   }
  }

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);

    let crpn = new CRPN();
    let [[u], [jones]] = crpn.match(sentence);
    let [[v], [ulysses]] = crpn.match(child(sentence, 1, 0));

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(ulysses)).equalsTo("Ulysses(b)");

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(child(node, 1, 0), [u, v]);

    assertThat(print(node)).equalsTo("b fascinates a");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Mel loves Dani."), true);
    let node = first(parse("She fascinates him."), true);
    
    let crpn = new CRPN();
    let [[u], [mel]] = crpn.match(sentence);
    let [[v], [dani]] = crpn.match(child(sentence, 1, 0));

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(child(node, 1, 0), [u, v]);

    assertThat(print(node)).equalsTo("b fascinates a");
  });

  it("CR.PRO", function() {
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates her."), true);

    let [[u], [jones]] = new CRPN().match(sentence);
    let [[v], [ulysses]] = new CRPN().match(child(sentence, 1, 0));
    
    let rule = new CRPRO();
    try {
     // Ulysses is a -hum and Jones is male, so
     // the pronoun "her" should fail.
     rule.match(child(node, 1, 0), [u, v]);
     throw new Error();
    } catch ({message}) {
     assertThat(message).equalsTo("Invalid Reference: her");
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
     let n = m1.noun;
     n.ref = ref;
     body.push(n);
     node.children[1] = ref;
    }

    let matcher2 = S(NP(DET(capture("det")), N(capture("noun"))), VP_());
    let m2 = match(matcher2, node);

    if (m2 && m2.det.children[0].toLowerCase() == "a") {
     let ref = new Referent(this.id());
     head.push(ref);
     let n = m2.noun;
     n.ref = ref;
     body.push(n);
     node.children[0] = ref;
    }

    return [head, body, [], []];
   }
  }

  class CRLIN extends Rule {
   match(node) {
    let matcher = N(capture("noun"));
    let m = match(matcher, node);

    let head = [];
    let body = [];

    return [head, body, [], []];

    if (m && 
        m.noun.ref && 
        m.noun.children.length == 1 &&
        typeof m.noun.children[0] == "string") {
     let name = m.noun.children[0];
     let u = m.noun.ref.name;
     node.assign(predicate(name, [arg(u)]));
    }

    return [head, body, [], []];
   }
  }

  it("CR.ID", function() {
    let ids = new Ids();

    let node = first(parse("Jones owns a porsche."), true);

    let rule = new CRID(ids);
    
    let [head, body] = rule.match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("Jones owns a");
    
    // One new discourse referents introduced.
    assertThat(head.length).equalsTo(1);
    assertThat(head[0].name).equalsTo("a");

    // Two new conditions added to the body.
    assertThat(body.length).equalsTo(1);
    assertThat(print(body[0])).equalsTo("porsche(a)");

    // Noun predicates added.
    new CRLIN(ids).match(body[0]);
    assertThat(print(body[0])).equalsTo("porsche(a)");

    // Before we compile, we have to pass through the 
    // construction rules for the proper name too.
    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("b owns a");
   });

  it("CR.ID", function() {
    let ids = new Ids();

    let node = first(parse("A man likes Jones."), true);

    let rule = new CRID(ids);
    
    let [head, [id]] = rule.match(node);

    assertThat(print(node)).equalsTo("a likes Jones");

    new CRLIN(ids).match(id);

    assertThat(print(id)).equalsTo("man(a)");

    new CRPN(ids).match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("a likes b");
  });

  class CRNRC extends Rule {
   match(node) {
    let matcher = N(N(), RC(capture("rc")));
    let m = match(matcher, node);

    let head = [];
    let body = [];
    let remove = [];

    if (!m) {
     return [[], [], [], []];
    }

    let rc = node.children.pop();

    let s = rc.children[1];

    // let g1 = ;
    const g1 = S(NP(), VP_(AUX(), "not", VP(V(), NP(GAP(capture("gap"))))));
    if (match(g1, s)) {
     child(s, 1, 2, 1).children[0] = node.ref;
    }

    // Binds gap to the referent.
    let object = child(s, 1, 0, 1);
    if (object && object.children[0]["@type"] == "GAP") {
     object.children[0] = node.ref;
    }
    
    let subject = s.children[0];
    if (subject.children[0]["@type"] == "GAP") {
     subject.children[0] = node.ref;
    }

    let noun = node.children.pop();
    noun.ref = node.ref;
    body.push(noun);
    remove.push(node);
    
    body.push(s);
    
    return [head, body, [], remove];
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
    let ids = new Ids();

    let node = first(parse("Jones owns a book which Smith likes."), true);

    let [h, [jones], subs, [remove]] = new CRPN(ids).match(node);

    assertThat(print(jones))
     .equalsTo("Jones(a)");
    assertThat(print(node))
     .equalsTo("a owns a book which Smith likes");

    let [ref, [id]] = new CRID(ids).match(child(node, 1, 0));
    assertThat(print(node)).equalsTo("a owns b");
    assertThat(print(id)).equalsTo("book which Smith likes(b)");

    let rule = new CRNRC(ids);

    let [head, [book, rc]] = rule.match(id);
    assertThat(print(book)).equalsTo("book(b)");
    assertThat(print(rc)).equalsTo("Smith likes b");

    new CRLIN(ids).match(id);

    assertThat(head.length).equalsTo(0);

    let [h2, [smith]] = new CRPN(ids).match(rc);
    assertThat(print(rc)).equalsTo("c likes b");
    assertThat(print(smith)).equalsTo("Smith(c)");
    
    new CRPN(ids).match(child(node, 0));

    assertThat(print(node)).equalsTo("a owns b");
   });

  it("CR.NRC", function() {
    let ids = new Ids();

    let node = first(parse("A man who likes Smith owns a book."), true);

    let [d, [id]] = new CRID(ids).match(node);

    assertThat(print(node)).equalsTo("a owns a book");
    assertThat(print(id)).equalsTo("man who likes Smith(a)");
    assertThat(id.ref.name).equalsTo("a");

    let [b, [man, rc]] = new CRNRC(ids).match(id);

    assertThat(print(man)).equalsTo("man(a)");
    assertThat(print(rc)).equalsTo("a likes Smith");

    new CRPN(ids).match(child(rc, 1, 0));

    assertThat(print(rc)).equalsTo("a likes b");

    new CRID(ids).match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("a owns c");
  });

  it("CR.NRC with negation", function() {
    let ids = new Ids();

    let node = first(parse("Jones owns a book which he does not like."), true);

    let [refs, [jones], subs, [remove]] = new CRPN(ids).match(node);

    assertThat(print(jones))
     .equalsTo("Jones(a)");
    assertThat(print(node))
     .equalsTo("a owns a book which he does not like");

    let [ref, [id]] = new CRID(ids).match(child(node, 1, 0));
    assertThat(print(node)).equalsTo("a owns b");
    assertThat(print(id)).equalsTo("book which he does not like(b)");

    let rule = new CRNRC(ids);

    let [head, [book, rc]] = rule.match(id);
    assertThat(print(book)).equalsTo("book(b)");
    assertThat(print(rc)).equalsTo("he does not like b");

    new CRPRO(ids).match(rc, refs);

    assertThat(print(rc)).equalsTo("a does not like b");

    new CRPN(ids).match(child(node, 0));

    assertThat(print(node)).equalsTo("a owns b");
   });

  class CRNEG extends Rule {
   match(node, refs) {
    let matcher = S(capture("np"), VP_(AUX("does"), "not", VP(capture("vp"))));
    let m = match(matcher, node);

    let head = [];
    let body = [];
    let subs = [];

    if (!m) {
     return [head, body, [], []];
    }
    
    let noun = m.np.children[0];

    let sub = new DRS(this.ids);
    sub.head = clone(refs);
    sub.head.forEach(ref => ref.closure = true);
    sub.neg = true;

    let s = node;
    s.children[1].children.splice(0, 2);

    // console.log(print(s));
    sub.push(s);

    // node.assign(noun);
    // node.remove();

    return [head, body, [sub], [node]];
   }
  }

  it("CR.NEG", function() {
    let ids = new Ids();

    let node = first(parse("Jones does not own a porsche."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a does not own a porsche");

    let [head, body, subs, remove] = new CRNEG(ids).match(node, []);

    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(subs.length).equalsTo(1);
    assertThat(subs[0].print()).equalsTo(trim(`
      ~drs(b) {
        a own b
        porsche(b)
      }
    `));
  });

  class DRS {
   constructor(ids = new Ids()) {
    this.head = [];
    this.body = [];
    this.subs = [];
    this.rules = 
     [new CRPN(ids),
      new CRID(ids), 
      new CRNRC(ids), 
      new CRPRO(ids),
      new CRNEG(ids)];
   }

   feed(s) {
    this.push(first(parse(s), true));
   }

   push(node) {
    let queue = [node];

    this.body.push(node);

    while (queue.length > 0) {
     let p = queue.shift();
     // breadth first search: iterate over
     // this level first ...
     for (let rule of this.rules) {
      let [head, body, drs, remove] = rule.match(p, this.head);
      this.head.push(...head);
      this.body.push(...body);
      this.subs.push(...drs);
      for (let del of remove) {
       let i = this.body.indexOf(del);
       // console.log(i);
       this.body.splice(i, 1);
      }
      queue.push(...body);
     }
     // ... and recurse.
     let next = (p.children || [])
      .filter(c => typeof c != "string");
     queue.push(...next);
    }

    return this;
   }

   print() {
    let result = [];
    let refs = [];
    for (let ref of this.head.filter(ref => !ref.closure)) {
     refs.push(`${ref.name}`);
    }

    let args = refs.join(", ");
    let neg = this.neg ? "~" : "";
    result.push(`${neg}drs(${args}) \{`);

    for (let cond of this.body) {
     result.push(transcribe(cond));
    }

    for (let sub of this.subs) {
     result.push(sub.print());
    }

    result.push("}");
    
    return result.join("\n");
   }
  }

  it.skip("DRS", function() {
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

  it("DRS print()", function() {
    let drs = new DRS();
    drs.feed("Mel loves Dani.");
    assertThat(drs.print())
     .equalsTo(trim(`
       drs(a, b) {
         a loves b
         Mel(a)
         Dani(b)
       }
     `));
  });

  it.skip("A man admires a woman She likes him.", function() {
    assertThat("A man admires a woman. She likes him.", true)
     .equalsTo(true, `
       drs(a, b) {
         a loves b
         Mel(a)
         Dani(b)
       }
    `);
  });

  it("Mel loves Dani.", function() {
    assertThat("Mel loves Dani.", true)
     .equalsTo(true, `
       drs(a, b) {
         a loves b
         Mel(a)
         Dani(b)
       }
    `);
  });

  it("A man loves Dani.", function() {
    assertThat("A man loves Dani.")
     .equalsTo(true, `
       drs(a, b) {
         a loves b
         man(a)
         Dani(b)
       }
     `);
  });

  it("Dani loves a man.", function() {
    assertThat("Dani loves a man.")
     .equalsTo(true, `
       drs(a, b) {
         a loves b
         Dani(a)
         man(b)
       }
     `);
  });

  it("A man who loves Dani fascinates Anna.", function() {
    assertThat("A man who loves Dani fascinates Anna.")
     .equalsTo(true, `
       drs(a, b, c) {
         a fascinates b
         man(a)
         a loves c
         Anna(b)
         Dani(c)
       }
     `);
  });

  it("Mel loves a book which fascinates Anna.", function() {
    assertThat("Mel loves a book which fascinates Anna.")
     .equalsTo(true, `
       drs(a, b, c) {
         a loves b
         Mel(a)
         book(b)
         b fascinates c
         Anna(c)
       }
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(true, `
       drs(a, b, c) {
         a owns b
         Jones(a)
         book(b)
         c loves b
         Smith(c)
       }
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(true, `
       drs(a, b) {
         a owns b
         Jones(a)
         book(b)
         b fascinates a
       }
     `);
  });

  it("A man who fascinates Dani loves a book which fascinates Anna.", function() {
    assertThat("A man who fascinates Dani loves a book which fascinates Anna.")
     .equalsTo(true, `
       drs(a, b, c, d) {
         a loves b
         man(a)
         a fascinates c
         book(b)
         b fascinates d
         Dani(c)
         Anna(d)
       }
     `);
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat("Jones owns Ulysses. It fascinates him.")
     .equalsTo(true, `
       drs(a, b) {
         a owns b
         Jones(a)
         Ulysses(b)
         b fascinates a
       }
     `);
  });

  it("Mel owns a book.", function() {
    assertThat("Mel owns a book. It fascinates him.")
     .equalsTo(true, `
       drs(a, b) {
         a owns b
         Mel(a)
         book(b)
         b fascinates a
       }
     `);
  });

  it("Mel owns a book. It fascinates him. Dani loves him.", function() {
    assertThat("Mel owns a book. It fascinates him. Dani loves him.")
     .equalsTo(true, `
       drs(a, b, c) {
         a owns b
         Mel(a)
         book(b)
         b fascinates a
         c loves a
         Dani(c)
       }
     `);
  });

  it("Jones does not own a porsche.", function() {
    assertThat("Jones does not own a porsche.")
     .equalsTo(true, `
       drs(a) {
         Jones(a)
         ~drs(b) {
           a own b
           porsche(b)
         }
       }
     `);
  });

  it("Jones owns a porsche. He does not like it.", function() {
    assertThat("Jones owns a porsche. He does not like it.")
     .equalsTo(true, `
       drs(a, b) {
         a owns b
         Jones(a)
         porsche(b)
         ~drs() {
           a like b
         }
       }
     `);
  });

  it("Jones does not own a porsche. He likes it.", function() {
    let drs = new DRS();
    drs.feed("Jones does not own a porsche.");
    assertThat(drs.print()).equalsTo(trim(`
      drs(a) {
        Jones(a)
        ~drs(b) {
          a own b
          porsche(b)
        }
      }
    `));
    try {
     // "it" in "he likes it" cannot bind to anything
     // because porsche(b) is inside the negated sub
     // drs.
     drs.feed("He likes it.");
     throw new Error("expected exception");
    } catch (e) {
     assertThat(e.message).equalsTo("Invalid Reference: it");
    }
  });

  it.skip("Jones does not own Ulysses. He likes it.", function() {
    // TODO(goto): promote PN referents from sub drs to the
    // global drs.
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(true, `
     `);
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(true, `
       drs(a, b) {
         a loves b
         Jones(a)
         woman(b)
         ~drs() {
           b love a
         }
         ~drs(c) {
           b love c
           man(c)
         }
       }
     `);
  });

  it("A porsche does not stink", function() {
    assertThat("A porsche does not stink.")
     .equalsTo(true, `
       drs(a) {
         porsche(a)
         ~drs() {
           a stink
         }
       }
     `);
  });

  it("Jones does not own a porsche which does not fascinate him", function() {
    assertThat("Jones does not own a porsche which does not fascinate him.")
     .equalsTo(true, `
       drs(a) {
         Jones(a)
         ~drs(b) {
           a own b
           porsche(b)
           ~drs() {
             b fascinate a
           }
         }
       }
     `);
  });

  it("Jones does not like a porsche which he does not own.", function() {
    assertThat("Jones does not like a porsche which he does not own.")
     .equalsTo(true, `
       drs(a) {
         Jones(a)
         ~drs(b) {
           a like b
           porsche(b)
           ~drs() {
             a own b
           }
         }
       }
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