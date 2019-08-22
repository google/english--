const Assert = require("assert");
const peg = require("pegjs");

const nearley = require("nearley");
const grammar = require("./grammar.js");

const {S, VP, NP, PN, V, PRO, DET, N, AND} = require("./ast.js");

describe.only("DRT", function() {

  function expand2(rule) {
   // console.log(rule);
   // return;
   let vars = {};
   let {head, tail} = rule;

   let capture = (types) =>
    Object
    .entries(types)
    .filter(([key, value]) => value == -1 || Array.isArray(value))
    .map(([key, value]) => vars[key] = value);
     
   // capture(rule.head.types);

   for (let term of tail) {
    if (term["@type"] == "Literal") {
     continue;
    }
    term
     .filter((term) => term["@type"] == "Term")
     .map(({types}) => capture(types));
   }

   // console.log(vars);

   // return;

   let {num, gen, caze, fin, gap, trans} = vars;

   let dims = [];
   // num
   dims.push(num == -1 ? ["s", "p"] : (num ? num : ["_"]));
   // gen
   dims.push(gen == -1 ? ["m", "f", "h"] : (gen ? gen : ["_"]));
   // case
   dims.push(caze == -1 ? ["p", "m"] : (caze ? caze : ["_"]));
   // fin
   dims.push(fin == -1 ? ["p", "m"] : (fin ? fin : ["_"]));
   // gap
   dims.push(gap == -1 ? ["p", "m"] : (gap ? gap : ["_"]));
   // trans
   dims.push(trans == -1 ? ["p", "m"] : (trans ? trans : ["_"]));
   
   let pop = (a) => {};

   let replace = (rule, fix) => {
    let result = JSON.parse(JSON.stringify(rule));
    for (let [key, value] of Object.entries(rule.head.types)) {
     if (value == -1) {
      result.head.types[key] = fix[key];
     }
    }
    for (let line of result.tail) {
     for (let term of line) {
      for (let [key, value] of Object.entries(term.types)) {
       if (value == -1) {
        term.types[key] = fix[key];
       }
      }
     }
    }
    return result;
   };

   let result = [];

   for (let num of dims[0]) {
    for (let gen of dims[1]) {
     for (let caze of dims[2]) {
      for (let fin of dims[3]) {
       for (let gap of dims[4]) {
        for (let trans of dims[5]) {
         result.push(replace(rule, {
            num: num, 
            gen: gen, 
            caze: caze, 
            fin: fin, 
            gap: gap, 
            trans: trans
         }));
        }
       }
      }
     }
    }
   }

   return result;
  }


  let l = (value) => { return literal(value); };
  let space = (space) => { return {"@type": "Space"} };
  let rule = (head = {}, tail = []) => { return {"@type": "Rule", head: head, tail: tail}};
  let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
  let literal = (value) => { return {"@type": "Literal", name: value} };
  let phrase = (head, tail) => { return rule(head, [tail]); };
  let name = (term) => {
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
   return result;
  }
  let print = ({head, tail}) => {
   let result = "";
   result += name(head) + " ->";
   for (let line of tail) {
    for (let term of line) {
     result += " " + name(term);
    }
   }
   return result;
  }

  it("Expand var", function() {
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

  it("Expand", function() {
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
    if (!rule.head.types) {
     continue;
    } else if (Number.isInteger(rule.head.types[key])) {
     vars[rule.head.types[key]] = FEATURES[key];
    } else if (Array.isArray(rule.head.types[key])) {
     vars[`${ids}`] = rule.head.types[key];
     rule.head.types[key] = ids;
     ids--;
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

  it("Collect", function() {
    let rule = phrase(term("VP", {"num": 1}),
                      [term("V", {"num": 1}),
                       term("NP", {"num": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[num=@1] -> V[num=@1] NP[num=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["sing", "plur"], "2": ["sing", "plur"]});
  });

  it("Collects case", function() {
    let rule = phrase(term("VP", {"case": 1}),
                      [term("V", {"case": 1}),
                       term("NP", {"case": 2})]);

    assertThat(print(rule))
     .equalsTo("VP[case=@1] -> V[case=@1] NP[case=@2]");
    assertThat(collect(rule))
     .equalsTo({"1": ["+nom", "-nom"], "2": ["+nom", "-nom"]});
  });

  it("Collects array", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    assertThat(print(rule))
     .equalsTo("PRO[num=sing, case=-nom/+nom] -> it");
    assertThat(collect(rule)).equalsTo({"-1": ["-nom", "+nom"]});
    // console.log(rule);
    assertThat(print(rule))
     .equalsTo("PRO[num=sing, case=@-1] -> it");
  });

  function replace(rule, vars) {
   let result = clone(rule);

   for (let [feature, values] of Object.entries(FEATURES)) {
    if (Number.isInteger(result.head.types[feature])) {
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

  it("Generate", function() {
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

  it("Generate with case", function() {
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

  it("Generate with fixed values", function() {
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

  it("Generate with two types", function() {
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

  it("Generate with two types and two variables", function() {
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

  it("Generate with array values", function() {
    let rule = phrase(term("PRO", {"num": "sing", "case": ["-nom", "+nom"]}),
                      [literal("it")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo("PRO[num=sing, case=-nom] -> it");
    assertThat(print(result[1]))
     .equalsTo("PRO[num=sing, case=+nom] -> it");
  });

  it("Gender", function() {
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

  it("Transitive verbs", function() {
    let rule = phrase(term("V", {"num": "sing", "trans": "-"}),
                      [literal("likes")]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(1);

    assertThat(print(result[0]))
     .equalsTo("V[num=sing, trans=-] -> likes");
  });

  it("Fin", function() {
    let rule = phrase(term("VP", {"fin": 1}),
                      [term("V", {"fin": 1})]);

    let result = generate(rule);

    assertThat(result.length).equalsTo(2);

    assertThat(print(result[0]))
     .equalsTo("VP[fin=+] -> V[fin=+]");
    assertThat(print(result[1]))
     .equalsTo("VP[fin=-] -> V[fin=-]");
  });

  it.skip("Expand two vars", function() {
    let rule = phrase(term("VP", {"num": -1}),
                      [term("V", {"num": -1}),
                       term("NP", {"num": -2})]);

    assertThat(print(rule)).equalsTo("VP[num=A] -> V[num=A] NP[num=B]");

    // console.log(JSON.stringify(rule, undefined, 2));

    function* expand(rule) {
     let result = clone(rule);
     if (result.head.types.num < 0) {
      for (let num of ["S", "P"]) {
       let tmp = clone(result);
       for (let line of tmp.tail) {
        for (let term of line) {
         if (term.types.num == result.head.types.num) {
          term.types.num = num;
         }
        }
       }
       tmp.head.types.num = num;
       yield* expand(tmp);
      }
      return;
     }

     for (let line of result.tail) {
      for (let term of line) {
       if (term.types.num < 0) {
        for (let num of ["S", "P"]) {
         for (let line2 of tmp.tail) {
          for (let term2 of line) {
           if (term2.types.num == term.types.num) {
            term2.types.num = num;
           }
          }
         }
         term.types.num = num;
         yield* expand(tmp);
        }
        return;
       }
      }
     }

     yield rule;
    }

    let result = [];

    for (let r of expand(rule)) {
     console.log(print(r));
     // result.push(r);
    }

    return;

    assertThat(result.length).equalsTo(4);
    assertThat(print(result[0])).equalsTo("VP[num=S] -> V[num=P] NP[num=P]");
    assertThat(print(result[1])).equalsTo("VP[num=S] -> V[num=P] NP[num=P]");
    assertThat(print(result[2])).equalsTo("VP[num=P] -> V[num=P] NP[num=P]");
    assertThat(print(result[3])).equalsTo("VP[num=P] -> V[num=P] NP[num=P]");
    return;

    let rules = expand(rule);

    assertThat(rules.length).equalsTo(2);
    assertThat(print(rules[0])).equalsTo("VP[num=s] -> V[num=s] NP[num=B]");
    assertThat(print(rules[1])).equalsTo("VP[num=p] -> V[num=p] NP[num=B]");
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

  it.skip("tests", function() {
    const grammar = require("./foo.js");

    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed("Smith stinks");
    let node = (type, ...children) => { return {"@type": type, children: children} };
    assertThat(parser.results)
     .equalsTo([node("S", 
                     node("NP", 
                          node("PN", "Smith")),
                     node("VP_", 
                          node("VP", 
                               node("V", "stinks"))))
                ]);
  });

  it.skip("nearly", function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed("foo\n");
    assertThat(parser.results).equalsTo([[[[["foo"], "\n"] ]]]);
  });

  function parse(code) {
   const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
   parser.feed(code);
   return parser.results;
  }

  it("basic", function() { 
   assertThat(parse("Jones likes Mary."))
     .equalsTo([S(NP(PN("Jones")), 
                  VP(V("likes"), 
                     NP(PN("Mary"))))]);
    assertThat(parse("Mary likes Jones."))
     .equalsTo([S(NP(PN("Mary")), 
                  VP(V("likes"), 
                     NP(PN("Jones"))))]);
    assertThat(parse("Mary likes him."))
     .equalsTo([S(NP(PN("Mary")), 
                  VP(V("likes"), 
                     NP(PRO("him"))))]);
    assertThat(parse("she likes him."))
     .equalsTo([S(NP(PRO("she")), 
                  VP(V("likes"), 
                     NP(PRO("him"))))]);
    assertThat(parse("she likes every car."))
     .equalsTo([S(NP(PRO("she")), 
                  VP(V("likes"), 
                     NP(DET("every"), N("car"))))]);
    assertThat(parse("a man likes a woman."))
     .equalsTo([S(NP(DET("a"), N("man")), 
                  VP(V("likes"), 
                     NP(DET("a"), N("woman"))))]);

    assertThat(parse("a man likes a woman and a car."))
     .equalsTo([S(NP(DET("a"), N("man")), 
                 VP(V("likes"), 
                    NP(AND(NP(DET("a"), N("woman")),
                           NP(DET("a"), N("car")))
                       )))]);
    assertThat(parse("a man and a woman likes a car."))
     .equalsTo([S(NP(AND(NP(DET("a"), N("man")),
                         NP(DET("a"), N("woman")))
                     ), 
                  VP(V("likes"), 
                     NP(DET("a"), N("car"))
                     ))]);
    

   });
   
  it("basic", function() {
    const parser = peg.generate(`
      S = "foo" /
          "bar"                                
    `);
    assertThat(parser.parse("foo")).equalsTo("foo");
    assertThat(parser.parse("bar")).equalsTo("bar");
  });

  it("S = NP VP", function() {
    const parser = peg.generate(`
      S = np:NP vp:VP PERIOD {return {"@type": "Sentence", np: np, vp: vp}}
      VP = v:V np:NP { return {"@type": "VerbPhrase", verb: v, np: np}; }
      NP = pn:PN { return { "@type": "NounPhrase", children: [pn]}; } /
           pro:PRO { return { "@type": "NounPhrase", children: [pro]}; } /
           det:DET n:N { return { "@type": "NounPhrase", children: [det, n]}; }

      PN = _ name:names _ { return {"@type": "ProperName", "name": name} }
      V = _ name:verbs _ { return {"@type": "Verb", "name": name} }
      N = _ name:nouns _ { return {"@type": "Noun", "name": name} }

      PRO = _ name:pronous _ { return {"@type": "Pronoun", "name": name} }
      DET = _ name:determiners _ { return {"@type": "Determiner", "name": name} }

      _ = [ ]*

      PERIOD = _ "." _

      names = "Jones" /
              "Mary"

      verbs = "likes" /
              "loves"

      nouns = "book" /
              "man" /
              "woman" /
              "donkey" /
              "car"

      determiners = "a" / "every" / "the" / "some" / "all" / "most"

      pronous = "he" / "him" / "she" / "her" / "it" / "they"

    `);
    assertThat(parser.parse("Jones loves Mary."))
     .equalsTo(S(NP(PN("Jones")), 
                 VP(V("loves"), 
                    NP(PN("Mary")))));
    assertThat(parser.parse("Mary likes Jones."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PN("Jones")))));
    assertThat(parser.parse("Mary likes him."))
     .equalsTo(S(NP(PN("Mary")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
    assertThat(parser.parse("she likes him."))
     .equalsTo(S(NP(PRO("she")), 
                 VP(V("likes"), 
                    NP(PRO("him")))));
    assertThat(parser.parse("she likes every car."))
     .equalsTo(S(NP(PRO("she")), 
                 VP(V("likes"), 
                    NP(DET("every"), N("car")))));
    assertThat(parser.parse("a man likes a woman."))
     .equalsTo(S(NP(DET("a"), N("man")), 
                 VP(V("likes"), 
                    NP(DET("a"), N("woman")))));
   });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.deepEqual(x, y);
    }
   }
  }

});

