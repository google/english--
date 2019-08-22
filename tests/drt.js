const Assert = require("assert");
const peg = require("pegjs");

const nearley = require("nearley");

describe.only("DRT", function() {
  let l = (value) => { return literal(value); };
  let space = (space) => { return {"@type": "Space"} };
  let rule = (head = {}, tail = []) => { return {"@type": "Rule", head: head, tail: tail}};
  let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
  let literal = (value) => { return {"@type": "Literal", name: value} };
  let phrase = (head, tail) => { return rule(head, [tail]); };
  let name = (term, pretty) => {
   if (term["@type"] == "Literal") {
    return `"${term.name}"`;
   }
   if (!term.types) {
    return term.name;
   }
   let result = term.name;
   result += "[";
   let first = true;
   for (let [key, value] of Object.entries(term.types)) {
    if (!first) {
     result += ", ";
    }
    first = false;
    let val = value;
    if (Number.isInteger(value)) {
     val = `@${value}`;
    } else if (Array.isArray(value)) {
     val = `${value.join("/")}`;
    }
    result += key + "=" + val;
   }
   result += "]";

   if (pretty) {
    result = result.replace(/\[/g, '_');
    result = result.replace(/\]/g, '');
    result = result.replace(/\s/g, '');
    result = result.replace(/,/g, '_');
    result = result.replace(/-/g, 'n');
    result = result.replace(/\+/g, 'p');
    result = result.replace(/=/g, '_');
    result = result.replace(/\'/g, '_');
   }

   return result;
  }
  
  let print = ({head, tail}, pretty = false) => {
   let result = "";
   result += name(head, pretty) + " ->";
   for (let line of tail) {
    for (let term of line) {
     result += " " + name(term, pretty);
    }
   }
   return result;
  }

  it("expand var", function() {
    let rule = phrase(term("S", {"num": 1}),
                      [term("NP", {"num": 1}),
                       term("VP_", {"num": 1})]);

    assertThat(print(rule)).equalsTo("S[num=@1] -> NP[num=@1] VP_[num=@1]");

    let rules = generate(rule);

    assertThat(rules.length).equalsTo(2);
    assertThat(print(rules[0])).equalsTo("S[num=sing] -> NP[num=sing] VP_[num=sing]");
    assertThat(print(rules[1])).equalsTo("S[num=plur] -> NP[num=plur] VP_[num=plur]");
   });
  
  let clone = (obj) => JSON.parse(JSON.stringify(obj));

  function expand(obj) {
   let queue = [];
   let result = [];

   queue.push(obj);
    
   while (queue.length > 0) {
    let obj = queue.pop();
    
    let vars = Object.entries(obj)
     .filter(([key, value]) => Array.isArray(value));
    
    if (vars.length == 0) {
     result.unshift(obj);
     continue;
    }

    let [key, values] = vars.shift();
    for (let value of values) {
     let fix = clone(obj);
     fix[key] = value;
     queue.push(fix);
    }
   };

   return result;
  }

  it("expand", function() {
    let obj = {"A": ["S", "P"], "B": ["X", "Y"]};

    assertThat(expand(obj))
     .equalsTo([{"A": "S", "B": "X"},
                {"A": "S", "B": "Y"},
                {"A": "P", "B": "X"},
                {"A": "P", "B": "Y"}]);

  });

  const FEATURES = {
   "num": ["sing", "plur"],
   "case": ["+nom", "-nom"],    
   "gen": ["male", "fem", "-hum"],    
   "trans": ["+", "-"],
   "fin": ["+", "-"],
  };

  function collect(rule) {
   let vars = {};

   let ids = -1;

   for (let [key, values] of Object.entries(FEATURES)) {
    if (rule.head.types) {
     if (Number.isInteger(rule.head.types[key])) {
      vars[rule.head.types[key]] = FEATURES[key];
     } else if (Array.isArray(rule.head.types[key])) {
      vars[`${ids}`] = rule.head.types[key];
      rule.head.types[key] = ids;
      ids--;
     }
    }
    for (let line of rule.tail) {
     for (let term of line) {
      if (!term.types) {
       continue;
      }
      if (Number.isInteger(term.types[key])) {
       vars[term.types[key]] = FEATURES[key];
      } else if (Array.isArray(term.types[key])) {
       vars[`${ids}`] = term.types[key];
       term.types[key] = ids;
       ids--;
      }
     }
    }
   }

   return vars;
  }

  it("collect", function() {
    let rule = phrase(term("VP", {"num": 1}),
                      [term("V", {"num": 1}),
                       term("NP", {"num": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[num=@1] -> V[num=@1] NP[num=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["sing", "plur"], "2": ["sing", "plur"]});
  });

  it("collects case", function() {
    let rule = phrase(term("VP", {"case": 1}),
                      [term("V", {"case": 1}),
                       term("NP", {"case": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[case=@1] -> V[case=@1] NP[case=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["+nom", "-nom"], "2": ["+nom", "-nom"]});
  });

  it("collects array", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    assertThat(print(rule))
     .equalsTo('PRO[num=sing, case=-nom/+nom] -> "it"');
    assertThat(collect(rule)).equalsTo({"-1": ["-nom", "+nom"]});
    // console.log(rule);
    assertThat(print(rule))
     .equalsTo('PRO[num=sing, case=@-1] -> "it"');
  });

  function replace(rule, vars) {
   let result = clone(rule);

   for (let [feature, values] of Object.entries(FEATURES)) {
    if (result.head.types && Number.isInteger(result.head.types[feature])) {
     result.head.types[feature] = vars[result.head.types[feature]];
    }

    for (let line of result.tail) {
     for (let term of line) {
      if (!term.types) {
       continue;
      } else if (Number.isInteger(term.types[feature])) {
       term.types[feature] = vars[term.types[feature]];
      }
     }
    }
   }

   return result;
  }

  function generate(rule) {
   let vars = collect(rule);
   let all = expand(vars);

   let result = [];
   for (let combo of all) {
    result.push(replace(rule, combo));
   }
   return result;
  }

  it("generate", function() {
    let rule = phrase(term("VP", {"num": 1}),
                      [term("V", {"num": 1}),
                       term("NP", {"num": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[num=sing] -> V[num=sing] NP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("VP[num=sing] -> V[num=sing] NP[num=plur]");
    assertThat(print(result[2]))
     .equalsTo("VP[num=plur] -> V[num=plur] NP[num=sing]");
    assertThat(print(result[3]))
     .equalsTo("VP[num=plur] -> V[num=plur] NP[num=plur]");
  });

  it("generate with case", function() {
    let rule = phrase(term("VP", {"case": 1}),
                      [term("V", {"case": 1}),
                       term("NP", {"case": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[case=+nom] -> V[case=+nom] NP[case=+nom]");
    assertThat(print(result[1]))
     .equalsTo("VP[case=+nom] -> V[case=+nom] NP[case=-nom]");
    assertThat(print(result[2]))
     .equalsTo("VP[case=-nom] -> V[case=-nom] NP[case=+nom]");
    assertThat(print(result[3]))
     .equalsTo("VP[case=-nom] -> V[case=-nom] NP[case=-nom]");
  });

  it("generate with fixed values", function() {
    let rule = phrase(term("NP", {"num": "plur"}),
                      [term("NP", {"num": 1}),
                       term("NP", {"num": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("NP[num=plur] -> NP[num=sing] NP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("NP[num=plur] -> NP[num=sing] NP[num=plur]");
    assertThat(print(result[2]))
     .equalsTo("NP[num=plur] -> NP[num=plur] NP[num=sing]");
    assertThat(print(result[3]))
     .equalsTo("NP[num=plur] -> NP[num=plur] NP[num=plur]");
  });

  it("generate with two types", function() {
    let rule = phrase(term("S", {"num": 1}),
                      [term("NP", {"num": 1, "case": "+nom"}),
                       term("VP", {"num": 1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);
    assertThat(print(result[0]))
     .equalsTo("S[num=sing] -> NP[num=sing, case=+nom] VP[num=sing]");
    assertThat(print(result[1]))
     .equalsTo("S[num=plur] -> NP[num=plur, case=+nom] VP[num=plur]");
  });

  it("generate with two types and two variables", function() {
    let rule = phrase(term("NP", {"num": 1, "case": 2}),
                      [term("PRO", {"num": 1, "case": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("NP[num=sing, case=+nom] -> PRO[num=sing, case=+nom]");
    assertThat(print(result[1]))
     .equalsTo("NP[num=sing, case=-nom] -> PRO[num=sing, case=-nom]");
    assertThat(print(result[2]))
     .equalsTo("NP[num=plur, case=+nom] -> PRO[num=plur, case=+nom]");
    assertThat(print(result[3]))
     .equalsTo("NP[num=plur, case=-nom] -> PRO[num=plur, case=-nom]");
  });

  it("generate with array values", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo('PRO[num=sing, case=-nom] -> "it"');
    assertThat(print(result[1]))
     .equalsTo('PRO[num=sing, case=+nom] -> "it"');
  });

  it("gender", function() {
    let rule = phrase(term("NP", {"gen": -1}),
                      [term("PRO", {"gen": -1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(3);

    assertThat(print(result[0]))
     .equalsTo("NP[gen=male] -> PRO[gen=male]");
    assertThat(print(result[1]))
     .equalsTo("NP[gen=fem] -> PRO[gen=fem]");
    assertThat(print(result[2]))
     .equalsTo("NP[gen=-hum] -> PRO[gen=-hum]");
  });

  it("transitive verbs", function() {
    let rule = phrase(term("V", {"num": "sing", "trans": "-"}),
                      [literal("likes")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(1);

    assertThat(print(result[0]))
     .equalsTo('V[num=sing, trans=-] -> "likes"');
  });

  it("fin", function() {
    let rule = phrase(term("VP", {"fin": 1}),
                      [term("V", {"fin": 1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo("VP[fin=+] -> V[fin=+]");
    assertThat(print(result[1]))
     .equalsTo("VP[fin=-] -> V[fin=-]");
  });

  it("combines nums with fins", function() {
    let rule = phrase(term("VP'", {"num": 1, "fin": 2}),
                      [term("VP", {"num": 1, "fin": 2})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(4);

    assertThat(print(result[0]))
     .equalsTo("VP'[num=sing, fin=+] -> VP[num=sing, fin=+]");
    assertThat(print(result[1]))
     .equalsTo("VP'[num=sing, fin=-] -> VP[num=sing, fin=-]");
    assertThat(print(result[2]))
     .equalsTo("VP'[num=plur, fin=+] -> VP[num=plur, fin=+]");
    assertThat(print(result[3]))
     .equalsTo("VP'[num=plur, fin=-] -> VP[num=plur, fin=-]");
  });

  function compile(grammar, header = true) {
   let rules = {};
   for (let rule of grammar) {
    for (let expansion of generate(rule)) {
     let head = name(expansion.head, true);
     rules[head] = rules[head] || [];
     for (let line of expansion.tail) {
      let list = [];
      for (let term of line) {
       list.push(name(term, true));
      }
      rules[head].push([list.join(" _ "), processor(expansion)]);
     }
    }
   }

   let result = [];

   if (header) {
    result.push(`@builtin "whitespace.ne"`);
    result.push(``);
    result.push(`@{%
function node(type, types, children) {
  return {
    "@type": type, 
    "types": types, 
    "children": children.filter(child => child)
  }; 
}
%}`);
    result.push(``);
   }

   for (let [key, list] of Object.entries(rules)) {
    result.push(`${key} -> `);
    let all = [];
    for (let [line, processor] of list) {
     all.push(`  ${line} {% ${processor} %}`);
    }
    result.push(all.join(" |\n"));
   }

   return result.join("\n");
  }

  it("generate on tail", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);
    
    assertThat(collect(rule)).equalsTo({"1": ["sing", "plur"]});

    let result = generate(rule);
    assertThat(result.length).equalsTo(2);
    assertThat(print(result[0])).equalsTo("S -> S[num=sing]");
    assertThat(print(result[1])).equalsTo("S -> S[num=plur]");
   });

  function processor(rule) {
   let result = [];
   result.push("(args)");
   // let args = [];
   // for (let line of rules[0].tail) {
   // for (let term of line) {
   //  args.push(name(term));
   //  }
   // }
   // processor.push(args.join(", "));
   // processor.push(")");
   result.push(" => ");
   result.push("node(");
   //console.log(rule);
   result.push(`"${rule.head.name}", ${JSON.stringify(rule.head.types || {})}, args`);
   result.push(")");
   return result.join("");
  }

  it("processor", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);

    let rules = generate(rule);

    assertThat(processor(rules[0])).equalsTo(`(args) => node("S", {}, args)`);
   });

  it("processor", function() {
    let rule = phrase(term("PN", {"num": "sing", "gen": "male"}),
                      [literal("Jones")]);

    let rules = generate(rule);

    assertThat(processor(rules[0]))
     .equalsTo(`(args) => node("PN", {"num":"sing","gen":"male"}, args)`);
   });

  it("processor", function() {
    let rule = phrase(term("S"),
                      [term("S", {"num": 1})]);

    assertThat(compile([rule], false))
     .equalsTo(`
S -> 
  S_num_sing {% (args) => node("S", {}, args) %} |
  S_num_plur {% (args) => node("S", {}, args) %}
               `.trim());
  });

  it("multiple expansions", function() {
    let grammar = [rule(term("A"), [[literal("b")], [literal("c")]])];
    assertThat(compile(grammar, false)).equalsTo(`
A -> 
  "b" {% (args) => node("A", {}, args) %} |
  "c" {% (args) => node("A", {}, args) %}
     `.trim());
  });

  it("grammar", function() {
    let grammar = [];

    // Root
    grammar.push(phrase(term("S"),
                        [term("S", {"num": 1})]));

    // PS 1
    grammar.push(phrase(term("S", {"num": 1}),
                        [term("NP", {"num": 1, "gen": 2, "case": "+nom"}),
                         term("VP'", {"num": 1, "fin": "+"})]));

    // PS 5
    grammar.push(phrase(term("VP'", {"num": 1, "fin": "+"}),
                        [term("VP", {"num": 1, "fin": "+"})]));

    // PS 7
    grammar.push(phrase(term("VP", {"num": 1, "fin": 2}),
                        [term("V", {"num": 1, "fin": 2, "trans": "-"})]));

    // PS 10
    // page 36 makes a simplification, which we introduce back manually:
    // The intended meaning is that the left-hand side can have either of 
    // the case values +nom and -nom. 
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3}),
                        [term("PN", {"num": 1, "gen": 2})]));

    // LI 9
    grammar.push(rule(term("PN", {"num": "sing", "gen": "male"}),
                      [[literal("Jones")], [literal("John")]]));

    // LI 11
    grammar.push(phrase(term("PN", {"num": "sing", "gen": "fem"}),
                        [literal("Mary")]));

    // LI 19
    // Manually expanding into the third person.
    grammar.push(phrase(term("V", {"num": ["sing", "plur"], "fin": "+", "trans": 1}),
                        [literal("loves")]));

    assertThat(print(grammar[0]))
     .equalsTo("S -> S[num=@1]");
    assertThat(print(grammar[1]))
     .equalsTo("S[num=@1] -> NP[num=@1, gen=@2, case=+nom] VP'[num=@1, fin=+]");
    assertThat(print(grammar[2]))
     .equalsTo("VP'[num=@1, fin=+] -> VP[num=@1, fin=+]");
    assertThat(print(grammar[3]))
     .equalsTo("VP[num=@1, fin=@2] -> V[num=@1, fin=@2, trans=-]");
    assertThat(print(grammar[4]))
     .equalsTo("NP[num=@1, gen=@2, case=@3] -> PN[num=@1, gen=@2]")
    assertThat(print(grammar[5]))
     .equalsTo(`PN[num=sing, gen=male] -> "Jones" "John"`);
    assertThat(print(grammar[6]))
     .equalsTo(`PN[num=sing, gen=fem] -> "Mary"`);
    assertThat(print(grammar[7]))
     .equalsTo(`V[num=sing/plur, fin=+, trans=@1] -> "loves"`);
    
    // "case" makes the distinction between "nominative case"
    // and "non-nominative case", respectively, he/she and
    // him/her.

    // "fin" makes the distinction between "infinitival" and
    // "finite" verb forms (- and +, respectively). 
    // "infinitival" verb forms are used with negations.

    const fs = require("fs");
    fs.writeFileSync("./tests/grammar.ne", compile(grammar));

    // console.log(compile(grammar));
  });

  function node(type, ...children) {
   return {"@type": type, "children": children} 
  }

  let S = (...children) => node("S", ...children);
  let NP = (...children) => node("NP", ...children);
  let PN = (...children) => node("PN", ...children);
  let VP_ = (...children) => node("VP'", ...children);
  let VP = (...children) => node("VP", ...children);
  let V = (...children) => node("V", ...children);

  function clear(node) {
   if (Array.isArray(node)) {
    for (let entry of node) {
     clear(entry);
    }
   } else if (typeof node == "object") {
    delete node.types;
    clear(node.children);
   }
   return node;
  }

  it("parse", function() {
    const grammar = require("./grammar.js");
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    parser.feed("John loves");

    assertThat(clear(clone(parser.results)))
     .equalsTo([S(S(NP(PN("John")),
                    VP_(VP(V("loves")))))]);
  });


  it("compiler compiler", function() {


    assertThat(term("S", {Num: "alpha"}))
     .equalsTo({"@type": "Term", name: "S", types: {Num: "alpha"}});
    assertThat(term("S", {Num: "alpha", Gen: "any", Case: "+nom"}))
     .equalsTo({"@type": "Term", name: "S", types: {Num: "alpha", Gen: "any", Case: "+nom"}});
    assertThat(rule(term("RPRO", {num: "sing/plur", gen: "-hum"}), [literal("which")]))
     .equalsTo({"@type": "Rule", 
        head: {"@type": "Term", name: "RPRO", types: {num: "sing/plur", gen: "-hum"}}, 
        tail: [{"@type": "Literal", name: "which"}]
      });

    const grammar = [];

    grammar.push(phrase(term("S", {"num": -1}), 
                        [term("NP", {"num": -1}),
                         term("VP_", {"num": -1})]));



    // console.log(JSON.stringify(grammar, undefined, 2));

    return;


    // phrase structure rules

    // PS1
    grammar.push(phrase(term("S", {"num": -1}), 
                        [term("NP", {"num": -1, "gen": -1, "case": "p"}),
                         term("VP_", {"num": -1, "fin": "p"})]));
    
    // PS2
    //grammar.push(rule(term("S", {"num": "alpha", "gap": "NP/num=gama"}), 
    //                  [term("NP", {"num": "{alpha, gama}", "gen": "beta", "case": "+nom", "gap": "NP/num=gama"}),
    //                   term("VP_", {"num": "alpha", "fin": "+", "gap": "-"})]));

    // PS3
    //grammar.push(rule(term("S", {"num": "alpha", "gap": "NP/num=gama"}), 
    //                  [term("NP", {"num": "alpha", "gen": "beta", "case": "+nom", "gap": "-"}),
    //                   term("VP_", {"num": "alpha", "fin": "+", "gap": "NP/num=gama"})]));

    // PS4
    //grammar.push(rule(term("VP_", {"num": "alpha", "fin": "+", "gap": "gama"}), 
    //                  [term("AUX", {"num": "alpha", "fin": "+"}),
    //                   l("not"),
    //                   term("VP", {"num": "sigma", "fin": "-", "gap": "gama"})]));

    // PS5
    grammar.push(phrase(term("VP_", {"num": -1, "fin": "p", "gap": -1}), 
                        [term("VP", {"num": -1, "fin": "p", "gap": -1})]));
    
    // PS6
    //grammar.push(rule(term("VP", {"num": "alpha", "fin": "beta", "gap": "gama"}), 
    //                  [term("V", {"num": "alpha", "fin": "beta", "trans": "+"}),
    //                   term("NP", {"num": "gama", "gen": "sigma", "case": "-nom", "gap": "gama"})]));

    // PS7
    grammar.push(phrase(term("VP", {"num": -1, "fin": -1}), 
                      [term("V", {"num": -1, "fin": -1, "trans": "m"})]));

    // PS8
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama", "gap": "NP/num=alpha"}), 
    //                  [term("GAP", {})]));

    // PS9
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama"}), 
    //                  [term("DET", {"num": "alpha"}),
    //                   term("N", {"num": "alpha", "gen": "beta"})]));

    // PS10
    grammar.push(phrase(term("NP", {"num": -1, "gen": -1}), 
                        [term("PN", {"num": -1, "gen": -1}),
                         space()]));

    // PS11
    //grammar.push(rule(term("NP", {"num": "alpha", "gen": "beta", "case": "gama"}), 
    //                  [term("PRO", {"num": "alpha", "gen": "beta", "case": "gama"})]));

    // PS12
    //grammar.push(rule(term("NP", {"num": "plur", "gen": "beta", "case": "gama"}), 
    //                  [term("NP", {"num": "sigma", "gen": "theta", "case": "gama"}),
    //                   l("and"),
    //                   term("NP", {"num": "sigma2", "gen": "theta2", "case": "gama"})]));
    
    // PS13
    //grammar.push(rule(term("N", {"num": "alpha", "gen": "beta"}), 
    //                  [term("N", {"num": "alpha", "gen": "beta"}),
    //                   term("RC", {"num": "alpha", "gen": "beta"})]));

    // PS14
    //grammar.push(rule(term("RC", {"num": "alpha", "gen": "beta"}), 
    //                  [term("RPRO", {"num": "alpha", "gen": "beta"}),
    //                   term("S", {"num": "gama", "gap": "NP/num=alpha"})]));


    // return;

    // lexical insertion rules

    // LI1
    //grammar.push(rule(term("DET", {"num": "sing"}), [l("a"), l("every"), l("the"), l("some")]));
    
    // LI2
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "+nom"}), [l("he")]));
    // LI3
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom"}), [l("him")]));
    // LI4
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "+nom"}), [l("she")]));
    // LI5
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom"}), [l("her")]));
    // LI6
    //grammar.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": "-nom/+nom"}), [l("it")]));
    // LI7
    //grammar.push(rule(term("PRO", {"num": "plur", "gen": "male/fem/-hum", "case": "+nom"}), [l("they")]));
    // LI8
    //grammar.push(rule(term("PRO", {"num": "plur", "gen": "male/fem/-hum", "case": "-nom"}), [l("them")]));

    // LI9
    grammar.push(rule(term("PN", {"num": "s", "gen": "m"}), [l("Jones"), l("Smith"), l("Bill")]));
    // LI10
    //grammar.push(rule(term("PN", {"num": "sing", "gen": "fem"}), [l("Jones"), l("Mary"), l("Anna")]));
    // LI11
    //grammar.push(rule(term("PN", {"num": "sing", "gen": "-hum"}), [l("Ulysses"), l("Anna Karenina")]));

    // LI12
    //grammar.push(rule(term("N", {"num": "sing", "gen": "male"}), [l("stockbroker"), l("man")]));
    // LI13
    //grammar.push(rule(term("N", {"num": "sing", "gen": "fem"}), [l("stockbroker"), l("woman", "widow")]));
    // LI14
    //grammar.push(rule(term("N", {"num": "sing", "gen": "-hum"}), [l("book"), l("horse", "bicycle")]));

    // LI15
    //grammar.push(rule(term("AUX", {"num": "sing", "fin": "+"}), [l("does")]));
    // LI16
    //grammar.push(rule(term("AUX", {"num": "plur", "fin": "+"}), [l("do")]));

    // LI17
    //grammar.push(rule(term("V", {"num": "sing/plur", "trans": "+", "fin": "-"}), 
    //                  [l("like"), l("love"), l("own"), l("fascinate"), l("rotate")]));
    // LI18
    grammar.push(rule(term("V", {"num": ["s", "p"], "trans": "m", "fin": "m"}), 
                      [l("stinks"), l("rotates")]));

    // TODO:
    // LI19
    // LI20

    // LI21
    //grammar.push(rule(term("RPRO", {"num": "sing/plur", "gen": "male/fem"}), [l("who")]));
    // LI22
    //grammar.push(rule(term("RPRO", {"num": "sing/plur", "gen": "-hum"}), [l("which")]));

    // console.log(JSON.stringify(grammar[0], undefined, 2));


    // console.log(JSON.stringify(grammar[grammar.length - 6], undefined, 2));

    // return;

    let atom = (name, [num, gen, caze, fin, gap, trans]) => `${name}+${num}${gen}${caze}${fin}${gap}${trans}`;

    for (let [rule, types] of expand(grammar[grammar.length - 6])) {
     console.log(atom(rule.head.name, types));
     console.log(rule);
     for (let term of rule.tail) {
      console.log(term);
      // console.log(atom(term.name, term.types));
     }
     break;
    }

    return;

    let lines = [];

    lines.push(``);

    lines.push(`@builtin "whitespace.ne"`);

    lines.push(``);

    lines.push(`@{% const node = (type, ...children) => { return {"@type": type, children: children}; }; %}`);

    lines.push(``);

    for (let {head, tail} of grammar) {

     let expand = (head) => {
      let suffix = Object.entries(head.types)
      .map(([key, value]) => `${key}_${value}`)
      .join("_");
      return `${head.name}_${suffix}`;
     };

     lines.push(`${expand(head)} ->`);
     for (let i = 0; i < tail.length; i++) {
      let term = tail[i];
      let br = i < (tail.length - 1) ? " |" : "";
      if (term["@type"] == "Literal") {
       lines.push(`  "${term.name}" {% ([n]) => node("${head.name}", n) %}${br}`);
       continue;
      }
      let terms = [];
      let sentence = term.map(x => x["@type"] == "Space" ? "_"  : x.name).join(" ");
      terms.push(`  ${sentence}`);
      let sp = 0;
      let args = term.map(x => x["@type"] == "Space" ? `s${sp++}`  : x.name).join(", ");
      let values = term.filter(x => x["@type"] != "Space").map(x => x.name).join(", ");
      terms.push(`{% ([${args}]) => node("${head.name}", ${values}) %}${br}`);
      lines.push(terms.join(" "));
     }
    }

    lines.push(``);

    assertThat(lines.join("\n")).equalsTo(`
@builtin "whitespace.ne"

@{% const node = (type, ...children) => { return {"@type": type, children: children}; }; %}

S ->
  NP VP_ {% ([NP, VP_]) => node("S", NP, VP_) %}
VP_ ->
  VP {% ([VP]) => node("VP_", VP) %}
VP ->
  V {% ([V]) => node("VP", V) %}
NP ->
  PN _ {% ([PN, s0]) => node("NP", PN) %}
PN ->
  "Jones" {% ([n]) => node("PN", n) %} |
  "Smith" {% ([n]) => node("PN", n) %} |
  "Bill" {% ([n]) => node("PN", n) %}
V ->
  "stinks" {% ([n]) => node("V", n) %} |
  "rotates" {% ([n]) => node("V", n) %}
`);

    const fs = require("fs");
    fs.writeFileSync("./tests/foo.ne", lines.join("\n"));
  });

  function parse(code) {
   const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
   parser.feed(code);
   return parser.results;
  }

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

