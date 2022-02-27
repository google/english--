const Assert = require("assert");
const {child} = require("../src/base.js");

const {
  Nearley, 
  bind, 
  FeaturedNearley, 
  Parser, 
  nodes,
  DrtSyntax} = require("../src/parser.js");

const {
  Sentence,
  Statement,
  Question,
  S,
  S_,
  NP,
  PN,
  VP_,
  VP,
  V,
  AUX,
  PRO,
  DET,
  N,
  N_,
  RC,
  RPRO,
  GAP,
  BE,
  ADJ,
  PREP,
  PP,
  VERB,
  HAVE,
  RN} = nodes;

const {dict} = require("../src/large.js");

function clear(root) {
  if (!root) {
    return;
  }
  if (Array.isArray(root)) {
    root.forEach(x => clear(x));
    return;
  }
  delete root.types;
  delete root.loc;
  delete root.prop;
  for (let i = 0; i < (root.children || []).length; i++) {
    let child = root.children[i];
    if (child["value"]) {
      root.children[i] = child.value;
      continue;
    }
    clear(child);
  }
  
  //for (let child of root.children || []) {
  //  clear(child);
  //}
  return root;
}

describe("Ambiguity", () => {

  it("father", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("father").length
    ).equalsTo(1);
  });
  
  it("father with a book", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("father with a book").length
    ).equalsTo(1);
  });
  
  it("father with a book by a woman", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("father with a book by a woman").length
    ).equalsTo(1);
  });
  
  it("father with Cascal", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("father with Cascal").length
    ).equalsTo(1);
  });

  it("reservation for Cascal for Dani", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("reservation for Cascal for Dani").length
    ).equalsTo(1);
  });
  
  it("a reservation for Cascal for Dani", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a reservation for Cascal for Dani").length
    ).equalsTo(1);
  });

  it("reservation", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a reservation").length
    ).equalsTo(1);

    assertThat(
      clear(new Parser("NP", dict).feed("a reservation")[0])
    ).equalsTo(
      NP(DET("a"), N_(N("reservation")))
    );

    //assertThat(
    //  clear(new Parser("NP", dict).feed("a reservation")[1])
    //).equalsTo(
    //  NP(DET("a"), N_(N("reservation")))
    //);
  });
  
  it("Brian's reservation", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Brian's reservation").length
    ).equalsTo(1);
    
    assertThat(
      clear(new Parser("NP", dict).feed("Brian's reservation")[0])
    ).equalsTo(
      NP(DET(NP(PN("Brian")), "'s"), N_(N("reservation")))
    );

    //assertThat(
    //  clear(new Parser("NP", dict).feed("Brian's reservation")[1])
    //).equalsTo(
    //  NP(DET(NP(PN("Brian")), "'s"), N_(N("reservation")))
    //);


  });

  it("a reservation", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a reservation").length
    ).equalsTo(1);
    
    assertThat(
      clear(new Parser("NP", dict).feed("a reservation")[0])
    ).equalsTo(
      NP(DET("a"), N_(N("reservation")))
    );

    //assertThat(
    //  clear(new Parser("NP", dict).feed("Brian's reservation")[1])
    //).equalsTo(
    //  NP(DET(NP(PN("Brian")), "'s"), N_(N("reservation")))
    //);


  });

  it("a reservation which loves", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a reservation which loves").length
    ).equalsTo(1);
    
    assertThat(
      clear(new Parser("NP", dict).feed("a reservation which loves")[0])
    ).equalsTo(
      NP(DET("a"), N_(N_(N("reservation")),
                      RC(RPRO("which"),
                         S(NP(GAP()), VP_(VP(V("loves"))))
                        )))
    );
  });

  it("father with a book by a woman", () => {
    const {dict} = require("./dict.js");

    assertThat(
      clear(new Parser("N_", dict).feed("father with a book by a woman")[0])
    ).equalsTo(
      N_(
        N_(
          N_(N("father")),
          PP(PREP("with"), NP(DET("a"), N_(N("book"))))
        ),
        PP(PREP("by"), NP(DET("a"), N_(N("woman"))))
      )
    );

    return;
    
    // another possible interpretation:
    assertThat(
      clear(new Parser("N_", dict).feed("father with a book by a woman")[0])
    ).equalsTo(
      N_(
        N("father"),
        PP(PREP("with"), NP(DET("a"), N_(
          N("book"),
          PP(PREP("by"), NP(DET("a"), N_(
            N("woman")
          )))
        )))
      )
    );
  });
  
  it("Sam walks.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam walks.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam loves Dani.", () => {
    assertThat(new Parser("NP", dict).feed("Dani").length).equalsTo(1);
    assertThat(new Parser("Statement", dict).feed("Sam loves.").length).equalsTo(1);
    assertThat(new Parser("Statement", dict).feed("Sam loves Dani.").length)
      .equalsTo(1);
  });

  it("[Sam]", () => {
    assertThat(parse("[Sam]", "NP")).equalsTo(NP("[", NP(PN("Sam")), "]"));
  });

  it("[a man]", () => {
    assertThat(parse("[a man]", "NP")).equalsTo(NP("[", NP(DET("a"), N_(N("man"))), "]"));
  });

  it("[a man from Brazil]", () => {
    assertThat(parse("[a man from Brazil]", "NP")).equalsTo(NP("[", NP(DET("a"), N_(
      N_(N("man")),
      PP(PREP("from"), NP(PN("Brazil")))
    )), "]"));
  });

  it("with [a man from Brazil]", () => {
    assertThat(parse("with [a man from Brazil]", "PP"))
      .equalsTo(
        PP(
          PREP("with"),
          NP("[",
             NP(DET("a"), N_(
               N_(N("man")),
               PP(PREP("from"), NP(PN("Brazil")))
             )),
             "]")          
        )
    );
  });

  it("Sam made a reservation for Cascal for Dani.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam made a reservation for Cascal for Dani.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam travelled from Brazil to Italy.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam travelled from Brazil to Japan.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam made a reservation for Cascal for Dani.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam made a reservation for Cascal for Dani.");

    assertThat(results.length).equalsTo(1);
  });

  it("Sam travelled from a beautifil country to an evil country.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam travelled from a beautiful country to an evil country.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam made a reservation for a woman with a porsche.", () => {
    let parser = new Parser("Sentence", dict);
    let results = parser.feed("Sam made a reservation for a woman with a porsche.");
    // The following are the two interpretations:
    // - Sam made [a reservation for [a woman] with [a porsche]].
    // - Sam made [a reservation for [a woman with [a porsche]]].
    // It favors the former.
    assertThat(results.length).equalsTo(1);

    assertThat(clear(results[0]))
      .equalsTo(Sentence(Statement(S_(
        S(NP(PN("Sam")),
          VP_(VP(V("made"),
                 NP(DET("a"),
                    N_(
                      N_(
                        N_(N("reservation")),
                        PP(PREP("for"), NP(DET("a"), N_(N("woman"))))
                      ),
                      PP(PREP("with"), NP(DET("a"), N_(N("porsche"))))
                    )
                   ))))), ".")));
  });

  it("They have walked.", () => {
      // Because walked can be transitive and intransitive, this VP_
      // can either be one with a GAP or one without.
      assertThat(new Parser("VP_", dict).feed("have walked").length).equalsTo(2);

      // The statement, on the other hand, isn't ambiguous because the "." ends the
      // statement without a NP.
      assertThat(new Parser("Statement", dict).feed("They have walked.").length).equalsTo(1);
  });

  it("Sam loved.", () => {
      // Because love can be transitive and intransitive, this VP_
      // can either be one with a GAP or one without.
      assertThat(new Parser("VP_", dict).feed("loved").length).equalsTo(2);

      // The statement, on the other hand, isn't ambiguous because the "." ends the
      // statement without a NP.
      assertThat(new Parser("Statement", dict).feed("Sam loved.").length).equalsTo(1);
  });

  it("Jones did not walk.", () => {
    assertThat(new Parser("Statement", dict).feed("Jones did not walk.").length)
      .equalsTo(1);
  });

  it("Were they happy?", () => {
    assertThat(new Parser("Question", dict).feed("Were they happy?").length).equalsTo(1);
  });

  it("Jones is Brian's brother. he likes Brazil.", () => {
    assertThat(new Parser("Discourse", dict).feed("Jones is Brian's brother.").length).equalsTo(1);
    return;
    assertThat(
      clear(new Parser("Statement", dict).feed("Jones is Brian's brother.")[0])
    ).equalsTo(
      Statement(S_(S(NP(PN("Jones")), VP_(VP(BE("is"),
                                             NP(DET(NP(PN("Brian")), "'s"), N_(N("brother")))
                                            )))), ".")
    );

    assertThat(
      clear(new Parser("Statement", dict).feed("Jones is Brian's brother.")[1])
    ).equalsTo(
      Statement(S_(S(NP(PN("Jones")), VP_(VP(BE("is"),
                                             NP(DET(NP(PN("Brian")), "'s"), N("brother"))
                                            )))), ".")
    );
    return;
    // return;
    assertThat(new Parser("Discourse", dict).feed("He likes Brazil.").length).equalsTo(1);
    assertThat(new Parser("Discourse", dict).feed("Jones is Brian's brother.He likes Brazil.").length).equalsTo(1);
    assertThat(new Parser("Discourse", dict).feed("Jones is Brian's brother. He likes Brazil.").length).equalsTo(1);
  });

  it("happy woman that likes Sam near Jones.", function() {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("happy woman that likes Sam").length)
      .equalsTo(1);
    assertThat(
      new Parser("N_", dict).feed("happy woman that likes Sam near Jones").length)
      .equalsTo(1);

    // We favor the first interpretation:
    // [happy woman [that likes Sam] near Jones]

    // But these are valid interpretations too:
    // [happy woman [that likes [Sam near Jones]]]
    // happy [woman [that likes Sam] near Jones]
    // happy [woman [that likes Sam near Jones]]
    assertThat(
      clear(new Parser("N_", dict).feed("happy woman that likes Sam near Jones")[0]))
      .equalsTo(
        N_(
          N_(
            N_(ADJ("happy"), N_(N("woman"))),
            RC(RPRO("that"), S(NP(GAP()), VP_(VP(V("likes"), NP(PN("Sam"))))))
          ),
          PP(PREP("near"), NP(PN("Jones")))
        )
      );
    
  });

  it("Jones is a happy man who loves Mary.", function() {
    assertThat(
      new Parser("Statement", dict).feed("Jones is a happy man who loves Mary.").length)
      .equalsTo(1);

    // Jones is [a happy [man who loves Mary]].
    // Jones is [a happy man [who loves Mary]].

    // We favor the second, making the adjective bind quickly to the noun.
    
    //assertThat(
    //  clear(new Parser("Statement", dict).feed("Jones is a happy man who loves Mary.")[0])
    //).equalsTo(
    //  Statement(
    //    S_(S(NP(PN("Jones")),
    //         VP_(VP(BE("is"),
    //                NP(DET("a"), N_(ADJ("happy"),
    //                                N_(N_(N("man")),
    //                                   RC(RPRO("who"), S(NP(GAP()), VP_(VP(V("loves"), NP(PN("Mary"))))))
    //                                  )))
    //               )))), ".")
    //);

    assertThat(
      clear(new Parser("Statement", dict).feed("Jones is a happy man who loves Mary.")[0])
    ).equalsTo(
      Statement(
        S_(S(NP(PN("Jones")),
             VP_(VP(BE("is"),
                    NP(DET("a"), N_(
                      N_(ADJ("happy"), N_(N("man"))),
                      RC(RPRO("who"), S(NP(GAP()), VP_(VP(V("loves"), NP(PN("Mary"))))))
                    )))))), ".")
    );

  });

  it("happy father", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("happy father").length
    ).equalsTo(1);
  });
  
  it("happy foolish father", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("happy foolish father").length
    ).equalsTo(1);
  });

  it("happy foolish book by the unhappy woman from the beautiful person that loves", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("happy foolish book by the unhappy woman from the beautiful person that loves").length
    ).equalsTo(1);
  });

  it("beautiful book about Brazil", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("beautiful book about Brazil").length
    ).equalsTo(1);
  });

  it("Sam and Dani and Leo", () => {
    const {dict} = require("./dict.js");
    // You cannot have nesting from the AND connective
    assertThat(
      new Parser("NP", dict).feed("Sam and Dani and Leo").length
    ).equalsTo(0);
  });

  it("Sam and a book", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Sam and a book").length
    ).equalsTo(1);
  });

  it("a book", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a book").length
    ).equalsTo(1);
  });

  it("Sam", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Sam").length
    ).equalsTo(1);
  });

  it("a book and Sam", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("a book and Sam").length
    ).equalsTo(1);
  });

  it("him and Sam", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("him and Sam").length
    ).equalsTo(1);
  });

  it("him and her and Sam", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("him and her and Sam").length
    ).equalsTo(0);
  });

  it("him and her and Sam and a country", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("him and her and Sam and a country").length
    ).equalsTo(0);
  });

  it("Sam and Dani and Leo", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Sam and Dani and Leo").length
    ).equalsTo(0);
  });

  it("Sam, Dani and Leo", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Sam, Dani and Leo").length
    ).equalsTo(1);
  });

  it("either Sam or Dani", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("NP", dict).feed("Either Sam or Dani").length
    ).equalsTo(1);
  });

  it("either Sam and Anna or Dani", () => {
    const {dict} = require("./dict.js");
    // We disallow composite noun phrases inside the head of the either
    assertThat(
      new Parser("NP", dict).feed("Either Sam and Anna or Dani").length
    ).equalsTo(0);
  });

  it("either Sam or Dani and Anna", () => {
    const {dict} = require("./dict.js");
    // We disallow composite noun phrases inside the foot of the either
    // But this actually refers to an AND of NPs
    // We should disable ANDs of being composites too.
    assertThat(
      new Parser("NP", dict).feed("Either Sam or Dani and Anna").length
    ).equalsTo(0);
  });

  it("if Sam likes Anna then Anna likes Sam", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("S", dict).feed("if Sam likes Anna then Anna likes Sam").length
    ).equalsTo(1);
  });

  it("if if John likes Dani then Sam likes Anna then Anna likes Sam", () => {
    const {dict} = require("./dict.js");
    // We disallow if-then sentences to contain if-then sentences.
    assertThat(
      new Parser("S", dict).feed("if if John likes Dani then Sam likes Anna then Anna likes Sam").length
    ).equalsTo(0);
  });

  function parse(s, type = "Statement") {
    const result = new Parser(type, dict).feed(s);

    if (result.length > 1) {
      throw new Error("ambiguous");
    }


    // console.log(result);
    
    return clear(result[0]);
  }
  
  it("Mary travelled with a man from Brazil.", function() {
    // This phrase is ambiguous in that it can be either interpreted as:
    // Mary travelled with [a man from Brazil]. or
    // Mary travelled with [a man] from Brazil.
    // By default, the ambiguity is resolved in binding to the verb
    // rather than the noun.
    assertThat(parse("Mary travelled with a man from Brazil."))
      .equalsTo(Statement(S_(S(NP(PN("Mary")),
                               VP_(VP(
                                 V(
                                   V(
                                     V("travelled"),
                                     PP(PREP("with"), NP(DET("a"), N_(N("man"))))
                                   ),
                                   PP(PREP("from"), NP(PN("Brazil")))
                                 )
                               )))), "."));
  });

  it("Mary travelled with [a man from Brazil].", function() {
    assertThat(parse("Mary travelled with [a man from Brazil]."))
      .equalsTo(Statement(S_(S(NP(PN("Mary")),
                               VP_(VP(
                                 V(
                                   V("travelled"),
                                   PP(PREP("with"),
                                      NP("[",
                                         NP(DET("a"),
                                            N_(
                                              N_(N("man")),
                                              PP(PREP("from"), NP(PN("Brazil")))
                                            )),
                                         "]")
                                     )
                                 )
                               ))
                              ))
                          , "."));
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
