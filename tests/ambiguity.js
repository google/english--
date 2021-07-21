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

const {dict} = require("../src/dict.js");

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

  it.skip("Sam made a reservation for a woman with a porsche.", () => {
    let parser = new Parser("Sentence", dict);
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
    // Because walked can be transitive and intransitive, this VP_
    // can either be one with a GAP or one without.
    assertThat(new Parser("VP_", dict).feed("have walked").length).equalsTo(2);
    assertThat(new Parser("Statement", dict).feed("They have walked.").length).equalsTo(1);
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
    assertThat(new Parser("Discourse", dict).feed("He likes Brazil.").length).equalsTo(1);
    assertThat(new Parser("Discourse", dict).feed("Jones is Brian's brother.He likes Brazil.").length).equalsTo(1);
    assertThat(new Parser("Discourse", dict).feed("Jones is Brian's brother. He likes Brazil.").length).equalsTo(1);
  });
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
