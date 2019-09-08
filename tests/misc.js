const Assert = require("assert");
const {Forward, normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
const {Reasoner} = require("../src/fol.js");
const {rewrite} = require("../src/unify.js");

const {
  program, 
  forall, 
  exists, 
  implies, 
  predicate, 
  func,
  binary, 
  literal, 
  constant, 
  and, 
  or, 
  negation,
  argument} = Parser;

describe("Knowledge", function() {
  it("mortal(socrates)", function() {
    assertThat("forall(x) men(x) => mortal(x). men(socrates).")
      .proving("mortal(socrates)?")
      .equalsTo(`
        men(socrates).
        forall (x = socrates) men(x) => mortal(x).
        mortal(socrates).
     `)
      .done();
  });
  
  it("evil(john)?", function() {
    assertThat(`
        forall(x) ((greedy(x) && king(x)) => evil(x)).
        greedy(john).
        king(john).
    `)
      .proving("evil(john)?")
      .equalsTo(`
        greedy(john).
        king(john).
        if (greedy(john) && king(john)) then greedy(john) && king(john).
        forall (x = john) greedy(x) && king(x) => evil(x).
        evil(john).
     `);
  });
  
  it("evil(father(john))?", function() {
    assertThat(`
        forall(x) (greedy(x) && king(x)) => evil(x).
        greedy(father(john)).
        king(father(john)).
    `)
      .proving("evil(father(john))?")
      .equalsTo(`
        greedy(father(john)).
        king(father(john)).
        if (greedy(father(john)) && king(father(john))) then greedy(father(john)) && king(father(john)).
        forall (x = father(john)) greedy(x) && king(x) => evil(x).
        evil(father(john)).
     `);
  });
  

  const professors = `
      professor(lucy).
      forall (x) professor(x) => person(x).
      dean(john).
      forall (x) exists (y) friends(y, x).
      forall (x) dean(x) => professor(x).
      forall (x) forall(y) (professor(x) && dean(y)) => (friends(x, y) || ~knows(x, y)).
      forall (x) forall (y) (person(x) && person(y) && criticized(x, y)) => ~friends(y, x).
      criticized(lucy, john).
   `;
  
  it("~friends(john, lucy)", function() {
    assertThat(professors)
      .proving("~friends(john, lucy)?")
      .equalsTo(`
       criticized(lucy, john).
       dean(john).
       forall (x = john) dean(x) => professor(x).
       professor(john).
       forall (x = john) professor(x) => person(x).
       person(john).
       criticized(lucy, john) && person(john) => criticized(lucy, john) && person(john).
       professor(lucy).
       forall (x = lucy) professor(x) => person(x).
       person(lucy).
       criticized(lucy, john) && person(john) && person(lucy) => criticized(lucy, john) && person(john) && person(lucy).
       forall (x = lucy) forall (y = john) person(x) && person(y) && criticized(x, y) => ~friends(y, x).
       ~friends(john, lucy).
     `);
  });
  
  it("person(john)", () => {
    assertThat(professors)
      .proving("person(john)?")
      .equalsTo(`
       dean(john).
       forall (x = john) dean(x) => professor(x).
       professor(john).
       forall (x = john) professor(x) => person(x).
       person(john).
     `);
  });
  
  it("person(lucy)", () => {
    assertThat(professors)
      .proving("person(lucy)?")
      .equalsTo(`
       professor(lucy).
       forall (x = lucy) professor(x) => person(x).
       person(lucy).
     `);
  });
  
  it("exists (x) criticized(x, john)", () => {
    assertThat(professors)
      .proving("exists (x) criticized(x, john)?")
      .equalsTo("criticized(lucy, john). exists (x = lucy) criticized(x, john).");
  });
  
  it.skip("~knows(lucy, john)", () => {
    // TODO(goto): add this case.
    assertThat(professors)
      .proving("~knows(lucy, john)?")
      .equalsTo("");
  });
  
  it("collapses(table)?", function() {
    assertThat("forall (x) on(x, table). forall (y) on(bertha, y) => collapses(y).")
      .proving("collapses(table)?")
      .equalsTo(`
       forall (x) on(x, table).
       on(bertha, table).
       forall (y = table) on(bertha, y) => collapses(y).
       collapses(table).
    `);
  });
  
  it("exists (y) collapses(y)?", function() {
    assertThat("forall (x) on(x, table). forall (x) on(bertha, x) => collapses(x).")
      .proving("exists (y) collapses(y)?")
      .equalsTo(`
       forall (x) on(x, table).
       exists (x = table) on(bertha, x).
       forall (x = table) on(bertha, x) => collapses(x).
       exists (y = table) collapses(y).
     `);
    // calling done() here returns another table.
    // figure out why.
  });
  
  it("forall(x) diet(x)", function() {
    // nobody can see oneself. 
    assertThat("forall(x) ~sees(x, x). forall(x) ~sees(x, feet(x)) => diet(x).")
      .proving("forall(x) diet(x)?")
      .equalsTo("false.");
    // should be false, since feet(x?) isn't necessarily x?.
  });

  function assertThat(x) {
    return {
      proving(z) {
	let result = new Reasoner(rewrite(Parser.parse(x))).go(rewrite(Rule.of(z)));
	return {
	  done() {
	    this.equalsTo("false.")
	    return this;
	  },
	  equalsTo(y) {
	    // console.log(result.toString());
	    // console.log(JSON.stringify(Parser.parse(result.toString()), undefined, 2));
	    let next = result.next();

	    if (next.done) {
	      assertThat(y).equalsTo("false.");
	      return;
	    }
	    
	    assertThat(toString(Parser.parse(next.value.toString())))
              .equalsTo(toString(Parser.parse(y)));
	    return this;
	  }
	};
      },
      equalsTo(y) {
	Assert.deepEqual(x, y);
      }
    }
  }
});
