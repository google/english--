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

  it("father with a book by a woman", () => {
    const {dict} = require("./dict.js");
    assertThat(
      new Parser("N_", dict).feed("father with a book").length
    ).equalsTo(1);
    assertThat(
      new Parser("N_", dict).feed("father").length
    ).equalsTo(1);
    assertThat(
      new Parser("N_", dict).feed("father with a book by a woman").length
    ).equalsTo(1);
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
    assertThat(new Parser("NP", dict).feed("Sam").length).equalsTo(1);
    assertThat(new Parser("NP", dict).feed("Dani").length).equalsTo(1);
    assertThat(new Parser("Statement", dict).feed("Sam loves.").length).equalsTo(1);
    assertThat(new Parser("Statement", dict).feed("Sam loves Dani.").length)
      .equalsTo(1);
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

    // [happy woman [that likes Sam] near Jones]
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


});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
