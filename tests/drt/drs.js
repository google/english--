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
         a admire b
         man(a)
         woman(b)
       }
    `);
  });

  it("A man admires a woman. She likes him.", function() {
    assertThat("A man admires a woman. She likes him.")
     .equalsTo(`
       drs(a, b) {
         a admire b
         man(a)
         woman(b)
         b like a
       }
    `);
  });

  it("Jones admires a woman who likes him.", function() {
    assertThat("Jones admires a woman who likes him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a admire b
         b like a
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
         a love b
       }
    `);
  });

  it("A man loves Dani.", function() {
    assertThat("A man loves Dani.")
     .equalsTo(`
       drs(a, b) {
         Dani(a)
         b love a
         man(b)
       }
     `);
  });

  it("Dani loves a man.", function() {
    assertThat("Dani loves a man.")
     .equalsTo(`
       drs(a, b) {
         Dani(a)
         a love b
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
         c fascinate a
         c love b
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
         a love c
         c fascinate b
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
         a own c
         b love c
         book(c)
       }
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a own b
         b fascinate a
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
         c love d
         c fascinate a
         man(c)
         d fascinate b
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
         a own b
         b fascinate a
       }
     `);
  });

  it("Mel owns a book.", function() {
    assertThat("Mel owns a book. It fascinates him.")
     .equalsTo(`
       drs(a, b) {
         Mel(a)
         a own b
         book(b)
         b fascinate a
       }
     `);
  });

  it("Mel owns a book. It fascinates him. Dani loves him.", function() {
    assertThat("Mel owns a book. It fascinates him. Dani loves him.")
     .equalsTo(`
       drs(a, b, c) {
         Mel(a)
         a own b
         book(b)
         b fascinate a
         Dani(c)
         c love a
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
         a own b
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
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Ulysses(b)
         ~drs() {
           a own b
         }
         b like a
       }
     `);
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a love b
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
         happy(a)
         a love b
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
         a love b
       }
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         a love b
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
         b love a
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
         a own b
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
           a own b
           book(b)
         } => drs() {
           a like b
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
           a own c
           book(c)
         } => drs(d) {
           b own d
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
         a like b
         drs(c) {
           b like c
           book(c)
         } => drs() {
           a like c
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
           a like c
           man(c)
         } => drs() {
           b like b
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
           b love a
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
           a love b
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
           a love c
         } or drs() {
           b love c
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
           a own b
           porsche(b)
         } or drs() {
           a like b
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
           a love b
         } or drs() {
           a like c
         }
       }
    `);
  });

  it("Jones or Smith loves Mary.", function() {
    // TODO(goto): this isn't correct because
    // Mary is bound to different referents.
    assertThat("Jones or Smith loves Mary.")
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

  it("Mary is happy. Jones or Smith loves her.", function() {
    assertThat("Mary is happy. Jones or Smith loves her.")
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
           a love
         } or drs() {
           a like b
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
           a love b
         } or drs(d) {
           a like d
           c love d
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
           b love c
           woman(c)
         } => drs() {
           a like c
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
           a love b
         } or drs() {
           drs(d) {
             c love d
             woman(d)
           } => drs() {
             a like d
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
           a love b
         } and drs() {
           b love a
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
           a own b
           porsche(b)
         } and drs() {
           a love b
         }
       }
    `);
  });

  it("She loves it and Mary owns a porsche.", function() {
    let drs = DRS.from();
    try {
     drs.feed("She loves it and Mary owns a porsche.");
     throw new Error("Expected exception");
    } catch (e) {
     // She can't bind to "Mary" because Mary is introduced
     // lexically after She, regardless of "Mary" being a
     // proper noun and being visible globally.
     Assert.deepEqual(e.message, "Invalid Reference: it");
    }
  });

  it.skip("Mary owns and loves a porsche.", function() {
    // TODO(goto): find a way to process indefinite nouns
    // before the CRAND gets constructed.
    assertThat("Mary owns and loves a porsche.")
     .equalsTo(`
       drs(a) {
         Mary(a)
         drs(b) {
           a own b
           porsche(b)
         } and drs(c) {
           a love c
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
           a like b
         } and drs() {
           a love b
         }
       }
    `);
  });

  it("John likes Peter. He admires him.", function() {
    // Chapter 3.1 suggests that the "him" here
    // shouldn't bind to "he", and more generally
    // that objects can't bind to subjects.
    // However, in "If Jones likes Mary then he loves her"
    // seems like the "he" should bind to "Jones.
    // TODO(goto): revisit 3.1 and figure out what needs
    // to be done.
    assertThat("John likes Peter. He admires him.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Peter(b)
         a like b
         b admire a
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
         b like c
       }
    `);
  });

  it("Smith likes Jones's wife.", function() {
    assertThat("Smith likes Jones's wife.")
     .equalsTo(`
       drs(a, b, c) {
         Smith(a)
         Jones(b)
         a like c
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
           d love a(d)
           d wife b
         } or drs(e) {
           e love a(e)
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
         a own b
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
         a own b
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
           a own b
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
           b love a
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
         a love c
         woman(c)
         ~drs() {
           c like b
         }
       }
    `);
  });

  it("Jones likes a woman who likes Bill.", function() {
    assertThat("Jones likes a woman who likes Bill.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         Bill(b)
         a like c
         c like b
         woman(c)
       }
    `);
  });

  it("Jones loves a woman with a donkey.", function() {
    assertThat("Jones loves a woman with a donkey.")
     .equalsTo(`
       drs(a, b, c) {
         Jones(a)
         a love b
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
         b love a
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
         a love the man
       }
    `);
  });

  it("Jones likes a woman near Smith's brother.", function() {
    assertThat("Jones likes a woman near Smith's brother.")
     .equalsTo(`
       drs(a, b, c, d) {
         Jones(a)
         Smith(b)
         a like c
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
         drs(b, c) {
           b with c
           woman(b)
           donkey(c)
         } => drs() {
           b love a
         }
       }
    `);
  });

  it("Every man from Brazil loves Mary.", function() {
    assertThat("Every man from Brazil loves Mary.")
     .equalsTo(`
       drs(a, b) {
         Mary(a)
         Brazil(b)
         drs(c) {
           c from b
           man(c)
         } => drs() {
           c love a
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
         a love b
         Smith(c)
         a like c
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


  it("Sam is a brazilian engineer who likes Dani. He loves Anna. He loves Leo.", function() {
    assertThat("Sam is a brazilian engineer who loves Dani. He loves Anna. He loves Leo.")
     // This is awkward but is working as intended:
     // Sam loves Dani, Dani loves Anna and Anna loves Leo.
     // Pronouns are bound to the last introduced referent
     // that agrees in gender and number, and Sam, Dani, Anna 
     // and Leo have gender values that can be bound to
     // anything.
     .equalsTo(`
       drs(a, b, c, d) {
         Sam(a)
         Dani(b)
         brazilian(a)
         a love b
         engineer(a)
         Anna(c)
         b love c
         Leo(d)
         c love d
       }
    `);
  });

  it.skip("Sam loves Anna and Leo.", function() {
    assertThat("Sam loves Anna and Leo.")
     .equalsTo(`
       drs(a) {
         Sam(a)
         a love Anna and Leo
       }
    `);
  });

  it("A brazilian engineer who loves Anna's mother is happy.", function() {
    assertThat("A brazilian engineer who loves Anna's mother is happy.")
     .equalsTo(`
       drs(a, b, c) {
         Anna(a)
         happy(b)
         b love c
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

  it("Fabio is Denise's brother. He likes Japan.", function() {
    assertThat("Fabio is Denise's brother. He likes Japan.")
     .equalsTo(`
       drs(a, b, c, d) {
         Fabio(a)
         Denise(b)
         a is c
         c brother b
         Japan(d)
         c like d
       }
    `);
  });

  it("John loves himself.", function() {
    assertThat("John loves himself.")
     .equalsTo(`
       drs(a) {
         John(a)
         a love a
       }
    `);
  });

  it("John kissed Anna.", function() {
    assertThat("John kissed Anna.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Anna(b)
         < a kiss b
       }
    `);
  });

  it("John was happy.", function() {
    assertThat("John was happy.")
     .equalsTo(`
       drs(a) {
         John(a)
         < happy(a)
       }
    `);
  });

  it("John was not happy.", function() {
    assertThat("John was not happy.")
     .equalsTo(`
       drs(a) {
         John(a)
         < ~happy(a)
       }
    `);
  });

  it("John knows Mary.", function() {
    assertThat("John knows Mary.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Mary(b)
         a know b
       }
    `);
  });

  it("John will not kiss Anna.", function() {
    assertThat("John will not kiss Anna.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Anna(b)
         ~drs() {
           > a kiss b
         }
       }
    `);
  });

  it("John did not kiss Anna.", function() {
    assertThat("John did not kiss Anna.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Anna(b)
         ~drs() {
           < a kiss b
         }
       }
    `);
  });

  it("John likes Anna.", function() {
    assertThat("John likes Anna.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Anna(b)
         a like b
       }
    `);
  });

  it("John does not like Anna.", function() {
    // This is a slightly different result we get at
    // page 555, with regards to the temporal
    // referents.
    assertThat("John does not like Anna.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Anna(b)
         ~drs() {
           a like b
         }
       }
    `);
  });

  it("John has kissed Mary.", function() {
    assertThat("John has kissed Mary.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Mary(b)
         a kiss b
       }
    `);
  });

  it.skip("John has not kissed Mary.", function() {
    assertThat("John has not kissed Mary.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Mary(b)
         a kiss b
       }
    `);
  });

  it("John has owned a porsche.", function() {
    assertThat("John has owned a porsche.")
     .equalsTo(`
       drs(a, b) {
        John(a)
         a own b
         porsche(b)
       }
    `);
  });

  it("John was happy.", function() {
    assertThat("John was happy.")
     .equalsTo(`
       drs(a) {
        John(a)
        < happy(a)
       }
    `);
  });

  it("John was an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("John was an engineer.")
     .equalsTo(`
       drs(a) {
        John(a)
        < engineer(a)
       }
    `);
  });

  it("John was not an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("John was not an engineer.")
     .equalsTo(`
       drs(a) {
         John(a)
         ~drs() {
           < engineer(a)
         }
       }
    `);
  });

  it("John was not an engineer.", function() {
    assertThat("John was not an engineer from Brazil.")
     .equalsTo(`
      drs(a, b) {
        John(a)
        Brazil(b)
        ~drs() {
          a from b
          engineer(a)
        }
       }
    `);
  });

  it("Every brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Every brazilian was happy.")
     .equalsTo(`
       drs() {
         drs(a) {
           brazilian(a)
         } => drs() {
           < happy(a)
         }
       }
    `);
  });

  it("Every engineer who was brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Every engineer who was brazilian was happy.")
     .equalsTo(`
       drs() {
         drs(a) {
           engineer(a)
           < brazilian(a)
         } => drs() {
           < happy(a)
         }
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