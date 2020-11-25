const Assert = require("assert");

const {Rules} = require("../../src/drt/rules.js");
const {DRS} = require("../../src/drt/drs.js");

describe("DRS", function() {

  it("A man admires a woman.", function() {
    assertThat("A man admires a woman.")
     .equalsTo(`
       let a, b
       man(a)
       woman(b)
       admires(a, b)
    `);
  });

  it("A man admires a woman. She likes him.", function() {
    assertThat("A man admires a woman. She likes him.")
     .equalsTo(`
       let a, b
       man(a)
       woman(b)
       admires(a, b)
       likes(b, a)
    `);
  });

  it("Jones admires a woman who likes him.", function() {
    assertThat("Jones admires a woman who likes him.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       admires(a, b)
       likes(b, a)
    `);
  });

  it("Jones loves Mary.", function() {
    assertThat("Jones loves Mary.", true)
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       loves(a, b)
    `);
  });

  it("A man loves Mary.", function() {
    assertThat("A man loves Mary.")
     .equalsTo(`
       let a, b
       Mary(a)
       man(b)
       loves(b, a)
     `);
  });

  it("Mary loves a man.", function() {
    assertThat("Mary loves a man.")
     .equalsTo(`
       let a, b
       Mary(a)
       man(b)
       loves(a, b)
     `);
  });

  it("A man who loves Mary fascinates Smith.", function() {
    assertThat("A man who loves Mary fascinates Smith.")
     .equalsTo(`
       let a, b, c
       Smith(a)
       Mary(b)
       man(c)
       fascinates(c, a)
       loves(c, b)
     `);
  });

  it("Jones loves a book which fascinates Smith.", function() {
    assertThat("Jones loves a book which fascinates Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       book(c)
       loves(a, c)
       fascinates(c, b)
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       book(c)
       owns(a, c)
       loves(b, c)
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       book(b)
       owns(a, b)
       fascinates(b, a)
     `);
  });

  it("A man who fascinates Mary loves a book which fascinates Smith.", function() {
    assertThat("A man who fascinates Mary loves a book which fascinates Smith.")
     .equalsTo(`
       let a, b, c, d
       Mary(a)
       Smith(b)
       man(c)
       book(d)
       loves(c, d)
       fascinates(c, a)
       fascinates(d, b)
     `);
  });

  it("Jones owns Ulysses. It fascinates him.", function() {
    assertThat("Jones owns Ulysses. It fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       Ulysses(b)
       owns(a, b)
       fascinates(b, a)
     `);
  });

  it("Jones owns a book.", function() {
    assertThat("Jones owns a book. It fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       book(b)
       owns(a, b)
       fascinates(b, a)
     `);
  });

  it("Jones owns a book. It fascinates him. Mary loves him.", function() {
    assertThat("Jones owns a book. It fascinates him. Mary loves him.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       book(b)
       owns(a, b)
       fascinates(b, a)
       Mary(c)
       loves(c, a)
     `);
  });

  it("Jones does not own a porsche.", function() {
    assertThat("Jones does not own a porsche.")
     .equalsTo(`
       let a
       Jones(a)
       not {
         let b
         porsche(b)
         own(a, b)
       }
     `);
  });

  it("Jones owns a porsche. He does not like it.", function() {
    assertThat("Jones owns a porsche. He does not like it.")
     .equalsTo(`
       let a, b
       Jones(a)
       porsche(b)
       owns(a, b)
       not {
         like(a, b)
       }
     `);
  });

  it("Jones does not own a porsche. He likes it.", function() {
    let drs = new DRS(Rules.from());
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

  it.skip("Jones does not own Ulysses. He likes it.", function() {
    // TODO(goto): we got the reference to "it" wrong here.
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Ulysses(b)
         ~drs() {
           a own b
         }
         b likes a
       }
     `);
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       not {
         love(b, a)
       }
       loves(a, b)
       not {
         let c
         man(c)
         love(b, c)
       }
     `);
  });

  it("A porsche does not stink", function() {
    assertThat("A porsche does not stink.")
     .equalsTo(`
       let a
       not {
         stink(a)
       }
       porsche(a)
     `);
  });

  it("Jones does not own a porsche which does not fascinate him", function() {
    assertThat("Jones does not own a porsche which does not fascinate him.")
     .equalsTo(`
       let a
       Jones(a)
       not {
         let b
         porsche(b)
         not {
           fascinate(b, a)
         }
         own(a, b)
       }
     `);
  });

  it("Jones does not like a porsche which he does not own.", function() {
    assertThat("Jones does not like a porsche which he does not own.")
     .equalsTo(`
       let a
       Jones(a)
       not {
         let b
         porsche(b)
         not {
           own(a, b)
         }
         like(a, b)
       }
     `);
  });

  it("Jones is happy.", function() {
    assertThat("Jones is happy.")
     .equalsTo(`
       let a
       Jones(a)
       happy(a)
    `);
  });

  it("Jones is not happy.", function() {
    assertThat("Jones is not happy.")
     .equalsTo(`
       let a
       Jones(a)
       not {
         happy(a)
       }
    `);
  });

  it("A man is happy.", function() {
    assertThat("A man is happy.")
     .equalsTo(`
       let a
       happy(a)
       man(a)
    `);
  });

  it("Jones is a man.", function() {
    assertThat("Jones is a man.")
     .equalsTo(`
       let a
       Jones(a)
       man(a)
    `);
  });

  it("Jones is a happy man.", function() {
    assertThat("Jones is a happy man.")
     .equalsTo(`
       let a
       Jones(a)
       happy(a)
       man(a)
    `);
  });

  it("Jones is a happy man who loves Mary.", function() {
    assertThat("Jones is a happy man who loves Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       happy(a)
       man(a)
       loves(a, b)
    `);
  });

  it("Jones is a man. He is happy. He loves Mary.", function() {
    assertThat("Jones is a man. He is happy. He loves Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       man(a)
       happy(a)
       Mary(b)
       loves(a, b)
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       happy(b)
       loves(a, b)
    `);
  });

  it("A woman who is happy loves Jones.", function() {
    assertThat("A woman who is happy loves Jones.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       happy(b)
       loves(b, a)
    `);
  });

  it("Jones owns a porsche. He is happy.", function() {
    assertThat("Jones owns a porsche. He is happy.")
     .equalsTo(`
       let a, b
       Jones(a)
       porsche(b)
       owns(a, b)
       happy(a)
    `);
  });

  it("If Jones owns a book then he likes it.", function() {
    assertThat("If Jones owns a book then he likes it.")
     .equalsTo(`
       let a
       Jones(a)
       if ({
         let b
         book(b)
         owns(a, b)
       }) {
         likes(a, b)
       }
    `);
  });

  it("If Jones owns a book then Smith owns a porsche.", function() {
    // TODO(goto): to make this result match 2.33 we still need to
    // promote proper names to the global DRS.
    assertThat("If Jones owns a book then Smith owns a porsche.")
     .equalsTo(`
       let a, b
       Jones(a)
       Smith(b)
       if ({
         let c
         book(c)
         owns(a, c)
       }) {
         let d
         porsche(d)
         owns(b, d)
       }
    `);
  });

  it("Jones likes Mary. If she likes a book then he likes it.", function() {
    assertThat("Jones likes Mary. If she likes a book then he likes it.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       likes(a, b)
       if ({
         let c
         book(c)
         likes(b, c)
       }) {
         likes(a, c)
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
         } every (c) drs() {
           b like b
         }
       }
    `);
  });

  it("Every man loves Jones.", function() {
    assertThat("Every man loves Jones.")
     .equalsTo(`
       let a
       Jones(a)
       every (b: {
         man(b)
       }) {
         loves(b, a)
       }
    `);
  });

  it("Every man is happy.", function() {
    assertThat("Every man is happy.")
     .equalsTo(`
       every (a: {
         man(a)
       }) {
         happy(a)
       }
    `);
  });

  it("Every man is happy. He likes it.", function() {
    try {
     let drs = new DRS(Rules.from());
     drs.feed("Every man is happy.");
     drs.feed("He likes it.");
     throw new Error("expected reference 'He' to fail");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: He");
    }
  });

  it("Every man owns a book. It is happy.", function() {
    try {
     let drs = new DRS(Rules.from());
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
         let a
         Jones(a)
         every (b: {
           man(b)
         }) {
           loves(a, b)
         }
    `);
  });

  it("Jones loves Mary or Smith loves her.", function() {
    assertThat("Jones loves Mary or Smith loves her.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       Mary(c)
       {
         loves(a, c)
       } or {
         loves(b, c)
       }
    `);
  });

  it.skip("Jones owns a porsche or he likes it.", function() {
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

  it.skip("Mary loves Jones or likes Smith.", function() {
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
       let a
       Mary(a)
       {
         let b
         Jones(b)
         b loves a
       } or {
         let c
         Smith(c)
         c loves a
       }
    `);
  });

  it("Mary is happy. Jones or Smith loves her.", function() {
    assertThat("Mary is happy. Jones or Smith loves her.")
     .equalsTo(`
       let a
       Mary(a)
       happy(a)
       {
         let b
         Jones(b)
         b loves a
       } or {
         let c
         Smith(c)
         c loves a
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

  it.skip("Jones loves or likes Mary.", function() {
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

  it.skip("Jones loves Mary or likes a woman who Smith loves.", function() {
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
       let a, b
       Jones(a)
       Smith(b)
       every (c: {
         woman(c)
         loves(b, c)
       }) {
         likes(a, c)
       }
     `);
  });

  it.skip("Jones loves Mary or likes a woman who Smith loves.", function() {
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
           } every (d) drs() {
             a like d
           }
         }
       }
    `);
  });

  it("Mary loves Smith and he lovers her.", function() {
    assertThat("Mary loves Smith and he loves her.")
     .equalsTo(`
       let a, b
       Mary(a)
       Smith(b)
       {
         loves(a, b) 
       } and {
         loves(b, a)
       }
    `);
  });

  it("Mary owns a porsche and she loves it.", function() {
    assertThat("Mary owns a porsche and she loves it.")
     .equalsTo(`
       let a
       Mary(a)
       {
         let b
         porsche(b)
         owns(a, b) 
       } and { 
         loves(a, b)
       }
    `);
  });

  it("She loves it and Mary owns a porsche.", function() {
    let drs = new DRS(Rules.from());
    
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

  it.skip("Mary likes and loves Jones.", function() {
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

  it.skip("Jones likes Smith. He admires him.", function() {
    // Chapter 3.1 suggests that the "him" here
    // shouldn't bind to "he", and more generally
    // that objects can't bind to subjects.
    // However, in "If Jones likes Mary then he loves her"
    // seems like the "he" should bind to "Jones.
    // TODO(goto): revisit 3.1 and figure out what needs
    // to be done.
    assertThat("Jones likes Smith. He admires him.")
     .equalsTo(`
       drs(a, b) {
         Jones(a)
         Smith(b)
         a likes b
         b admires a
       }
    `);
  });

  it("Jones's wife is happy.", function() {
    assertThat("Jones's wife is happy.")
     .equalsTo(`
       let a, b
       Jones(a)
       happy(b)
       wife(b, a)
    `);
  });

  it("Jones's wife is happy. She likes Smith.", function() {
    assertThat("Jones's wife is happy. She likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       happy(b)
       wife(b, a)
       Smith(c)
       likes(b, c)
    `);
  });

  it("Smith likes Jones's wife.", function() {
    assertThat("Smith likes Jones's wife.")
     .equalsTo(`
       let a, b, c
       Smith(a)
       Jones(b)
       likes(a, c)
       wife(c, b)
    `);
  });

  it.skip("Jones's wife or Smith's brother love Mary.", function() {
    //assertThat("Jones's wife or Smith's brother loves Mary.")
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
       let a, b
       Jones(a)
       unhappy(b)
       donkey(b)
       owns(a, b)
    `);
  });

  it("Jones owns a fast porsche.", function() {
    assertThat("Jones owns a fast porsche.")
     .equalsTo(`
       let a, b
       Jones(a)
       fast(b)
       porsche(b)
       owns(a, b)
    `);
  });

  it("Jones owns every fast porsche.", function() {
    assertThat("Jones owns every fast porsche.")
     .equalsTo(`
       let a
       Jones(a)
       every (b: {
         fast(b)
         porsche(b)
       }) {
         owns(a, b)
       }
    `);
  });

  it("Every beautiful woman loves Jones.", function() {
    assertThat("Every beautiful woman loves Jones.")
     .equalsTo(`
       let a
       Jones(a)
       every (b: {
         beautiful(b)
         woman(b)
       }) {
         loves(b, a)
       }
    `);
  });

  it("Smith loves a woman who does not like Jones.", function() {
    assertThat("Smith loves a woman who does not like Jones.")
     .equalsTo(`
       let a, b, c
       Smith(a)
       Jones(b)
       woman(c)
       not {
         like(c, b)
       }
       loves(a, c)
    `);
  });

  it("Jones likes a woman who likes Smith.", function() {
    assertThat("Jones likes a woman who likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       woman(c)
       likes(a, c)
       likes(c, b)
    `);
  });

  it("Jones loves a woman with a donkey.", function() {
    assertThat("Jones loves a woman with a donkey.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       woman(b)
       donkey(c)
       loves(a, b)
       with(b, c)
    `);
  });

  it("A woman with a donkey loves Jones.", function() {
    assertThat("A woman with a donkey loves Jones.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       woman(b)
       donkey(c)
       loves(b, a)
       with(b, c)
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

  it.skip("Jones likes a woman near Smith's brother.", function() {
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
       let a
       Jones(a)
       every (b: {
         let c
         woman(b)
         donkey(c)
         with(b, c)
       }) {
         loves(b, a)
       }
    `);
  });

  it("Every man from Brazil loves Mary.", function() {
    assertThat("Every man from Brazil loves Mary.")
     .equalsTo(`
       let a, b
       Mary(a)
       Brazil(b)
       every (c: {
         man(c)
         from(c, b)
       }) {
         loves(c, a)
       }
    `);
  });

  it("Jones loves Mary. Jones likes Smith.", function() {
    assertThat("Jones loves Mary. Jones likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       loves(a, b)
       Smith(c)
       likes(a, c)
    `);
  });

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat("Every man is mortal. Socrates is a man.")
     .equalsTo(`
       let b
       every (a: {
         man(a)
       }) {
         mortal(a)
       }
       Socrates(b)
       man(b)
    `);
  });


  it.skip("Jones is a brazilian engineer who likes Mary. He loves Smith. He loves Socrates.", function() {
    assertThat("Jones is a brazilian engineer who loves Mary. He loves Smith. He loves Socraates.")
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

  it.skip("Jones loves Mary and Smith.", function() {
    assertThat("Jones loves Mary and Smith.")
     .equalsTo(`
       drs(a) {
         Jones(a)
         a loves Mary and Smith
       }
    `);
  });

  it.skip("A brazilian engineer who loves Mary's mother is happy.", function() {
    assertThat("A brazilian engineer who loves Mary's mother is happy.")
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

  it("Jones is Mary's husband.", function() {
    assertThat("Jones is Mary's husband.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       a is c
       husband(c, b)
    `);
  });

  it("Jones's father is Mary's husband.", function() {
    assertThat("Jones's father is Mary's husband.")
     .equalsTo(`
       let a, b, c, d
       Jones(a)
       Mary(b)
       c is d(c)
       father(c, a)
       husband(d, b)
    `);
  });

  it("Mary's father is a brazilian engineer.", function() {
    assertThat("Mary's father is a brazilian engineer.")
     .equalsTo(`
       let a, b
       Mary(a)
       brazilian(b)
       engineer(b)
       father(b, a)
    `);
  });

  it("Jones is from Brazil", function() {
    assertThat("Jones is from Brazil.")
     .equalsTo(`
       let a, b
       Jones(a)
       Brazil(b)
       from(a, b)
    `);
  });

  it("Jones is behind Mary", function() {
    assertThat("Jones is behind Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       behind(a, b)
    `);
  });

  it("Jones's wife is behind Mary's sister", function() {
    // assertThat("Jones's wife is behind Mary's sister.")
    assertThat("Jones's wife is behind Mary's sister.")
     .equalsTo(`
       let a, b, c, d
       Jones(a)
       Mary(b)
       wife(c, a)
       behind(c, d)
       sister(d, b)
    `);
  });

  it("Jones's wife is Mary.", function() {
    assertThat("Jones's wife is Mary.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       c is b(c)
       wife(c, a)
    `);
  });

  it("Mary is Jones's wife.", function() {
    assertThat("Mary is Jones's wife.")
     .equalsTo(`
       let a, b, c
       Mary(a)
       Jones(b)
       a is c
       wife(c, b)
    `);
  });

  it("Jones is Smith's brother. He likes Brazil.", function() {
    assertThat("Jones is Smith's brother. He likes Brazil.")
     .equalsTo(`
       let a, b, c, d
       Jones(a)
       Smith(b)
       a is c
       brother(c, b)
       Brazil(d)
       likes(c, d)
    `);
  });

  it("Jones loves himself.", function() {
    assertThat("Jones loves himself.")
     .equalsTo(`
       let a
       Jones(a)
       loves(a, a)
    `);
  });

  it("Jones kissed Mary.", function() {
    assertThat("Jones kissed Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       < kissed(a, b)
    `);
  });

  it("John was happy.", function() {
    assertThat("John was happy.")
     .equalsTo(`
       let a
       John(a)
       < happy(a)
    `);
  });

  it("John was not happy.", function() {
    assertThat("John was not happy.")
     .equalsTo(`
       let a
       John(a)
       not {
         < happy(a)
       }
    `);
  });

  it("John likes Mary.", function() {
    assertThat("John likes Mary.")
     .equalsTo(`
       let a, b
       John(a)
       Mary(b)
       likes(a, b)
    `);
  });

  it("John will not kiss Mary.", function() {
    assertThat("John will not kiss Mary.")
     .equalsTo(`
       let a, b
       John(a)
       Mary(b)
       not {
         > kiss(a, b)
       }
    `);
  });

  it.skip("John did not love Mary.", function() {
    assertThat("John did not kiss Mary.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Mary(b)
         ~drs() {
           < a kiss b
         }
       }
    `);
  });

  it("John likes Mary.", function() {
    assertThat("John likes Mary.")
     .equalsTo(`
       let a, b
       John(a)
       Mary(b)
       likes(a, b)
    `);
  });

  it("John does not like Mary.", function() {
    // This is a slightly different result we get at
    // page 555, with regards to the temporal
    // referents.
    assertThat("John does not like Mary.")
     .equalsTo(`
       let a, b
       John(a)
       Mary(b)
       not {
         like(a, b)
       }
    `);
  });

  it("John has kissed Mary.", function() {
    assertThat("John has kissed Mary.")
     .equalsTo(`
       let a, b
       John(a)
       Mary(b)
       kissed(a, b)
    `);
  });

  it.skip("John has not kissed Mary.", function() {
    assertThat("John has not kissed Mary.")
     .equalsTo(`
       drs(a, b) {
         John(a)
         Mary(b)
         a has not kissed b
       }
    `);
  });

  it("John has owned a porsche.", function() {
    assertThat("John has owned a porsche.")
     .equalsTo(`
       let a, b
       John(a)
       porsche(b)
       owned(a, b)
    `);
  });

  it("John was happy.", function() {
    assertThat("John was happy.")
     .equalsTo(`
       let a
       John(a)
       < happy(a)
    `);
  });

  it("John was an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("John was an engineer.")
     .equalsTo(`
       let a
       John(a)
       < engineer(a)
    `);
  });

  it("John was not an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("John was not an engineer.")
     .equalsTo(`
       let a
       John(a)
       not {
         < engineer(a)
       }
    `);
  });

  it("John was not an engineer from Brazil.", function() {
    assertThat("John was not an engineer from Brazil.")
     .equalsTo(`
      let a, b
      John(a)
      Brazil(b)
      not {
        engineer(a)
        from(a, b)
      }
    `);
  });

  it("Every brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Every brazilian was happy.")
     .equalsTo(`
         every (a: {
           brazilian(a)
         }) {
           < happy(a)
         }
    `);
  });

  it("All brazilians are happy.", function() {
    assertThat("All brazilians are happy.")
     .equalsTo(`
         all (a: {
           brazilians(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Most brazilians are happy.", function() {
    assertThat("Most brazilians are happy.")
     .equalsTo(`
         most (a: {
           brazilians(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Many brazilians are happy.", function() {
    assertThat("Many brazilians are happy.")
     .equalsTo(`
       many (a: {
         brazilians(a)
       }) {
         happy(a)
       }
    `);
  });

  it("3 brazilians are happy.", function() {
    assertThat("3 brazilians are happy.")
     .equalsTo(`
         3 (a: {
           brazilians(a)
         }) {
           happy(a)
         }
    `);
  });
  
  it("Only brazilians are happy.", function() {
    assertThat("Only brazilians are happy.")
     .equalsTo(`
         only (a: {
           brazilians(a)
         }) {
           happy(a)
         }
    `);
  });

  it("The majority of brazilians are happy.", function() {
    assertThat("The majority of brazilians are happy.")
     .equalsTo(`
         the-majority-of (a: {
           brazilians(a)
         }) {
           happy(a)
         }
    `);
  });

  it.skip("Every engineer who was brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Every engineer who was brazilian was happy.")
     .equalsTo(`
       drs() {
         drs(a) {
           engineer(a)
           < brazilian(a)
         } every (a) drs() {
           < happy(a)
         }
       }
    `);
  });

  it("Is Jones happy?", function() {
    assertThat("Is Jones happy?")
     .equalsTo(`
       for () {
         let a
         Jones(a) 
         happy(a)
       } ?
    `);
  });

  it("Who loves Jones?", function() { 
    // NOTE(goto): we should probably keep the 
    // variable b scoped to the question.
    assertThat("Who loves Jones?")
     .equalsTo(`
       let a, b
       Jones(a)
       for (b) {
         let b
         loves(b, a)
       } ?
    `);
  });

  it("Who does Jones love?", function() { 
    assertThat("Who does Jones love?")
     .equalsTo(`
       let a
       for (a) {
         let a, b
         Jones(b)
         love(b, a)
       } ?
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
       let drs = new DRS(Rules.from());
       drs.feed(x);
       Assert.deepEqual(drs.print(), this.trim(y));
      }
     }
    }

});
