const Assert = require("assert");
const nearley = require("nearley");
const grammar = require("./grammar.js");

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
   // console.log(type + ": " + JSON.stringify(types));
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

    // PS 4
    // NOTE(goto): this is slightly different in that the "num" variable
    // is tied to the same variable rather than a different one. This
    // may be a typo in the paper.
    grammar.push(phrase(term("VP'", {"num": 1, "fin": "+"}),
                        [term("AUX", {"num": 1, "fin": "+"}),
                         literal("not"),
                         term("VP", {"num": 1, "fin": "-"})]));

    // PS 5
    grammar.push(phrase(term("VP'", {"num": 1, "fin": "+"}),
                        [term("VP", {"num": 1, "fin": "+"})]));

    // PS 6
    grammar.push(phrase(term("VP", {"num": 1, "fin": 2}),
                        [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                         term("NP", {"num": 3, "gen": 4, "case": "-nom"})]));

    // PS 7
    grammar.push(phrase(term("VP", {"num": 1, "fin": 2}),
                        [term("V", {"num": 1, "fin": 2, "trans": "-"})]));

    // page 36 makes a simplification, which we introduce back manually:
    // The intended meaning is that the left-hand side can have either of 
    // the case values +nom and -nom. 

    // PS 9
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3}),
                        [term("DET", {"num": 1}), term("N", {"num": 1, "gen": 2})]));

    // PS 10
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3}),
                        [term("PN", {"num": 1, "gen": 2})]));

    // PS 11
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3}),
                        [term("PRO", {"num": 1, "gen": 2, "case": 3})]));

    // PS 12
    grammar.push(phrase(term("NP", {"num": "plur", "gen": 1, "case": 2}),
                        [term("NP", {"num": 3, "gen": 4, "case": 2}),
                         literal("and"),
                         term("NP", {"num": 5, "gen": 6, "case": 2})]));

    // LI 1
    grammar.push(rule(term("DET", {"num": "sing"}),
                      [[literal("a")], [literal("every")], [literal("the")], [literal("some")]]));

    // LI 2
    grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "+nom"}),
                      [[literal("he")]]));

    // LI 3
    grammar.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom"}),
                      [[literal("him")]]));

    // LI 4
    grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "+nom"}),
                      [[literal("she")]]));

    // LI 5
    grammar.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom"}),
                      [[literal("her")]]));

    // LI 6
    grammar.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": ["-nom", "+nom"]}),
                      [[literal("it")]]));

    // LI 7
    grammar.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "+nom"}),
                      [[literal("they")]]));

    // LI 8
    grammar.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "-nom"}),
                      [[literal("them")]]));

    // LI 9
    grammar.push(rule(term("PN", {"num": "sing", "gen": "male"}),
                      [[literal("Jones")], [literal("John")]]));

    // LI 11
    grammar.push(rule(term("PN", {"num": "sing", "gen": "fem"}),
                      [[literal("Mary")], [literal("Anna")]]));

    // LI 12
    grammar.push(rule(term("N", {"num": "sing", "gen": "male"}),
                      [[literal("stockbroker")], [literal("man")]]));

    // LI 13
    grammar.push(rule(term("N", {"num": "sing", "gen": "fem"}),
                      [[literal("stockbroker")], [literal("woman")], [literal("widow")]]));

    // LI 14
    grammar.push(rule(term("N", {"num": "sing", "gen": "-hum"}),
                      [[literal("book")], [literal("donkey")], [literal("horse")]]));

    // LI 15
    grammar.push(rule(term("AUX", {"num": "sing", "fin": "+"}),
                      [[literal("does")]]));

    // LI 16
    grammar.push(rule(term("AUX", {"num": "plur", "fin": "+"}),
                      [[literal("do")]]));

    // LI 17
    grammar.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "+"}),
                      [[literal("like")], [literal("love")], [literal("own")], [literal("fascinate")]]));

    // LI 18
    // Manually expanding into the transitivity.
    grammar.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "-"}),
                      [[literal("love")], [literal("stink")]]));

    // LI 19
    // Manually expanding into the present / third person.
    grammar.push(rule(term("V", {"num": ["sing"], "fin": "+", "trans": ["-", "+"]}),
                      [[literal("loves")], [literal("stinks")]]));

    // LI 20
    // Manually expanding into the present / plural.
    grammar.push(rule(term("V", {"num": ["plur"], "fin": "+", "trans": ["-", "+"]}),
                      [[literal("love")], [literal("stink")]]));

    assertThat(grammar.length).equalsTo(29);

    assertThat(print(grammar[0]))
     .equalsTo("S -> S[num=@1]");
    assertThat(print(grammar[1]))
     .equalsTo("S[num=@1] -> NP[num=@1, gen=@2, case=+nom] VP'[num=@1, fin=+]");
    assertThat(print(grammar[2]))
     .equalsTo("VP'[num=@1, fin=+] -> AUX[num=@1, fin=+] \"not\" VP[num=@1, fin=-]");
    assertThat(print(grammar[3]))
     .equalsTo("VP'[num=@1, fin=+] -> VP[num=@1, fin=+]");
    assertThat(print(grammar[4]))
     .equalsTo("VP[num=@1, fin=@2] -> V[num=@1, fin=@2, trans=+] NP[num=@3, gen=@4, case=-nom]");
    assertThat(print(grammar[5]))
     .equalsTo("VP[num=@1, fin=@2] -> V[num=@1, fin=@2, trans=-]");
    assertThat(print(grammar[6]))
     .equalsTo("NP[num=@1, gen=@2, case=@3] -> DET[num=@1] N[num=@1, gen=@2]")
    assertThat(print(grammar[7]))
     .equalsTo("NP[num=@1, gen=@2, case=@3] -> PN[num=@1, gen=@2]")
    assertThat(print(grammar[8]))
     .equalsTo('NP[num=@1, gen=@2, case=@3] -> PRO[num=@1, gen=@2, case=@3]');
    assertThat(print(grammar[9]))
     .equalsTo('NP[num=plur, gen=@1, case=@2] -> NP[num=@3, gen=@4, case=@2] "and" NP[num=@5, gen=@6, case=@2]');
    assertThat(print(grammar[10]))
     .equalsTo('DET[num=sing] -> "a" "every" "the" "some"');
    assertThat(print(grammar[11]))
     .equalsTo('PRO[num=sing, gen=male, case=+nom] -> "he"');    
    assertThat(print(grammar[12]))
     .equalsTo('PRO[num=sing, gen=male, case=-nom] -> "him"');
    assertThat(print(grammar[13]))
     .equalsTo('PRO[num=sing, gen=fem, case=+nom] -> "she"');
    assertThat(print(grammar[14]))
     .equalsTo('PRO[num=sing, gen=fem, case=-nom] -> "her"');
    assertThat(print(grammar[15]))
     .equalsTo('PRO[num=sing, gen=-hum, case=-nom/+nom] -> "it"');
    assertThat(print(grammar[16]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=+nom] -> "they"');
    assertThat(print(grammar[17]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=-nom] -> "them"');
    assertThat(print(grammar[18]))
     .equalsTo('PN[num=sing, gen=male] -> "Jones" "John"');
    assertThat(print(grammar[19]))
     .equalsTo('PN[num=sing, gen=fem] -> "Mary" "Anna"');
    assertThat(print(grammar[20]))
     .equalsTo('N[num=sing, gen=male] -> "stockbroker" "man"');
    assertThat(print(grammar[21]))
     .equalsTo('N[num=sing, gen=fem] -> "stockbroker" "woman" "widow"');
    assertThat(print(grammar[22]))
     .equalsTo('N[num=sing, gen=-hum] -> "book" "donkey" "horse"');
    assertThat(print(grammar[23]))
     .equalsTo('AUX[num=sing, fin=+] -> "does"');
    assertThat(print(grammar[24]))
     .equalsTo('AUX[num=plur, fin=+] -> "do"');
    assertThat(print(grammar[25]))
     .equalsTo('V[num=sing/plur, fin=-, trans=+] -> "like" "love" "own" "fascinate"');
    assertThat(print(grammar[26]))
     .equalsTo('V[num=sing/plur, fin=-, trans=-] -> "love" "stink"');
    assertThat(print(grammar[27]))
     .equalsTo('V[num=sing, fin=+, trans=-/+] -> "loves" "stinks"');
    assertThat(print(grammar[28]))
     .equalsTo('V[num=plur, fin=+, trans=-/+] -> "love" "stink"');
    
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
  let DET = (...children) => node("DET", ...children);
  let N = (...children) => node("N", ...children);
  let PRO = (...children) => node("PRO", ...children);
  let AUX = (...children) => node("AUX", ...children);

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

  function parse(source) {
   const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
   parser.feed(source);
   return clone(parser.results);
  }

  it("parse", function() {
    assertThat(clear(parse("John loves")))
     .equalsTo([S(S(NP(PN("John")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("Jones loves")))
     .equalsTo([S(S(NP(PN("Jones")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("Mary loves")))
     .equalsTo([S(S(NP(PN("Mary")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("Anna loves")))
     .equalsTo([S(S(NP(PN("Anna")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("John stinks")))
     .equalsTo([S(S(NP(PN("John")),
                    VP_(VP(V("stinks")))))]);
    assertThat(clear(parse("a man loves")))
     .equalsTo([S(S(NP(DET("a"), N("man")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("every donkey stinks")))
     .equalsTo([S(S(NP(DET("every"), N("donkey")),
                    VP_(VP(V("stinks")))))]);
    assertThat(clear(parse("the woman loves")))
     .equalsTo([S(S(NP(DET("the"), N("woman")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("he loves")))
     .equalsTo([S(S(NP(PRO("he")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("she loves")))
     .equalsTo([S(S(NP(PRO("she")),
                    VP_(VP(V("loves")))))]);
    assertThat(clear(parse("it stinks")))
     .equalsTo([S(S(NP(PRO("it")),
                    VP_(VP(V("stinks")))))]);
    assertThat(clear(parse("it does not stink")))
     .equalsTo([S(S(NP(PRO("it")),
                    VP_(AUX("does"), "not", VP(V("stink")))))]);
    assertThat(clear(parse("the book does not stink")))
     .equalsTo([S(S(NP(DET("the"), N("book")),
                    VP_(AUX("does"), "not", VP(V("stink")))))]);
    assertThat(clear(parse("he loves her")))
     .equalsTo([S(S(NP(PRO("he")),
                    VP_(VP(V("loves"), NP(PRO("her"))))))]);
    assertThat(clear(parse("she loves the book")))
     .equalsTo([S(S(NP(PRO("she")),
                    VP_(VP(V("loves"), NP(DET("the"), N("book"))))))]);
    assertThat(clear(parse("every man loves her")))
     .equalsTo([S(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), NP(PRO("her"))))))]);
    assertThat(clear(parse("every man loves John")))
     .equalsTo([S(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), NP(PN("John"))))))]);
    assertThat(clear(parse("she does not love")))
     .equalsTo([S(S(NP(PRO("she")),
                    VP_(AUX("does"), "not", VP(V("love")))))]);
    assertThat(clear(parse("she does not love him")))
     .equalsTo([S(S(NP(PRO("she")),
                    VP_(AUX("does"), "not", 
                        VP(V("love"), NP(PRO("him"))))))]);
    assertThat(clear(parse("John does not like the book")))
     .equalsTo([S(S(NP(PN("John")),
                    VP_(AUX("does"), "not", 
                        VP(V("like"), NP(DET("the"), N("book"))))))]);
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    assertThat(parse("they love him").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(clear(parse("they love him"))[0])
     .equalsTo(S(S(NP(PRO("they")),
                    VP_(VP(V("love"), NP(PRO("him")))))));
    assertThat(clear(parse("they do not love him"))[0])
     .equalsTo(S(S(NP(PRO("they")),
                   VP_(AUX("do"), "not", VP(V("love"), NP(PRO("him"))))
                   )));
    assertThat(clear(parse("they do not love the book"))[0])
     .equalsTo(S(S(NP(PRO("they")),
                   VP_(AUX("do"), "not", 
                       VP(V("love"), NP(DET("the"), N("book"))))
                   )));

    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    assertThat(clear(parse("he and she love her"))[0])
     .equalsTo(S(S(NP(NP(PRO("he")), "and", NP(PRO("she"))),
                    VP_(VP(V("love"), NP(PRO("her")))))));
    assertThat(clear(parse("they love him and her"))[0])
     .equalsTo(S(S(NP(PRO("they")),
                   VP_(VP(V("love"), 
                          NP(NP(PRO("him")), "and", NP(PRO("her")))
                          )))));
    assertThat(clear(parse("every man loves a book and a woman"))[0])
     .equalsTo(S(S(NP(DET("every"), N("man")),
                    VP_(VP(V("loves"), 
                           NP(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                           )))));
   });

  it.skip("debug", function() {
    //console.log(JSON.stringify(parse("he and she love her")[1], undefined, 2));
    //return;
  });


  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

