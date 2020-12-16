const Assert = require("assert");
const {child} = require("../../src/drt/base.js");

const {
  Nearley, 
  bind, 
  FeaturedNearley, 
  Parser, 
  nodes,
  DrtSyntax} = require("../../src/drt/parser.js");

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
  it("Sam walks.", () => {
    let parser = new Parser("Sentence");
    let results = parser.feed("Sam walks.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam loves Dani.", () => {
    assertThat(new Parser("NP").feed("Sam").length).equalsTo(1);
    assertThat(new Parser("NP").feed("Dani").length).equalsTo(1);
    assertThat(new Parser("Statement").feed("Sam loves.").length).equalsTo(1);
    assertThat(new Parser("Statement").feed("Sam loves Dani.").length)
      .equalsTo(1);
  });

  it("Sam made a reservation for Cascal for Dani.", () => {
    let parser = new Parser("Sentence");
    let results = parser.feed("Sam made a reservation for Cascal for Dani.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam travelled from Brazil to Japan.", () => {
    let parser = new Parser("Sentence");
    let results = parser.feed("Sam travelled from Brazil to Japan.");
    assertThat(results.length).equalsTo(1);
  });

  it("Sam made a reservation for Cascal for Dani.", () => {
    let parser = new Parser("Sentence");
    let results = parser.feed("Sam made a reservation for Cascal for Dani.");

    assertThat(results.length).equalsTo(1);
  });

  it("Sam made a reservation for a woman with a porsche.", () => {
    let parser = new Parser("Sentence");
    let results = parser.feed("Sam made a reservation for a woman with a porsche.");
    // The following are the two interpretations:
    // - Sam made a reservation for [a woman] with a porsche.
    // - Sam made a reservation for [a woman with a porsche].
    assertThat(results.length).equalsTo(2);
    assertThat(clear(results[0]))
      .equalsTo(Sentence(Statement(S_(
        S(NP(PN("Sam")),
          VP_(VP(V(VERB("made")),
                 NP(DET("a"),
                    N("reservation"),
                    PP([
                      [PREP("for"), NP(DET("a"), N("woman"))],
                      [PREP("with"), NP(DET("a"), N("porsche"))]
                    ])))))), ".")));
    
    assertThat(clear(results[1]))
      .equalsTo(Sentence(Statement(S_(
        S(NP(PN("Sam")),
          VP_(VP(V(VERB("made")),
                 NP(DET("a"),
                    N("reservation"),
                    PP([
                      [PREP("for"),
                       NP(DET("a"),
                          N("woman"),
                          PP([
                            [PREP("with"), NP(DET("a"), N("porsche"))]
                          ]))],
                    ])))))), ".")));
  });

  it("They have walked.", () => {
    assertThat(new Parser("VP_").feed("have walked").length).equalsTo(1);
    assertThat(new Parser("Statement").feed("They have walked.").length).equalsTo(1);
    // console.log(new Parser("VP_").feed("have walked"));
  });

// they have walked.
// jones did not walk.
// were they happy?
// was Mary happy?
// who did they like?
// they left Brazil.
// they have not walked.
// they have walked.
// jones did not walk.
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
