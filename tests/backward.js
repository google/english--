const Assert = require("assert");
const {normalize, stringify, equals, explain, toString} = require("../forward.js");
const {Parser, Rule} = require("../parser.js");
const {Backward} = require("../backward.js");

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

describe("Backward", function() {
    
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
    let code = Parser.parse(`
      a || b.
      ~a.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("b?"))))
     .equalsTo(`
      ~a.
      a || b && ~a => b.
    `);
   });

  it("a || b, ~b |= a?", function() {
    let code = Parser.parse(`
      a || b.
      ~b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a?"))))
     .equalsTo(`
      ~b.
      a || b && ~b => a.
    `);
   });

  it("a |= a || b?", function() {
    let code = Parser.parse(`
      a.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a || b?"))))
     .equalsTo(`a. a => a || b.`);
   });

  it("a |= b || a?", function() {
    let code = Parser.parse(`
      a.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("b || a?"))))
     .equalsTo(`a. a => b || a.`);
   });

  it("a && b |= a?", function() {
    let code = Parser.parse(`
      a && b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a."))))
     .equalsTo(`a && b => a.`);
   });

  it("b && a |= a?", function() {
    let code = Parser.parse(`
      b && a.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a."))))
     .equalsTo(`b && a => a.`);
   });

  it("a, b |= a && b?", function() {
    let code = Parser.parse(`
      a.
      b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a && b?"))))
     .equalsTo(`
      a.
      b.
      a && b => a && b.`);
   });

  it("a => b, b => c |= a => c?", function() {
    let code = Parser.parse(`
      a => b.
      b => c.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a => c?"))))
     .equalsTo(`((a => b) && (b => c)) => (a => c).`);
   });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    let code = Parser.parse(`
      a => c.
      b => d.
      a || b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("c || d?"))))
     .equalsTo(`if ((a => c) and (b => d) and (a || b)) then c || d.`);
   });

  it("a => b |= a => (a && b)", function() {
    let code = Parser.parse(`
      a => b.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a => (a && b)?"))))
     .equalsTo(`if (a => b) then a => a && b.`);
   });

  it("criminal?", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = Parser.parse(`
      cat_fur || dog_fur.
      dog_fur => thompson_allergy.
      cat_fur => macavity_criminal.
      ~thompson_allergy.
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("macavity_criminal?"))))
     .equalsTo(`
      ~thompson_allergy.
      if (dog_fur => thompson_allergy and ~thompson_allergy) then ~dog_fur.
      if (cat_fur || dog_fur and ~dog_fur) then cat_fur.
      if (cat_fur => macavity_criminal and cat_fur) then macavity_criminal.
      `);

   });

  it("brake?", function() {
    // http://www.cs.cornell.edu/courses/cs472/2005fa/lectures/15-kb-systems_part3_6up.pdf
    let kb = Parser.parse(`
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
    `);

    // Can we infer "Brake"?
    assertThat(explain(new Backward(kb).backward(Rule.of("Brake?"))))
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
    let kb = Parser.parse(`
      p => q.
      (l && m) => p.
      (b && l) => m.
      (a && p) => l.
      (a && b) => l.
      a.
      b.
    `);

    // console.log(kb);
    // return;

    // Can we infer "Brake"?
    assertThat(explain(new Backward(kb).backward(Rule.of("q?"))))
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
       let explanation = Parser.parse(explain(result));       
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

