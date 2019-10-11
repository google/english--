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
 CROR,
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

describe("DRS", function() {

  it("A man admires a woman.", function() {
    assertThat("A man admires a woman.")
     .equalsTo(`
       drs(a, b) {
         a admires b
         man(a)
         woman(b)
       }
    `);
  });

  it("A man admires a woman. She likes him.", function() {
    assertThat("A man admires a woman. She likes him.")
     .equalsTo(`
       drs(a, b) {
         a admires b
         man(a)
         woman(b)
         b likes a
       }
    `);
  });

  it("Jones admires a woman who likes him.", function() {
    assertThat("Jones admires a woman who likes him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a admires b
         b likes a
         woman(b)
       }
    `);
  });

  it("Mel loves Dani.", function() {
    assertThat("Mel loves Dani.", true)
     .equalsTo(`
       drs(a, b) {
         Mel(a)
         Dani(b)
         a loves b
       }
    `);
  });

  it("A man loves Dani.", function() {
    assertThat("A man loves Dani.")
     .equalsTo(`
       drs(a, b) {
         Dani(a)
         b loves a
         man(b)
       }
     `);
  });

  it("Dani loves a man.", function() {
    assertThat("Dani loves a man.")
     .equalsTo(`
       drs(a, b) {
         Dani(a)
         a loves b
         man(b)
       }
     `);
  });

  it("A man who loves Dani fascinates Anna.", function() {
    assertThat("A man who loves Dani fascinates Anna.")
     .equalsTo(`
       drs(a, b, c) {
         Anna(a)
         Dani(b)
         c fascinates a
         c loves b
         man(c)
       }
     `);
  });

  it("Mel loves a book which fascinates Anna.", function() {
    assertThat("Mel loves a book which fascinates Anna.")
     .equalsTo(`
       drs(a, b, c) {
         Mel(a)
         Anna(b)
         a loves c
         c fascinates b
         book(c)
       }
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Smith(b)
         a owns c
         b loves c
         book(c)
       }
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a owns b
         b fascinates a
         book(b)
       }
     `);
  });

  it("A man who fascinates Dani loves a book which fascinates Anna.", function() {
    assertThat("A man who fascinates Dani loves a book which fascinates Anna.")
     .equalsTo(`
       drs(a, b, c, d) {
         Dani(a)
         Anna(b)
         c loves d
         c fascinates a
         man(c)
         d fascinates b
         book(d)
       }
     `);
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat("Jones owns Ulysses. It fascinates him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Ulysses(b)
         a owns b
         b fascinates a
       }
     `);
  });

  it("Mel owns a book.", function() {
    assertThat("Mel owns a book. It fascinates him.")
     .equalsTo(`
       drs(a, b) {
         Mel(a)
         a owns b
         book(b)
         b fascinates a
       }
     `);
  });

  it("Mel owns a book. It fascinates him. Dani loves him.", function() {
    assertThat("Mel owns a book. It fascinates him. Dani loves him.")
     .equalsTo(`
       drs(a, b, c) {
         Mel(a)
         a owns b
         book(b)
         b fascinates a
         Dani(c)
         c loves a
       }
     `);
  });

  it("Jones does not own a porsche.", function() {
    assertThat("Jones does not own a porsche.")
     .equalsTo(`
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
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a owns b
         porsche(b)
         ~drs() {
           a like b
         }
       }
     `);
  });

  it("Jones does not own a porsche. He likes it.", function() {
    let drs = DRS.from();
    drs.feed("Jones does not own a porsche.");
    try {
     // "it" in "he likes it" cannot bind to anything
     // because porsche(b) is inside the negated sub
     // drs.
     drs.feed("He likes it.");
     throw new Error("expected exception");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid Reference: it");
    }
  });

  it("Jones does not own Ulysses. He likes it.", function() {
    // TODO(goto): promote PN referents from sub drs to the
    // global drs.
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Ulysses(b)
         ~drs() {
           a own b
         }
         a likes b
       }
     `);
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a loves b
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
     .equalsTo(`
       drs(a) {
         ~drs() {
           a stink
         }
         porsche(a)
       }
     `);
  });

  it("Jones does not own a porsche which does not fascinate him", function() {
    assertThat("Jones does not own a porsche which does not fascinate him.")
     .equalsTo(`
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
     .equalsTo(`
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

  it("Jones is happy.", function() {
    assertThat("Jones is happy.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         happy(a)
       }
    `);
  });

  it("Jones is not happy.", function() {
    assertThat("Jones is not happy.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         ~happy(a)
       }
    `);
  });

  it("A man is happy.", function() {
    assertThat("A man is happy.")
     .equalsTo(`
       drs(a) {
         happy(a)
         man(a)
       }
    `);
  });

  it("Jones is a man.", function() {
    assertThat("Jones is a man.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         man(a)
       }
    `);
  });

  it("Jones is a happy man.", function() {
    assertThat("Jones is a happy man.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         happy(a)
         man(a)
       }
    `);
  });

  it("Jones is a happy man who loves Mary.", function() {
    assertThat("Jones is a happy man who loves Mary.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Mary(b)
         a loves b
         happy(a)
         man(a)
       }
    `);
  });

  it("Jones is a man. He is happy. He loves Mary.", function() {
    assertThat("Jones is a man. He is happy. He loves Mary.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         man(a)
         happy(a)
         Mary(b)
         a loves b
       }
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a loves b
         woman(b)
         happy(b)
       }
    `);
  });

  it("A woman who is happy loves Jones.", function() {
    assertThat("A woman who is happy loves Jones.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         b loves a
         woman(b)
         happy(b)
       }
    `);
  });

  it("Jones owns a porsche. He is happy.", function() {
    assertThat("Jones owns a porsche. He is happy.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a owns b
         porsche(b)
         happy(a)
       }
    `);
  });

  it("If Jones owns a book then he likes it.", function() {
    assertThat("If Jones owns a book then he likes it.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           a owns b
           book(b)
         } => drs() {
           a likes b
         }
       }
    `);
  });

  it("If Jones owns a book then Smith owns a porsche.", function() {
    // TODO(goto): to make this result match 2.33 we still need to
    // promote proper names to the global DRS.
    assertThat("If Jones owns a book then Smith owns a porsche.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Smith(b)
         drs(c) {
           a owns c
           book(c)
         } => drs(d) {
           b owns d
           porsche(d)
         }
       }
    `);
  });

  it("Jones likes Mary. If she likes a book then he likes it.", function() {
    assertThat("Jones likes Mary. If she likes a book then he likes it.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Mary(b)
         a likes b
         drs(c) {
           b likes c
           book(c)
         } => drs() {
           a likes c
         }
       }
    `);
  });

  it.skip("Jones does not like Mary. If she likes a book then he does not like it.", function() {
    // TODO(goto): for this to work we need to promote PN to the global DRS.
    assertThat("Jones does not like Mary. If she likes a book then he does not like it.")
     .equalsTo(true, `
    `);
  });

  it.skip("If Mary likes a man then he likes Jones.", function() {
    // TODO(goto): he here probably refers to "a man". It is pointing
    // to Jones at the moment because we have parsed proper names first.
    // The search algorithm for referents should probably search
    // backwards, from most recent to oldest.
    assertThat("If Mary likes a man then he likes Jones.")
     .equalsTo(`
       drs(a, b) {
         Mary(a)
         Jones(b)
         drs(c) {
           a likes c
           man(c)
         } => drs() {
           b likes b
         }
       }
    `);
  });

  it("Every man loves Jones.", function() {
    assertThat("Every man loves Jones.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           man(b)
         } => drs() {
           b loves a
         }
       }
    `);
  });

  it("Every man is happy.", function() {
    assertThat("Every man is happy.")
     .equalsTo(`
       drs() {
         drs(a) {
           man(a)
         } => drs() {
           happy(a)
         }
       }
    `);
  });

  it("Every man is happy. He likes it.", function() {
    try {
     let drs = DRS.from();
     drs.feed("Every man is happy.");
     drs.feed("He likes it.");
     throw new Error("expected reference 'He' to fail");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: He");
    }
  });

  it("Every man owns a book. It is happy.", function() {
    try {
     let drs = DRS.from();
     drs.feed("Every man owns a book.");
     drs.feed("It is happy.");
     throw new Error("expected reference 'It' to fail");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: It");
    }
  });

  it("Jones loves every man.", function() {
    assertThat("Jones loves every man.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           man(b)
         } => drs() {
           a loves b
         }
       }
    `);
  });

  it("Jones loves Mary or Smith loves her.", function() {
    assertThat("Jones loves Mary or Smith loves her.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Smith(b)
         Mary(c)
         drs() {
           a loves c
         } or drs() {
           b loves c
         }
       }
    `);
  });

  it("Jones owns a porsche or he likes it.", function() {
    assertThat("Jones owns a porsche or he likes it.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           a owns b
           porsche(b)
         } or drs() {
           a likes b
         }
       }
    `);
  });

  it("Mary loves Jones or likes Smith.", function() {
    assertThat("Mary loves Jones or likes Smith.")
     .equalsTo(`
       drs(a, b, c) {
         Mary(a)
         Jones(b)
         Smith(c)
         drs() {
           a loves b
         } or drs() {
           a likes c
         }
       }
    `);
  });

  it("Jones or Smith love Mary.", function() {
    // TODO(goto): this isn't correct because
    // Mary is bound to different referents.
    assertThat("Jones or Smith love Mary.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         drs(b) {
           Jones(b)
           b love a
         } or drs(c) {
           Smith(c)
           c love a
         }
       }
    `);
  });

  it("Mary is happy. Jones or Smith love her.", function() {
    // TODO(goto): this isn't correct because
    // Mary is bound to different referents.
    assertThat("Mary is happy. Jones or Smith love her.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         happy(a)
         drs(b) {
           Jones(b)
           b love a
         } or drs(c) {
           Smith(c)
           c love a
         }
       }
    `);
  });

  it.skip("If a woman fascinates a man then he likes her or she likes him.", function() {
    // "she" can't be bound because the search algorithm isn't walking up the drs chain.
    assertThat("If a woman fascinates a man then he likes her or she likes him.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         happy(a)
         drs(b) {
           Jones(b)
           b love a
         } or drs(c) {
           Smith(c)
           c love a
         }
       }
    `);
  });

  it("Jones loves or likes Mary.", function() {
    assertThat("Jones loves or likes Mary.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Mary(b)
         drs() {
           a loves
         } or drs() {
           a likes b
         }
       }
    `);
  });

  it("Jones loves Mary or likes a woman who Smith loves.", function() {
    assertThat("Jones loves Mary or likes a woman who Smith loves.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Mary(b)
         Smith(c)
         drs() {
           a loves b
         } or drs(d) {
           a likes d
           c loves d
           woman(d)
         }
       }
    `);
  });

  it("Jones likes every woman who Smith loves.", function() {
    assertThat("Jones likes every woman who Smith loves.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Smith(b)
         drs(c) {
           b loves c
           woman(c)
         } => drs() {
           a likes c
         }
       }
     `);
  });

  it("Jones loves Mary or likes a woman who Smith loves.", function() {
    assertThat("Jones loves Mary or likes every woman who Smith loves.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Mary(b)
         Smith(c)
         drs() {
           a loves b
         } or drs() {
           drs(d) {
             c loves d
             woman(d)
           } => drs() {
             a likes d
           }
         }
       }
    `);
  });

  it("Mary loves Smith and he lovers her.", function() {
    assertThat("Mary loves Smith and he loves her.")
     .equalsTo(`
       drs(a, b) {
         Mary(a)
         Smith(b)
         drs() {
           a loves b
         } and drs() {
           b loves a
         }
       }
    `);
  });

  it("Mary owns a porsche and she loves it.", function() {
    assertThat("Mary owns a porsche and she loves it.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         drs(b) {
           a owns b
           porsche(b)
         } and drs() {
           a loves b
         }
       }
    `);
  });

  it("Mary owns a porsche and she loves it.", function() {
    let drs = DRS.from();
    try {
     drs.feed("She loves it and Mary owns a porsche.");
     throw new Error("expected exception");
    } catch (e) {
     // She can bind to "Mary" because Mary is a proper name.
     // "a porsche", on the other hand, isn't processed
     // globally, so "it" cannot bind to it.
     Assert.deepEqual(e.message, "Invalid Reference: it");
    }
  });

  it.skip("Mary owns and loves a porsche.", function() {
    // TODO(goto): find a way to process indefinite nouns
    // before the CRAND gets constructed.
    assertThat("Mary owns and loves a porsche.")
     .equalsTo(`
       drs(a, d) {
         Mary(a)
         porsche(d)
         drs(b) {
           a owns b
           porsche(b)
         } and drs(c) {
           a loves c
           porsche(c)
         }
       }
    `);
  });

  it("Mary likes and loves Jones.", function() {
    assertThat("Mary likes and loves Jones.")
     .equalsTo(`
       drs(a, b) {
         Mary(a)
         Jones(b)
         drs() {
           a likes b
         } and drs() {
           a loves b
         }
       }
    `);
  });

  it.skip("Jones likes him.", function() {
    // Chapter 3.1 suggests that the "him" here
    // shouldn't bind to Jones, and more generally
    // that objects can't bind to subjects.
    // However, in "If Jones likes Mary then he loves her"
    // seems like the "he" should bind to "Jones.
    // TODO(goto): revisit 3.1 and figure out what needs
    // to be done.
    assertThat("Jones likes him.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         a likes a
       }
    `);
  });

  it("Jones's wife is happy.", function() {
    assertThat("Jones's wife is happy.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         b wife a
         happy(b)
       }
    `);
  });

  it("Jones's wife is happy. She likes Smith.", function() {
    assertThat("Jones's wife is happy. She likes Smith.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         b wife a
         happy(b)
         Smith(c)
         b likes c
       }
    `);
  });

  it("Smith likes Jones's wife.", function() {
    assertThat("Smith likes Jones's wife.")
     .equalsTo(`
       drs(a, b, c) {
         Smith(a)
         Jones(b)
         a likes c
         c wife b
       }
    `);
  });

  it("Jones's wife or Smith's brother love Mary.", function() {
    assertThat("Jones's wife or Smith's brother loves Mary.")
     .equalsTo(`
       drs(a, b, c) {
         Mary(a)
         Jones(b)
         Smith(c)
         drs(d) {
           d loves a(d)
           d wife b
         } or drs(e) {
           e loves a(e)
           e brother c
         }
       }
    `);
  });

  it("Jones owns an unhappy donkey.", function() {
    assertThat("Jones owns an unhappy donkey.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a owns b
         unhappy(b)
         donkey(b)
       }
    `);
  });

  it("Jones owns a fast porsche.", function() {
    assertThat("Jones owns a fast porsche.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a owns b
         fast(b)
         porsche(b)
       }
    `);
  });

  it("Jones owns every fast porsche.", function() {
    assertThat("Jones owns every fast porsche.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           fast(b)
           porsche(b)
         } => drs() {
           a owns b
         }
       }
    `);
  });

  it("Every beautiful woman loves Jones.", function() {
    assertThat("Every beautiful woman loves Jones.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b) {
           beautiful(b)
           woman(b)
         } => drs() {
           b loves a
         }
       }
    `);
  });

  it("Smith loves a woman who does not like Jones.", function() {
    assertThat("Smith loves a woman who does not like Jones.")
     .equalsTo(`
       drs(a, b, c) {
         Smith(a)
         Jones(b)
         a loves c
         woman(c)
         ~drs() {
           c like b
         }
       }
    `);
  });

  it.skip("Jones likes a woman who likes Bill.", function() {
    // TODO(goto): this hangs. investigate why.
    assertThat("Jones likes a woman who likes Bill.")
     .equalsTo(`
    `);
  });

  it("Jones loves a woman with a donkey.", function() {
    assertThat("Jones loves a woman with a donkey.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         a loves b
         b with c
         woman(b)
         donkey(c)
       }
    `);
  });

  it("A woman with a donkey loves Jones.", function() {
    assertThat("A woman with a donkey loves Jones.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         b loves a
         b with c
         woman(b)
         donkey(c)
       }
    `);
  });

  it.skip("Jones loves the man.", function() {
    // What handles "the"-like nouns?
    assertThat("Jones loves the man.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         a loves the man
       }
    `);
  });

  it("Jones likes a woman near Smith's brother.", function() {
    assertThat("Jones likes a woman near Smith's brother.")
     .equalsTo(`
       drs(a, b, c, d) {
         Jones(a)
         Smith(b)
         a likes c
         c near d
         woman(c)
         d brother b
       }
    `);
  });

  it("Every woman with a donkey loves Jones.", function() {
    assertThat("Every woman with a donkey loves Jones.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         drs(b, c, d) {
           c with d
           woman(c)
           donkey(d)
         } => drs() {
           b loves a
         }
       }
    `);
  });

  it.skip("Every man from Brazil loves Mary.", function() {
    // c is introduced here and b is missing.
    assertThat("Every man from Brazil loves Mary.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         drs(b, c) {
           c from Brazil
           man(c)
         } => drs() {
           b loves a
         }
       }
    `);
  });

  it("Jones loves Mary. Jones likes Smith.", function() {
    assertThat("Jones loves Mary. Jones likes Smith.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Mary(b)
         a loves b
         Smith(c)
         a likes c
       }
    `);
  });

  it("Every man is mortal.", function() {
    assertThat("Every man is mortal. Socrates is a man.")
     .equalsTo(`
       drs(b) {
         drs(a) {
           man(a)
         } => drs() {
           mortal(a)
         }
         Socrates(b)
         man(b)
       }
    `);
  });

  it.skip("Mel loves Anna. Mel loves Anna's brother", function() {
    let ids = new Ids();
    let drs = DRS.from();
    drs.bind(first(parse("Mel loves Anna.")));
    assertThat(drs.head).equalsTo([]);
    // drs.bind("Mel loves Anna's brother.");
    // console.log(drs.print());

   });

  it("Sam is a brazilian engineer who likes Dani.", function() {
    assertThat("Sam is a brazilian engineer who loves Dani. He loves Anna. He loves Leo.")
     .equalsTo(`
       drs(a, b, c, d) {
         Sam(a)
         Dani(b)
         a loves b
         brazilian(a)
         engineer(a)
         Anna(c)
         a loves c
         Leo(d)
         a loves d
       }
    `);
  });

  it.skip("Sam loves Anna and Leo.", function() {
    assertThat("Sam loves Anna and Leo.")
     .equalsTo(`
       drs(a) {
         Sam(a)
         a loves Anna and Leo
       }
    `);
  });

  it("A brazilian engineer who loves Anna's mother is happy.", function() {
    assertThat("A brazilian engineer who loves Anna's mother is happy.")
     .equalsTo(`
       drs(a, b, c) {
         Anna(a)
         happy(b)
         b loves c
         brazilian(b)
         engineer(b)
         c mother a
       }
    `);
  });

  it("Sam is Dani's husband.", function() {
    assertThat("Sam is Dani's husband.")
     .equalsTo(`
       drs(a, b, c) {
         Sam(a)
         Dani(b)
         a is c
         c husband b
       }
    `);
  });

  it("Anna's father is Dani's husband.", function() {
    assertThat("Anna's father is Dani's husband.")
     .equalsTo(`
       drs(a, b, c, d) {
         Anna(a)
         Dani(b)
         c is d(c)
         c father a
         d husband b
       }
    `);
  });

  it("Anna's father is a brazilian engineer.", function() {
    assertThat("Anna's father is a brazilian engineer.")
     .equalsTo(`
       drs(a, b) {
         Anna(a)
         b father a
         brazilian(b)
         engineer(b)
       }
    `);
  });

  it("Sam is from Brazil", function() {
    assertThat("Sam is from Brazil.")
     .equalsTo(`
       drs(a, b) {
         Sam(a)
         Brazil(b)
         a from b
       }
    `);
  });

  it("Sam is from Brazil", function() {
    assertThat("Sam is from Brazil.")
     .equalsTo(`
       drs(a, b) {
         Sam(a)
         Brazil(b)
         a from b
       }
    `);
  });

  it("Sam's wife is behind Leo's sister", function() {
    assertThat("Sam's wife is behind Leo's sister.")
     .equalsTo(`
       drs(a, b, c, d) {
         Sam(a)
         Leo(b)
         c wife a
         c behind d
         d sister b
       }
    `);
  });

  it("Sam's wife is Dani.", function() {
    assertThat("Sam's wife is Dani.")
     .equalsTo(`
       drs(a, b, c) {
         Sam(a)
         Dani(b)
         c is b(c)
         c wife a
       }
    `);
  });

  it("Dani is Sam's wife.", function() {
    assertThat("Dani is Sam's wife.")
     .equalsTo(`
       drs(a, b, c) {
         Dani(a)
         Sam(b)
         a is c
         c wife b
       }
    `);
  });

  function assertThat(x) { 
    return {
      trim (str) {
        return str
          .trim()
          .split("\n")
          .map(line => line.trim())
          .join("\n");
      },
      equalsTo(y) {
       let drs = DRS.from();

       for (let s of x.split(".")) {
        if (s == "") {
         continue;
        }
        drs.feed(s.trim() + ".");
       }
       Assert.deepEqual(drs.print(), this.trim(y));
      }
     }
    }

});