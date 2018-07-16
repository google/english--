const Assert = require("assert");
const {normalize, stringify, equals} = require("../forward.js");
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
      a => b
      a
    `)
     .proving("b")
     .equalsTo(`Take that a. 
If a => b and a then b. `);
   });

  it("a => b, ~b |= ~a?", function() {
    assertThat(`
      a => b
      ~b
    `)
     .proving("~a")
     .equalsTo(`Take that ~b. 
If a => b and ~b then ~a. `);
   });

  it("a || b, ~a |= b?", function() {
    let code = Parser.parse(`
      a || b
      ~a
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("b"))))
     .equalsTo(`Take that ~a. 
If a || b and ~a then b. `);
   });

  it("a || b, ~b |= a?", function() {
    let code = Parser.parse(`
      a || b
      ~b
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a"))))
     .equalsTo(`Take that ~b. 
If a || b and ~b then a. `);
   });

  it("a |= a || b?", function() {
    let code = Parser.parse(`
      a
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a || b"))))
     .equalsTo(`If a then a || b. `);
   });

  it("a |= b || a?", function() {
    let code = Parser.parse(`
      a
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("b || a"))))
     .equalsTo(`If a then b || a. `);
   });

  it("a && b |= a?", function() {
    let code = Parser.parse(`
      a && b
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a"))))
     .equalsTo(`If a && b then a. `);
   });

  it("b && a |= a?", function() {
    let code = Parser.parse(`
      b && a
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a"))))
     .equalsTo(`If b && a then a. `);
   });

  it("a, b |= a && b?", function() {
    let code = Parser.parse(`
      a
      b
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a && b"))))
     .equalsTo(`Take that a. 
Take that b. 
If a and b then a && b. `);
   });

  it("a => b, b => c |= a => c?", function() {
    let code = Parser.parse(`
      a => b
      b => c
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a => c"))))
     .equalsTo(`If a => b and b => c then a => c. `);
   });

  it("(a => c) && (b => d), a || b |= c || d", function() {
    let code = Parser.parse(`
      a => c
      b => d
      a || b
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("c || d"))))
     .equalsTo(`If a => c and b => d and a || b then c || d. `);
   });

  it("a => b |= a => (a && b)", function() {
    let code = Parser.parse(`
      a => b
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("a => (a && b)"))))
     .equalsTo(`If a => b then a => a && b. `);
   });

  it("criminal?", function() {
    // https://www.iep.utm.edu/prop-log/#SH5a

    let code = Parser.parse(`
      cat_fur || dog_fur
      dog_fur => thompson_allergy
      cat_fur => macavity_criminal
      ~thompson_allergy
    `);

    assertThat(explain(new Backward(code).backward(Rule.of("macavity_criminal"))))
     .equalsTo(`Take that ~thompson_allergy. 
If dog_fur => thompson_allergy and ~thompson_allergy then ~dog_fur. 
If cat_fur || dog_fur and ~dog_fur then cat_fur. 
If cat_fur => macavity_criminal and cat_fur then macavity_criminal. `);

   });

  it("brake?", function() {
    // http://www.cs.cornell.edu/courses/cs472/2005fa/lectures/15-kb-systems_part3_6up.pdf
    let kb = Parser.parse(`
     PersonInFrontOfCar => Brake
     (YellowLight && Policeman && ~Slippery) => Brake
     Policecar => Policeman
     Snow => Slippery
     Slippery => ~Dry
     RedLight => Brake
     Winter => Snow    
     YellowLight
     ~RedLight
     ~Snow
     Dry
     Policecar
     ~PersonInFrontOfCar
    `);

    // Can we infer "Brake"?
    assertThat(explain(new Backward(kb).backward(Rule.of("Brake"))))
     .equalsTo(`Take that Policecar. 
If Policecar => Policeman and Policecar then Policeman. 
Take that YellowLight. 
Take that Dry. 
If Slippery => ~Dry and ~~Dry then ~Slippery. 
If YellowLight and ~Slippery then YellowLight && ~Slippery. 
If Policeman and YellowLight && ~Slippery then Policeman && YellowLight && ~Slippery. 
If Policeman && ~Slippery && YellowLight => Brake and Policeman && ~Slippery && YellowLight then Brake. `);

  });

  // TODO(goto): check if a && b => c has the precedence there

  it("q?", function() {
    // http://pages.cs.wisc.edu/~bgibson/cs540/handouts/pl.pdf
    // TODO(goto): 
    let kb = Parser.parse(`
      p => q
      (l && m) => p
      (b && l) => m
      (a && p) => l
      (a && b) => l
      a
      b
    `);

    // console.log(kb);
    // return;

    // Can we infer "Brake"?
    assertThat(explain(new Backward(kb).backward(Rule.of("q"))))
     .equalsTo(`Take that a. 
Take that b. 
If a and b then a && b. 
If a && b => l and a && b then l. 
Take that b. 
Take that l. 
If b and l then b && l. 
If b && l => m and b && l then m. 
If l and m then l && m. 
If l && m => p and l && m then p. 
If p => q and p then q. `);

  });

  function explain(reasons) {
   let result = [];
   // console.log(JSON.stringify(reasons));                                                                                  
   for (let reason of reasons) {
    // console.log(reason);                                                                                                  
    if (equals(reason.given, reason.goal)) {
     result.push("Take that " + stringify(reason.given) + ". ");
    } else {
     let line = [];
     line.push("If " + stringify(reason.given) + " ");
     let ands = reason.and || [];
     for (let and of ands) {
      line.push("and " + stringify(and) + " ");
     }
     line.push("then " + stringify(reason.goal) + ". ");
     result.push(line.join(""));
    }
   }
   return result.join("\n");
  }

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    },
    proving(y) {
     return {
      equalsTo(z) {
       let kb = Parser.parse(x);
       assertThat(explain(new Backward(kb).backward(Rule.of(y))))
        .equalsTo(z);
      }
     }
    }
   }
  }

});

