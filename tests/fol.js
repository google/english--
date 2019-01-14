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

  it("parser - free variables", function() {
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

  it("parser - multiple free variables", function() {
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

  it("parser - mixed variables", function() {
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

  it("parser - function args", function() {
    assertThat(Rule.of("P(Q(x)).").arguments[0]).equalsTo({
      "@type": "Argument",
      "call": {
       "@type": "Function",
       "name": "Q",
       "arguments": [{
         "@type": "Argument",
         "name": "x"
       }]
      }
    });
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
     if (!a.arguments[i].free && !b.arguments[i].free &&
         a.arguments[i].name != b.arguments[i].name) {
      // can't unify.
      return false;
     } else if (a.arguments[i].free && !b.arguments[i].free) {
      result[a.arguments[i].name] = b.arguments[i].name;
     } else if (!a.arguments[i].free && b.arguments[i].free) {
      result[b.arguments[i].name] = a.arguments[i].name;
     } else if (a.arguments[i].free && b.arguments[i].free) {
      // sanity check if this is correct.
      result[a.arguments[i].name] = b.arguments[i].name;
     }
    }
    return result;
   }
   return false;
  }

  it("Unify(P(a), P(x?))", function() {
    assertThat(unify(Rule.of("P(a)."), Rule.of("P(x?).")))
     .equalsTo({"x": "a"});
  });

  it("Unify(P(a, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(a, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": "b"});
  });

  it("Unify(P(y?, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(y?, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": "b", "y": "a"});
  });

  it("Unify(P(p?, q?), P(x, y))", function() {
    assertThat(unify(Rule.of("a(p?, q?)."), Rule.of("a(x, y).")))
     .equalsTo({"p": "x", "q": "y"});
  });

  it("Unify failures", function() {
    assertThat(unify(Rule.of("a(x?)."), Rule.of("b(y).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y, z).")))
       .equalsTo(false);
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

