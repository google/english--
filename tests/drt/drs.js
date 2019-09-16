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
         a admires b
         Jones(a)
         woman(b)
         b likes a
       }
    `);
  });

  it("Mel loves Dani.", function() {
    assertThat("Mel loves Dani.", true)
     .equalsTo(`
       drs(a, b) {
         a loves b
         Mel(a)
         Dani(b)
       }
    `);
  });

  it("A man loves Dani.", function() {
    assertThat("A man loves Dani.")
     .equalsTo(`
       drs(a, b) {
         a loves b
         man(a)
         Dani(b)
       }
     `);
  });

  it("Dani loves a man.", function() {
    assertThat("Dani loves a man.")
     .equalsTo(`
       drs(a, b) {
         a loves b
         Dani(a)
         man(b)
       }
     `);
  });

  it("A man who loves Dani fascinates Anna.", function() {
    assertThat("A man who loves Dani fascinates Anna.")
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
     .equalsTo(`
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
    // TODO(goto): promote PN referents from sub drs to the
    // global drs.
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(true, `
     `);
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
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
     .equalsTo(`
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
         man(a)
         happy(a)
       }
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       drs(a, b) {
         a loves b
         Jones(a)
         woman(b)
         happy(b)
       }
    `);
  });

  it("A woman who is happy loves Jones.", function() {
    assertThat("A woman who is happy loves Jones.")
     .equalsTo(`
       drs(a, b) {
         a loves b
         woman(a)
         happy(a)
         Jones(b)
       }
    `);
  });

  it("Jones owns a porsche. He is happy.", function() {
    assertThat("Jones owns a porsche. He is happy.")
     .equalsTo(`
       drs(a, b) {
         a owns b
         Jones(a)
         porsche(b)
         happy(a)
       }
    `);
  });

  it("If Jones owns a book then he likes it.", function() {
    assertThat("If Jones owns a book then he likes it.")
     .equalsTo(`
       drs() {
         drs(a, b) {
           a owns b
           Jones(a)
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
       drs() {
         drs(a, b) {
           a owns b
           Jones(a)
           book(b)
         } => drs(c, d) {
           c owns d
           Smith(c)
           porsche(d)
         }
       }
    `);
  });

  it("Jones likes Mary. If she likes a book then he likes it.", function() {
    assertThat("Jones likes Mary. If she likes a book then he likes it.")
     .equalsTo(`
       drs(a, b) {
         a likes b
         Jones(a)
         Mary(b)
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

  it("If Mary likes a man then he likes Jones.", function() {
    assertThat("If Mary likes a man then he likes Jones.")
     .equalsTo(`
       drs() {
         drs(a, b) {
           a likes b
           Mary(a)
           man(b)
         } => drs(c) {
           b likes c
           Jones(c)
         }
       }
    `);
  });

  it("Every man loves Jones.", function() {
    assertThat("Every man loves Jones.")
     .equalsTo(`
       drs() {
         drs(a) {
           man(a)
         } => drs(b) {
           a loves b
           Jones(b)
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
     let drs = new DRS();
     drs.feed("Every man is happy.");
     drs.feed("He likes it.");
     throw new Error("expected reference 'He' to fail");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: He");
    }
  });

  it("Every man owns a book. It is happy.", function() {
    try {
     let drs = new DRS();
     drs.feed("Every man owns a book.");
     drs.feed("It is happy.");
     throw new Error("expected reference 'It' to fail");
    } catch (e) {
     Assert.deepEqual(e.message, "Invalid reference: It");
    }
  });

  it("Jones loves Mary or Smith loves Mary.", function() {
    assertThat("Jones loves Mary or Smith loves Mary.")
     .equalsTo(`
       drs() {
         drs(a, b) {
           a loves b
           Jones(a)
           Mary(b)
         } or drs(c, d) {
           c loves d
           Smith(c)
           Mary(d)
         }
       }
    `);
  });

  it("Jones owns a porsche or he likes it.", function() {
    assertThat("Jones owns a porsche or he likes it.")
     .equalsTo(`
       drs() {
         drs(a, b) {
           a owns b
           Jones(a)
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
       drs(a) {
         Mary(a)
         drs(b) {
           a loves b
           Jones(b)
         } or drs(c) {
           a likes c
           Smith(c)
         }
       }
    `);
  });

  it.skip("Jones or Smith love Mary.", function() {
    // TODO(goto): this isn't correct because
    // Mary is bound to different referents.
    assertThat("Jones or Smith love Mary.")
     .equalsTo(`
       drs(e) {
         Mary(e)
         drs(a, b) {
           a love b
           Jones(a)
           Mary(b)
         } or drs(c, d) {
           c love d
           Smith(c)
           Mary(d)
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
           b love a
           Jones(b)
         } or drs(c) {
           c love a
           Smith(c)
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
     let drs = new DRS();

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