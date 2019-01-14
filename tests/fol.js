const Assert = require("assert");
const logic = require("../grammar.js");
const {Forward, normalize, stringify, equals, explain} = require("../forward.js");
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
        "literal": {"@type": "Literal", "name": "x"},
        free: true
      }]
    });
  });

  it("parser - multiple free variables", function() {
    assertThat(Rule.of("P(x?, y?).").arguments).equalsTo([{
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "x"},
        free: true
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "y"},
        free: true
      }]);
  });

  it("parser - mixed variables", function() {
    assertThat(Rule.of("P(x, y?, z).").arguments).equalsTo([{
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "x"},
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "y"},
        free: true
      }, {
        "@type": "Argument",
        "literal": {"@type": "Literal", "name": "z"}
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
         "literal": {"@type": "Literal", "name": "x"},
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

  function fill(rule, map) {
   // clones rule.
   let result = JSON.parse(JSON.stringify(rule));
   if (result["@type"] == "Function" || result["@type"] == "Predicate") {
    for (let arg of result.arguments.filter(y => y.free)) {
     // console.log(arg);
     if (!map[arg.literal.name]) {
      // there is non-unified free variable
      return false;
     }
     delete arg.free;
     arg.literal = map[arg.literal.name];
    }
   }
   return result;
  }

  function unify(a, b) {
   // Find all substitutions.
   let result = reduce(a, b);

   if (!result) {
    return false;
   }

   for (let [key, value] of Object.entries(result)) {
    // console.log(value);
    // fill(value);
    // result[key] = fill(value);
    result[key] = fill(value, result);
   }
   return result;
  }

  function reduce(a, b) {
   if (a["@type"] == "Literal" && b["@type"] == "Literal" &&
       a.name == b.name) {
    return {};
   } if ((a["@type"] == "Predicate" && b["@type"] == "Predicate" ||
          a["@type"] == "Function" && b["@type"] == "Function") &&
       a.name == b.name &&
       a.arguments.length == b.arguments.length) {
    let result = {};
    for (let i = 0; i < a.arguments.length; i++) {
     if (!a.arguments[i].free && !b.arguments[i].free) {
      let inner = unify(a.arguments[i].literal || a.arguments[i].call, 
                      b.arguments[i].literal || b.arguments[i].call);
      // can't unify inner.
      if (!inner) {
       return false;
      }
      result = {...result, ...inner};
     } else if (a.arguments[i].free && !b.arguments[i].free) {
      result[a.arguments[i].literal.name] = b.arguments[i].literal || b.arguments[i].call;
     } else if (!a.arguments[i].free && b.arguments[i].free) {
      result[b.arguments[i].literal.name] = a.arguments[i].literal || a.arguments[i].call;
     } else if (a.arguments[i].free && b.arguments[i].free) {
      // sanity check if this is correct.
      result[a.arguments[i].name] = b.arguments[i].name;
     }
    }
    return result;
   }
   return false;
  }

  let literal = (x) => {return {"@type": "Literal", "name": x}};

  it("Unify(P(a), P(a))", function() {
    assertThat(unify(Rule.of("P(a)."), Rule.of("P(a).")))
     .equalsTo({});
  });

  it("Unify(P(a), P(x?))", function() {
    assertThat(unify(Rule.of("P(a)."), Rule.of("P(x?).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(a, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": literal("b")});
  });

  it("Unify(P(y?, b), P(a, x?))", function() {
    assertThat(unify(Rule.of("P(y?, b)."), Rule.of("P(a, x?).")))
     .equalsTo({"x": literal("b"), "y": literal("a")});
  });

  it("Unify(P(p?, q?), P(x, y))", function() {
    assertThat(unify(Rule.of("a(p?, q?)."), Rule.of("a(x, y).")))
     .equalsTo({"p": literal("x"), "q": literal("y")});
  });

  it("Unify(P(Q(a)), P(x?))", function() {
    assertThat(unify(Rule.of("P(Q(a))."), Rule.of("P(x?).")))
     .equalsTo({"x": {
        "@type": "Function",
        "name": "Q",
        "arguments": [{
          "@type": "Argument",
          "literal": {
           "@type": "Literal",
            "name": "a"
          }
        }] 
      }
     });
  });

  it("Unify(P(Q(a)), P(Q(x?)))", function() {
    assertThat(unify(Rule.of("P(Q(a))."), Rule.of("P(Q(x?)).")))
     .equalsTo({"x": literal("a")});
  });

  it("Unify(P(a, x?), P(y?, Q(y?)))", function() {
    assertThat(unify(Rule.of("P(a, x?)."), Rule.of("P(y?, Q(y?)).")))
     .equalsTo({"y": literal("a"), "x": {
        "@type": "Function",
        "name": "Q",
        "arguments": [{
          "@type": "Argument",
          "literal": {
           "@type": "Literal",
            "name": "a"
          }
        }]
     }});
  });

  it("Unify fails", function() {
    assertThat(unify(Rule.of("a(x?)."), Rule.of("b(y).")))
       .equalsTo(false);
    assertThat(unify(Rule.of("a(x?)."), Rule.of("a(y, z).")))
       .equalsTo(false);
  });

  it("generalized modus ponens", function() {
    // doesn't throw a parse exception.
    let kb = Parser.parse(`
        forall(x) men(x?) => mortal(x?). 
        men(socrates).
    `);

    let q = Rule.of(`mortal(socrates)?`);

    // console.log(kb);
    // console.log(q);

    function backward(goal) {
     if (goal["@type"] == "Predicate") {
      for (let predicate of kb.statements.filter(x => x["@type"] == "Predicate")) {
       if (predicate.name == goal.name &&
           predicate.arguments.length == goal.arguments.length) {
        // console.log("checking predicates");
        let matches = true;
        for (let i = 0; i < predicate.arguments.length; i++) {
         if (!equals(predicate.arguments[i], goal.arguments[i])) {
          matches = false;
          break;
         }
        }
        if (matches) {
         return [predicate];
        }
       }
      }
     }
     // Searches for something that implies goal.
     for (let statement of kb.statements) {
      // console.log(statement);
      if (statement["@type"] == "Quantifier" &&
          statement.expression.op == "=>") {
       let implication = statement.expression.right;
       // console.log(implication);
       let unifies = unify(implication, goal);
       if (unifies) {
        // console.log(unifies);
        let left = fill(statement.expression.left, unifies);
        // console.log(JSON.stringify(left));
        let dep = backward(left);
        if (dep) {
         return [{given: statement, and: [...dep], goal: goal}];
        }
       }
      }
     }

     return false;
    }

    let result = explain(backward(q));
    assertThat(result)
     .equalsTo("if (forall (x) men(x) => mortal(x) and men(socrates)) then (mortal(socrates)).\n");
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }
});

