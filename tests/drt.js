const Assert = require("assert");
const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./grammar.js");

describe.only("DRT", function() {
  let l = (value) => { return literal(value); };
  let space = (optional = false) => { return optional ? "_" : "__"};
  let rule = (head = {}, tail = []) => { return {"@type": "Rule", head: head, tail: tail}};
  let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
  let literal = (value) => { return {"@type": "Literal", name: value} };
  let phrase = (head, tail) => { return rule(head, [tail]); };
  let name = (term, pretty) => {
   if (typeof term == "string") {
    return term;
   }
   if (term["@type"] == "Literal") {
    return `"${term.name}"${pretty ? "i" : ""}`;
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
   "gap": ["-", "sing", "plur"],
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

   let flatten = (expansion) => {
   };

   for (let rule of grammar) {
    for (let expansion of generate(rule)) {
     let head = name(expansion.head, true);
     rules[head] = rules[head] || [];
     for (let line of expansion.tail) {
      let list = [];
      for (let term of line) {
       list.push(name(term, true));
      }
      rules[head].push([list.join(" "), processor(expansion)]);
     }
    }
   }

   let result = [];

   if (header) {
    result.push(`@builtin "whitespace.ne"`);
    result.push(``);
    result.push(`@{%
function node(type, types, children) {
  // console.log(type + ": " + JSON.stringify(types) + " => ");
  return {
    "@type": type, 
    "types": types, 
     "children": children
       .filter(child => child != null)
       .filter(child => child != '.')
  }; 
}
%}`);
    result.push(``);
    result.push(``);

    result.push(`Discourse -> ( _ Sentence _ {% (args) => args[1] %} ):+ {% (args) => node("Discourse", {}, ...args) %}`);

    result.push(``);
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

   if (header) {
    result.push("");
    result.push("# extensible proper names");
    let names = rule(term("PN", {"num": "sing", "gen": 1}),
                     [["FULLNAME"]]);
    for (let exp of generate(names)) {
     result.push(`${print(exp, true)} {% ${processor(exp)} %}`);
    }
    result.push(`FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}`);
    result.push(`NAME -> [A-Z]:+ [a-z]:+ {% ([a, b]) => a.join("") + b.join("") %}`);

    result.push("");
    result.push("#  whitespaces");

    let whitespaces = rule(term("WS", {"gap": ["sing", "plur", "-"]}));
    for (let whitespace of generate(whitespaces)) {
     let gap = whitespace.head.types.gap != "-";
     result.push(`${print(whitespace, true)} ${gap ? "_" : "__"} {% () => null %}`);
    }

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

  it("generate gap", function() {
    let rule = phrase(term("VP", {"num": 1, "gap": 3}),
                      [term("V", {"num": 1, "trans": "+"}),
                       term("NP", {"num": 3, "case": "-nom", "gap": 3})]);

    assertThat(collect(rule)).equalsTo({
      "1": ["sing", "plur"],
      "3": ["sing", "plur"],
     });

    let result = generate(rule);
    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0]))
     .equalsTo("VP[num=sing, gap=sing] -> V[num=sing, trans=+] NP[num=sing, case=-nom, gap=sing]");
    assertThat(print(result[1]))
     .equalsTo("VP[num=sing, gap=plur] -> V[num=sing, trans=+] NP[num=plur, case=-nom, gap=plur]");
    assertThat(print(result[2]))
     .equalsTo("VP[num=plur, gap=sing] -> V[num=plur, trans=+] NP[num=sing, case=-nom, gap=sing]");
    assertThat(print(result[3]))
     .equalsTo("VP[num=plur, gap=plur] -> V[num=plur, trans=+] NP[num=plur, case=-nom, gap=plur]");

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
  "b"i {% (args) => node("A", {}, args) %} |
  "c"i {% (args) => node("A", {}, args) %}
     `.trim());
  });

  it("grammar", function() {
    let grammar = [];

    // Root
    grammar.push(phrase(term("Sentence"),
                        [term("S", {"num": 1}), 
                         space(true),
                         '"."']));

    // PS 1
    grammar.push(phrase(term("S", {"num": 1}),
                        [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": "-"}),
                         space(),
                         term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));

    // PS 2
    grammar.push(phrase(term("S", {"num": 1, "gap": 3}),
                        [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": 3}),
                         term("WS", {"gap": 3}),
                         term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));

    // PS 2.5
    grammar.push(phrase(term("S", {"num": 1, "gap": 3}),
                        [term("NP'", {"num": 3, "gen": 2, "case": "+nom", "gap": 3}),
                         term("WS", {"gap": 3}),
                         term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));

    // PS 3
    grammar.push(phrase(term("S", {"num": 1, "gap": 3}),
                        [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": "-"}),
                         space(),
                         term("VP'", {"num": 1, "fin": "+", "gap": 3})]));

    // PS 4
    // NOTE(goto): this is slightly different in that the "num" variable
    // is tied to the same variable rather than a different one. This
    // may be a typo in the paper.
    grammar.push(phrase(term("VP'", {"num": 1, "fin": "+", "gap": 2}),
                        [term("AUX", {"num": 1, "fin": "+"}),
                         space(),
                         literal("not"),
                         space(),
                         term("VP", {"num": 1, "fin": "-", "gap": 2})]));

    // PS 5
    grammar.push(phrase(term("VP'", {"num": 1, "fin": "+", "gap": 2}),
                        [term("VP", {"num": 1, "fin": "+", "gap": 2})]));

    // PS 6
    grammar.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                        [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                         term("WS", {"gap": 3}),
                         term("NP'", {"num": 3, "gen": 4, "case": "-nom", "gap": 3})]));

    grammar.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                        [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                         space(),
                         term("NP'", {"num": 3, "gen": 4, "case": "-nom", "gap": "-"})]));

    // PS 7
    grammar.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                        [term("V", {"num": 1, "fin": 2, "trans": "-"})]));

    // PS 8
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": 1}),
                        [term("GAP")]));

    // page 36 makes a simplification, which we introduce back manually:
    // The intended meaning is that the left-hand side can have either of 
    // the case values +nom and -nom. 

    // PS 9
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                        [term("DET", {"num": 1}), 
                         space(),
                         term("N", {"num": 1, "gen": 2})]));

    // PS 10
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                        [term("PN", {"num": 1, "gen": 2})]));

    // PS 11
    grammar.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                        [term("PRO", {"num": 1, "gen": 2, "case": 3})]));

    // PS 12
    grammar.push(phrase(term("NP'", {"num": "plur", "gen": 1, "case": 2, "gap": "-"}),
                        [term("NP", {"num": 3, "gen": 1, "case": 2, "gap": "-"}),
                         space(),
                         literal("and"),
                         space(),
                         term("NP", {"num": 4, "gen": 1, "case": 2, "gap": "-"})]));

    grammar.push(phrase(term("NP'", {"num": "plur", "gen": "-hum", "case": 2, "gap": "-"}),
                        [term("NP", {"num": 3, "gen": 5, "case": 2, "gap": "-"}),
                         space(),
                         literal("and"),
                         space(),
                         term("NP", {"num": 4, "gen": 6, "case": 2, "gap": "-"})]));

    // PS 12.5
    grammar.push(phrase(term("NP'", {"num": 1, "gen": 2, "case": 3, "gap": 4}),
                        [term("NP", {"num": 1, "gen": 2, "case": 3, "gap": 4})]));


    // PS 13
    grammar.push(phrase(term("N", {"num": 1, "gen": 2}),
                        [term("N", {"num": 1, "gen": 2}),
                         space(),
                         term("RC", {"num": 1, "gen": 2})]));
    // PS 14
    // NOTE(goto): this is in slight disagreement with the book, because it is forcing
    // the sentence to agree with the relative clause number feature to disallow the
    // following example:
    // A stockbroker who DO not love her likes him.
    grammar.push(phrase(term("RC", {"num": 1, "gen": 2}),
                        [term("RPRO", {"num": 1, "gen": 2}),
                         space(),
                         term("S", {"num": 1, "gap": 1})]));

    // LI 1
    grammar.push(rule(term("DET", {"num": ["sing"]}),
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

    //console.log(print(grammar[grammar.length - 1]));
    //console.log(grammar.length);
    //return;

    // LI 7
    grammar.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "+nom"}),
                      [[literal("they")]]));

    // LI 8
    grammar.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "-nom"}),
                      [[literal("them")]]));

    // LI 9
    grammar.push(rule(term("PN", {"num": "sing", "gen": "male"}),
                      [[literal("Jones")], [literal("John")]]));

    // LI 10
    grammar.push(rule(term("PN", {"num": "sing", "gen": "fem"}),
                      [[literal("Mary")], [literal("Anna")]]));

    // LI 11
    grammar.push(rule(term("PN", {"num": "sing", "gen": "-hum"}),
                      [[literal("Brazil")], [literal("Italy")]]));

    // LI 12
    grammar.push(rule(term("N", {"num": "sing", "gen": "male"}),
                      [[literal("stockbroker")], [literal("man")]]));

    // LI 13
    grammar.push(rule(term("N", {"num": "sing", "gen": "fem"}),
                      [[literal("stockbroker")], [literal("woman")], [literal("widow")]]));

    // LI 14
    grammar.push(rule(term("N", {"num": "sing", "gen": "-hum"}),
                      [[literal("book")], [literal("donkey")], [literal("horse")]]));

    // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
    // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
    // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.

    // LI 15
    grammar.push(rule(term("AUX", {"num": "sing", "fin": "+"}),
                      [[literal("does")]]));

    // LI 16
    grammar.push(rule(term("AUX", {"num": "plur", "fin": "+"}),
                      [[literal("do")]]));

    // Verbs in their inifinitive form.
    const transitive = ["like", "love", "know", "own", "fascinate", "rotate", "surprise"];
    const intransitive = ["love", "stink"];

    // LI 17
    grammar.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "+"}),
                      transitive.map((verb) => [literal(verb)])));

    // LI 18
    // Manually expanding into the transitivity.
    grammar.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "-"}),
                      intransitive.map((verb) => [literal(verb)])));

    // LI 19
    // Manually expanding into the present / third person.
    // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
    // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
    // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
    // It seems like the same applies to verbs:
    // https://parentingpatch.com/third-person-singular-simple-present-verbs/
    grammar.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "+"}),
                      transitive.map((verb) => [literal(verb + "s")])
                      ));

    grammar.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "-"}),
                      intransitive.map((verb) => [literal(verb + "s")])
                      ));

    // LI 20
    // Manually expanding into the present / plural.
    // > Except for the verb be, plural verb forms we want here - i.e. the third person plural of the
    // > present tense - are identical with the infinitival forms, which we already have (They were needed
    // > for negation). 
    grammar.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "+"}),
                      transitive.map((verb) => [literal(verb)])));
    grammar.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "-"}),
                      intransitive.map((verb) => [literal(verb)])));

    // LI 21
    grammar.push(rule(term("RPRO", {"num": ["sing", "plur"], "gen": ["male", "fem"]}),
                      [[literal("who")]]));
    // LI 22
    grammar.push(rule(term("RPRO", {"num": ["sing", "plur"], "gen": "-hum"}),
                      [[literal("which")]]));

    // GAP
    grammar.push(rule(term("GAP"),
                      [["null"]]));

    const fs = require("fs");
    fs.writeFileSync("./tests/grammar.ne", compile(clone(grammar)));

    assertThat(grammar.length).equalsTo(44);

    let i = 0;
    assertThat(print(grammar[i++]))
     .equalsTo('Sentence -> S[num=@1] _ "."');
    assertThat(print(grammar[i++]))
     .equalsTo('S[num=@1] -> NP\'[num=@1, gen=@2, case=+nom, gap=-] __ VP\'[num=@1, fin=+, gap=-]');
    assertThat(print(grammar[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, gen=@2, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(grammar[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@3, gen=@2, case=+nom, gap=@3] WS[gap=@3] VP'[num=@1, fin=+, gap=-]");
    assertThat(print(grammar[i++]))
     .equalsTo("S[num=@1, gap=@3] -> NP\'[num=@1, gen=@2, case=+nom, gap=-] __ VP'[num=@1, fin=+, gap=@3]");
    assertThat(print(grammar[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> AUX[num=@1, fin=+] __ \"not\" __ VP[num=@1, fin=-, gap=@2]");
    assertThat(print(grammar[i++]))
     .equalsTo("VP'[num=@1, fin=+, gap=@2] -> VP[num=@1, fin=+, gap=@2]");
    assertThat(print(grammar[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=@3] -> V[num=@1, fin=@2, trans=+] WS[gap=@3] NP\'[num=@3, gen=@4, case=-nom, gap=@3]");
    assertThat(print(grammar[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=+] __ NP\'[num=@3, gen=@4, case=-nom, gap=-]");
    assertThat(print(grammar[i++]))
     .equalsTo("VP[num=@1, fin=@2, gap=-] -> V[num=@1, fin=@2, trans=-]");
    assertThat(print(grammar[i++]))
     .equalsTo('NP[num=@1, gen=@2, case=@3, gap=@1] -> GAP')
    assertThat(print(grammar[i++]))
     .equalsTo("NP[num=@1, gen=@2, case=@3, gap=-] -> DET[num=@1] __ N[num=@1, gen=@2]")
    assertThat(print(grammar[i++]))
     .equalsTo("NP[num=@1, gen=@2, case=@3, gap=-] -> PN[num=@1, gen=@2]")
    assertThat(print(grammar[i++]))
     .equalsTo('NP[num=@1, gen=@2, case=@3, gap=-] -> PRO[num=@1, gen=@2, case=@3]');
    assertThat(print(grammar[i++]))
     .equalsTo('NP\'[num=plur, gen=@1, case=@2, gap=-] -> NP[num=@3, gen=@1, case=@2, gap=-] __ "and" __ NP[num=@4, gen=@1, case=@2, gap=-]');
    assertThat(print(grammar[i++]))
     .equalsTo('NP\'[num=plur, gen=-hum, case=@2, gap=-] -> NP[num=@3, gen=@5, case=@2, gap=-] __ "and" __ NP[num=@4, gen=@6, case=@2, gap=-]');
    assertThat(print(grammar[i++]))
     .equalsTo("NP'[num=@1, gen=@2, case=@3, gap=@4] -> NP[num=@1, gen=@2, case=@3, gap=@4]");
    assertThat(print(grammar[i++]))
     .equalsTo('N[num=@1, gen=@2] -> N[num=@1, gen=@2] __ RC[num=@1, gen=@2]');
    assertThat(print(grammar[i++]))
     .equalsTo('RC[num=@1, gen=@2] -> RPRO[num=@1, gen=@2] __ S[num=@1, gap=@1]');
    assertThat(print(grammar[i++]))
     .equalsTo('DET[num=sing] -> "a" "every" "the" "some"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=sing, gen=male, case=+nom] -> "he"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=sing, gen=male, case=-nom] -> "him"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=sing, gen=fem, case=+nom] -> "she"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=sing, gen=fem, case=-nom] -> "her"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=sing, gen=-hum, case=-nom/+nom] -> "it"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=+nom] -> "they"');
    assertThat(print(grammar[i++]))
     .equalsTo('PRO[num=plur, gen=male/fem/-hum, case=-nom] -> "them"');
    assertThat(print(grammar[i++]))
     .equalsTo('PN[num=sing, gen=male] -> "Jones" "John"');
    assertThat(print(grammar[i++]))
     .equalsTo('PN[num=sing, gen=fem] -> "Mary" "Anna"');
    assertThat(print(grammar[i++]))
     .equalsTo('PN[num=sing, gen=-hum] -> "Brazil" "Italy"');
    assertThat(print(grammar[i++]))
     .equalsTo('N[num=sing, gen=male] -> "stockbroker" "man"');
    assertThat(print(grammar[i++]))
     .equalsTo('N[num=sing, gen=fem] -> "stockbroker" "woman" "widow"');
    assertThat(print(grammar[i++]))
     .equalsTo('N[num=sing, gen=-hum] -> "book" "donkey" "horse"');
    assertThat(print(grammar[i++]))
     .equalsTo('AUX[num=sing, fin=+] -> "does"');
    assertThat(print(grammar[i++]))
     .equalsTo('AUX[num=plur, fin=+] -> "do"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=+] -> "like" "love" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=sing/plur, fin=-, trans=-] -> "love" "stink"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=sing, fin=+, trans=+] -> "likes" "loves" "knows" "owns" "fascinates" "rotates" "surprises"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=sing, fin=+, trans=-] -> "loves" "stinks"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=plur, fin=+, trans=+] -> "like" "love" "know" "own" "fascinate" "rotate" "surprise"');
    assertThat(print(grammar[i++]))
     .equalsTo('V[num=plur, fin=+, trans=-] -> "love" "stink"');
    assertThat(print(grammar[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=male/fem] -> "who"');
    assertThat(print(grammar[i++]))
     .equalsTo('RPRO[num=sing/plur, gen=-hum] -> "which"');
    assertThat(print(grammar[i++]))
     .equalsTo('GAP -> null');
    
    // "case" makes the distinction between "nominative case"
    // and "non-nominative case", respectively, he/she and
    // him/her.

    // "fin" makes the distinction between "infinitival" and
    // "finite" verb forms (- and +, respectively). 
    // "infinitival" verb forms are used with negations.

    // console.log(compile(grammar));
  });

  function node(type, ...children) {
   return {"@type": type, "children": children} 
  }

  let S = (...children) => node("S", ...children);
  let NP = (...children) => node("NP", ...children);
  let NP_ = (...children) => node("NP'", ...children);
  let PN = (...children) => node("PN", ...children);
  let VP_ = (...children) => node("VP'", ...children);
  let VP = (...children) => node("VP", ...children);
  let V = (...children) => node("V", ...children);
  let DET = (...children) => node("DET", ...children);
  let N = (...children) => node("N", ...children);
  let PRO = (...children) => node("PRO", ...children);
  let AUX = (...children) => node("AUX", ...children);
  let RC = (...children) => node("RC", ...children);
  let RPRO = (...children) => node("RPRO", ...children);
  let GAP = (...children) => node("GAP", ...children);
  let Discourse = (...children) => node("Discourse", ...children);
  let Sentence = (...children) => node("Sentence", ...children);

  function clean(node) {
   if (Array.isArray(node)) {
    for (let entry of node) {
     if (entry) {
      clean(entry);
     }
    }
   } else if (typeof node == "object") {
    delete node.types;
    clean(node.children);
   }
   return node;
  }

  function parse(source) {
   const parser = new Parser(ParserRules, ParserStart, {
     keepHistory: true
    });
   parser.feed(source);
   return parser.results;
  }

  function first(results) {
   return clean(clone(results[0].children[0]).children[0]);
  }

  it("parse", function() {
    assertThat(first(parse("Jones loves.")))
     .equalsTo(S(NP_(NP(PN("Jones"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("Mary loves.")))
     .equalsTo(S(NP_(NP(PN("Mary"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("Anna loves.")))
     .equalsTo(S(NP_(NP(PN("Anna"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("John stinks.")))
     .equalsTo(S(NP_(NP(PN("John"))),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("a man loves.")))
     .equalsTo(S(NP_(NP(DET("a"), N("man"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("every donkey stinks.")))
     .equalsTo(S(NP_(NP(DET("every"), N("donkey"))),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("the woman loves.")))
     .equalsTo(S(NP_(NP(DET("the"), N("woman"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("he loves.")))
     .equalsTo(S(NP_(NP(PRO("he"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("she loves.")))
     .equalsTo(S(NP_(NP(PRO("she"))),
                 VP_(VP(V("loves")))));
    assertThat(first(parse("it stinks.")))
     .equalsTo(S(NP_(NP(PRO("it"))),
                 VP_(VP(V("stinks")))));
    assertThat(first(parse("it does not stink.")))
     .equalsTo(S(NP_(NP(PRO("it"))),
                 VP_(AUX("does"), "not", VP(V("stink")))));
    assertThat(first(parse("the book does not stink.")))
     .equalsTo(S(NP_(NP(DET("the"), N("book"))),
                 VP_(AUX("does"), "not", VP(V("stink")))));
    assertThat(first(parse("he loves her.")))
     .equalsTo(S(NP_(NP(PRO("he"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("she loves the book.")))
     .equalsTo(S(NP_(NP(PRO("she"))),
                 VP_(VP(V("loves"), NP_(NP(DET("the"), N("book")))))));
    assertThat(first(parse("every man loves her.")))
     .equalsTo(S(NP_(NP(DET("every"), N("man"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("every man loves John.")))
     .equalsTo(S(NP_(NP(DET("every"), N("man"))),
                 VP_(VP(V("loves"), NP_(NP(PN("John")))))));
    assertThat(first(parse("she does not love.")))
     .equalsTo(S(NP_(NP(PRO("she"))),
                 VP_(AUX("does"), "not", VP(V("love")))));
    assertThat(first(parse("she does not love him.")))
     .equalsTo(S(NP_(NP(PRO("she"))),
                  VP_(AUX("does"), "not", 
                      VP(V("love"), NP_(NP(PRO("him")))))));
    assertThat(first(parse("John does not like the book.")))
     .equalsTo(S(NP_(NP(PN("John"))),
                 VP_(AUX("does"), "not", 
                     VP(V("like"), NP_(NP(DET("the"), N("book")))))));
    // There are three interpretations to this phrase because
    // "they" can have three genders: male, female or non-human.
    // assertThat(parse("they love him.").length).equalsTo(3);
    // We just check the first one because we ignore types, but 
    // all are valid ones.
    assertThat(first(parse("they love him.")))
     .equalsTo(S(NP_(NP(PRO("they"))),
                 VP_(VP(V("love"), NP_(NP(PRO("him")))))));
    assertThat(first(parse("they do not love him.")))
     .equalsTo(S(NP_(NP(PRO("they"))),
                 VP_(AUX("do"), "not", VP(V("love"), NP_(NP(PRO("him")))))
                 ));
    assertThat(first(parse("they do not love the book.")))
     .equalsTo(S(NP_(NP(PRO("they"))),
                 VP_(AUX("do"), "not", 
                     VP(V("love"), NP_(NP(DET("the"), N("book")))))
                 ));
    
    // This has three possible interpretations, because "he and she"
    // has 3 gender values: male, fem and -hum.
    // TODO(goto): when both sides agree, we should probably make
    // the rule agree too.
    assertThat(first(parse("he and she love her.")))
     .equalsTo(S(NP_(NP(PRO("he")), "and", NP(PRO("she"))),
                 VP_(VP(V("love"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("they love him and her.")))
     .equalsTo(S(NP_(NP(PRO("they"))),
                 VP_(VP(V("love"), 
                        NP_(NP(PRO("him")), "and", NP(PRO("her")))
                        ))));
    assertThat(first(parse("every man loves a book and a woman.")))
     .equalsTo(S(NP_(NP(DET("every"), N("man"))),
                 VP_(VP(V("loves"), 
                        NP_(NP(DET("a"), N("book")), "and", NP(DET("a"), N("woman")))
                        ))));
    assertThat(first(parse("Brazil loves her.")))
     .equalsTo(S(NP_(NP(PN("Brazil"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("Brazil loves Italy.")))
     .equalsTo(S(NP_(NP(PN("Brazil"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Italy")))))));
    assertThat(first(parse("every man loves Italy and Brazil.")))
     .equalsTo(S(NP_(NP(DET("every"), N("man"))),
                    VP_(VP(V("loves"), 
                           NP_(NP(PN("Italy")), "and", NP(PN("Brazil")))
                           ))));

    // TODO(goto): investigate why there are 12 possible interpretations.
    // This is possibly related to the expansions of gender / number.
    // assertThat(first(parse("Anna loves a man who loves her.")).length).equalsTo(12);
    assertThat(first(parse("Anna loves a man who loves her.")))
     .equalsTo(S(NP_(NP(PN("Anna"))),
                 VP_(VP(V("loves"),
                        NP_(NP(DET("a"), 
                               N(N("man"), 
                                 RC(RPRO("who"), 
                                    S(NP_(NP(GAP())), VP_(VP(V("loves"), NP_(NP(PRO("her"))))))
                                    ))))))));
    
    // assertThat(first(parse("Anna loves a book which surprises her.")).length).equalsTo(12);
    assertThat(first(parse("Anna loves a book which surprises her.")))
     .equalsTo(S(NP_(NP(PN("Anna"))),
                 VP_(VP(V("loves"),
                        NP_(NP(DET("a"), 
                               N(N("book"), 
                                 RC(RPRO("which"), 
                                    S(NP_(NP(GAP())), VP_(VP(V("surprises"), NP_(NP(PRO("her"))))))
                                    ))))))));

    assertThat(first(parse("Every book which she loves  surprises him.")))
     .equalsTo(S(NP_(NP(DET("Every"), 
                        N(N("book"), RC(RPRO("which"), 
                                        S(NP_(NP(PRO("she"))),
                                          VP_(VP(V("loves"), NP_(NP(GAP())))))
                                        )))),
                 VP_(VP(V("surprises"), NP_(NP(PRO("him"))))
                     )));

    assertThat(first(parse("Every man who knows her loves her.")))
     .equalsTo(S(NP_(NP(DET("Every"), 
                        N(N("man"), RC(RPRO("who"), 
                                       S(NP_(NP(GAP())),
                                         VP_(VP(V("knows"), NP_(NP(PRO("her"))))))
                                       )))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))
                 ));


    assertThat(first(parse("A stockbroker who does not love her surprises him.")))
     .equalsTo(S(NP_(NP(DET("A"),
                        N(N("stockbroker"), RC(RPRO("who"), 
                                               S(NP_(NP(GAP())),
                                                 VP_(AUX("does"), "not", VP(V("love"), NP_(NP(PRO("her"))))))
                                               )))),
                 VP_(VP(V("surprises"), NP_(NP(PRO("him")))))
                 ));

   });

  it("errors", function() {
    assertThat("foo").failsAt(0, "f");
    assertThat("A stockbroker who do not love her surprises him.").failsAt(20, " ");
  });

  it("debug", function() {
    parse("Anna loves a man who loves her.");
    parse("Every book which she loves surprises him.");
    parse("A stockbroker who does not love her surprises him.");
    parse("A stockbroker who Sam likes loves him.");
  });

  it("discourse", function() {
    assertThat(clean(parse("Anna loves John. John loves Anna. A man loves her.")[0]))
     .equalsTo(Discourse(Sentence(S(NP_(NP(PN("Anna"))),
                                    VP_(VP(V("loves"), NP_(NP(PN("John"))))))
                                  ),
                         Sentence(S(NP_(NP(PN("John"))),
                                    VP_(VP(V("loves"), NP_(NP(PN("Anna"))))))
                                  ),
                         Sentence(S(NP_(NP(DET("A"), N("man"))),
                                    VP_(VP(V("loves"), NP_(NP(PRO("her"))))))
                                  )
                         ));
   });

  it("extensible proper names", function() {
    assertThat(first(parse("Sam loves her.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PRO("her")))))));
    assertThat(first(parse("Sam loves Dani.")))
     .equalsTo(S(NP_(NP(PN("Sam"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani")))))));
    assertThat(first(parse("Sam and Dani love Anna and Leo.")))
     .equalsTo(S(NP_(NP(PN("Sam")), "and", NP(PN("Dani"))),
                 VP_(VP(V("love"), 
                        NP_(NP(PN("Anna")), "and", NP(PN("Leo")))
                        ))));
    assertThat(first(parse("Sam Goto loves Dani Fonsechi.")))
     .equalsTo(S(NP_(NP(PN("Sam Goto"))),
                 VP_(VP(V("loves"), NP_(NP(PN("Dani Fonsechi")))))));
  });

  it("autocomplete", function() {
   const parser = new Parser(ParserRules, ParserStart, {
     keepHistory: true
    });
   parser.feed("");
   // console.log(parser.table[0].states);
   // for (let row of parser.table) {
   //  console.log(row.wants);
   // }
  });


  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    },
    failsAt(offset, token) {
     try {
      parse(x);
      throw Error("expected failure");
     } catch (e) {
      // console.log(e);
      assertThat(e.offset).equalsTo(offset);
      assertThat(e.token.value).equalsTo(token);
     }
    }
   }
  }

});

