const Assert = require("assert");
const logic = require("../grammar.js");
const {Forward, normalize, stringify, equals} = require("../forward.js");
const {Parser, Rule} = require("../parser.js");

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

describe("first order logic", function() {
  it("parser", function() {
    // doesn't throw a parse exception.
    Parser.parse(`
        forall(x) mortal(x). 
        exists(x) men(x).
    `);
  });

  it("free variables", function() {
    assertThat(Rule.of("P(x?).")).equalsTo({
      "@type": "Predicate",
      "name": "P",
      "arguments": [{
        "@type": "Argument",
        "name": "x",
        free: true
      }]
    });
  });

  it("multiple free variables", function() {
    assertThat(Rule.of("P(x?, y?).").arguments).equalsTo([{
        "@type": "Argument",
        "name": "x",
        free: true
      }, {
        "@type": "Argument",
        "name": "y",
        free: true
      }]);
  });

  it("mixed variables", function() {
    assertThat(Rule.of("P(x, y?, z).").arguments).equalsTo([{
        "@type": "Argument",
        "name": "x"
      }, {
        "@type": "Argument",
        "name": "y",
        free: true
      }, {
        "@type": "Argument",
        "name": "z"
      }]);
  });

  it.skip("multiple variables", function() {
    // TODO(goto): the following fails, figure out
    // why.
    Parser.parse(`
        forall(x, y) mortal(x, y).
    `);
  });

  function unify(a, b) {
   if (a["@type"] == "Predicate" &&
       b["@type"] == "Predicate" &&
       a.name == b.name &&
       a.arguments.length == b.arguments.length) {
    let result = {};
    for (let i = 0; i < a.arguments.length; i++) {
       result[a.arguments[i].name] = b.arguments[i].name;
    }
    return result;
   }
   return false;
  }

  it("unification", function() {
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y).")))
       .equalsTo({"x": "y"});
    assertThat(unify(Rule.of("a(x?)."), Rule.of("b(y).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y, z).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(p?, q?)."), Rule.of("a(x, y).")))
     .equalsTo({"p": "x", "q": "y"});
  });

  it.skip("modus ponens", function() {
    // doesn't throw a parse exception.
    let kb = Parser.parse(`
        forall(x) men(x) => mortal(x). 
        men(socrates).
    `);

    let q = Parser.parse(`mortal(socrates)?`);

    console.log(kb);
    console.log(q);

    
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

