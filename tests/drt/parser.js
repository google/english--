const Assert = require("assert");

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
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP,
 Discourse, Sentence
} = nodes;

describe("Parser", function() {

  it("errors", function() {
    assertThat("foo").failsAt(0, "f");
    assertThat("A stockbroker who do not love her surprises him.").failsAt(20, " ");
  });

  it("discourse", function() {
    assertThat(clean(parse("Anna loves John. John loves Anna. A man loves her.", "Discourse")[0]))
     .equalsTo(Discourse(Sentence(S(NP(PN("Anna")),
                                    VP_(VP(V("loves"), NP(PN("John")))))
                                  ),
                         Sentence(S(NP(PN("John")),
                                    VP_(VP(V("loves"), NP(PN("Anna")))))
                                  ),
                         Sentence(S(NP(DET("A"), N("man")),
                                    VP_(VP(V("loves"), NP(PRO("her")))))
                                  )
                         ));
   });

  it.skip("extensible proper names", function() {
    assertThat(first(parse("Sam loves her.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("Sam loves Dani.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani")))))));
    assertThat(first(parse("Sam and Dani love Anna and Leo.")))
     .equalsTo(S(NP_(NP(PN("Sam")), "and", NP(PN("Dani"))),
                 VP_(VP(V("love"), 
                        NP_(NP(PN("Anna")), "and", NP(PN("Leo")))
                        ))));
    assertThat(first(parse("Sam Goto loves Dani Fonsechi.")))
     .equalsTo(S(NP_(NP(PN("Sam Goto"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani Fonsechi")))))));
  });

  it("autocomplete", function() {
   //const parser = new Parser(ParserRules, ParserStart, {
   //  keepHistory: true
   // });
   //parser.feed("");
   // console.log(parser.table[0].states);
   // for (let row of parser.table) {
   //  console.log(row.wants);
   // }
  });

  it("ambiguities", function() {
     assertThat(parse("Foo loves Bar.").length).equalsTo(1);
     // TODO(goto): investigate why there are 6 possible interpretations.
     // This is possibly related to the expansions of gender / number.
     assertThat(parse("Foo loves a man.", "Sentence").length).equalsTo(1);
     assertThat(parse("A man loves Bar.", "Sentence").length).equalsTo(1);
     assertThat(parse("Foo loves a book.", "Sentence").length).equalsTo(1);
     assertThat(parse("Foo loves a book and Bar.", "Sentence").length).equalsTo(1);
     assertThat(parse("Foo and Bar love Hello and World.", "Sentence").length).equalsTo(1);
     // console.log(JSON.stringify(parse("Mel and Dani like Brazil.", "Sentence")[1], undefined, 2));
     //assertThat(parse("Mel and Dani like Brazil.", "Sentence").length).equalsTo(1);
     //assertThat(parse("Yuji and Mel like Dani.", "Sentence").length).equalsTo(1);
     //assertThat(parse("Anna loves a man who loves her.", "Sentence").length).equalsTo(6);
   });

  it("debug", function() {
    parse("Anna loves a man who loves her.");
    parse("Every book which she loves surprises him.");
    parse("A stockbroker who does not love her surprises him.");
    parse("A stockbroker who Mel likes loves him.");
  });

  it("Jones loves.", function() {
    assertThat(first(parse("Jones loves.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves")))));
  });

  it("Mary loves", function() {
    assertThat(first(parse("Mary loves.")))
     .equalsTo(S(NP(PN("Mary")),
                 VP_(VP(V("loves")))));
  });

  it("Anna loves.", function() {
    assertThat(first(parse("Anna loves.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves")))));
  });

  it("John stinks", function() {
    assertThat(first(parse("John stinks.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("stinks")))));
  });

  it("a man loves", function() {
    assertThat(first(parse("a man loves.")))
     .equalsTo(S(NP(DET("a"), N("man")),
                 VP_(VP(V("loves")))));
  });

  it("every donkey stinks", function() {
    assertThat(first(parse("every donkey stinks.")))
     .equalsTo(S(NP(DET("every"), N("donkey")),
                 VP_(VP(V("stinks")))));
  });

  it("the woman loves.", function() {
    assertThat(first(parse("the woman loves.")))
     .equalsTo(S(NP(DET("the"), N("woman")),
                 VP_(VP(V("loves")))));
  });

  it("he loves", function() {
    assertThat(first(parse("he loves.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves")))));
  });

  it("she loves", function() {
    assertThat(first(parse("she loves.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves")))));
  });

  it("it stinks.", function() {
    assertThat(first(parse("it stinks.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(VP(V("stinks")))));
  });

  it("it does not stink.", function() {
    assertThat(first(parse("it does not stink.")))
     .equalsTo(S(NP(PRO("it")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
  });

  it("the book does not stink.", function() {
    assertThat(first(parse("the book does not stink.")))
     .equalsTo(S(NP(DET("the"), N("book")),
                 VP_(AUX("does"), "not", VP(V("stink")))));
  });

  it("he loves her.", function() {
    assertThat(first(parse("he loves her.")))
     .equalsTo(S(NP(PRO("he")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("she loves the book", function() {
    assertThat(first(parse("she loves the book.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(VP(V("loves"), NP(DET("the"), N("book"))))));
  });

  it("every man loves her.", function() {
    assertThat(first(parse("every man loves her.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("every man loves John.", function() {
    assertThat(first(parse("every man loves John.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), NP(PN("John"))))));
  });

  it("shes does not love.", function() {
    assertThat(first(parse("she does not love.")))
     .equalsTo(S(NP(PRO("she")),
                 VP_(AUX("does"), "not", VP(V("love")))));
  });

  it("she does not love him.", function() {
    assertThat(first(parse("she does not love him.")))
     .equalsTo(S(NP(PRO("she")),
                  VP_(AUX("does"), "not", 
                      VP(V("love"), NP(PRO("him"))))));
  });

  it("John does not like the book.", function() {
    assertThat(first(parse("John does not like the book.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(AUX("does"), "not", 
                     VP(V("like"), NP(DET("the"), N("book"))))));
  });

  it("they love him", function() {
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(first(parse("they love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), NP(PRO("him"))))));
  });

  it("they do not love him", function() {
    assertThat(first(parse("they do not love him.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", VP(V("love"), NP(PRO("him"))))
                 ));
  });

  it("they do not love the book", function() {
    assertThat(first(parse("they do not love the book.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(AUX("do"), "not", 
                     VP(V("love"), NP(DET("the"), N("book"))))
                 ));
  });

  it("he and she love her.", function() {
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    // return;
    assertThat(first(parse("he and she love her.")))
     .equalsTo(S(NP(NP(PRO("he")), "and", NP(PRO("she"))),
                 VP_(VP(V("love"), NP(PRO("her"))))));
  });

  it("they love him and her.", function() {
    assertThat(first(parse("they love him and her.")))
     .equalsTo(S(NP(PRO("they")),
                 VP_(VP(V("love"), 
                        NP(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
  });

  it("every man loves a book and a woman.", function() {
    assertThat(first(parse("every man loves a book and a woman.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                 VP_(VP(V("loves"), 
                        NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
  });

  it("Brazil loves her.", function() {
    assertThat(first(parse("Brazil loves her.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("Brazil loves Italy.", function() {
    assertThat(first(parse("Brazil loves Italy.")))
     .equalsTo(S(NP(PN("Brazil")),
                 VP_(VP(V("loves"), NP(PN("Italy"))))));
  });

  it("every man loves Italy and Brazil", function() {
    assertThat(first(parse("every man loves Italy and Brazil.")))
     .equalsTo(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), 
                           NP(NP(PN("Italy")), "and", NP(PN("Brazil")))
                           ))));
  });

  it("Anna loves a man who loves her.", function() {
    assertThat(first(parse("Anna loves a man who loves her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("man"), 
                             RC(RPRO("who"), 
                                S(NP(GAP()), VP_(VP(V("loves"), NP(PRO("her")))))
                                )))))));
  });

  it("Anna loves a book which surprises her", function() {
    // assertThat(first(parse("Anna loves a book which surprises her.")).length).equalsTo(12);
    assertThat(first(parse("Anna loves a book which surprises her.")))
     .equalsTo(S(NP(PN("Anna")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), 
                           N(N("book"), 
                             RC(RPRO("which"), 
                                S(NP(GAP()), VP_(VP(V("surprises"), NP(PRO("her")))))
                                )))))));
  });

  it("Every book which she loves surprises him.", function() {
    assertThat(first(parse("Every book which she loves surprises him.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("book"), RC(RPRO("which"), 
                                    S(NP(PRO("she")),
                                      VP_(VP(V("loves"), NP(GAP()))))
                                    ))),
                 VP_(VP(V("surprises"), NP(PRO("him")))
                     )));

  });

  it("Every man who knows her loves her.", function() {
    assertThat(first(parse("Every man who knows her loves her.")))
     .equalsTo(S(NP(DET("Every"), 
                    N(N("man"), RC(RPRO("who"), 
                                   S(NP(GAP()),
                                     VP_(VP(V("knows"), NP(PRO("her")))))
                                   ))),
                 VP_(VP(V("loves"), NP(PRO("her"))))
                 ));
  });

  it("A stockbroker who does not love her surprises him.", function() {
    assertThat(first(parse("A stockbroker who does not love her surprises him.")))
     .equalsTo(S(NP(DET("A"),
                    N(N("stockbroker"), RC(RPRO("who"), 
                                           S(NP(GAP()),
                                             VP_(AUX("does"), "not", VP(V("love"), NP(PRO("her")))))
                                           ))),
                 VP_(VP(V("surprises"), NP(PRO("him"))))
                 ));

  });

  it("He is happy.", function() {
    assertThat(first(parse("He is happy.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), ADJ("happy")))));
   });

  it("He is not happy.", function() {
    assertThat(first(parse("He is not happy.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(BE("is"), "not", ADJ("happy")))));
   });

  it("A porsche does not stink", function() {
    assertThat(first(parse("A porsche does not stink.")))
     .equalsTo(S(NP(DET("A"), N("porsche")),
                 VP_(AUX("does"), "not", 
                     VP(V("stink")))));
  });

  it("Jones loves a woman who does not admire him.", function() {
    assertThat(first(parse("Jones loves a woman who does not love him.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V("loves"),
                        NP(DET("a"), N(N("woman"), 
                                       RC(RPRO("who"), S(NP(GAP()), 
                                                         VP_(AUX("does"), "not", 
                                                             VP(V("love"), NP(PRO("him"))))
                                                         ))
                                       ))))
                 ));
  });

  it("If Jones owns a book then he likes it.", function() {
    assertThat(first(parse("If Jones owns a book then he likes it.")))
     .equalsTo(S("If", 
                 S(NP(PN("Jones")), VP_(VP(V("owns"), NP(DET("a"), N("book"))))), 
                 "then", 
                 S(NP(PRO("he")), VP_(VP(V("likes"), NP(PRO("it")))))));
  });

  it("every man who owns a book likes it.", function() {
    assertThat(first(parse("every man who owns a book likes it.")))
     .equalsTo(S(NP(DET("every"), N(N("man"), RC(RPRO("who"), 
                                                 S(NP(GAP()), VP_(VP(V("owns"), NP(DET("a"), N("book")))))))), 
                 VP_(VP(V("likes"), NP(PRO("it"))))));
  });

  it("Jones loves her or Smith loves her.", function() {
    assertThat(first(parse("Jones loves her or Smith loves her.")))
     .equalsTo(S(S(NP(PN("Jones")), VP_(VP(V("loves"), NP(PRO("her"))))), 
                 "or", 
                 S(NP(PN("Smith")), VP_(VP(V("loves"), NP(PRO("her")))))));
   });

  it("Mary loves Jones or likes Smith.", function() {
    assertThat(first(parse("Mary loves Jones or likes Smith.")))
     .equalsTo(S(NP(PN("Mary")), 
                 VP_(VP(VP(V("loves"), NP(PN("Jones"))), 
                        "or", 
                        VP(V("likes"), NP(PN("Smith")))))));
   });

  it("Jones or Smith loves her.", function() {
    assertThat(first(parse("Jones or Smith loves her.")))
     .equalsTo(S(NP(NP(PN("Jones")), "or", NP(PN("Smith"))),
                 VP_(VP(V("loves"), NP(PRO("her"))))));
  });

  it("Jones owns and loves a porsche.", function() {
    assertThat(first(parse("Jones owns and loves a porsche.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(V(V("owns"), "and", V("loves")), NP(DET("a"), N("porsche"))))));
  });

  it("Mary likes Smith and she loves him.", function() {
    assertThat(first(parse("Mary likes Smith and she loves him.")))
     .equalsTo(S(S(NP(PN("Mary")), VP_(VP(V("likes"), NP(PN("Smith"))))), 
                 "and", 
                 S(NP(PRO("she")), VP_(VP(V("loves"), NP(PRO("him")))))));
  });

  it("Jones's wife is happy.", function() {
    assertThat(first(parse("Jones's wife is happy.")))
     .equalsTo(S(NP(DET(PN("Jones"), "'s"), RN("wife")),
                 VP_(VP(BE("is"), ADJ("happy")))));
  });

  it("Jones owns an unhappy donkey.", function() {
    assertThat(first(parse("Jones owns an unhappy donkey.")))
     .equalsTo(S(NP(PN("Jones")), VP_(VP(V("owns"), NP(DET("an"), N(ADJ("unhappy"), N("donkey")))))));
  });

  it("Jones likes a woman with a donkey.", function() {
    assertThat(first(parse("Jones likes a woman with a donkey.")))
     .equalsTo(S(NP(PN("Jones")), 
                 VP_(VP(V("likes"), 
                        NP(DET("a"), N(N("woman"), 
                                       PP(PREP("with"), NP(DET("a"), N("donkey"))
                                          )))))));
  });

  it("Jones is a man.", function() {
    assertThat(first(parse("Jones is a man.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N("man"))))));
  });

  it("Who likes Mary?", function() {
    assertThat(clean(parse("Who likes Mary?")[0]))
     .equalsTo(Sentence("Who", 
                        NP(GAP()), 
                        VP_(VP(V("likes"), NP(PN("Mary")))), 
                        "?"));
  });

  it("Who is happy?", function() {
    assertThat(clean(parse("Who is happy?")[0]))
     .equalsTo(Sentence("Who", 
                        NP(GAP()), 
                        VP_(VP(BE("is"), ADJ("happy"))), 
                        "?"));
  });

  it("Who does Mary like?", function() {
    assertThat(clean(parse("Who does Mary like?")[0]))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(PN("Mary")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Who does the man like?", function() {
    assertThat(clean(parse("Who does the man like?")[0]))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET("the"), N("man")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Who does Smith's brother like?", function() {
    assertThat(clean(parse("Who does Smith's brother like?")[0]))
     .equalsTo(Sentence("Who", 
                        AUX("does"),
                        NP(DET(PN("Smith"), "'s"), RN("brother")), 
                        VP(V("like"), NP(GAP())), 
                        "?"));
  });

  it("Is Mary happy?", function() {
    assertThat(clean(parse("Is Mary happy?")[0]))
     .equalsTo(Sentence("Is", 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it.skip("Sam's wife is Dani", function() {
    assertThat(clean(parse("Sam's wife is Dani")[0]))
     .equalsTo(Sentence("Is", 
                        NP(PN("Mary")), 
                        ADJ("happy"), 
                        "?"));
  });

  it("John is a happy man", function() {
    assertThat(first(parse("Jones is a happy man.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), NP(DET("a"), N(ADJ("happy"), N("man")))))));
  });

  it("Sam loves Anna and Leo.", function() {
    assertThat(first(parse("Sam loves Anna and Leo.")))
     .equalsTo(S(NP(PN("Sam")),
                 VP_(VP(V("loves"), 
                        NP(NP(PN("Anna")), "and", NP(PN("Leo")))
                        ))));
  });

  it("John is from Brazil", function() {
    assertThat(first(parse("Jones is from Brazil.")))
     .equalsTo(S(NP(PN("Jones")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it("Every brazilian is from Brazil", function() {
    assertThat(first(parse("Every brazilian is from Brazil.")))
     .equalsTo(S(NP(DET("Every"), N("brazilian")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it.skip("If A is B's parent then B is A's child.", function() {
    assertThat(first(parse("If A is B's parent then B is A's child.")))
     .equalsTo(S(NP(DET("Every"), N("brazilian")),
                 VP_(VP(BE("is"), PP(PREP("from"), NP(PN("Brazil")))
                        ))));
  });

  it("He loves it.", function() {
    assertThat(first(parse("He loves It.")))
     .equalsTo(S(NP(PRO("He")),
                 VP_(VP(V("loves"), NP(PRO("It"))))));
  });

  it("John loves himself.", function() {
    assertThat(first(parse("John loves himself.")))
     .equalsTo(S(NP(PN("John")),
                 VP_(VP(V("loves"), NP(PRO("himself"))))));
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    },
    failsAt(offset, token) {
     try {
      parse(x);
      throw Error("expected failure");
     } catch (e) {
      // console.log(e);
      assertThat(e.offset).equalsTo(offset);
      assertThat(e.token.value).equalsTo(token);
     }
    }
   }
  }

});

