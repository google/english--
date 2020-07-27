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

describe.skip("Paraphrase", function() {

  it("Mel loves a woman who likes Leo. She loves Anna. She loves Anna's brother.", function() {
    let ids = new Ids();
    let drs = DRS.from();
    drs.feed("Mel loves a woman who likes Leo.");
    drs.feed("She loves Anna.");
    drs.feed("She loves Anna's brother.");

    assertThat(drs.head.length).equalsTo(5);
    assertThat(drs.head[0].value)
     .equalsTo("Mel");
    assertThat(drs.head[1].value)
     .equalsTo("Leo");
    assertThat(drs.head[2].value)
      .equalsTo("a woman who likes Leo");
    assertThat(drs.head[3].value)
      .equalsTo("Anna");
    assertThat(drs.head[4].value)
      .equalsTo("Anna 's brother");
  });

  function assertThat(x) { 
  return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});