const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./english.js");

let l = (value) => { return literal(value); };
let space = (optional = false) => { return optional ? "_" : "__"};
let rule = (head = {}, tail = [], skip = false) => { return {"@type": "Rule", head: head, tail: tail, skip: skip}};
let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
let literal = (value) => { return {"@type": "Literal", name: value} };
let phrase = (head, tail, skip) => { return rule(head, [tail], skip); };

function name(term, pretty) {
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
 
function print({head, tail}, pretty = false) {
 let result = "";
 result += name(head, pretty) + " ->";
 for (let line of tail) {
  for (let term of line) {
   result += " " + name(term, pretty);
  }
 }
 return result;
}

function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

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
    
    let prod = processor(expansion);
    if (rule.skip) {
     prod = `(args) => args.length == 1 ? args[0] : (${processor(expansion, rule.skip)})(args)`;
    }
    rules[head].push([list.join(" "), prod]);
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
  //result.push("");
  //result.push("# extensible proper names");
  //let names = rule(term("PN", {"num": "sing", "gen": 1}),
  //                 [["FULLNAME"]]);
  //for (let exp of generate(names)) {
  // result.push(`${print(exp, true)} {% ${processor(exp)} %}`);
  //}
  //result.push(`FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}`);
  //result.push(`NAME -> [A-Z]:+ [a-z]:+ {% ([a, b]) => a.join("") + b.join("") %}`);
  
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

function processor(rule, name) {
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
 result.push(`"${name ? name : rule.head.name}", ${JSON.stringify(rule.head.types || {})}, args`);
 result.push(")");
 return result.join("");
}

function parse(source, start = "Sentence") {
 const parser = new Parser(ParserRules, start, {
   keepHistory: true
  });
 parser.feed(source);
 return parser.results;
}

function grammar() {
 let result = [];

 // Root
 result.push(phrase(term("Sentence"),
                     [term("S", {"num": 1}), 
                      space(true),
                      '"."']));

 // PS 1
 result.push(phrase(term("S", {"num": 1}),
                     [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": "-"}),
                      space(),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));
 
 // PS 2
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": 3}),
                      term("WS", {"gap": 3}),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));
 
 // PS 2.5
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 3, "gen": 2, "case": "+nom", "gap": 3}),
                      term("WS", {"gap": 3}),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));

 // PS 3
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 1, "gen": 2, "case": "+nom", "gap": "-"}),
                      space(),
                      term("VP'", {"num": 1, "fin": "+", "gap": 3})]));
 
 // PS 4
 // NOTE(goto): this is slightly different in that the "num" variable
 // is tied to the same variable rather than a different one. This
 // may be a typo in the paper.
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "gap": 2}),
                     [term("AUX", {"num": 1, "fin": "+"}),
                      space(),
                      literal("not"),
                      space(),
                      term("VP", {"num": 1, "fin": "-", "gap": 2})]));
 
 // PS 5
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "gap": 2}),
                     [term("VP", {"num": 1, "fin": "+", "gap": 2})]));

 // PS 6
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                     [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                      term("WS", {"gap": 3}),
                      term("NP'", {"num": 3, "gen": 4, "case": "-nom", "gap": 3})]));
 
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                     [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                      space(),
                      term("NP'", {"num": 3, "gen": 4, "case": "-nom", "gap": "-"})]));
 
 // PS 7
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                     [term("V", {"num": 1, "fin": 2, "trans": "-"})]));
 
 // PS 8
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": 1}),
                     [term("GAP")]));
 
 // page 36 makes a simplification, which we introduce back manually:
 // The intended meaning is that the left-hand side can have either of 
 // the case values +nom and -nom. 
 
 // PS 9
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                     [term("DET", {"num": 1}), 
                      space(),
                      term("N", {"num": 1, "gen": 2})]));
 
 // PS 10
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                     [term("PN", {"num": 1, "gen": 2})]));
 
 // PS 11
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                     [term("PRO", {"num": 1, "gen": 2, "case": 3})]));
 
 // PS 12
 result.push(phrase(term("NP'", {"num": "plur", "gen": 1, "case": 2, "gap": "-"}),
                     [term("NP", {"num": 3, "gen": 1, "case": 2, "gap": "-"}),
                      space(),
                      literal("and"),
                      space(),
                      term("NP", {"num": 4, "gen": 1, "case": 2, "gap": "-"})], 
                    "NP"));
 
 result.push(phrase(term("NP'", {"num": "plur", "gen": "-hum", "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "gen": 5, "case": 2, "gap": "-"}),
                     space(),
                     literal("and"),
                     space(),
                     term("NP", {"num": 4, "gen": 6, "case": 2, "gap": "-"})], 
                    "NP"));
 
 // PS 12.5
 result.push(phrase(term("NP'", {"num": 1, "gen": 2, "case": 3, "gap": 4}),
                    [term("NP", {"num": 1, "gen": 2, "case": 3, "gap": 4})], 
                    "NP"));
 

 // PS 13
 result.push(phrase(term("N", {"num": 1, "gen": 2}),
                     [term("N", {"num": 1, "gen": 2}),
                      space(),
                      term("RC", {"num": 1, "gen": 2})]));
 // PS 14
 // NOTE(goto): this is in slight disagreement with the book, because it is forcing
 // the sentence to agree with the relative clause number feature to disallow the
 // following example:
 // A stockbroker who DO not love her likes him.
 result.push(phrase(term("RC", {"num": 1, "gen": 2}),
                     [term("RPRO", {"num": 1, "gen": 2}),
                      space(),
                      term("S", {"num": 1, "gap": 1})]));
 
 // LI 1
 result.push(rule(term("DET", {"num": ["sing"]}),
                   [[literal("a")], [literal("every")], [literal("the")], [literal("some")]]));
 
 // LI 2
 result.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "+nom"}),
                   [[literal("he")]]));
 
 // LI 3
 result.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom"}),
                   [[literal("him")]]));
 
 // LI 4
 result.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "+nom"}),
                   [[literal("she")]]));
 
 // LI 5
 result.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom"}),
                   [[literal("her")]]));
 
 // LI 6
 result.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": ["-nom", "+nom"]}),
                   [[literal("it")]]));
 
 //console.log(print(result[result.length - 1]));
 //console.log(result.length);
 //return;
 
 // LI 7
 result.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "+nom"}),
                   [[literal("they")]]));
 
 // LI 8
 result.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "-nom"}),
                   [[literal("them")]]));
 
 // LI 9
 result.push(rule(term("PN", {"num": "sing", "gen": "male"}),
                   [[literal("Jones")], [literal("John")], [literal("Mel")], [literal("Leo")], [literal("Yuji")]]));
 
 // LI 10
 result.push(rule(term("PN", {"num": "sing", "gen": "fem"}),
                   [[literal("Mary")], [literal("Dani")], [literal("Anna")]]));
 
 // LI 11
 result.push(rule(term("PN", {"num": "sing", "gen": "-hum"}),
                   [[literal("Brazil")], [literal("Italy")], [literal("Ulysses")]]));
 
 // LI 12
 result.push(rule(term("N", {"num": "sing", "gen": "male"}),
                   [[literal("stockbroker")], [literal("man")]]));
 
 // LI 13
 result.push(rule(term("N", {"num": "sing", "gen": "fem"}),
                   [[literal("stockbroker")], [literal("woman")], [literal("widow")]]));
 
 // LI 14
 result.push(rule(term("N", {"num": "sing", "gen": "-hum"}),
                  [[literal("book")], [literal("donkey")], [literal("horse")], [literal("porsche")]]));
 
 // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
 // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
 // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
 
 // LI 15
 result.push(rule(term("AUX", {"num": "sing", "fin": "+"}),
                   [[literal("does")]]));
 
 // LI 16
 result.push(rule(term("AUX", {"num": "plur", "fin": "+"}),
                   [[literal("do")]]));
 
 // Verbs in their inifinitive form.
 const transitive = ["like", "love", "know", "own", "fascinate", "rotate", "surprise"];
 const intransitive = ["love", "stink"];
 
 // LI 17
 result.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "+"}),
                   transitive.map((verb) => [literal(verb)])));
 
 // LI 18
 // Manually expanding into the transitivity.
 result.push(rule(term("V", {"num": ["sing", "plur"], "fin": "-", "trans": "-"}),
                   intransitive.map((verb) => [literal(verb)])));
 
 // LI 19
 // Manually expanding into the present / third person.
 // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
 // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
 // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
 // It seems like the same applies to verbs:
 // https://parentingpatch.com/third-person-singular-simple-present-verbs/
 result.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "+"}),
                   transitive.map((verb) => [literal(verb + "s")])
                   ));
 
 result.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "-"}),
                   intransitive.map((verb) => [literal(verb + "s")])
                   ));
 
 // LI 20
 // Manually expanding into the present / plural.
 // > Except for the verb be, plural verb forms we want here - i.e. the third person plural of the
 // > present tense - are identical with the infinitival forms, which we already have (They were needed
 // > for negation). 
 result.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "+"}),
                   transitive.map((verb) => [literal(verb)])));
 result.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "-"}),
                   intransitive.map((verb) => [literal(verb)])));
 
 // LI 21
 result.push(rule(term("RPRO", {"num": ["sing", "plur"], "gen": ["male", "fem"]}),
                   [[literal("who")]]));
 // LI 22
 result.push(rule(term("RPRO", {"num": ["sing", "plur"], "gen": "-hum"}),
                   [[literal("which")]]));
 
 // GAP
 result.push(rule(term("GAP"),
                   [["null"]]));
 
 return result;
}

module.exports = {
 space: space,
 rule: rule,
 term: term,
 rule: rule,
 phrase: phrase,
 literal: literal,
 print: print,
 generate: generate,
 processor: processor,
 expand: expand,
 collect: collect,
 compile: compile,
 clone: clone,
 parse: parse,
 grammar: grammar
};
