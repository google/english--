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
  CRAND,
  CRPOSS,
  CRADJ,
  CRPP,
  CRTENSE,
  CRASPECT,
  referent,
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
    let subject = S(NP(PN(capture("mel"))), VP_());
    assertThat(match(subject, s).mel.types)
     .equalsTo({
       "num": "sing",
       "gen": "?"
      });
    let object = S(NP(), VP_(VP(V(), NP(capture("object")))));
    assertThat(match(object, s).object["@type"]).equalsTo("NP");
    assertThat(match(object, s).object.types)
     .equalsTo({
       "case": -3595323571, 
       "gap": "-", 
       "num": "plur",
       "gen": "?"
    });

    let root = first(parse("Mel owns a book."), true);
    assertThat(child(root, 1, 0, 1, 1).types)
     .equalsTo({"num": "sing", "gen": "-hum"});

    assertThat(child(first(parse("Mel loves a woman."), true), 1, 0, 1, 1).types)
     .equalsTo({"num": "sing", "gen": "fem"});
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

  it("CR.PN", function() {
    let ids = new Ids();
    let a = first(parse("Mel loves Dani."), true);
    let rule = new CRPN(ids);
    let [[u], [mel]] = rule.match(a, []);
    let [[v], [dani]] = rule.match(child(a, 1, 0), [u]);
    assertThat(print(a)).equalsTo("a loves b");

    u.loc = 0;
    v.loc = 0;

    let b = first(parse("Dani loves Mel."), true);
    let [c] = rule.match(b, [u, v]);
    assertThat(c.length).equalsTo(0);
    assertThat(print(b)).equalsTo("b loves Mel");
    let [d] = rule.match(child(b, 1, 0), [u, v]);
    assertThat(d.length).equalsTo(0);
    assertThat(print(b)).equalsTo("b loves a");
   });

  it("CR.DETPN", function() {
    let ids = new Ids();
    let node = first(parse("Mel's brother likes Dani."), true);
    let rule = new CRPN(ids);
    let [[u], [mel]] = rule.match(child(node, 0, 0), []);
    assertThat(u.value).equalsTo("Mel");
    let [[v], [brother]] = new CRPOSS(ids).match(node, [u]);
    assertThat(v.value).equalsTo("Mel 's brother");
   });

  it("CR.VPPN", function() {
    let ids = new Ids();
    let node = first(parse("Mel's wife is Dani."), true);
    let [[u], [dani]] = new CRPN(ids).match(child(node, 1, 0), []);
    assertThat(u.value).equalsTo("Dani");
    assertThat(print(node)).equalsTo("Mel 's wife is a");
   });

  it("CR.PRO", function() {
    let ids = new Ids();
    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);

    let crpn = new CRPN(ids);
    let [[u], [jones]] = crpn.match(sentence);
    let [[v], [ulysses]] = crpn.match(child(sentence, 1, 0));

    u.loc = 0;
    v.loc = 0;

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

    u.loc = 0;
    v.loc = 0;

    let rule = new CRPRO();
    rule.match(node, [u, v]);
    rule.match(child(node, 1, 0), [u, v]);

    assertThat(print(node)).equalsTo("b fascinates a");
  });

  it("CR.PRO", function() {
    let ids = new Ids();

    let sentence = first(parse("Jones owns Ulysses."), true);
    let node = first(parse("It fascinates him."), true);

    let [[u], [jones]] = new CRPN(ids).match(sentence);
    let [[v], [ulysses]] = new CRPN(ids).match(child(sentence, 1, 0));

    u.loc = 0;
    v.loc = 0;

    // assertThat(jones.types.gen).equalsTo("?");
    // assertThat(ulysses.types.gen).equalsTo("?");
    
    new CRPRO().match(node, [u, v]);
    // assertThat(jones.types.gen).equalsTo("male");
    // assertThat(ulysses.types.gen).equalsTo("-hum");

    new CRPRO().match(child(node, 1, 0), [u, v]);

    assertThat(print(node)).equalsTo("b fascinates a");

    // assertThat(jones.types.gen).equalsTo("male");
    // assertThat(ulysses.types.gen).equalsTo("-hum");
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
    assertThat(head[0].value).equalsTo("a porsche");
    assertThat(head[0].types).equalsTo({num: "sing", "gen": "-hum"});

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

    let node = first(parse("A woman likes Jones."), true);

    let rule = new CRID(ids);
    
    let [[{name, value, types}], [id]] = rule.match(node);

    assertThat(print(node)).equalsTo("a likes Jones");
    assertThat(name).equalsTo("a");
    assertThat(value).equalsTo("A woman");
    assertThat(types).equalsTo({"num": "sing", "gen": "fem"});

    new CRLIN(ids).match(id);

    assertThat(print(id)).equalsTo("woman(a)");

    new CRPN(ids).match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("a likes b");
  });

  it("CR.ID: A man admires a woman.", function() {
    let ids = new Ids();

    let node = first(parse("A man admires a woman."), true);

    let rule = new CRID(ids);
    
    let [[a], body1] = rule.match(node);
    assertThat(a.name).equalsTo("a");
    assertThat(a.types).equalsTo({num: "sing", "gen": "male"});

    let [[b], body2] = rule.match(child(node, 1, 0));
    assertThat(b.name).equalsTo("b");
    assertThat(b.types).equalsTo({num: "sing", "gen": "fem"});

    assertThat(print(node)).equalsTo("a admires b");
   });

  it("CR.NRC", function() {
    let ids = new Ids();

    let node = first(parse("Jones owns a book which Smith likes."), true);

    let [h, [jones], , [remove]] = new CRPN(ids).match(node);

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

    let [[u], [jones], [remove]] = new CRPN(ids).match(node);

    assertThat(print(jones))
     .equalsTo("Jones(a)");
    assertThat(print(node))
     .equalsTo("a owns a book which he does not like");
    assertThat(u.types).equalsTo({"num": "sing", "gen": "?"});

    let [ref, [id]] = new CRID(ids).match(child(node, 1, 0));
    assertThat(print(node)).equalsTo("a owns b");
    assertThat(print(id)).equalsTo("book which he does not like(b)");

    let rule = new CRNRC(ids);

    let [head, [book, rc]] = rule.match(id);
    assertThat(print(book)).equalsTo("book(b)");
    assertThat(print(rc)).equalsTo("he does not like b");

    new CRPRO(ids).match(rc, [u]);

    assertThat(print(rc)).equalsTo("a does not like b");

    new CRPN(ids).match(child(node, 0));

    assertThat(print(node)).equalsTo("a owns b");
   });

  it("CR.NEG", function() {
    let ids = new Ids();

    let node = first(parse("Jones does not own a porsche."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a does not own a porsche");

    let [head, body, , remove] = new CRNEG(ids).match(node, []);

    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(body.length).equalsTo(1);
    assertThat(body[0].print()).equalsTo(trim(`
      ~drs(b) {
        a own b
        porsche(b)
      }
    `));
  });

  it("CR.NEG", function() {
    let ids = new Ids();

    let node = first(parse("Jones will not own a porsche."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a will not own a porsche");

    let [head, body, , remove] = new CRNEG(ids).match(node, []);

    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(body.length).equalsTo(1);
    assertThat(body[0].print()).equalsTo(trim(`
      ~drs(b) {
        > a own b
        porsche(b)
      }
    `));
  });

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Jones is happy."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a is happy");

    let [head, body, , remove] = new CRBE(ids).match(node, []);

    assertThat(head.length).equalsTo(0);

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

    let [head, body, , remove] = new CRBE(ids).match(node, []);

    assertThat(head.length).equalsTo(0);

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

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Jones is a man."), true);

    new CRPN(ids).match(node);

    assertThat(print(node)).equalsTo("a is a man");

    let [head, body, , remove] = new CRBE(ids).match(node, []);

    // no new referents introduced.
    assertThat(head.length).equalsTo(0);

    // remove current node.
    assertThat(remove.length).equalsTo(1);
    assertThat(remove[0]).equalsTo(node);

    assertThat(body.length).equalsTo(1);
    assertThat(print(body[0])).equalsTo("man(a)");
  });

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Dani is Sam's wife."), true);

    new CRPN(ids).match(node, []);

    new CRPN(ids).match(child(node, 1, 0, 1, 0), []);

    assertThat(print(node)).equalsTo("a is b 's wife");

    let [[ref], [wife]] = new CRPOSS(ids).match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("a is c");
    assertThat(print(wife)).equalsTo("c wife b");
  });

  it("CR.BE", function() {
    let ids = new Ids();

    let node = first(parse("Sam is from Brazil."), true);

    new CRPN(ids).match(node, []);
    new CRPN(ids).match(child(node, 1, 0, 1), []);

    assertThat(print(node)).equalsTo("a is from b");

    let [, [from], , [remove]] = new CRBE(ids).match(node, []);

    assertThat(remove).equalsTo(node);
    assertThat(print(from)).equalsTo("a from b");
  });

  it("CR.BE John was happy", function() {
    let ids = new Ids();

    let node = first(parse("Sam was happy."), true);

    new CRPN(ids).match(node, []);
    new CRPN(ids).match(child(node, 1, 0, 1), []);

    assertThat(print(node)).equalsTo("a was happy");

    let [[], []] = new CRTENSE(ids).match(node, []);
    
    // NOTE(goto): BE should be state=+ and lead to an s0
    // here instead.
    // assertThat(s.print()).equalsTo("s0");
    // assertThat(time.print()).equalsTo("s0 < @now");
    
    let [, [from], , [remove]] = new CRBE(ids).match(node, []);

    assertThat(remove).equalsTo(node);
    assertThat(print(from)).equalsTo("happy(a)");
  });

  it("CR.COND", function() {
    let ids = new Ids();

    let node = first(parse("If Jones owns a book then he likes it."), true);

    let [, [sub]] = new CRCOND(ids).match(node, []);

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

    let [, [sub]] = new CREVERY(ids).match(node, []);

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

    let [, [sub]] = new CRVPEVERY(ids).match(node, []);

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

    let [, [sub]] = new CRVPEVERY(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
         Smith(b)
         b loves a
         woman(a)
       } => drs(c) {
         Jones(c)
         c likes a
       }
    `));
  });

  it("CR.OR", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves Mary or Smith loves Mary."), true);

    let [, [sub]] = new CROR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Jones(a)
        Mary(b)
        a loves b
      } or drs(c) {
        Smith(c)
        c loves b
      }
    `));
  });

  it("CR.VPOR", function() {
    let ids = new Ids();

    let node = first(parse("Mary loves Jones or likes Smith."), true);

    let [, [sub]] = new CRVPOR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Mary(a)
        Jones(b)
        a loves b
      } or drs(c) {
        Smith(c)
        a likes c
      }
    `));
  });

  it("CR.NPOR", function() {
    let ids = new Ids();

    let node = first(parse("Jones or Smith loves Mary."), true);

    let [, [sub]] = new CRNPOR(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Jones(a)
        Mary(b)
        a loves b
      } or drs(c) {
        Smith(c)
        c loves b
      }
    `));
  });

  it("CR.AND", function() {
    let ids = new Ids();

    let node = first(parse("Smith likes Mary and she loves him."), true);

    let [, [sub]] = new CRAND(ids).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Smith(a)
        Mary(b)
        a likes b
      } and drs() {
        b loves a
      }
    `));
  });

  it("CR.SAND", function() {
    // She can't be bound to Mary because Mary hasn't been processed
    // yet.
    let node = first(parse("She loves him and Mary likes Smith."), true);
    try {
     new CRAND(new Ids()).match(node, []);
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: She");
    }
  });

  it("CR.VPAND", function() {
    let node = first(parse("Mary owns and loves a porsche."), true);

    let [, [sub]] = new CRAND(new Ids()).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Mary(a)
        a owns b
        porsche(b)
      } and drs(c) {
        a loves c
        porsche(c)
      }
    `));
  });

  it.skip("CR.VPAND", function() {
    let node = first(parse("Mary likes and loves Jones."), true);

    // console.log(node);

    let [, [sub]] = new CRAND(new Ids()).match(node, []);

    assertThat(sub.print()).equalsTo(trim(`
      drs(a, b) {
        Mary(a)
        Jones(b)
        a likes b
      } and drs() {
        a loves b
      }
    `));
  });

  it("CR.POSS", function() {
    let ids = new Ids();

    let node = first(parse("Mary's brother is happy."), true);
    
    let [[mary]] = new CRPN(ids).match(child(node, 0, 0), []);

    assertThat(print(node)).equalsTo("a 's brother is happy");

    let [[ref], [brother]] = new CRPOSS(ids).match(node);

    assertThat(print(node)).equalsTo("b is happy(b)");

    // Brother is male and singular
    assertThat(ref.types).equalsTo({"num": "sing", "gen": "male"});

    assertThat(print(brother)).equalsTo("b brother a");
  });

  it("CR.POSS", function() {
    let ids = new Ids();

    let node = first(parse("Jones likes Mary's brother."), true);
    
    let [a, [jones]] = new CRPN(ids).match(node, []);

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(node)).equalsTo("a likes Mary 's brother");

    let [b, [mary]] = new CRPN(ids).match(child(node, 1, 0, 1, 0), []);

    assertThat(print(mary)).equalsTo("Mary(b)");
    assertThat(print(node)).equalsTo("a likes b 's brother");

    let [[ref], [brother]] = new CRPOSS(ids).match(child(node, 1, 0));

    assertThat(print(node)).equalsTo("a likes c");

    // Brother is male and singular
    assertThat(ref.types).equalsTo({"num": "sing", "gen": "male"});

    assertThat(print(brother)).equalsTo("c brother b");
  });

  it("CR.NPADJ", function() {
    let ids = new Ids();

    let node = first(parse("Jones owns an unhappy donkey."), true);
    
    let [a, [jones]] = new CRPN(ids).match(node);

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(node)).equalsTo("a owns an unhappy donkey");

    let [[b], [donkey]] = new CRID(ids).match(child(node, 1, 0));
    assertThat(print(node)).equalsTo("a owns b");
    assertThat(print(donkey)).equalsTo("unhappy donkey(b)");

    let [[], [raw, unhappy], [], [remove]] = new CRADJ(ids).match(donkey);
    // The noun is removed and two new conditions are introduced.
    assertThat(remove).equalsTo(donkey);
    assertThat(print(raw)).equalsTo("donkey(b)");
    assertThat(print(unhappy)).equalsTo("unhappy(b)");    
  });

  it("CR.VPPP", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves a woman with a donkey."), true);
    
    let [a, [jones]] = new CRPN(ids).match(node);

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(node)).equalsTo("a loves a woman with a donkey");

    let [[b], [woman, prep], [], []] = new CRPP(ids).match(node);

    assertThat(print(node)).equalsTo("a loves b");
    assertThat(print(woman)).equalsTo("woman(b)");
    assertThat(print(prep)).equalsTo("b with a donkey");

    let [[c], [donkey], [], []] = new CRID(ids).match(child(prep, 1, 0));
    assertThat(print(prep)).equalsTo("b with c");
    assertThat(print(donkey)).equalsTo("donkey(c)");
  });

  it("CR.SPP", function() {
    let ids = new Ids();

    let node = first(parse("A woman with a donkey loves Jones."), true);
    
    let [a, [jones]] = new CRPN(ids).match(child(node, 1, 0));

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(node)).equalsTo("A woman with a donkey loves a");

    let [[b], [woman, prep], [], []] = new CRPP(ids).match(node);

    assertThat(print(node)).equalsTo("b loves a");
    assertThat(print(woman)).equalsTo("woman(b)");
    assertThat(print(prep)).equalsTo("b with a donkey");

    let [[c], [donkey], [], []] = new CRID(ids).match(child(prep, 1, 0));
    assertThat(print(prep)).equalsTo("b with c");
    assertThat(print(donkey)).equalsTo("donkey(c)");
  });

  it("A man from Brazil loves Mary", function() {
    let ids = new Ids();

    let node = first(parse("A man from Brazil loves Mary."), true);
    
    let [[a], [jones]] = new CRPN(ids).match(child(node, 1, 0));

    assertThat(print(jones)).equalsTo("Mary(a)");
    assertThat(print(node)).equalsTo("A man from Brazil loves a");

    let [[b], [brazil]] = new CRPN(ids).match(child(node, 0, 1, 1), []);

    assertThat(print(brazil)).equalsTo("Brazil(b)");
    assertThat(print(node)).equalsTo("A man from b loves a");

    let [[c], [man, prep], [], []] = new CRPP(ids).match(node, [b]);

    assertThat(print(node)).equalsTo("c loves a");
    assertThat(print(man)).equalsTo("man(c)");
    assertThat(print(prep)).equalsTo("c from b");
    assertThat(c.value).equalsTo("A man from Brazil");
  });

  it("CR.SPP every", function() {
    let ids = new Ids();

    let node = first(parse("Every woman with a donkey loves Jones."), true);

    let [a, [jones]] = new CRPN(ids).match(child(node, 1, 0));

    assertThat(print(jones)).equalsTo("Jones(a)");
    assertThat(print(node)).equalsTo("Every woman with a donkey loves a");
    
    // console.log(node);
    // return;

    let [[], [implication]] = new CREVERY(ids).match(node, []);

    assertThat(implication.print()).equalsTo(trim(`
      drs(b, c) {
        b with c
        woman(b)
        donkey(c)
      } => drs() {
        b loves a
      }
    `));

  });

  it("CR.VPPP", function() {
    let ids = new Ids();

    let node = first(parse("Jones loves a woman with a donkey."), true);
    
    let [[a], [woman, prep]] = new CRPP(ids).match(node);

    assertThat(a.print()).equalsTo("a");
    assertThat(print(woman)).equalsTo("woman(a)");
    assertThat(print(prep)).equalsTo("a with a donkey");

    let [[b], [donkey], [], []] = new CRID(ids).match(child(prep, 1, 0));

    assertThat(b.print()).equalsTo("b");
    assertThat(print(prep)).equalsTo("a with b");
    assertThat(print(donkey)).equalsTo("donkey(b)");
  });

  it("CR.SPP", function() {
    let ids = new Ids();

    let node = first(parse("A woman with a donkey loves Jones."), true);
    
    let [[a], [woman, prep]] = new CRPP(ids).match(node);

    assertThat(a.print()).equalsTo("a");
    assertThat(print(woman)).equalsTo("woman(a)");
    assertThat(print(prep)).equalsTo("a with a donkey");

    let [[b], [donkey], [], []] = new CRID(ids).match(child(prep, 1, 0));

    assertThat(b.print()).equalsTo("b");
    assertThat(print(prep)).equalsTo("a with b");
    assertThat(print(donkey)).equalsTo("donkey(b)");
  });

  it.skip("CR.TENSE", function() {
    let ids = new Ids();

    let node = first(parse("Mary kissed Jones."), true);
    new CRPN(ids).match(node);
    new CRPN(ids).match(child(node, 1, 0));
    
    let [[e], [time]] = new CRTENSE(ids).match(node, []);

    // A new event referent is added.
    assertThat(e.print()).equalsTo("e0");

    // And assigned as an eventuality referent on the verb.
    assertThat(print(child(node, 1, 0, 0))).equalsTo("kissed");

    // A new condition is added binding the eventuality to the
    // utterance time.
    // assertThat(time.print()).equalsTo("e0 < @now");

    assertThat(print(node)).equalsTo("a kissed b");
   });

  it("Mary has kissed Jones.", function() {
    let ids = new Ids();

    let node = first(parse("Mary has kissed Jones."), true);
    new CRPN(ids).match(node);
    new CRPN(ids).match(child(node, 1, 0, 1));
    
    // let [[foo], [bar]] = new CRTENSE(ids).match(node, []);

    // console.log(print(foo));

    // return;


    let [[], []] = new CRASPECT(ids).match(node, []);

    // A new event referent is added.
    // assertThat(e.print()).equalsTo("e0");

    // And assigned as an eventuality referent on the verb.
    assertThat(print(child(node, 1, 0, 0))).equalsTo("kissed");

    // A new condition is added binding the eventuality to the
    // utterance time.
    // assertThat(time.print()).equalsTo("@now <> e0");

    assertThat(print(node)).equalsTo("a kissed b");
   });

  it("Mary has owned a horse.", function() {
    let ids = new Ids();

    let node = first(parse("Mary has owned a horse."), true);
    new CRPN(ids).match(node);
    new CRID(ids).match(child(node, 1, 0, 1));
    
    let [[], []] = new CRASPECT(ids).match(node, []);

    // A new eventuality is added.
    // assertThat(e.print()).equalsTo("e0");
    // A new state referent is added.
    // assertThat(s.print()).equalsTo("s1");

    // A new condition is added binding the state to the
    // utterance time.
    // assertThat(included.print()).equalsTo("e0 <> s1");

    // TODO(goto): this isn't exactly right. it should be
    // end(s1) instead, but I'll get to this once I know
    // more how it is used.
    // assertThat(equals.print()).equalsTo("e0 == s1");

    assertThat(print(node)).equalsTo("a owned b");
   });

  class TreeWalker {
   constructor(rules = []) {
    this.rules = rules;
   }

   push(rule) {
    this.rules.push(rule);
    return this;
   }

   walk(node) {

    if (typeof node == "string") {
     return node;
    }

    let children = [];
    for (let child of node.children || []) {
     children.push(this.walk(child));
    }
 
    let result = {"@type": node["@type"], children: children};
    for (let rule of this.rules) {
     if (rule.match(result)) {
      return rule.apply(result);
     }
    }
    
    // console.log(children);
    
    return children.join("");
   }
  }

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