const Assert = require("assert");
const {normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
const {Backward} = require("../src/backward.js");

const {
 program, 
 forall, 
 exists, 
 implies, 
 predicate, 
 binary, 
 literal, 
 constant, 
 and, 
 or, 
 negation} = Parser;

describe("Backward chaining", function() {
    
  it("a => b, a |= b?", function() {
    assertThat(`
      a => b.
      a.
    `)
     .proving("b?")
     .equalsTo(`
      a.
      if (a => b && a) then b.
    `);
   });

  it("a => b, ~b |= ~a?", function() {
    assertThat(`
      a => b.
      ~b.
    `)
     .proving("~a?")
     .equalsTo(`
      ~b.
      a => b && ~b => ~a.
    `);
   });

  it("a || b, ~a |= b?", function() {
    assertThat(`
      a || b.
      ~a.
    `)
    .proving("b?")
    .equalsTo(`
      ~a.
      a || b && ~a => b.
    `);
   });

  it("a || b, ~b |= a?", function() {
    assertThat(`
      a || b.
      ~b.
    `)
     .proving("a?")
     .equalsTo(`
      ~b.
      a || b && ~b => a.
    `);
   });

  it("a |= a || b?", function() {
    assertThat(`
      a.
    `)
    .proving("a || b?")
    .equalsTo(`a. a => a || b.`);
   });

  it("a |= b || a?", function() {
    assertThat(`
      a.
    `)
    .proving("b || a?")
    .equalsTo(`a. a => b || a.`);
   });

  it("a && b |= a?", function() {
    assertThat(`
      a && b.
    `)
     .proving("a.")
     .equalsTo(`a && b => a.`);
   });

  it("b && a |= a?", function() {
    assertThat(`
      b && a.
    `)
     .proving("a.")
     .equalsTo(`b && a => a.`);
   });

  it("a, b |= a && b?", function() {
    assertThat(`
      a.
      b.
    `)
    .proving("a && b?")
    .equalsTo(`
      a.
      b.
      a && b => a && b.`);
   });

  it("a => b, b => c |= a => c?", function() {
    assertThat("a => b. b => c.")
     .proving("a => c?")
     .equalsTo("((a => b) && (b => c)) => (a => c).");
   });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    assertThat(`
      a => c.
      b => d.
      a || b.
    `)
     .proving("c || d?")
     .equalsTo(`if ((a => c) and (b => d) and (a || b)) then c || d.`);
   });

  it("a => b |= a => (a && b)", function() {
    assertThat(`
      a => b.
    `)
     .proving("a => (a && b)?")
     .equalsTo(`if (a => b) then a => a && b.`);
   });

  it.skip("a => b && c. a. |= b?", function() {
    // This should probably be derived.
    assertThat(`
      a => b && c.
      a.
    `)
     .proving("b?")
     .equalsTo(`false.`);
   });

  it.skip("a => b || c. a. ~b. |= c.", function() {
    // This is logically correct.
    let code = Parser.parse(`
      a => b || c.
      a.
      ~b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("c?"))))
     .equalsTo("");
   });

  it.skip("a => b && c |= a => c", function() {
    // TODO(goto): this should probably be possible. figure out how
    // to address this.
    let code = Parser.parse(`
      a => b && c.
      a.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("c?"))))
     .equalsTo(``);
   });

  it("criminal?", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    assertThat(`
      cat_fur || dog_fur.
      dog_fur => thompson_allergy.
      cat_fur => macavity_criminal.
      ~thompson_allergy.
    `)
     .proving("macavity_criminal?")
     .equalsTo(`
      ~thompson_allergy.
      if (dog_fur => thompson_allergy and ~thompson_allergy) then ~dog_fur.
      if (cat_fur || dog_fur and ~dog_fur) then cat_fur.
      if (cat_fur => macavity_criminal and cat_fur) then macavity_criminal.
      `);

   });

  it("brake?", function() {
    // http://www.cs.cornell.edu/courses/cs472/2005fa/lectures/15-kb-systems_part3_6up.pdf
    assertThat(`
     PersonInFrontOfCar => Brake.
     (YellowLight && Policeman && ~Slippery) => Brake.
     Policecar => Policeman.
     Snow => Slippery.
     Slippery => ~Dry.
     RedLight => Brake.
     Winter => Snow.
     YellowLight.
     ~RedLight.
     ~Snow.
     Dry.
     Policecar.
     ~PersonInFrontOfCar.
    `)
     .proving("Brake?")
     .equalsTo(`
      Policecar.
      if (Policecar => Policeman && Policecar) then Policeman.
      YellowLight.
      Dry.
      if (Slippery => ~Dry and ~~Dry) then ~Slippery.
      if (YellowLight and ~Slippery) then YellowLight and ~Slippery.
      if (Policeman && YellowLight && ~Slippery) then Policeman && YellowLight && ~Slippery.
      if (Policeman && ~Slippery && (YellowLight => Brake) && Policeman && ~Slippery && YellowLight) then Brake.
      `);

  });

  // TODO(goto): check if a && b => c has the precedence there

  it("q?", function() {
    // http://pages.cs.wisc.edu/~bgibson/cs540/handouts/pl.pdf
    // TODO(goto): 
    assertThat(`
      p => q.
      (l && m) => p.
      (b && l) => m.
      (a && p) => l.
      (a && b) => l.
      a.
      b.
    `)
     .proving("q?")
     .equalsTo(`
      a.
      b.
      if a && b then a && b.
      if ((a && b => l) and (a && b)) then l.
      b.
      l.
      if b and l then b and l.
      if ((b && l) => m && (b && l)) then m.
      if l && m then l && m.
      if ((l && m) => p && (l && m)) then p.
      if (p => q && p) then q.`);
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
      // console.log(x);
      let given = Parser.parse(x);
      // console.log(y);
      let expected = Parser.parse(y);
      Assert.deepEqual(toString(expected), toString(given));
    },
    proving(y) {
     return {
      equalsTo(z) {
       // console.log(x);
       // console.log(`[${x}]`);
       let kb = Parser.parse(x);
       let result = new Backward(kb).backward(Rule.of(y));
       // console.log(explain(result));
       // console.log(result);
       let explanation = Parser.parse(result.toString());
       // console.log(explanation);
       // console.log(z);
       let expected = Parser.parse(z);
       // console.log(expected);
       assertThat(toString(expected)).equalsTo(toString(explanation));
      }
     }
    }
   }
  }

});

