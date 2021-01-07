const Assert = require("assert");

const {Rules} = require("../../src/drt/rules.js");
const {DRS} = require("../../src/drt/drs.js");
const {Parser} = require("../../src/drt/parser.js");
const {dict} = require("./dict.js");
const {Tokenizer} = require("../../src/drt/lexer.js");

describe("DRS", function() {

  it("A man admires a woman.", function() {
    assertThat("A man admires a woman.")
     .equalsTo(`
       let a, b
       man(a)
       woman(b)
       admire(a, b)
    `);
  });

  it("A man admires a woman. She likes him.", function() {
    assertThat("A man admires a woman. She likes him.")
     .equalsTo(`
       let a, b
       man(a)
       woman(b)
       admire(a, b)
       like(b, a)
    `);
  });

  it("Jones admires a woman who likes him.", function() {
    assertThat("Jones admires a woman who likes him.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       admire(a, b)
       like(b, a)
    `);
  });

  it("Jones loves Mary.", function() {
    assertThat("Jones loves Mary.", true)
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       love(a, b)
    `);
  });

  it("A man loves Mary.", function() {
    assertThat("A man loves Mary.")
     .equalsTo(`
       let a, b
       Mary(a)
       man(b)
       love(b, a)
     `);
  });

  it("Mary loves a man.", function() {
    assertThat("Mary loves a man.")
     .equalsTo(`
       let a, b
       Mary(a)
       man(b)
       love(a, b)
     `);
  });

  it("A man who loves Mary fascinates Smith.", function() {
    assertThat("A man who loves Mary fascinates Smith.")
     .equalsTo(`
       let a, b, c
       Smith(a)
       Mary(b)
       man(c)
       fascinate(c, a)
       love(c, b)
     `);
  });

  it("Jones loves a book which fascinates Smith.", function() {
    assertThat("Jones loves a book which fascinates Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       book(c)
       love(a, c)
       fascinate(c, b)
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       book(c)
       own(a, c)
       love(b, c)
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       book(b)
       own(a, b)
       fascinate(b, a)
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
       love(c, d)
       fascinate(c, a)
       fascinate(d, b)
     `);
  });

  it("Jones owns Ulysses. it fascinates him.", function() {
    assertThat("Jones owns Ulysses. it fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       Ulysses(b)
       own(a, b)
       fascinate(b, a)
     `);
  });

  it("Jones owns a book.", function() {
    assertThat("Jones owns a book. it fascinates him.")
     .equalsTo(`
       let a, b
       Jones(a)
       book(b)
       own(a, b)
       fascinate(b, a)
     `);
  });

  it("Jones owns a book. It fascinates him. Mary loves him.", function() {
    assertThat("Jones owns a book. It fascinates him. Mary loves him.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       book(b)
       own(a, b)
       fascinate(b, a)
       Mary(c)
       love(c, a)
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
       own(a, b)
       not {
         like(a, b)
       }
     `);
  });

  it("Jones does not own a porsche. He likes it.", function() {
    let drs = new DRS(Rules.from());
    drs.feed(new Parser("Discourse", dict).feed("Jones does not own a porsche."));
    try {
      // "it" in "he likes it" cannot bind to anything
      // because porsche(b) is inside the negated sub
      // drs.
      drs.feed(new Parser("Discourse", dict).feed("He likes it."));
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

  it("Jones loves a woman who does not admire him. She does not love a man.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       not {
         love(b, a)
       }
       love(a, b)
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
       man(a)
       happy(a)
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
       happy-man(a)
       man(a)
    `);
  });

  it("Jones is a happy man who loves Mary.", function() {
    assertThat("Jones is a happy man who loves Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       happy-man(a)
       man(a)
       love(a, b)
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
       love(a, b)
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       happy(b)
       love(a, b)
    `);
  });

  it("A woman who is happy loves Jones.", function() {
    assertThat("A woman who is happy loves Jones.")
     .equalsTo(`
       let a, b
       Jones(a)
       woman(b)
       happy(b)
       love(b, a)
    `);
  });

  it("Jones owns a porsche. He is happy.", function() {
    assertThat("Jones owns a porsche. He is happy.")
     .equalsTo(`
       let a, b
       Jones(a)
       porsche(b)
       own(a, b)
       happy(a)
    `);
  });
  
  it("If a man loves Mary then Smith likes the woman.", function() {
    assertThat("If a man loves Mary then Smith likes a woman.")
     .equalsTo(`
      let a, b
      Smith(a)
      Mary(b)
      if ({
        let c
        man(c)
        love(c, b)
      }) {
        let d
        woman(d)
        like(a, d)
      }
    `);
  });

  it.skip("A man likes Smith. The man loves Mary.", function() {
    // Anaphora resoution of "the" seems to not be working.
    assertThat("A man likes Smith. The man loves Mary.")
     .equalsTo(`
    `);
  });
  
  it("If Jones owns a book then he likes it.", function() {
    assertThat("if Jones owns a book then he likes it.")
     .equalsTo(`
       let a
       Jones(a)
       if ({
         let b
         book(b)
         own(a, b)
       }) {
         like(a, b)
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
         own(a, c)
       }) {
         let d
         porsche(d)
         own(b, d)
       }
    `);
  });

  it("Jones likes Mary. If she likes a book then he likes it.", function() {
    assertThat("Jones likes Mary. If she likes a book then he likes it.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       like(a, b)
       if ({
         let c
         book(c)
         like(b, c)
       }) {
         like(a, c)
       }
    `);
  });

  it.skip("Jones does not like Mary. If she likes a book then he does not like it.", function() {
    // TODO(goto): for this to work we need to promote PN to the global DRS.
    assertThat("Jones does not like Mary. If she likes a book then he does not like it.")
     .equalsTo(true, `
    `);
  });

  it("If Mary likes a man then he likes Jones.", function() {
    assertThat("If Mary likes a man then he likes Jones.")
     .equalsTo(`
      let a, b
      Mary(a)
      Jones(b)
      if ({
        let c
        man(c)
        like(a, c)
      }) {
        like(c, b)
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
         love(b, a)
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
      drs.feed(new Parser("Discourse", dict).feed("Every man is happy."));
      drs.feed(new Parser("Discourse", dict).feed("He likes it."));
      throw new Error("expected reference 'he' to fail");
    } catch (e) {
      Assert.deepEqual(e.message, "Invalid reference: He");
    }
  });

  it("Every man owns a book. It is happy.", function() {
    try {
      let drs = new DRS(Rules.from());
      drs.feed(new Parser("Discourse", dict).feed("Every man owns a book."));
      drs.feed(new Parser("Discourse", dict).feed("It is happy."));
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
           love(a, b)
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
         love(a, c)
       } or {
         love(b, c)
       }
    `);
  });

  it("Jones owns a porsche or he likes it.", function() {
    assertThat("Jones owns a porsche or he likes it.")
     .equalsTo(`
      let a
      Jones(a)
      {
        let b
        porsche(b)
        own(a, b)
      } or {
        like(a, b)
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
         love(b, a)
       } or {
         let c
         Smith(c)
         love(c, a)
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
         love(b, a)
       } or {
         let c
         Smith(c)
         love(c, a)
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
         love(b, c)
       }) {
         like(a, c)
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

  it("Mary loves Smith and he loves her.", function() {
    assertThat("Mary loves Smith and he loves her.")
     .equalsTo(`
       let a, b
       Mary(a)
       Smith(b)
       {
         love(a, b) 
       } and {
         love(b, a)
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
         own(a, b) 
       } and { 
         love(a, b)
       }
    `);
  });

  it("She loves it and Mary owns a porsche.", function() {
    let drs = new DRS(Rules.from());
    
    try {
      let lines = new Parser("Discourse", dict)
          .feed("She loves it and Mary owns a porsche.");
      drs.feed(lines);
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

  it.skip("Jones likes Smith. he admires him.", function() {
    // Chapter 3.1 suggests that the "him" here
    // shouldn't bind to "he", and more generally
    // that objects can't bind to subjects.
    // However, in "If Jones likes Mary then he loves her"
    // seems like the "he" should bind to "Jones.
    // TODO(goto): revisit 3.1 and figure out what needs
    // to be done.
    assertThat("Jones likes Smith. he admires him.")
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
       wife(b, a)
       happy(b)
    `);
  });

  it("Jones's wife is happy. She likes Smith.", function() {
    assertThat("Jones's wife is happy. She likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       wife(b, a)
       happy(b)
       Smith(c)
       like(b, c)
    `);
  });

  it("Smith likes Jones's wife.", function() {
    assertThat("Smith likes Jones's wife.")
     .equalsTo(`
       let a, b, c
       Smith(a)
       Jones(b)
       wife(c, b)
       like(a, c)
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
       unhappy-donkey(b)
       donkey(b)
       own(a, b)
    `);
  });

  it("Jones owns a fast porsche.", function() {
    assertThat("Jones owns a fast porsche.")
     .equalsTo(`
       let a, b
       Jones(a)
       fast-porsche(b)
       porsche(b)
       own(a, b)
    `);
  });

  it("Jones owns every fast porsche.", function() {
    assertThat("Jones owns every fast porsche.")
     .equalsTo(`
       let a
       Jones(a)
       every (b: {
         fast-porsche(b)
         porsche(b)
       }) {
         own(a, b)
       }
    `);
  });

  it("Every beautiful woman loves Jones.", function() {
    assertThat("Every beautiful woman loves Jones.")
     .equalsTo(`
       let a
       Jones(a)
       every (b: {
         beautiful-woman(b)
         woman(b)
       }) {
         love(b, a)
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
       love(a, c)
    `);
  });

  it("Jones likes a woman who likes Smith.", function() {
    assertThat("Jones likes a woman who likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Smith(b)
       woman(c)
       like(a, c)
       like(c, b)
    `);
  });

  it("Jones loves a woman with a donkey.", function() {
    assertThat("Jones loves a woman with a donkey.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       woman(b)
       donkey(c)
       love(a, b)
       woman-with(b, c)
    `);
  });

  it("A woman with a donkey loves Jones.", function() {
    assertThat("a woman with a donkey loves Jones.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       woman(b)
       donkey(c)
       love(b, a)
       woman-with(b, c)
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
         let a, b, c, d
         Jones(a)
         Smith(b)
         woman(d)
         like(a, c)
         brother(c, d)
         near(d, b)
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
         woman-with(b, c)
       }) {
         love(b, a)
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
         man-from(c, b)
       }) {
         love(c, a)
       }
    `);
  });

  it("Jones loves Mary. Jones likes Smith.", function() {
    assertThat("Jones loves Mary. Jones likes Smith.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       love(a, b)
       Smith(c)
       like(a, c)
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
       a = c
       husband(c, b)
    `);
  });

  it("Jones's father is Mary's husband.", function() {
    assertThat("Jones's father is Mary's husband.")
     .equalsTo(`
       let a, b, c, d
       Jones(a)
       Mary(b)
       c = d
       father(c, a)
       husband(d, b)
    `);
  });

  it("Mary's father is a brazilian engineer.", function() {
    assertThat("Mary's father is a brazilian engineer.")
     .equalsTo(`
       let a, b
       Mary(a)
       father(b, a)
       brazilian-engineer(b)
       engineer(b)
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

  it("Jones likes a brazilian engineer", function() {
    assertThat("Jones likes a brazilian engineer.")
     .equalsTo(`
       let a, b
       Jones(a)
       brazilian-engineer(b)
       engineer(b)
       like(a, b)
    `);
  });
  
  it("Jones likes a married brazilian", function() {
    assertThat("Jones likes a married brazilian.")
     .equalsTo(`
       let a, b
       Jones(a)
       married-brazilian(b)
       brazilian(b)
       like(a, b)
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
       sister(d, b)
       behind(c, d)
    `);
  });

  it("Jones's wife is Mary.", function() {
    assertThat("Jones's wife is Mary.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       c = b
       wife(c, a)
    `);
  });

  it("Mary is Jones's wife.", function() {
    assertThat("Mary is Jones's wife.")
     .equalsTo(`
       let a, b, c
       Mary(a)
       Jones(b)
       a = c
       wife(c, b)
    `);
  });

  it("Jones is Smith's brother. he likes Brazil.", function() {
    assertThat("Jones is Smith's brother. he likes Brazil.")
     .equalsTo(`
       let a, b, c, d
       Jones(a)
       Smith(b)
       a = c
       brother(c, b)
       Brazil(d)
       like(c, d)
    `);
  });

  it("Jones loves himself.", function() {
    assertThat("Jones loves himself.")
     .equalsTo(`
       let a
       Jones(a)
       love(a, a)
    `);
  });

  it("Jones kissed Mary.", function() {
    assertThat("Jones kissed Mary.")
     .equalsTo(`
       let a, b
       Jones(a)
       Mary(b)
       < kiss(a, b)
    `);
  });

  it("Smith was happy.", function() {
    assertThat("Smith was happy.")
     .equalsTo(`
       let a
       Smith(a)
       < happy(a)
    `);
  });

  it("Smith was not happy.", function() {
    assertThat("Smith was not happy.")
     .equalsTo(`
       let a
       Smith(a)
       not {
         < happy(a)
       }
    `);
  });

  it("Smith likes Mary.", function() {
    assertThat("Smith likes Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       like(a, b)
    `);
  });

  it("Smith will not kiss Mary.", function() {
    assertThat("Smith will not kiss Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       not {
         > kiss(a, b)
       }
    `);
  });

  it("Smith did not love Mary.", function() {
    assertThat("Smith did not kiss Mary.")
     .equalsTo(`
         let a, b
         Smith(a)
         Mary(b)
         not {
           < kiss(a, b)
         }
    `);
  });

  it("Smith likes Mary.", function() {
    assertThat("Smith likes Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       like(a, b)
    `);
  });

  it("Smith does not like Mary.", function() {
    // This is a slightly different result we get at
    // page 555, with regards to the temporal
    // referents.
    assertThat("Smith does not like Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       not {
         like(a, b)
       }
    `);
  });

  it("Smith has kissed Mary.", function() {
    assertThat("Smith has kissed Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       kiss(a, b)
    `);
  });

  it.skip("Smith has not kissed Mary.", function() {
    assertThat("Smith has not kissed Mary.")
     .equalsTo(`
       let a, b
       Smith(a)
       Mary(b)
       a has not b
    `);
  });

  it("Smith has owned a porsche.", function() {
    assertThat("Smith has owned a porsche.")
     .equalsTo(`
       let a, b
       Smith(a)
       porsche(b)
       own(a, b)
    `);
  });

  it("Smith was happy.", function() {
    assertThat("Smith was happy.")
     .equalsTo(`
       let a
       Smith(a)
       < happy(a)
    `);
  });

  it("Smith was an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Smith was an engineer.")
     .equalsTo(`
       let a
       Smith(a)
       < engineer(a)
    `);
  });

  it("Smith was not an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Smith was not an engineer.")
     .equalsTo(`
       let a
       Smith(a)
       not {
         < engineer(a)
       }
    `);
  });

  it.skip("Smith was married to Mary.", function() {
    // TODO: allow prepositional phrases to be attached
    // to adjectives.
    assertThat("Smith was married to Mary.")
     .equalsTo(`
       let a
       Smith(a)
       < marry(a)
    `);
  });

  it("Smith was not an engineer from Brazil.", function() {
    assertThat("Smith was not an engineer from Brazil.")
     .equalsTo(`
      let a, b
      Smith(a)
      Brazil(b)
      not {
        engineer(a)
        engineer-from(a, b)
      }
    `);
  });

  it("Every brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("every brazilian was happy.")
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
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Most brazilians are happy.", function() {
    assertThat("Most brazilians are happy.")
     .equalsTo(`
         most (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Many brazilians are happy.", function() {
    assertThat("Many brazilians are happy.")
     .equalsTo(`
       many (a: {
         brazilian(a)
       }) {
         happy(a)
       }
    `);
  });

  it("3 brazilians are happy.", function() {
    assertThat("3 brazilians are happy.")
     .equalsTo(`
         3 (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });
  
  it("More than 3 brazilians are happy.", function() {
    assertThat("More than 3 brazilians are happy.")
     .equalsTo(`
         more-than-3 (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Fewer than 3 brazilians are happy.", function() {
    assertThat("Fewer than 3 brazilians are happy.")
     .equalsTo(`
         fewer-than-3 (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("At least 3 brazilians are happy.", function() {
    assertThat("At least 3 brazilians are happy.")
     .equalsTo(`
         at-least-3 (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("At most 3 brazilians are happy.", function() {
    assertThat("At most 3 brazilians are happy.")
     .equalsTo(`
         at-most-3 (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("Only brazilians are happy.", function() {
    assertThat("Only brazilians are happy.")
     .equalsTo(`
         only (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it("The majority of brazilians are happy.", function() {
    assertThat("The majority of brazilians are happy.")
     .equalsTo(`
         the-majority-of (a: {
           brazilian(a)
         }) {
           happy(a)
         }
    `);
  });

  it.skip("Every engineer who was brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    // who was brazilian 
    assertThat("Every engineer who was brazilian was happy.")
     .equalsTo(`
       every (a: {
         engineer(a)
       }) {
         < happy(a)
       }
    `);
  });

  it("Most brazilians like most porsches.", function() {
    assertThat("Most brazilians like most porsches.")
     .equalsTo(`
         most (a: {
           brazilian(a)
         }) {
           most (b: {
             porsche(b)
           }) {
             like(a, b)
           }
         }
    `);
  });
  
  it("Most brazilians love a porsche which Smith likes.", function() {
    assertThat("Most brazilians love a porsche which Smith likes.")
     .equalsTo(`
         let a
         Smith(a)
         most (b: {
           brazilian(b)
         }) {
           let c
           porsche(c)
           love(b, c)
           like(a, c)
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
         love(b, a)
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

  // Adverbs
  it("Jones gave to Mary a porsche.", function() { 
    // These aren't a correct representation of adverbs
    // because they aren't using the eventuality
    // but it is a reasonable starting point.
    assertThat("Jones gave to Mary a porsche.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       porsche(c)
       to(e, b)
       < give(a, c)
     `);
  });

  it.skip("Jones kissed Mary in Brazil.", function() {
    assertThat("Jones kissed Mary to Brazil.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Mary(b)
       Brazil(c)
       in(e, c)
       < kiss(a, b)
     `);
  });

  it("Foo likes Bar.", function() {
    // TODO: Leaving Bar here alone causes a parsing error
    // possibly because it collides with a noun named "bar".
    // We need to investigate why that's the case and fix it.
    assertThat("Foo likes XBar.")
     .equalsTo(`
       let a, b
       Foo(a)
       XBar(b)
       like(a, b)
     `);
  });

  it("Pikachu likes Charmander.", function() { 
    assertThat("Picachu likes Charmander.")
     .equalsTo(`
       let a, b
       Picachu(a)
       Charmander(b)
       like(a, b)
     `);
  });

  it("Sam likes Aristotle.", function() { 
    assertThat("Sam likes Aristotle.")
     .equalsTo(`
       let a, b
       Sam(a)
       Aristotle(b)
       like(a, b)
     `);
  });

  it("Sam Goto likes Computer Science.", function() { 
    assertThat("Sam Goto likes Computer Science.")
     .equalsTo(`
       let a, b
       Sam Goto(a)
       Computer Science(b)
       like(a, b)
     `);
  });

  it("Sam Goto likes the United States Of America.", function() { 
    assertThat("Sam Goto likes the United States Of America.")
     .equalsTo(`
       let a, b
       Sam Goto(a)
       United States Of America(b)
       like(a, b)
     `);
  });

  it("Sam likes DRT.", function() { 
    assertThat("Sam likes DRT.")
     .equalsTo(`
       let a, b
       Sam(a)
       DRT(b)
       like(a, b)
     `);
  });
  
  it("Sam likes Discourse Representation Theory.", function() { 
    assertThat("Sam likes Discourse Representation Theory.")
     .equalsTo(`
       let a, b
       Sam(a)
       Discourse Representation Theory(b)
       like(a, b)
     `);
  });

  it("Sam made a reservation for Cascal for Dani.", function() { 
    assertThat("Sam made a reservation for Cascal for Dani.")
     .equalsTo(`
       let a, b, c, d
       Sam(a)
       Dani(b)
       Cascal(c)
       reservation(d)
       < make(a, d)
       for(d, b)
       reservation-for(d, c)
     `);
  });

  it("Mel is unhappy about Brazil", function() { 
    assertThat("Mel is unhappy about Brazil.")
     .equalsTo(`
        let a, b
        Mel(a)
        Brazil(b)
        unhappy(a)
        unhappy-about(a, b)
     `);
  });

  it("Jones came from Brazil to Italy.", function() { 
    // TODO(goto): "e" is hard coded, but needs to be a reference
    // to an eventuality introduced by "come".
    // "came" also needs to be predicated with "e".
    assertThat("Jones came from Brazil to Italy.")
     .equalsTo(`
       let a, b, c
       Jones(a)
       Italy(b)
       Brazil(c)
       to(e, b)
       from(e, c)
       < come(a)
     `);
  });

  it("Sam made a reservation for a woman with a porsche.", function() { 
    // This is an ambiguous sentence, because it can mean:
    // - Sam made a reservation for [a woman with a porsche]
    // or
    // - Sam made a reservation for [a woman] with a porsche
    // The interpretation used at the moment is the latter.
    assertThat("Sam made a reservation for a woman with a porsche.")
     .equalsTo(`
       let a, b, c, d
       Sam(a)
       reservation(b)
       porsche(c)
       woman(d)
       < make(a, b)
       with(b, c)
       reservation-for(b, d)
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
        let parser = new Parser("Discourse", dict);
        let sentences = parser.feed(x);
        drs.feed(sentences);
        Assert.deepEqual(drs.print(), this.trim(y));
      }
    }
  }
});

describe("Large Lexicon", () => {
  it("Mel likes Yuji's girlfriend.", function() { 
    assertThat("Mel likes Yuji's girlfriend.")
      .equalsTo(`
      let a, b, c
      Mel(a)
      Yuji(b)
      girlfriend(c, b)
      like(a, c)
    `);
  });

  it("Mel likes Yuji's awesome girlfriend.", function() {
    assertThat("Mel likes Yuji's awesome girlfriend.")
      .equalsTo(`
      let a, b, c
      Mel(a)
      Yuji(b)
      awesome-girlfriend(c)
      girlfriend(c, b)
      like(a, c)
    `);
  });

  it("Yuji is an awesome person.", function() { 
    assertThat("Yuji is an awesome person.")
      .equalsTo(`
      let a
      Yuji(a)
      awesome-person(a)
      person(a)
    `);
  });

  it("Jones is an unhappy foolish man.", function() { 
    assertThat("Jones is an unhappy foolish man.")
      .equalsTo(`
      let a
      Jones(a)
      unhappy-foolish-man(a)
      foolish-man(a)
      man(a)
    `);
  });

  it("Mel travelled to a country.", function() { 
    assertThat("Mel travelled to an awesome country.")
      .equalsTo(`
       let a, b
       Mel(a)
       awesome-country(b)
       country(b)
       to(e, b)
       < travel(a)
    `);
  });

  it("Mel does not live in Brazil.", function() { 
    assertThat("Mel does not live in Brazil.")
      .equalsTo(`
       let a, b
       Mel(a)
       Brazil(b)
       not {
         in(e, b)
         live(a)
       }
    `);
  });

  it("Most brazilians live in Brazil.", function() { 
    assertThat("Most brazilians live in Brazil.")
      .equalsTo(`
       let a
       Brazil(a)
       most (b: {
         brazilian(b)
       }) {
         in(e, a)
         live(b)
       }
    `);
  });

  it("Mel lives in Brazil.", function() { 
    assertThat("Mel lives in Brazil.")
      .equalsTo(`
       let a, b
       Mel(a)
       Brazil(b)
       in(e, b)
       live(a)
    `);
  });

  it("Mel lived in Brazil.", function() { 
    assertThat("Mel lived in Brazil.")
      .equalsTo(`
       let a, b
       Mel(a)
       Brazil(b)
       in(e, b)
       < live(a)
    `);
  });

  it("Mel has lived in Brazil.", function() { 
    assertThat("Mel has lived in Brazil.")
      .equalsTo(`
       let a, b
       Mel(a)
       Brazil(b)
       in(e, b)
       live(a)
    `);
  });

  it.skip("Sam was born in Brazil.", function() {
    // TODO: expand prepositional phrases in adjectives.
    assertThat("Sam was born in Brazil.")
      .equalsTo(`
        let a
        Sam(a)
        Brazil(b)
        < born(a)
    `);    
  });

  it("Every person who is from Brazil is brazilian.", function() {
    assertThat("Every person who is from Brazil is brazilian.")
      .equalsTo(`
       let a
       Brazil(a)
       every (b: {
         person(b)
         from(b, a)
       }) {
         brazilian(b)
       }
    `);    
  });

  it("Brazil is a country in South America.", () => {
    assertThat("Brazil is a country in South America.")
      .equalsTo(`
        let a, b
        Brazil(a)
        South America(b)
        country(a)
        country-in(a, b)
      `);
  });

  it("Brazil borders most countries in South America.", () => {
    assertThat("Brazil borders all countries in South America.")
      .equalsTo(`
        let a, b
        Brazil(a)
        South America(b)
        all (c: {
          country(c)
          country-in(c, b)
        }) {
          border(a, c)
        }
      `);
  });

  it("211M peoples live in Brazil.", () => {
    assertThat("211M peoples live in Brazil.")
      .equalsTo(`
        let a
        Brazil(a)
        211m (b: {
          people(b)
        }) {
          in(e, a)
          live(b)
        }
    `);
  });
  
  it("The capital of Brazil is Brasilia.", () => {
    assertThat("The capital of Brazil is Brasilia.")
      .equalsTo(`
        let a, b, c
        Brasilia(a)
        Brazil(b)
        c = a
        capital(c)
        capital-of(c, b)
      `);
  });

  it("Brasilia is the capital of Brazil.", () => {
    assertThat("Brasilia is a capital of Brazil.")
      .equalsTo(`
        let a, b
        Brasilia(a)
        Brazil(b)
        capital(a)
        capital-of(a, b)
      `);
  });

  it("Brazil borders most countries.", () => {
    assertThat("Brazil borders most countries.")
      .equalsTo(`
        let a
        Brazil(a)
        most (b: {
          country(b)
        }) {
          border(a, b)
        }
      `);
  });

  it("26 states compose Brazil's federation.", () => {
    assertThat("26 states compose Brazil's federation.")
      .equalsTo(`
        let a
        Brazil(a)
        26 (b: {
          state(b)
        }) {
          let c
          federation(c, a)
          compose(b, c)
        }
      `);
  });
  
  it("Brazil is bounded by the Atlantic Ocean on the East.", () => {
    assertThat("Brazil is bounded by the Atlantic Ocean on the East.")
      .equalsTo(`
        let a, b, c
        Brazil(a)
        East(b)
        Atlantic Ocean(c)
        bounded(a)
        bounded-on(a, b)
        bounded-by(a, c)
      `);
  });

  it("Brazil's official language is Portuguese.", () => {
    assertThat("Brazil's official language is Portuguese.")
      .equalsTo(`
        let a, b, c
        Brazil(a)
        Portuguese(b)
        c = b
        official-language(c)
        language(c, a)
      `);
  });

  it("The official language of Brazil is Portuguese.", () => {
    assertThat("The official language of Brazil is Portuguese.")
      .equalsTo(`
        let a, b, c
        Portuguese(a)
        Brazil(b)
        c = a
        official-language(c)
        language(c)
        of(c, b)
      `);
  });

  it("Brazil was inhabited by a tribal nation before the landing of Pedro Alvares Cabral.", () => {
    // The prepositional phrases aren't tied quite right, specially "the landing of" isn't
    // tieing back the landing to Pedro Alvares Cabral.
    assertThat("Brazil was inhabited by a tribal nation before the landing of Pedro Alvares Cabral.")
      .equalsTo(`
        let a, b, c, d
        Brazil(a)
        Pedro Alvares Cabral(b)
        inhabited(a)
        landing(c)
        tribal-nation(d)
        nation(d)
        of(a, b)
        inhabited-before(a, c)
        inhabited-by(a, d)
      `);        
  });

  it("Pedro Alvares Cabral claimed for the Portuguese Empire the area of Brazil.", () => {
    // Pedro Alvares Cabral claimed Brazil's area for The-Portuguese-Empire.
    // This isn't right because it binds "for" with "Brazil's area" rather than "claimed".
    // Pedro Alvares Cabral claimed for The-Portuguese-Empire Brazil's area.
    // This isn't grammatical because The Portuguese Empire binds to Brazil as a
    // single proper name.
    assertThat("Pedro Alvares Cabral claimed for the Portuguese Empire the area of Brazil.")
      .equalsTo(`
        let a, b, c, d
        Pedro Alvares Cabral(a)
        Portuguese Empire(b)
        Brazil(c)
        area(d)
        for(e, b)
        < claim(a, d)
        area-of(d, c)
      `);
  });

  it("The Portuguese Empire's capital was transferred from Lisbon to Rio De Janeiro.", () => {
    // TODO: this isn't quite right. First, the "was" is being ignored in its tense.
    // Second, this is probably the "passive" form of the to-transfer verb.
    assertThat("The Portuguese Empire's capital was transferred from Lisbon to Rio De Janeiro.")
      .equalsTo(`
        let a, b, c, d
        Portuguese Empire(a)
        Rio De Janeiro(b)
        Lisbon(c)
        capital(d, a)
        transferred(d)
        transferred-to(d, b)
        transferred-from(d, c)
      `);
  });

  it("Brazil is classified by the World Bank as an industrialized country.", () => {
    // TODO: allow conjugated noun phrases to allow Brazil to be classified as
    // multiple things.
    //   - Brazil is classified as an upper-midle income economy by The-World-Bank.
    assertThat("Brazil is classified by the World Bank as an industrialized country.")
      .equalsTo(`
        let a, b, c
        Brazil(a)
        World Bank(b)
        classified(a)
        industrialized-country(c)
        country(c)
        classified-as(a, c)
        classified-by(a, b)
      `);
  });

  it("Brazil is a member of the United Nations.", () => {
    //   - Brazil is a founding member of the United Nations and the Mercosul.
    assertThat("Brazil is a member of the United Nations.")
      .equalsTo(`
        let a, b
        Brazil(a)
        United Nations(b)
        member(a)
        member-of(a, b)
      `);
  });
  
  it("Brazil is considered as an advanced economy.", () => {
    // TODO: allow multiple adjectives to be used in front of nouns.
    // e.g. "Brazil is considered an advanced emerging economy."
    assertThat("Brazil is considered as an advanced economy.")
      .equalsTo(`
        let a, b
        Brazil(a)
        considered(a)
        advanced-economy(b)
        economy(b)
        considered-as(a, b)
      `);
  });

  it("Brazil is a country in South America.", function() {
    // Things that I'd expect to be able to write:
    //   - Brazil's population is 211 million people.
    //   - 26 states compose the federation of Brazil: Sao Paulo, etc, etc.
    //   - Brazil remained a colony.
    //   - Brazil is classified as an upper-midle income economy by The-World-Bank.
    //   - Brazil is considered an advanced emerging economy.
    // Semantically, things I'd expect:
    //   - "was transferred" is an adjective, but feels like the passive voice
    //   - "was transferred" isn't maintaining the "tense" of "was"
    //   - prepositions attached to verbs, nouns and adjectives should probably be
    //     prefixed. e.g. instead of capital(u), of(u, v), we want capital(u), capital-of(u, v)
    assertThat(`
      Brazil is a country in South America.
      Brazil borders most countries in South America.
      211M peoples live in Brazil.
      The capital of Brazil is Brasilia.
      26 states compose Brazil's federation.
      Brazil is bounded by the Atlantic Ocean on the East.
      The official language of Brazil is Portuguese.
      Brazil was inhabited by a tribal nation before the landing of Pedro Alvares Cabral.
      The Portugese Empire's capital was transferred from Lisbon to Rio De Janeiro.
      Brazil is classified by the World Bank as an industrialized country.
      Brazil is a member of the United Nations.
      Brazil is considered as an advanced economy.
    `).equalsTo(`
       let a, b, e, f, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w
       Brazil(a)
       South America(b)
       country(a)
       country-in(a, b)
       most (c: {
         country(c)
         country-in(c, b)
       }) {
         border(a, c)
       }
       211m (d: {
         people(d)
       }) {
         in(e, a)
         live(d)
       }
       Brasilia(e)
       f = e
       capital(f)
       capital-of(f, a)
       26 (g: {
         state(g)
       }) {
         let h
         federation(h, f)
         compose(g, h)
       }
       East(i)
       Atlantic Ocean(j)
       bounded(f)
       bounded-on(f, i)
       bounded-by(f, j)
       Portuguese(k)
       l = k
       official-language(l)
       language(l)
       language-of(l, f)
       Pedro Alvares Cabral(m)
       inhabited(l)
       landing(n)
       tribal-nation(o)
       nation(o)
       of(l, m)
       inhabited-before(l, n)
       inhabited-by(l, o)
       Portugese Empire(p)
       Rio De Janeiro(q)
       Lisbon(r)
       capital(s, p)
       transferred(s)
       transferred-to(s, q)
       transferred-from(s, r)
       World Bank(t)
       classified(l)
       industrialized-country(u)
       country(u)
       classified-as(l, u)
       classified-by(l, t)
       United Nations(v)
       member(l)
       member-of(l, v)
       considered(l)
       advanced-economy(w)
       economy(w)
       considered-as(l, w)
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
        const {dict} = require("../../src/drt/dict.js");

        let drs = new DRS(Rules.from());
        let parser = new Parser("Discourse", dict);
        parser.load(dict);
        let sentences = parser.feed(x);
        // console.log(sentences);
        drs.feed(sentences);
        Assert.deepEqual(drs.print(), this.trim(y));
      }
    }
  }
});

