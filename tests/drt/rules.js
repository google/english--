const Assert = require("assert");

const {
  match,
  capture,
  print,
  child,
  Ids,
  DRS,
  CRPN,
  CRPRO,
  CRID,
  CRLIN,
  CRNRC,
  CRNEG,
  CRBE,
  CRCOND,
  CREVERY,
  CRVPEVERY,
  CROR,
  CRVPOR,
  CRNPOR,
} = require("../../src/drt/rules.js");

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
  generate, 
  expand, 
  collect, 
  processor, 
  grammar,
  first,
  clean,
  nodes} = require("../../src/drt/parser.js");

const {
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, PRO, AUX, RC, RPRO, GAP, ADJ,
 Discourse, Sentence
} = nodes;

describe("Rules", function() {
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

  it("match", function() {
    let s = first(parse("Mel loves Dani."));
    let m1 = S(NP(PN(capture("name"))), VP_());
    assertThat(match(m1, s)).equalsTo({name: PN("Mel")});
    let m2 = S(NP(), VP_(VP(V(), NP(PN(capture("name"))))));
    assertThat(match(m2, s)).equalsTo({name: PN("Dani")});

    let m3 = S(NP(), VP_(AUX("does"), "not", VP(capture("vp"))));
    let s3 = first(parse("Jones does not love Smith."));
    assertThat(print(match(m3, s3).vp))
     .equalsTo("love Smith");
   });

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

  it("CR.PN", function() {
    let ids = new Ids();
    let node = first(parse("Mel loves Dani."), true);
    let rule = new CRPN(ids);
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

  it("CR.PRO", function() {
    let ids = new Ids();
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);

    let crpn = new CRPN(ids);
    let [[u], [jones]] = crpn.match(sentence);
    let [[v], [ulysses]] = crpn.match(child(sentence, 1, 0));

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(ulysses)).equalsTo("Ulysses(b)");

    let rule = new CRPRO(ids);
    rule.match(node, [u, v]);
    rule.match(child(node, 1, 0), [u, v]);

    assertThat(print(node)).equalsTo("b fascinates a");
  });

  it("CR.PRO", function() {
    let ids = new Ids();

    let sentence = first(parse("Mel loves Dani."), true);
    let node = first(parse("She fascinates him."), true);
    
    let crpn = new CRPN(ids);
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

  it("CR.ID: A man admires a woman.", function() {
    let ids = new Ids();

    let node = first(parse("A man admires a woman."), true);

    let rule = new CRID(ids);
    
    let [[a], body1] = rule.match(node);
    assertThat(a.name).equalsTo("a");
    assertThat(a.types).equalsTo({num: "sing", gen: "male"});

    let [[b], body2] = rule.match(child(node, 1, 0));
    assertThat(b.name).equalsTo("b");
    assertThat(b.types).equalsTo({num: "sing", gen: "fem"});

    assertThat(print(node)).equalsTo("a admires b");
   });

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

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Jones is happy."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a is happy");

    let [head, body, subs, remove] = new CRBE(ids).match(node, []);

    assertThat(head.length).equalsTo(0);
    assertThat(subs.length).equalsTo(0);

    // remove current node
    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(body.length).equalsTo(1);
    assertThat(print(body[0])).equalsTo(trim(`
      happy(a)
    `));
  });

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Jones is not happy."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a is not happy");

    let [head, body, subs, remove] = new CRBE(ids).match(node, []);

    assertThat(head.length).equalsTo(0);
    assertThat(subs.length).equalsTo(0);

    // remove current node
    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(body.length).equalsTo(1);
    assertThat(print(body[0])).equalsTo(trim(`
      ~happy(a)
    `));
  });

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves a woman who is happy."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a loves a woman who is happy");

    let [, [id]] = new CRID(ids).match(child(node, 1, 0));

    assertThat(print(id)).equalsTo("woman who is happy(b)");

    let [, [woman, rc]] = new CRNRC(ids).match(id);

    assertThat(print(woman)).equalsTo("woman(b)");
    assertThat(print(rc)).equalsTo("b is happy");

    let [, [be]] = new CRBE(ids).match(rc);

    assertThat(print(be)).equalsTo("happy(b)");
  });

  it("CR.COND", function() {
    let ids = new Ids();

    let node = first(parse("If Jones owns a book then he likes it."), true);

    let [, , [sub]] = new CRCOND(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Jones(a)
        a owns b
        book(b)
      } => drs() {
        a likes b
      }
    `));
  });

  it("CR.EVERY", function() {
    let ids = new Ids();

    let node = first(parse("every man loves Jones."), true);

    let [, , [sub]] = new CREVERY(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a) {
        man(a)
      } => drs(b) {
        Jones(b)
        a loves b
      }
    `));
  });

  it("CR.VPEVERY", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves every man."), true);

    let [, , [sub]] = new CRVPEVERY(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a) {
        man(a)
      } => drs(b) {
        Jones(b)
        b loves a
      }
    `));
  });

  it("CR.VPEVERY", function() {
    let ids = new Ids();

    let node = first(parse("Jones likes every woman who Smith loves."), true);

    let [, , [sub]] = new CRVPEVERY(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
         Smith(b)
         woman(a)
         b loves a
       } => drs(c) {
         Jones(c)
         c likes a
       }
    `));
  });

  it("CR.OR", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves Mary or Smith loves Mary."), true);

    let [, , [sub]] = new CROR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Jones(a)
        Mary(b)
        a loves b
      } or drs(c, d) {
        Smith(c)
        Mary(d)
        c loves d
      }
    `));
  });

  it("CR.VPOR", function() {
    let ids = new Ids();

    let node = first(parse("Mary loves Jones or likes Smith."), true);

    let [, , [sub]] = new CRVPOR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Mary(a)
        Jones(b)
        a loves b
      } or drs(c, d) {
        Mary(c)
        Smith(d)
        c likes d
      }
    `));
  });

  it("CR.NPOR", function() {
    let ids = new Ids();

    let node = first(parse("Jones or Smith love Mary."), true);

    let [, , [sub]] = new CRNPOR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Jones(a)
        Mary(b)
        a love b
      } or drs(c, d) {
        Smith(c)
        Mary(d)
        c love d
      }
    `));
  });

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
         Mel(a)
         Dani(b)
         a loves b
       }
     `));
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