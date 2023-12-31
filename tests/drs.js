/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Assert = require("assert");

const {Rules} = require("../src/rules.js");
const {DRS} = require("../src/drs.js");
const {Parser} = require("../src/parser.js");
const {dict} = require("./dict.js");
const {Tokenizer} = require("../src/lexer.js");
const {Console} = require("../src/console.js");
const {KB} = require("logic/src/solver.js");

describe("DRS", function() {

  it("Jones loves Mary.", function() {
    assertThat("Jones loves Mary.", true)
     .equalsTo(`
       Jones(a).
       Mary(b).
       love(s0, a, b).
    `);
  });

  it("A man admires a woman.", function() {
    assertThat("A man admires a woman.")
     .equalsTo(`
       man(a).
       woman(b).
       admire(s0, a, b).
     `);
  });

  it("A man loves Mary.", function() {
    assertThat("A man loves Mary.")
     .equalsTo(`
       Mary(a).
       man(b).
       love(s0, b, a).
     `);
  });

  it("Mary loves a man.", function() {
    assertThat("Mary loves a man.")
     .equalsTo(`
       Mary(a).
       man(b).
       love(s0, a, b).
     `);
  });

  it("A man admires a woman. She likes him.", function() {
    assertThat("A man admires a woman. She likes him.")
     .equalsTo(`
       man(a).
       woman(b).
       admire(s0, a, b).
       like(s1, b, a).
    `);
  });

  it("Jones admires a woman who likes him.", function() {
    assertThat("Jones admires a woman who likes him.")
     .equalsTo(`
       Jones(a).
       woman(b).
       admire(s1, a, b).
       like(s0, b, a).
    `);
  });


  it("A man who loves Mary fascinates Smith.", function() {
    assertThat("A man who loves Mary fascinates Smith.")
     .equalsTo(`
       Mary(a).
       Smith(b).
       man(c).
       fascinate(s1, c, b).
       love(s0, c, a).
    `);
  });

  it("Jones loves a book which fascinates Smith.", function() {
    assertThat("Jones loves a book which fascinates Smith.")
     .equalsTo(`
       Jones(a).
       Smith(b).
       book(c).
       love(s1, a, c).
       fascinate(s0, c, b).
     `);
  });

  it("Jones owns a book which Smith loves.", function() {
    assertThat("Jones owns a book which Smith loves.")
     .equalsTo(`
       Jones(a).
       Smith(b).
       book(c).
       own(s1, a, c).
       love(s0, b, c).
     `);
  });

  it("Jones owns a book which fascinates him.", function() {
    assertThat("Jones owns a book which fascinates him.")
     .equalsTo(`
       Jones(a).
       book(b).
       own(s1, a, b).
       fascinate(s0, b, a).
     `);
  });

  it("A man who fascinates Mary loves a book which fascinates Smith.", function() {
    assertThat("A man who fascinates Mary loves a book which fascinates Smith.")
     .equalsTo(`
       Mary(a).
       Smith(b).
       man(c).
       book(d).
       love(s2, c, d).
       fascinate(s1, d, b).
       fascinate(s0, c, a).
     `);
  });

  it("Jones owns Ulysses. it fascinates him.", function() {
    assertThat("Jones owns Ulysses. it fascinates him.")
     .equalsTo(`
       Jones(a).
       Ulysses(b).
       own(s0, a, b).
       fascinate(s1, b, a).
     `);
  });

  it("Jones owns a book. It fascinates him.", function() {
    assertThat("Jones owns a book. it fascinates him.")
     .equalsTo(`
       Jones(a).
       book(b).
       own(s0, a, b).
       fascinate(s1, b, a).
     `);
  });

  it("Jones owns a book. It fascinates him. Mary loves him.", function() {
    assertThat("Jones owns a book. It fascinates him. Mary loves him.")
     .equalsTo(`
       Jones(a).
       book(b).
       own(s0, a, b).
       fascinate(s1, b, a).
       Mary(c).
       love(s2, c, c).
     `);
  });

  it("Jones does not own a porsche.", function() {
    assertThat("Jones does not own a porsche.")
     .equalsTo(`
       Jones(a).
       not (
         own(s0, a, b).
       ).
       porsche(b).
     `);
  });

  it("Jones owns a porsche. He does not like it.", function() {
    assertThat("Jones owns a porsche. He does not like it.")
     .equalsTo(`
       Jones(a).
       porsche(b).
       own(s0, a, b).
       not (
         like(s1, a, b).
       ).
     `);
  });

  it("Jones owns a porsche. He likes it.", function() {
    assertThat("Jones owns a porsche. He likes it.")
     .equalsTo(`
       Jones(a).
       porsche(b).
       own(s0, a, b).
       like(s1, a, b).
     `);
  });

  it("Jones does not own Ulysses. He likes it.", function() {
    // TODO(goto): we got the reference to "it" wrong here.
    assertThat("Jones does not own Ulysses. He likes it.")
     .equalsTo(`
       Jones(a).
       Ulysses(b).
       not (
         own(s0, a, b).
       ).
       like(s1, b, a).
     `);
  });

  it("Jones loves a woman who loves him.", function() {
    assertThat("Jones loves a woman who loves him.")
     .equalsTo(`
       Jones(a).
       woman(b).
       love(s1, a, b).
       love(s0, b, a).
     `);
  });

  it("Jones loves a woman who does not love him.", function() {
    assertThat("Jones loves a woman who does not love him.")
     .equalsTo(`
       Jones(a).
       not (
         love(s0, b, a).
       ).
       woman(b).
       love(s1, a, b).
     `);
  });

  it("Jones loves a woman who does not admire him. She does not love a man.", function() {
    assertThat("Jones loves a woman who does not love him. She does not love a man.")
     .equalsTo(`
       Jones(a).
       not (
         love(s0, b, a).
       ).
       woman(b).
       love(s1, a, b).
       not (
         love(s2, b, c).
       ).
       man(c).
     `);
  });

  it("A porsche does not stink", function() {
    assertThat("A porsche does not stink.")
     .equalsTo(`
       not (
         stink(s0, a).
       ).
       porsche(a).
     `);
  });

  it("Jones does not own a porsche which does not fascinate him", function() {
    assertThat("Jones does not own a porsche which does not fascinate him.")
     .equalsTo(`
       Jones(a).
       not (
         own(s1, a, b).
       ).
       porsche(b).
       not (
         fascinate(s0, b, a).
       ).
     `);
  });

  it("Jones does not like a porsche which he does not own.", function() {
    assertThat("Jones does not like a porsche which he does not own.")
     .equalsTo(`
       Jones(a).
       not (
         like(s1, a, b).
       ).
       porsche(b).
       not (
         own(s0, a, b).
       ).
     `);
  });

  it("Jones likes a porsche which he does not own.", function() {
    assertThat("Jones likes a porsche which he does not own.")
     .equalsTo(`
       Jones(a).
       not (
         own(s0, a, b).
       ).
       porsche(b).
       like(s1, a, b).
     `);
  });

  it("Jones is happy.", function() {
    assertThat("Jones is happy.")
     .equalsTo(`
       Jones(a).
       happy(a).
    `);
  });

  it("Jones is not happy.", function() {
    assertThat("Jones is not happy.")
     .equalsTo(`
       Jones(a).
       not (
         happy(a).
       ).
    `);
  });

  it("A man is happy.", function() {
    assertThat("A man is happy.")
     .equalsTo(`
       happy(a).
       man(a).
    `);
  });

  it("Jones is a man.", function() {
    assertThat("Jones is a man.")
     .equalsTo(`
       Jones(a).
       a = b.
       man(b).
    `);
  });

  it("Jones is a happy man.", function() {
    assertThat("Jones is a happy man.")
     .equalsTo(`
       Jones(a).
       a = b.
       happy-man(b).
       man(b).
    `);
  });

  it("Jones is a man. He is happy. He loves Mary.", function() {
    assertThat("Jones is a man. He is happy. He loves Mary.")
     .equalsTo(`
       Jones(a).
       a = b.
       man(b).
       happy(b).
       Mary(c).
       love(s0, b, c).
    `);
  });

  it("Jones loves a woman who is happy.", function() {
    assertThat("Jones loves a woman who is happy.")
     .equalsTo(`
       Jones(a).
       woman(b).
       happy(b).
       love(s0, a, b).
    `);
  });

  it("A woman who is happy loves Jones.", function() {
    assertThat("A woman who is happy loves Jones.")
     .equalsTo(`
       Jones(a).
       woman(b).
       happy(b).
       love(s0, b, a).
    `);
  });

  it("Jones owns a porsche. He is happy.", function() {
    assertThat("Jones owns a porsche. He is happy.")
     .equalsTo(`
       Jones(a).
       porsche(b).
       own(s0, a, b).
       happy(a).
    `);
  });
  
  it("If a man loves Mary then Smith likes the woman.", function() {
    assertThat("If a man loves Mary then Smith likes a woman.")
     .equalsTo(`
      Mary(a).
      Smith(b).
      if (man(c) love(s0, c, a)) {
        woman(d).
        like(s1, b, d).
      }
    `);
  });

  it("A man likes Smith. The man loves Mary.", function() {
    // Anaphora resoution of "the" seems to not be working.
    assertThat("A man likes Smith. The man loves Mary.")
     .equalsTo(`
       Smith(a).
       man(b).
       like(s0, b, a).
       Mary(c).
       man(d).
       love(s1, d, c).
    `);
  });
  
  it("If Jones owns a book then he likes it.", function() {
    assertThat("if Jones owns a book then he likes it.")
     .equalsTo(`
       Jones(a).
       if (book(b) own(s0, a, b)) {
         like(s1, a, b).
       }
    `);
  });

  it("If Jones owns a book then Smith owns a porsche.", function() {
    // TODO(goto): to make this result match 2.33 we still need to
    // promote proper names to the global DRS.
    assertThat("If Jones owns a book then Smith owns a porsche.")
     .equalsTo(`
       Jones(a).
       Smith(b).
       if (book(c) own(s0, a, c)) {
         porsche(d).
         own(s1, b, d).
       }
    `);
  });

  it("Jones likes Mary. If she likes a book then he likes it.", function() {
    assertThat("Jones likes Mary. If she likes a book then he likes it.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       like(s0, a, b).
       if (book(c) like(s1, b, c)) {
         like(s2, a, c).
       }
    `);
  });

  it("Jones does not like Mary. If she likes a book then he does not like it.", function() {
    assertThat("Jones does not like Mary. If she likes a book then he does not like it.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       not (
         like(s0, a, b).
       ).
       if (book(c) like(s1, b, c)) {
         not (
           like(s2, a, c).
         ).
       }
    `);
  });

  it("If Mary likes a man then he likes Jones.", function() {
    assertThat("If Mary likes a man then he likes Jones.")
     .equalsTo(`
      Mary(a).
      Jones(b).
      if (man(c) like(s0, a, c)) {
        like(s1, c, b).
      }
    `);
  });

  it("Every man loves Jones.", function() {
    assertThat("Every man loves Jones.")
     .equalsTo(`
       Jones(a).
       for (let every b: man(b)) {
         love(s0, b, a).
       }
    `);
  });

  it("Every man is happy.", function() {
    assertThat("Every man is happy.")
     .equalsTo(`
       for (let every a: man(a)) {
         happy(a).
       }
    `);
  });

  it("Jones likes a woman that loves every man.", function() {
    assertThat("Jones likes a woman that loves every man.")
     .equalsTo(`
       Jones(a).
       for (let every b: man(b)) {
         love(s0, c, b).
       }
       woman(c).
       like(s1, a, c).
    `);
  });

  it.skip("Jones likes every woman that loves every man.", function() {
    assertThat("Jones likes every woman that loves every man.")
     .equalsTo(`
       Jones(a).
       for (let every b: man(b)) {
         love(s0, c, b).
       }
       woman(c).
       like(s1, a, c).
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

  it("Every man owns a book.", function() {
    assertThat("Every man owns a book.")
     .equalsTo(`
         for (let every a: man(a)) {
           book(b).
           own(s0, a, b).
         }
    `);
  });

  it("Jones loves every man.", function() {
    assertThat("Jones loves every man.")
     .equalsTo(`
         Jones(a).
         for (let every b: man(b)) {
           love(s0, a, b).
         }
    `);
  });

  it("Either Jones loves Mary or Smith loves her.", function() {
    // TODO(goto): the resolution of "her" failed.
    assertThat("Either Jones loves Mary or Smith loves her.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       Smith(c).
       either (
         love(s0, a, b).
       ) or (
         love(s1, c, c).
       ).
    `);
  });

  it("Either Jones owns a porsche or he likes it.", function() {
    assertThat("Either Jones owns a porsche or he likes it.")
     .equalsTo(`
      Jones(a).
      either (
        porsche(b).
        own(s0, a, b).
      ) or (
        like(s1, a, b).
      ).
    `);
  });

  it("Either Jones or Smith loves Mary.", function() {
    // NOTE: goto it seems like there is an state parameter
    // missing here.
    assertThat("Either Jones or Smith loves Mary.")
     .equalsTo(`
        Jones(a).
        Smith(b).
        Mary(c).
        either (
         love(a, c).
        ) or (
         love(b, c).
        ).
    `);
  });

  it("Mary loves either Jones or Smith.", function() {
    assertThat("Mary loves either Jones or Smith.")
     .equalsTo(`
       Mary(a).
       Jones(b).
       Smith(c).
       either (
         love(a, b).
       ) or (
         love(a, c).
       ).
    `);
  });

  it.skip("Either Mary loves Jones or likes Smith.", function() {
    assertThat("Mary either loves Jones or likes Smith.")
     .equalsTo(`
    `);
  });

  it.skip("Jones or Smith loves Mary.", function() {
    // TODO(goto): this isn't correct because
    // Mary is bound to different referents.
    // Also, the time reference isn't distributed
    assertThat("Jones or Smith loves Mary.")
     .equalsTo(`
       let a, s0
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

  it.skip("Mary is happy. Jones or Smith loves her.", function() {
    // TODO: the distribution of the time property isn't being
    // done on the conjectives.
    assertThat("Mary is happy. Jones or Smith loves her.")
     .equalsTo(`
       let a, s0
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
       Jones(a).
       Smith(b).
       for (let every c, s0: woman(c) love(s0, b, c)) {
         like(s1, a, c).
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
       Mary(a).
       Smith(b).
       (
         love(s0, a, b).
       ) and (
         love(s1, b, a).
       ).
    `);
  });

  it("Mary owns a porsche and she loves it.", function() {
    // NOTE: goto the referent here of "it" is not right.
    assertThat("Mary owns a porsche and she loves it.")
     .equalsTo(`
       Mary(a).
       (
         porsche(b).
         own(s0, a, b).
       ) and (
         love(s1, a, b).
       ).
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
      Assert.deepEqual(e.message, "Invalid reference: it");
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
       Smith(a).
       Jones(b).
       like(s0, b, a).
       admire(s1, b, b).
    `);
  });

  it("Jones's wife is happy.", function() {
    assertThat("Jones's wife is happy.")
     .equalsTo(`
       Jones(a).
       wife(b).
       wife-of(b, a).
       happy(b).
    `);
  });

  it("Anna is Jones's wife.", function() {
    assertThat("Anna is Jones's wife.")
     .equalsTo(`
       Anna(a).
       Jones(b).
       a = c.
       wife(c).
       wife-of(c, b).
    `);
  });

  it("Jones's wife is happy. She likes Smith.", function() {
    assertThat("Jones's wife is happy. She likes Smith.")
     .equalsTo(`
       Jones(a).
       wife(b).
       wife-of(b, a).
       happy(b).
       Smith(c).
       like(s0, b, c).
    `);
  });

  it("Smith likes Jones's wife.", function() {
    assertThat("Smith likes Jones's wife.")
     .equalsTo(`
       Smith(a).
       Jones(b).
       wife-of(c, b).
       wife(c).
       like(s0, a, c).
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
       Jones(a).
       unhappy-donkey(b).
       donkey(b).
       own(s0, a, b).
    `);
  });

  it("Jones owns a fast porsche.", function() {
    assertThat("Jones owns a fast porsche.")
     .equalsTo(`
       Jones(a).
       fast-porsche(b).
       porsche(b).
       own(s0, a, b).
    `);
  });

  it("Jones owns every fast porsche.", function() {
    assertThat("Jones owns every fast porsche.")
     .equalsTo(`
       Jones(a).
       for (let every b: fast-porsche(b) porsche(b)) {
         own(s0, a, b).
       }
    `);
  });

  it("Every beautiful woman loves Jones.", function() {
    assertThat("Every beautiful woman loves Jones.")
     .equalsTo(`
       Jones(a).
       for (let every b: beautiful-woman(b) woman(b)) {
         love(s0, b, a).
       }
    `);
  });

  it("Smith loves a woman who does not like Jones.", function() {
    assertThat("Smith loves a woman who does not like Jones.")
     .equalsTo(`
       Smith(a).
       Jones(b).
       not (
         like(s0, c, b).
       ).
       woman(c).
       love(s1, a, c).
    `);
  });

  it("Jones likes a woman who likes Smith.", function() {
    assertThat("Jones likes a woman who likes Smith.")
     .equalsTo(`
       Jones(a).
       Smith(b).
       woman(c).
       like(s1, a, c).
       like(s0, c, b).
    `);
  });

  it("Jones loves a woman with a donkey.", function() {
    assertThat("Jones loves a woman with a donkey.")
     .equalsTo(`
       Jones(a).
       donkey(b).
       woman(c).
       love(s0, a, c).
       woman-with(c, b).
    `);
  });

  it("A woman with a donkey loves Jones.", function() {
    assertThat("a woman with a donkey loves Jones.")
     .equalsTo(`
       Jones(a).
       donkey(b).
       woman(c).
       love(s0, c, a).
       woman-with(c, b).
    `);
  });

  it("Jones loves the man.", function() {
    // What handles "the"-like nouns?
    assertThat("Jones loves the man.")
     .equalsTo(`
       Jones(a).
       man(b).
       love(s0, a, b).
    `);
  });

  it("Jones likes a woman near Smith's brother.", function() {
    // This seems ambigious:
    //   - Jones likes [a woman near Smith]'s brother
    //   - Jones likes a woman near [Smith's brother]
    assertThat("Jones likes a woman near Smith's brother.")
     .equalsTo(2);
  });

  it("Every woman with a donkey loves Jones.", function() {
    assertThat("Every woman with a donkey loves Jones.")
     .equalsTo(`
       Jones(a).
       for (let every b, c: woman(b) donkey(c) woman-with(b, c)) {
         love(s0, b, a).
       }
    `);
  });

  it("Every man from Brazil loves Mary.", function() {
    assertThat("Every man from Brazil loves Mary.")
     .equalsTo(`
       Brazil(a).
       Mary(b).
       for (let every c: man(c) man-from(c, a)) {
         love(s0, c, b).
       }
    `);
  });

  it("Jones loves Mary. Jones likes Smith.", function() {
    assertThat("Jones loves Mary. Jones likes Smith.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       love(s0, a, b).
       Smith(c).
       like(s1, a, c).
    `);
  });

  it("Every man is mortal. Socrates is a man.", function() {
    assertThat("Every man is mortal. Socrates is a man.")
     .equalsTo(`
       for (let every a: man(a)) {
         mortal(a).
       }
       Socrates(b).
       b = c.
       man(c).
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

  it("A brazilian engineer who loves Mary's mother is happy.", function() {
    assertThat("A brazilian engineer who loves Mary's mother is happy.")
     .equalsTo(2);
  });

  it("Jones is Mary's husband.", function() {
    assertThat("Jones is Mary's husband.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       a = c.
       husband(c).
       husband-of(c, b).
    `);
  });

  it("Jones's father is Mary's husband.", function() {
    assertThat("Jones's father is Mary's husband.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       c = d.
       father(c).
       husband(d).
       father-of(c, a).
       husband-of(d, b).
    `);
  });

  it("Mary's father is a brazilian engineer.", function() {
    assertThat("Mary's father is a brazilian engineer.")
     .equalsTo(`
       Mary(a).
       b = c.
       father(b).
       father-of(b, a).
       brazilian-engineer(c).
       engineer(c).
    `);
  });

  it("Jones is from Brazil", function() {
    assertThat("Jones is from Brazil.")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       from(a, b).
    `);
  });

  it("Jones likes a brazilian engineer", function() {
    assertThat("Jones likes a brazilian engineer.")
     .equalsTo(`
       Jones(a).
       brazilian-engineer(b).
       engineer(b).
       like(s0, a, b).
    `);
  });
  
  it("Jones likes a married brazilian", function() {
    assertThat("Jones likes a married brazilian.")
     .equalsTo(`
       Jones(a).
       married-brazilian(b).
       brazilian(b).
       like(s0, a, b).
    `);
  });

  it("Jones is behind Mary", function() {
    assertThat("Jones is behind Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       behind(a, b).
    `);
  });

  it("Jones's wife is behind Mary's sister", function() {
    // assertThat("Jones's wife is behind Mary's sister.")
    assertThat("Jones's wife is behind Mary's sister.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       wife(c).
       sister(d).
       wife-of(c, a).
       sister-of(d, b).
       behind(c, d).
    `);
  });

  it("Jones's wife is Mary.", function() {
    assertThat("Jones's wife is Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       c = b.
       wife(c).
       wife-of(c, a).
    `);
  });

  it("Mary is Jones's wife.", function() {
    assertThat("Mary is Jones's wife.")
     .equalsTo(`
       Mary(a).
       Jones(b).
       a = c.
       wife(c).
       wife-of(c, b).
    `);
  });

  it("Jones is Smith's brother. he likes Brazil.", function() {
    assertThat("Jones is Smith's brother. he likes Brazil.")
     .equalsTo(`
       Jones(a).
       Smith(b).
       a = c.
       brother(c).
       brother-of(c, b).
       Brazil(d).
       like(s0, c, d).
    `);
  });

  it("Jones loves himself.", function() {
    assertThat("Jones loves himself.")
     .equalsTo(`
       Jones(a).
       love(s0, a, a).
    `);
  });

  it("Jones kissed Mary.", function() {
    assertThat("Jones kissed Mary.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       s0 < __now__.
       kiss(s0, a, b).
    `);
  });

  it("Smith was happy.", function() {
    assertThat("Smith was happy.")
     .equalsTo(`
       Smith(a).
       happy(a).
    `);
  });

  it("Smith was not happy.", function() {
    assertThat("Smith was not happy.")
     .equalsTo(`
       Smith(a).
       not (
         happy(a).
       ).
    `);
  });

  it("Smith likes Mary.", function() {
    assertThat("Smith likes Mary.")
     .equalsTo(`
       Smith(a).
       Mary(b).
       like(s0, a, b).
    `);
  });

  it("Smith will not kiss Mary.", function() {
    assertThat("Smith will not kiss Mary.")
     .equalsTo(`
       Smith(a).
       Mary(b).
       s0 > __now__.
       not (
         kiss(s0, a, b).
       ).
    `);
  });

  it("Smith did not kiss Mary.", function() {
    assertThat("Smith did not kiss Mary.")
     .equalsTo(`
         Smith(a).
         Mary(b).
         s0 < __now__.
         not (
           kiss(s0, a, b).
         ).
    `);
  });

  it("Smith likes Mary.", function() {
    assertThat("Smith likes Mary.")
     .equalsTo(`
       Smith(a).
       Mary(b).
       like(s0, a, b).
    `);
  });

  it("Smith does not like Mary.", function() {
    // This is a slightly different result we get at
    // page 555, with regards to the temporal
    // referents.
    assertThat("Smith does not like Mary.")
     .equalsTo(`
       Smith(a).
       Mary(b).
       not (
         like(s0, a, b).
       ).
    `);
  });

  it("Smith has kissed Mary.", function() {
    assertThat("Smith has kissed Mary.")
     .equalsTo(`
       Smith(a).
       Mary(b).
       kiss(s0, a, b).
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
       Smith(a).
       porsche(b).
       own(s0, a, b).
    `);
  });

  it("Smith was happy.", function() {
    assertThat("Smith was happy.")
     .equalsTo(`
       Smith(a).
       happy(a).
    `);
  });

  it("Smith was an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Smith was an engineer.")
     .equalsTo(`
       Smith(a).
       a = b.
       engineer(b).
    `);
  });

  it("Smith was not an engineer.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("Smith was not an engineer.")
     .equalsTo(`
       Smith(a).
       not (
         a = b.
         engineer(b).
       ).
    `);
  });

  it("Smith was married to Mary.", function() {
    // TODO: allow prepositional phrases to be attached
    // to adjectives.
    assertThat("Smith was married to Mary.")
     .equalsTo(2);
  });

  it("Smith was not an engineer from Brazil.", function() {
    assertThat("Smith was not an engineer from Brazil.")
     .equalsTo(`
      Smith(a).
      Brazil(b).
      not (
        a = c.
        engineer(c).
        engineer-from(c, b).
      ).
    `);
  });

  it("Every brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    assertThat("every brazilian was happy.")
     .equalsTo(`
         for (let every a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("All brazilians are happy.", function() {
    assertThat("All brazilians are happy.")
     .equalsTo(`
         for (let every a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("Most brazilians are happy.", function() {
    assertThat("Most brazilians are happy.")
     .equalsTo(`
         for (let most a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("Many brazilians are happy.", function() {
    assertThat("Many brazilians are happy.")
     .equalsTo(`
       for (let many a: brazilian(a)) {
         happy(a).
       }
    `);
  });

  it("3 brazilians are happy.", function() {
    assertThat("3 brazilians are happy.")
     .equalsTo(`
         for (let exactly(3) a: brazilian(a)) {
           happy(a).
         }
    `);
  });
  
  it("More than 3 brazilians are happy.", function() {
    assertThat("More than 3 brazilians are happy.")
     .equalsTo(`
         for (let more-than(3) a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("Fewer than 3 brazilians are happy.", function() {
    assertThat("Fewer than 3 brazilians are happy.")
     .equalsTo(`
         for (let fewer-than(3) a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("At least 3 brazilians are happy.", function() {
    assertThat("At least 3 brazilians are happy.")
     .equalsTo(`
         for (let at-least(3) a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("At most 3 brazilians are happy.", function() {
    assertThat("At most 3 brazilians are happy.")
     .equalsTo(`
         for (let at-most(3) a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("Only brazilians are happy.", function() {
    assertThat("Only brazilians are happy.")
     .equalsTo(`
         for (let only a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it.skip("The majority of brazilians are happy.", function() {
    assertThat("The majority of brazilians are happy.")
     .equalsTo(`
         for (let the-majority-of a: brazilian(a)) {
           happy(a).
         }
    `);
  });

  it("Every engineer who was brazilian was happy.", function() {
    // Matches the DRS found in (3.57) on page 269.
    // who was brazilian 
    assertThat("Every engineer who was brazilian was happy.")
     .equalsTo(`
       for (let every a: engineer(a) brazilian(a)) {
         happy(a).
       }
    `);
  });

  it("Most brazilians like most porsches.", function() {
    assertThat("Most brazilians like most porsches.")
     .equalsTo(`
         for (let most a: brazilian(a)) {
           for (let most b: porsche(b)) {
             like(s0, a, b).
           }
         }
    `);
  });
  
  it("Most brazilians love a porsche which Smith likes.", function() {
    assertThat("Most brazilians love a porsche which Smith likes.")
     .equalsTo(`
         Smith(a).
         for (let most b: brazilian(b)) {
           porsche(c).
           love(s1, b, c).
           like(s0, a, c).
         }
    `);
  });

  it("Is Jones happy about Brazil?", function() {
    assertThat("Is Jones happy about Brazil?")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       happy(a) happy-about(a, b)?
    `);
  });

  it("Is Jones from Brazil?", function() {
    assertThat("Is Jones from Brazil?")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       from(a, b)?
    `);
  });

  it("Who loves Jones?", function() { 
    // NOTE(goto): we should probably keep the 
    // variable b scoped to the question.
    assertThat("Who loves Jones?")
     .equalsTo(`
       Jones(a).
       let b: love(b, a)?
    `);
  });

  it("Who does Jones love?", function() { 
    assertThat("Who does Jones love?")
     .equalsTo(`
       Jones(a).
       let b: love(a, b)?
    `);
  });

  it("What does Jones love?", function() { 
    assertThat("What does Jones love?")
     .equalsTo(`
       Jones(a).
       let b: love(a, b)?
    `);
  });

  it("Is Brazil a country?", function() { 
    assertThat("Is Brazil a country?")
     .equalsTo(`
       Brazil(a).
       let b: a = b country(b)?
    `);
  });

  it("Is Brazil a country which borders Argentina?", function() { 
    assertThat("Is Brazil a country which borders Argentina?")
     .equalsTo(`
       Brazil(a).
       Argentina(b).
       let s0, c: a = c country(c) border(s0, c, b)?
    `);
  });

  it("Which country borders Brazil?", function() { 
    assertThat("Which country borders Brazil?")
     .equalsTo(`
       Brazil(a).
       let b: border(b, a)?
    `);
  });

  it("Which countries border Brazil?", function() { 
    assertThat("Which countries border Brazil?")
     .equalsTo(`
       Brazil(a).
       let b: border(b, a)?
    `);
  });

  it("Which countries border Brazil?", function() {
    // NOTE: where is europe factored into the question?
    assertThat("Which country in Europe is happy about Brazil?")
     .equalsTo(`
       Europe(a).
       Brazil(b).
       let c: happy(c) happy-about(c, b)?
    `);
  });

  it("Who borders Brazil?", function() {
    assertThat("Who borders Brazil?")
     .equalsTo(`
       Brazil(a).
       let b: border(b, a)?
    `);
  });

  it("Does Jones like Mary?", function() {
    assertThat("Does Jones like Mary?")
     .equalsTo(`
       Jones(a).
       Mary(b).
       like(a, b)?
    `);
  });

  it("Does Jones like a woman from Brazil?", function() {
    assertThat("Does Jones like a woman from Brazil?")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       let c: woman(c) like(a, c) woman-from(c, b)?
    `);
  });

  it("Does Argentina border Brazil?", function() {
    assertThat("Does Argentina border Brazil?")
     .equalsTo(`
       Argentina(a).
       Brazil(b).
       border(a, b)?
    `);
  });

  it("Does Brazil border most countries in South America?", function() {
    assertThat("Does Brazil border most countries in South America?")
     .equalsTo(`
       Brazil(a).
       South-America(b).
       for (let most c: country(c) country-in(c, b)) {
         border(a, c).
       }
       ?
    `);
  });

  it("Is every man mortal?", function() {
    assertThat("Is every man mortal?")
     .equalsTo(`
       for (let every a: man(a)) {
         mortal(a).
       }
       ?
    `);
  });
  
  it("Are most men mortal?", function() {
    assertThat("Are most men mortal?")
     .equalsTo(`
       for (let most a: man(a)) {
         mortal(a).
       } 
       ?
    `);
  });

  it("Do most birds fly?", function() {
    assertThat("Do most birds fly?")
     .equalsTo(`
        for (let most a: bird(a)) {
          fly(a).
        } 
        ?
    `);
  });

  it("Do birds fly?", function() {
    assertThat("Do birds fly?")
     .equalsTo(`
        for (let every a: bird(a)) {
          fly(a).
        } 
        ?
    `);
  });

  it("Is Sam married to Dani?", function() {
    assertThat("Is Sam married to Dani?")
     .equalsTo(`
        Sam(a).
        Dani(b).
        married(a) married-to(a, b)?
    `);
  });

  it("Are most countries in South America rich?", function() {
    assertThat("Are most countries in South America rich?")
     .equalsTo(`
        South-America(a).
        for (let most b: country(b) country-in(b, a)) {
          rich(b).
        } 
        ?
    `);
  });

  it("Are most countries in South America happy about the cancelation?", function() {
    assertThat("Are most countries in South America happy about the cancelation?")
     .equalsTo(`
       South-America(a).
       for (let most b: country(b) country-in(b, a)) {
         cancelation(c).
         happy(b).
         happy-about(b, c).
       }
       ?
    `);
  });

  // Adverbs
  it("Jones gave to Mary a porsche.", function() { 
    // These aren't a correct representation of adverbs
    // because they aren't using the eventuality
    // but it is a reasonable starting point.
    assertThat("Jones gave to Mary a porsche.")
     .equalsTo(`
       Jones(a).
       Mary(b).
       s0 < __now__.
       porsche(c).
       give-to(s0, b).
       give(s0, a, c).
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
       Foo(a).
       XBar(b).
       like(s0, a, b).
     `);
  });

  it("Pikachu likes Charmander.", function() { 
    assertThat("Picachu likes Charmander.")
     .equalsTo(`
       Picachu(a).
       Charmander(b).
       like(s0, a, b).
     `);
  });

  it("Sam likes Aristotle.", function() { 
    assertThat("Sam likes Aristotle.")
     .equalsTo(`
       Sam(a).
       Aristotle(b).
       like(s0, a, b).
     `);
  });

  it("Sam Goto likes Computer Science.", function() { 
    assertThat("Sam Goto likes Computer Science.")
     .equalsTo(`
       Sam-Goto(a).
       Computer-Science(b).
       like(s0, a, b).
     `);
  });

  it("Sam Goto likes the United States Of America.", function() { 
    assertThat("Sam Goto likes the United States Of America.")
     .equalsTo(`
       Sam-Goto(a).
       United-States-Of-America(b).
       like(s0, a, b).
     `);
  });

  it("Sam likes DRT.", function() { 
    assertThat("Sam likes DRT.")
     .equalsTo(`
       Sam(a).
       DRT(b).
       like(s0, a, b).
     `);
  });
  
  it("DRT is liked by Sam.", function() { 
    assertThat("DRT is liked by Sam.")
     .equalsTo(`
       DRT(a).
       Sam(b).
       like(s0, b, a).
     `);
  });

  it("DRT is liked.", function() { 
    assertThat("DRT is liked.")
     .equalsTo(`
       DRT(a).
       like(s0, b, a).
     `);
  });

  it("DRT was liked by Sam.", function() { 
    assertThat("DRT was liked by Sam.")
     .equalsTo(`
       DRT(a).
       Sam(b).
       s0 < __now__.
       like(s0, b, a).
     `);
  });
  
  it("DRT is liked by Sam.", function() { 
    assertThat("DRT is liked by Sam.")
     .equalsTo(`
       DRT(a).
       Sam(b).
       like(s0, b, a).
     `);
  });

  it("Sam likes Discourse Representation Theory.", function() { 
    assertThat("Sam likes Discourse Representation Theory.")
     .equalsTo(`
       Sam(a).
       Discourse-Representation-Theory(b).
       like(s0, a, b).
     `);
  });

  it("Sam made a reservation for Cascal for Dani.", function() { 
    assertThat("Sam made a reservation for Cascal for Dani.")
     .equalsTo(`
       Sam(a).
       Cascal(b).
       Dani(c).
       s0 < __now__.
       reservation(d).
       make(s0, a, d).
       reservation-for(d, c).
       reservation-for(d, b).
     `);
  });

  it("Every uncle is either a parent or a relative", function() { 
    assertThat("Every uncle is either a parent or a relative.")
     .equalsTo(`
      for (let every a: uncle(a)) {
        either (
          a = b.
          parent(b).
        ) or (
          a = c.
          relative(c).
        ).
      }
     `);
  });

  it("Everyone is happy", function() { 
    assertThat("Everyone is happy.")
     .equalsTo(`
     for (let every a) {
       happy(a).
     }
     `);
  });

  it.skip("Everyone who likes Sam is happy", function() { 
    assertThat("Everyone who likes Sam is happy.")
     .equalsTo(`
     for (let every a) {
       happy(a).
     }
     `);
  });

  it("Everyone's uncle is happy", function() { 
    assertThat("Everyone's uncle is happy.")
     .equalsTo(`
       for (let every a, b: uncle(b) uncle-of(b, a)) {
         happy(b).
       }
     `);
  });

  it.skip("Some uncle is happy", function() { 
    assertThat("Some uncle is happy.")
     .equalsTo(`
       for (let every a: uncle(a)) {
         happy(a).
       }
     `);
  });

  it("Every brother of one's parent uncle is one's uncle", function() { 
    assertThat("Every brother of one's parent is one's uncle.")
     .equalsTo(`
       for (let every a) {
         for (let every b, c: parent(c) parent-of(c, a) brother(b) brother-of(b, c)) {
           b = d.
           uncle(d).
           uncle-of(d, a).
         }
       }
     `);
  });

  it("Maura is Mel's parent.", function() { 
    assertThat("Maura is Mel's parent.")
     .equalsTo(`
       Maura(a).
       Mel(b).
       a = c.
       parent(c).
       parent-of(c, b).
     `);
  });

  it("Everyone's uncle one is one's relative", function() { 
    assertThat("Everyone's uncle is one's relative.")
     .equalsTo(`
      for (let every a, b: uncle(b) uncle-of(b, a)) {
        b = c.
        relative(c).
        relative-of(c, a).
      }
     `);
  });
 
  it("Every uncle is happy", function() { 
    assertThat("Every uncle is happy.")
     .equalsTo(`
      for (let every a: uncle(a)) {
        happy(a).
      }
     `);
  });

  it("Everyone's uncle is happy", function() { 
    assertThat("Everyone's uncle is happy.")
     .equalsTo(`
      for (let every a, b: uncle(b) uncle-of(b, a)) {
        happy(b).
      }
     `);
  });

  it("Everyone's uncle is a male relative", function() { 
    assertThat("Everyone's uncle is a male relative.")
     .equalsTo(`
       for (let every a, b: uncle(b) uncle-of(b, a)) {
         b = c.
         male-relative(c).
         relative(c).
       }
     `);
  });

  it.skip("Every uncle is either rich or happy.", function() { 
    assertThat("Every uncle is either rich or happy.")
     .equalsTo(`
      for (let every a: uncle(a)) {
        rich(a).
      }
     `);
  });

  it("Mel is unhappy about Brazil", function() { 
    assertThat("Mel is unhappy about Brazil.")
     .equalsTo(`
        Mel(a).
        Brazil(b).
        unhappy(a).
        unhappy-about(a, b).
     `);
  });

  it("Jones came from Brazil to Italy.", function() { 
    assertThat("Jones came from Brazil to Italy.")
     .equalsTo(`
       Jones(a).
       Brazil(b).
       Italy(c).
       s0 < __now__.
       come-to(s0, c).
       come(s0, a).
       come-from(s0, b).
     `);
  });

  it("Sam made a reservation for a woman with a porsche.", function() { 
    // This is an ambiguous sentence, because it can mean:
    // - Sam made a reservation for [a woman with a porsche]
    // or
    // - Sam made [a reservation [for a woman] [with a porsche]]
    // The interpretation used at the moment is the latter..
    assertThat("Sam made a reservation for a woman with a porsche.")
     .equalsTo(`
       Sam(a).
       s0 < __now__.
       woman(b).
       reservation(d).
       porsche(c).
       make(s0, a, d).
       reservation-with(d, c).
       reservation-for(d, b).
     `);
  });

  it.skip("Either every man is mortal or every woman is mortal.", function() {
    assertThat("Either every man is mortal or every woman is mortal.")
     .equalsTo(`
       either (
         for (let every a: man(a)) {
           mortal(a).
         }
       ) or (
         for (let every b: woman(b)) {
           mortal(b).
         }
       ).
    `);
  });

  it("Either every man or every woman is mortal.", function() {
    assertThat("either every man or every woman is mortal.")
     .equalsTo(`
       for (let every a: man(a)) {
         for (let every b: woman(b)) {
           either (
             mortal(a).
           ) or (
             mortal(b).
           ).
         }
       }
    `);
  });

  it("Either every man or every woman is not mortal.", function() {
    assertThat("either every man or every woman is not mortal.")
     .equalsTo(`
         for (let every a: man(a)) {
           for (let every b: woman(b)) {
             either (
               not (
                 mortal(a).
               ).
             ) or (
               not (
                 mortal(b).
               ).
             ).
           }
         }
    `);
  });

  it("Either every man or every woman is from Brazil.", function() {
    assertThat("either every man or every woman is from Brazil.")
     .equalsTo(`
       Brazil(a).
       for (let every b: man(b)) {
         for (let every c: woman(c)) {
           either (
             from(b, a).
           ) or (
             from(c, a).
           ).
         }
       }
    `);
  });

  it("Brazilians are happy.", function() { 
    assertThat("Brazilians are happy.")
     .equalsTo(`
       for (let every a: brazilian(a)) {
         happy(a).
       }
     `);
  });

  it("Brazilians who like Sam are happy.", function() { 
    assertThat("Brazilians who like Sam are happy.")
     .equalsTo(`
       Sam(a).
       for (let every b, s0: brazilian(b) like(s0, b, a)) {
         happy(b).
       }
    `);
  });

  it("Birds are happy.", function() { 
    assertThat("Birds are happy.")
     .equalsTo(`
       for (let every a: bird(a)) {
         happy(a).
       }
    `);
  });

  it("Birds fly.", function() { 
    assertThat("Birds fly.")
     .equalsTo(`
       for (let every a: bird(a)) {
         fly(s0, a).
       }
    `);
  });

  it("Birds that like Sam are happy.", function() { 
    assertThat("Birds that like Sam are happy.")
     .equalsTo(`
       Sam(a).
       for (let every b, s0: bird(b) like(s0, b, a)) {
         happy(b).
       }
    `);
  });

  it("Birds that fly are happy.", function() { 
    assertThat("Birds that fly are happy.")
     .equalsTo(`
       for (let every a, s0: bird(a) fly(s0, a)) {
         happy(a).
       }
    `);
  });

  it("Sam loves birds.", function() { 
    assertThat("Sam loves birds.")
     .equalsTo(`
       Sam(a).
       for (let every b: bird(b)) {
         love(s0, a, b).
       }
    `);
  });

  it("People love birds.", function() { 
    assertThat("People love birds.")
     .equalsTo(`
       for (let every a: person(a)) {
         for (let every b: bird(b)) {
           love(s0, a, b).
         }
       }
    `);
  });

  it("Every person loves birds.", function() { 
    assertThat("Every person loves birds.")
     .equalsTo(`
       for (let every a: person(a)) {
         for (let every b: bird(b)) {
           love(s0, a, b).
         }
       }
    `);
  });

  it("People love birds that fly.", function() { 
    assertThat("People love birds that fly.")
     .equalsTo(`
       for (let every a: person(a)) {
         for (let every b, s0: bird(b) fly(s0, b)) {
           love(s1, a, b).
         }
       }
    `);
  });

  it("Birds are animals.", function() { 
    assertThat("Birds are animals.")
     .equalsTo(`
       for (let every a: bird(a)) {
         animal(a).
       }
    `);
  });

  it("Penguins are birds that do not fly.", function() { 
    assertThat("Penguins are birds that do not fly.")
     .equalsTo(`
       for (let every a: penguin(a)) {
         not (
           fly(s0, a).
         ).
         bird(a).
       }
    `);
  });

  it("Sam loves [Dani].", function() { 
    assertThat("Sam loves [Dani].")
     .equalsTo(`
       Sam(a).
       Dani(b).
       love(s0, a, b).
     `);
  });

  it("Sam loves [a woman].", function() { 
    assertThat("Sam loves [a woman].")
     .equalsTo(`
      Sam(a).
      woman(b).
      love(s0, a, b).
     `);
  });

  it("Sam loves a woman who is a [sibling of Thais].", function() { 
    assertThat("Sam loves a woman who is [a sibling of Thais].")
     .equalsTo(`
       Sam(a).
       Thais(b).
       sibling(c).
       woman(d).
       d = c.
       love(s0, a, d).
       sibling-of(c, b).
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
        // console.log(JSON.stringify(sentences, undefined, 2));
        if (sentences.length > 1) {
          Assert.deepEqual(sentences.length, y);
          return sentences.length;
        }
        drs.feed(sentences);
        // console.log(drs.print());
        // const console = new Console();
        // console.log(drs.print());
        //console.log(KB.read);
        // console.log(kb.read);
        const kb = new KB();
        const gen = kb.read(drs.print());
        gen.next();
        // console.log(kb);
        Assert.deepEqual(this.trim(drs.print()), this.trim(y));
      }
    }
  }
});

describe("Large Lexicon", () => {
  it("Mel likes Yuji's girlfriend.", function() { 
    assertThat("Mel likes Yuji's girlfriend.")
      .equalsTo(`
      Mel(a).
      Yuji(b).
      girlfriend-of(c, b).
      girlfriend(c).
      like(s0, a, c).
    `);
  });

  it("Mel likes Yuji's awesome girlfriend.", function() {
    assertThat("Mel likes Yuji's awesome girlfriend.")
      .equalsTo(`
      Mel(a).
      Yuji(b).
      awesome-girlfriend-of(c).
      girlfriend-of(c, b).
      awesome-girlfriend(c).
      girlfriend(c).
      like(s0, a, c).
    `);
  });

  it("Yuji is an awesome person.", function() { 
    assertThat("Yuji is an awesome person.")
      .equalsTo(`
      Yuji(a).
      a = b.
      awesome-person(b).
      person(b).
    `);
  });

  it("Jones is an unhappy foolish man.", function() { 
    assertThat("Jones is an unhappy foolish man.")
      .equalsTo(`
      Jones(a).
      a = b.
      unhappy-foolish-man(b).
      foolish-man(b).
      man(b).
    `);
  });

  it("Mel travelled to a country.", function() { 
    assertThat("Mel travelled to an awesome country.")
      .equalsTo(`
       Mel(a).
       s0 < __now__.
       awesome-country(b).
       country(b).
       travel-to(s0, b).
       travel(s0, a).
    `);
  });

  it("Mel does not live in Brazil.", function() { 
    assertThat("Mel does not live in Brazil.")
      .equalsTo(`
       Mel(a).
       Brazil(b).
       not (
         live-in(s0, b).
         live(s0, a).
       ).
    `);
  });

  it("Most brazilians live in Brazil.", function() { 
    assertThat("Most brazilians live in Brazil.")
      .equalsTo(`
       Brazil(a).
       for (let most b: brazilian(b)) {
         live-in(s0, a).
         live(s0, b).
       }
    `);
  });

  it("Mel lives in Brazil.", function() { 
    assertThat("Mel lives in Brazil.")
      .equalsTo(`
       Mel(a).
       Brazil(b).
       live-in(s0, b).
       live(s0, a).
    `);
  });

  it("Mel lived in Brazil.", function() { 
    assertThat("Mel lived in Brazil.")
      .equalsTo(`
       Mel(a).
       Brazil(b).
       s0 < __now__.
       live-in(s0, b).
       live(s0, a).
    `);
  });

  it("Mel has lived in Brazil.", function() { 
    assertThat("Mel has lived in Brazil.")
      .equalsTo(`
       Mel(a).
       Brazil(b).
       live-in(s0, b).
       live(s0, a).
    `);
  });

  it.skip("Sam was born in Brazil.", function() {
    // TODO: expand prepositional phrases in adjectives.
    assertThat("Sam was born in Brazil.")
      .equalsTo(`
        Sam(a).
        Brazil(b).
        < born(a).
    `);    
  });

  it("Every person who is from Brazil is brazilian.", function() {
    assertThat("Every person who is from Brazil is brazilian.")
      .equalsTo(`
       Brazil(a).
       for (let every b: person(b) from(b, a)) {
         brazilian(b).
       }
    `);    
  });

  it("Brazil is a country in South America.", () => {
    assertThat("Brazil is a country in South America.")
      .equalsTo(`
        Brazil(a).
        South-America(b).
        a = c.
        country(c).
        country-in(c, b).
      `);
  });

  it("Brazil borders most countries in South America.", () => {
    assertThat("Brazil borders all countries in South America.")
      .equalsTo(`
        Brazil(a).
        South-America(b).
        for (let every c: country(c) country-in(c, b)) {
          border(s0, a, c).
        }
      `);
  });

  it("211M peoples live in Brazil.", () => {
    assertThat("211M peoples live in Brazil.")
      .equalsTo(`
        Brazil(a).
        for (let exactly(211M) b: people(b)) {
          live-in(s0, a).
          live(s0, b).
        }
    `);
  });
  
  it("The capital of Brazil is Brasilia.", () => {
    assertThat("The capital of Brazil is Brasilia.")
      .equalsTo(`
        Brazil(a).
        Brasilia(b).
        c = b.
        capital(c).
        capital-of(c, a).
      `);
  });

  it("Brasilia is the capital of Brazil.", () => {
    assertThat("Brasilia is a capital of Brazil.")
      .equalsTo(`
        Brasilia(a).
        Brazil(b).
        a = c.
        capital(c).
        capital-of(c, b).
      `);
  });

  it("Brazil borders most countries.", () => {
    assertThat("Brazil borders most countries.")
      .equalsTo(`
        Brazil(a).
        for (let most b: country(b)) {
          border(s0, a, b).
        }
      `);
  });

  it("26 states compose Brazil's federation.", () => {
    assertThat("26 states compose Brazil's federation.")
      .equalsTo(`
        Brazil(a).
        for (let exactly(26) b: state(b)) {
          federation-of(c, a).
          federation(c).
          compose(s0, b, c).
        }
      `);
  });
  
  it("Brazil is bounded by the Atlantic Ocean on the East.", () => {
    assertThat("Brazil is bounded by the Atlantic Ocean on the East.")
      .equalsTo(`
        Brazil(a).
        Atlantic-Ocean(b).
        East(c).
        bound-on(s0, c).
        bound(s0, b, a).
      `);
  });

  it("Brazil's official language is Portuguese.", () => {
    assertThat("Brazil's official language is Portuguese.")
      .equalsTo(`
        Brazil(a).
        Portuguese(b).
        c = b.
        official-language(c).
        language(c).
        official-language-of(c).
        language-of(c, a).
      `);
  });

  it("The official language of Brazil is Portuguese.", () => {
    assertThat("The official language of Brazil is Portuguese.")
      .equalsTo(`
        Brazil(a).
        Portuguese(b).
        c = b.
        official-language(c).
        language(c).
        official-language-of(c, a).
      `);
  });

  it.skip("Brazil was inhabited by a tribal nation before the landing of Pedro Alvares Cabral.", () => {
    // The prepositional phrases aren't tied quite right, specially "the landing of" isn't
    // tieing back the landing to Pedro Alvares Cabral.
    assertThat("Brazil was inhabited by a tribal nation before the landing of Pedro Alvares Cabral.")
      .equalsTo(`
        Brazil(a).
        Pedro Alvares Cabral(b).
        inhabited(a).
        landing(c).
        tribal-nation(d).
        nation(d).
        of(a, b).
        inhabited-before(a, c).
        inhabited-by(a, d).
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
        Pedro-Alvares-Cabral(a).
        Portuguese-Empire(b).
        Brazil(c).
        s0 < __now__.
        area(d).
        claim-for(s0, b).
        area-of(d, c).
        claim(s0, a, d).
      `);
  });

  it("The Portuguese Empire's capital was transferred from Lisbon to Rio De Janeiro.", () => {
    assertThat("The Portuguese Empire's capital was transferred from Lisbon to Rio De Janeiro.")
      .equalsTo(`
        Portuguese-Empire(a).
        Lisbon(b).
        Rio-De-Janeiro(c).
        capital(d).
        capital-of(d, a).
        s0 < __now__.
        transfer-to(s0, c).
        transfer(s0, e, d).
        transfer-from(s0, b).
      `);
  });

  it("Brazil is classified by the World Bank as an industrialized country.", () => {
    // TODO: allow conjugated noun phrases to allow Brazil to be classified as
    // multiple things.
    //   - Brazil is classified as an upper-midle income economy by The-World-Bank.
    // industrialized is also a the past participle of a verb to-industrialize
    // which conflicts here.
    assertThat("Brazil is classified by the World Bank as an industrial country.")
      .equalsTo(`
        Brazil(a).
        World-Bank(b).
        industrial-country(c).
        country(c).
        classify-as(s0, c).
        classify(s0, b, a).
      `);
  });

  it("Brazil is a member of the United Nations.", () => {
    //   - Brazil is a founding member of the United Nations and the Mercosul.
    assertThat("Brazil is a member of the United Nations.")
      .equalsTo(`
        Brazil(a).
        United-Nations(b).
        a = c.
        member(c).
        member-of(c, b).
      `);
  });
  
  it("Brazil is considered as an advanced economy.", () => {
    // TODO: allow multiple adjectives to be used in front of nouns.
    // e.g. "Brazil is considered an advanced emerging economy."
    // 
    // "advanced" is removed from the adjective list because it can
    // be used as the passive voice "x is y by z" but also the
    // adjective formation of "x is y by z".
    assertThat("Brazil is considered as an upcoming economy.")
      .equalsTo(`
        Brazil(a).
        upcoming-economy(b).
        economy(b).
        consider-as(s0, b).
        consider(s0, c, a).
      `);
  });
  
  it("Brazil.", function() {
    // Things that I'd expect to be able to write:
    //   - Brazil's population is 211 million people.
    //   - 26 states compose the federation of Brazil: Sao Paulo, etc, etc.
    //   - Brazil remained a colony. // probablly missing remained in the lexicon.
    //   - Brazil is classified as an upper-midle income economy by The-World-Bank.
    //   - Brazil is considered an advanced emerging economy.
    // Semantically, things I'd expect:
    //   - "was transferred" is an adjective, but feels like the passive voice
    //   - "was transferred" isn't maintaining the "tense" of "was"
    assertThat(`
      Brazil is a country in South America.
      Brazil borders most countries in South America.
      211M peoples live in Brazil.
      The capital of Brazil is Brasilia.
      26 states compose Brazil's federation.
      Brazil is bounded by the Atlantic Ocean on the East.
      The official language of Brazil is Portuguese.
      Pedro Alvares Cabral claimed for the Portuguese Empire the area of Brazil.
      The Portuguese Empire's capital was transferred from Lisbon to Rio De Janeiro.
      Brazil is classified by the World Bank as an industrial country.
      Brazil is a member of the United Nations.
      Brazil is considered as an upcoming economy.
    `).equalsTo(`
       Brazil(a).
       South-America(b).
       a = c.
       country(c).
       country-in(c, b).
       for (let most d: country(d) country-in(d, b)) {
         border(s0, a, d).
       }
       for (let exactly(211M) e: people(e)) {
         live-in(s1, a).
         live(s1, e).
       }
       Brasilia(f).
       g = f.
       capital(g).
       capital-of(g, a).
       for (let exactly(26) h: state(h)) {
         federation-of(i, a).
         federation(i).
         compose(s2, h, i).
       }
       Atlantic-Ocean(j).
       East(k).
       bound-on(s3, k).
       bound(s3, j, a).
       Portuguese(l).
       m = l.
       official-language(m).
       language(m).
       official-language-of(m, a).
       Pedro-Alvares-Cabral(n).
       Portuguese-Empire(o).
       s4 < __now__.
       area(p).
       claim-for(s4, o).
       area-of(p, a).
       claim(s4, n, p).
       Lisbon(q).
       Rio-De-Janeiro(r).
       capital(s).
       capital-of(s, o).
       s5 < __now__.
       transfer-to(s5, r).
       transfer(s5, t, s).
       transfer-from(s5, q).
       World-Bank(u).
       industrial-country(v).
       country(v).
       classify-as(s6, v).
       classify(s6, u, a).
       United-Nations(w).
       a = x.
       member(x).
       member-of(x, w).
       upcoming-economy(y).
       economy(y).
       consider-as(s7, y).
       consider(s7, z, a).
    `);    
  });

  it("Every country is a political territory which is controlled.", () => {
    assertThat(`
      Every country is a political territory which is controlled.
    `).equalsTo(`
       for (let every a: country(a)) {
         a = b.
         political-territory(b).
         territory(b).
         control(s0, c, b).
       }
     `);
  });
  
  it("Every country is a political territory which is controlled.", () => {
    // TODO: allow adjectives to apply to multiple nouns.
    // A country is a political state, nation or territory which is controlled
    // Things that I'd expect to be able to write:
    //   - A country may be an independent sovereign state or part of a larger state,
    //   - The United Nations and the World bank classify all countries.
    assertThat(`
      Every country is a political territory which is controlled.
      Every country is an independent state.
      The United Nations classifies all countries.
      The World Bank classifies all countries.
    `).equalsTo(`
       for (let every a: country(a)) {
         a = b.
         political-territory(b).
         territory(b).
         control(s0, c, b).
       }
       for (let every d: country(d)) {
         d = e.
         independent-state(e).
         state(e).
       }
       United-Nations(f).
       for (let every g: country(g)) {
         classify(s1, f, g).
       }
       World-Bank(h).
       for (let every i: country(i)) {
         classify(s2, h, i).
       }
     `);
  });

  it.skip("Every nation is a stable community of some peoples with a common language.", () => {
    // TODO(goto): there is a bug somewhere here with the "of some peoples".
    assertThat(`
      Every nation is a stable community of some peoples with a common language.
    `).equalsTo(`
       for (let every a: nation(a)) {
         a = b.
         stable-community(b).
         community(b).
         common-language(c).
         language(c).
         stable-community-with(b, c).
         stable-community-of(b, ).
       }
     `);

  });

  it("Sam travelled from a beautiful country to an evil country.", () => {
    assertThat(`Sam travelled from a beautiful country to an evil country.`)
      .equalsTo(`
        Sam(a).
        s0 < __now__.
        evil-country(c).
        beautiful-country(b).
        country(c).
        country(b).
        travel-to(s0, c).
        travel-from(s0, b).
        travel(s0, a).
      `);
  });
  
  it.skip("Every nation is a stable community of some peoples with a common language.", () => {
    // Things I'd expect I'd be able to write:
    //   - a stable community of peoples (probably need generics)
    //   - some peoples with a common language, territory, history, ethnicity or culture.
    //   - A nation is more overtly political than an ethnic group (needs comparatives)
    //   - Some nations are ethnic groups. // possibly missing groups from the lexicon
    //                                        or possibly it needs generics.
    //   - Every nation is a cultural and political community.
    //   - "aware of its autonomy"
    // 
    assertThat(`
      Every nation is a stable community of some peoples with a common language.
      Every nation is political.
      Some nations are ethnic.
      Some nations are not ethnic.
      Every nation is a cultural community which is aware of the autonomy.
    `).equalsTo(`
       for (let every a: nation(a)) {
         a = d.
         common-language(c).
         language(b).
         community(c).
         stable-community(c).
         stable-community-with(c, b).
         stable-community-of(c, ).
       }
       for (let every d: nation(d)) {
         political(d).
       }
       for (let some e: nation(e)) {
         ethnic(e).
       }
       for (let some f: nation(f)) {
         not (
           ethnic(f).
         ).
       }
       for (let every g: nation(g)) {
         g = i.
         cultural-community(i).
         community(i).
         autonomy(h).
         aware(i).
         cultural-community-of(i, h).
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
        const {dict} = require("../src/large.js");

        let drs = new DRS(Rules.from());
        let parser = new Parser("Discourse", dict);
        parser.load(dict);
        let sentences = parser.feed(x);
        // console.log(JSON.stringify(sentences, undefined, 2));
        drs.feed(sentences);
        Assert.deepEqual(this.trim(drs.print(".\n", false)), this.trim(y));
      }
    }
  }
});

