const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./english.js");

let rule = (head = {}, tail = [], skip = false, types = {}, prod) => { 
 return {
  "@type": "Rule", 
  "head": head, 
  "tail": tail, 
  "skip": skip, 
  "types": types,
  "prod": prod
 }
};

let l = (value) => { return literal(value); };
let space = (optional = false) => { return optional ? "_" : "__"};
let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
let literal = (value) => { return {"@type": "Literal", name: value} };
let phrase = (head, tail, skip, types) => { return rule(head, [tail], skip, types); };

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
 "trans": ["+", "-"],
 "fin": ["+", "-"],
 "refl": ["+", "-"],
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
    
    let prod = processor(expansion, undefined, rule.types);
    if (rule.prod) {
     prod = rule.prod(expansion.head.name, expansion.head.types);
    } else if (rule.skip) {
     prod = `(args) => args.length == 1 ? args[0] : (${processor(expansion, rule.skip, rule.types)})(args)`;
    }
    rules[head].push([list.join(" "), prod]);
   }
  }
 }

 let result = [];

 if (header) {
  result.push(`@builtin "whitespace.ne"`);
  result.push(`@include "base.ne"`);
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
  result.push("# whitespaces");
  
  let whitespaces = rule(term("WS", {"gap": ["sing", "plur", "-"]}));
  for (let whitespace of generate(whitespaces)) {
   let gap = whitespace.head.types.gap != "-";
   result.push(`${print(whitespace, true)} ${gap ? "_" : "__"} {% () => null %}`);
  }
  
 }

 return result.join("\n");
}

function processor(rule, name, extra) {
 let result = [];
 result.push("(args, loc)");
 result.push(" => ");
 result.push("node(");
 let types = {};
 Object.assign(types, rule.head.types);
 Object.assign(types, extra);
 result.push(`"${name ? name : rule.head.name}", ${JSON.stringify(types)}, args, loc`);
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

 // Questions
 result.push(phrase(term("Sentence"),
                    [literal("who"),
                     space(true),
                     term("NP", {"num": 1, "case": "+nom", "gap": 1}),
                     space(),
                     term("VP'", {"num": 1, "fin": "+", "gap": "-"}),
                     space(true),
                     literal("?")]));

 result.push(phrase(term("Sentence"),
                    [literal("who"),
                     space(),
                     term("AUX", {"num": "sing", "fin": "+"}),
                     space(),
                     term("NP", {"num": 1, "case": "+nom", "gap": "-"}),
                     space(),
                     term("VP", {"num": 3, "fin": "+", "gap": 1}),
                     space(true),
                     literal("?")]));

 result.push(phrase(term("Sentence"),
                    [literal("is"),
                     space(),
                     term("NP", {"num": "sing", "case": "+nom", "gap": "-"}),
                     space(),
                     term("ADJ"),
                     space(true),
                     literal("?")]));

 // PS 1
 result.push(phrase(term("S", {"num": 1}),
                     [term("NP'", {"num": 1, "case": "+nom", "gap": "-"}),
                      space(),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));
 
 // PS 2
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 1, "case": "+nom", "gap": 3}),
                      term("WS", {"gap": 3}),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));
 
 // PS 2.5
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 3, "case": "+nom", "gap": 3}),
                      term("WS", {"gap": 3}),
                      term("VP'", {"num": 1, "fin": "+", "gap": "-"})]));

 // PS 3
 result.push(phrase(term("S", {"num": 1, "gap": 3}),
                     [term("NP'", {"num": 1, "case": "+nom", "gap": "-"}),
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
                      term("NP'", {"num": 3, "case": "-nom", "gap": 3})]));
 
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                     [term("V", {"num": 1, "fin": 2, "trans": "+"}),
                      space(),
                      term("NP'", {"num": 3, "case": "-nom", "gap": "-"})]));
 
 // PS 7
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": "-"}),
                     [term("V", {"num": 1, "fin": 2, "trans": "-"})]));
 
 // PS 8
 result.push(phrase(term("NP", {"num": 1, "case": 3, "gap": 1}),
                    [term("GAP")]));
 
 // page 36 makes a simplification, which we introduce back manually:
 // The intended meaning is that the left-hand side can have either of 
 // the case values +nom and -nom. 
 
 // PS 9
 result.push(phrase(term("NP", {"num": 1, "case": 3, "gap": "-"}),
                     [term("DET", {"num": 1}), 
                      space(),
                      term("N", {"num": 1})]));
 
 // PS 10
 result.push(phrase(term("NP", {"num": 1, "case": 3, "gap": "-"}),
                     [term("PN", {"num": 1})]));
  
 // PS 11
 result.push(phrase(term("NP", {"num": 1, "case": 3, "gap": "-"}),
                     [term("PRO", {"num": 1, "case": 3, "refl": 4})]));

 // PS 12
 result.push(phrase(term("NP'", {"num": "plur", "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "case": 2, "gap": "-"}),
                     space(),
                     literal("and"),
                     space(),
                     term("NP", {"num": 4, "case": 2, "gap": "-"})], 
                    "NP"));
 
 // PS 12.5
 result.push(phrase(term("NP'", {"num": 1, "case": 3, "gap": 4}),
                    [term("NP", {"num": 1, "case": 3, "gap": 4})], 
                    "NP"));
 

 // PS 13
 result.push(phrase(term("N", {"num": 1}),
                     [term("N", {"num": 1}),
                      space(),
                      term("RC", {"num": 1})]));
 // PS 14
 // NOTE(goto): this is in slight disagreement with the book, because it is forcing
 // the sentence to agree with the relative clause number feature to disallow the
 // following example:
 // A stockbroker who DO not love her likes him.
 result.push(phrase(term("RC", {"num": 1}),
                     [term("RPRO", {"num": 1}),
                      space(),
                      term("S", {"num": 1, "gap": 1})]));

 // PS Adjectives (page 57)
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                    [term("BE", {"num": 1, "fin": 2}),
                     space(),
                     term("ADJ")]));

 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                    [term("BE", {"num": 1, "fin": 2}),
                     space(),
                     literal("not"),
                     space(),
                     term("ADJ")]));
 

 // 3.6 Identity and Predication
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                    [term("BE", {"num": 1, "fin": 2}),
                     space(),
                     term("NP", {"num": 1, "case": 5, "gap": 3})]));

 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                    [term("BE", {"num": 1, "fin": 2}),
                     space(),
                     term("PP")]));

 // Adnominal adjectives (page 271)
 result.push(phrase(term("N", {"num": 1}),
                     [term("ADJ"),
                      space(),
                      term("N", {"num": 1})]));

 // Conditionals
 result.push(phrase(term("S", {"num": 1}),
                    [literal("if"),
                     space(),
                     term("S", {"num": 1}),
                     space(),
                     literal("then"),
                     space(),
                     term("S", {"num": 1})]));
 
 // Sentential Disjunctions
 result.push(phrase(term("S", {"num": 1}),
                    [term("S", {"num": 1}),
                     space(),
                     literal("or"),
                     space(),
                     term("S", {"num": 1})]));

 // VP Disjunctions
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "gap": 3}),
                     [term("VP", {"num": 1, "fin": 2, "gap": 3}),
                      space(),
                      literal("or"),
                      space(),
                      term("VP", {"num": 1, "fin": 2, "gap": 3})]));

 // NP Disjunctions
 result.push(phrase(term("NP'", {"num": 3, "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "case": 2, "gap": "-"}),
                     space(),
                     literal("or"),
                     space(),
                     term("NP", {"num": 3, "case": 2, "gap": "-"})], 
                    "NP"));
 
 // Sentential Conjunctions
 result.push(phrase(term("S", {"num": 1}),
                    [term("S", {"num": 1}),
                     space(),
                     literal("and"),
                     space(),
                     term("S", {"num": 1})]));

 // V Conjunctions
 result.push(phrase(term("V", {"num": 1, "fin": 2, "trans": 3}),
                     [term("V", {"num": 1, "fin": 2, "trans": 3}),
                      space(),
                      literal("and"),
                      space(),
                      term("V", {"num": 1, "fin": 2, "trans": 3})]));
 
 // Non-pronomial possessive phrases
 result.push(phrase(term("NP", {"num": 1, "case": 3, "gap": "-"}),
                     [term("DET", {"num": "sing", "rn": "+"}), 
                      space(),
                      term("RN", {"num": 1})]));

 result.push(phrase(term("DET", {"num": "sing", "rn": "+"}),
                    [term("PN", {"num": 1}), 
                      literal("'s")]));

 // Noun Prepositional Phrases
 result.push(phrase(term("N", {"num": 1}),
                    [term("N", {"num": 1}), 
                     space(),
                     term("PP")]));

 result.push(phrase(term("PP"),
                     [term("PREP"),
                      space(),
                      term("NP", {"num": 1, "case": 3, "gap": "-"})]));

 // LI 1
 result.push(rule(term("DET", {"num": ["sing"]}),
                   [[literal("a")], [literal("an")], [literal("every")], [literal("the")], [literal("some")]]));
 
 // LI 2
 result.push(rule(term("PRO", {"num": "sing", "case": "+nom", "refl": "-"}),
                  [[literal("he")]],
                  undefined,
                  {"gen": "male"}));
 
 // LI 3
 result.push(rule(term("PRO", {"num": "sing", "case": "-nom", "refl": "-"}),
                  [[literal("him")]],
                  undefined,
                  {"gen": "male"}));
 
 // LI 4
 result.push(rule(term("PRO", {"num": "sing", "case": "+nom", "refl": "-"}),
                  [[literal("she")]],
                  undefined,
                  {"gen": "fem"}));
 
 // LI 5
 result.push(rule(term("PRO", {"num": "sing", "case": "-nom", "refl": "-"}),
                  [[literal("her")]],
                  undefined,
                  {"gen": "fem"}));
 
 // LI 6
 result.push(rule(term("PRO", {"num": "sing", "case": ["-nom", "+nom"], "refl": "-"}),
                  [[literal("it")]],
                  undefined,
                  {"gen": "-hum"}));
  
 // LI 7
 result.push(rule(term("PRO", {"num": "plur", "case": "+nom", "refl": "-"}),
                  [[literal("they")]],
                  undefined,
                  {"gen": ["male", "fem", "-hum"]}));
 
 // LI 8
 result.push(rule(term("PRO", {"num": "plur", "case": "-nom", "refl": "-"}),
                  [[literal("them")]],
                  undefined,
                  {"gen": ["male", "fem", "-hum"]}));
 
 // LI 9
 //result.push(rule(term("PN", {"num": "sing"}),
 //[[literal("Jones")], [literal("John")], [literal("Mel")], [literal("Leo")], [literal("Yuji")], [literal("Smith")], [literal("Socrates")], [literal("Sam")]],
 //undefined,
 //{"gen": "male"}));
 
 // LI 10
 // result.push(rule(term("PN", {"num": "sing"}),
 //                  [[literal("Mary")], [literal("Dani")], [literal("Anna")]],
 //                  undefined,
 //                  {"gen": "fem"}));
 
 // LI 11
 //result.push(rule(term("PN", {"num": "sing"}),
 //                 [[literal("Brazil")], [literal("Italy")], [literal("Ulysses")]],
 //                 undefined, 
 //                 {"gen": "-hum"}));
 
 // LI 12
 result.push(rule(term("N", {"num": "sing"}),
                  [[literal("stockbroker")], [literal("man")], [literal("engineer")], [literal("brazilian")]],
                  undefined,
                  {"gen": "male"}));
 
 // LI 13
 result.push(rule(term("N", {"num": "sing"}),
                  [[literal("stockbroker")], [literal("woman")], [literal("widow")], [literal("engineer")], [literal("brazilian")]],
                  undefined,
                  {"gen": "fem"}));
 
 // LI 14
 result.push(rule(term("N", {"num": "sing"}),
                  [[literal("book")], [literal("donkey")], [literal("horse")], [literal("porsche")]],
                  undefined,
                  {"gen": "-hum"}));
 
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
 
 result.push(rule(term("V", {"trans": "+"}),
                  [[literal("like")],
                   [literal("love")],
                   [literal("admire")],
                   [literal("know")],
                   [literal("own")],
                   [literal("fascinate")],
                   [literal("rotate")],
                   [literal("surprise")],
                   ]));

 result.push(rule(term("V", {"trans": "-"}),
                  [[literal("love")],
                   [literal("stink")],
                   [literal("adore")]]));

 // LI 17
 // LI 18
 result.push(rule(term("V", {"num": 1, "fin": "-", "trans": 2}),
                  [[term("V", {"trans": 2})]],
                  undefined, 
                  undefined,
                  (name, types) => { 
                   return `([child], loc) => child`;
                  }
                  ));
 
 // LI 19
 // Manually expanding into the present / third person.
 // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
 // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
 // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
 // It seems like the same applies to verbs:
 // https://parentingpatch.com/third-person-singular-simple-present-verbs/
 result.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "+"}),
                  [[term("V", {"num": "sing", "fin": "-", "trans": "+"}), literal("s")]],
                  undefined, 
                  undefined,
                  (name, types) => { 
                   return "([inf, s], loc) => { inf.children[0] += s; return inf; }";
                  }
                  ));
 
 result.push(rule(term("V", {"num": "sing", "fin": "+", "trans": "-"}),
                  [[term("V", {"num": "sing", "fin": "-", "trans": "-"}), literal("s")]],
                  undefined, 
                  undefined,
                  (name, types) => { 
                   return "([inf, s], loc) => { inf.children[0] += s; return inf; }";
                  }
                  ));
 
 // LI 20
 // Manually expanding into the present / plural.
 // > Except for the verb be, plural verb forms we want here - i.e. the third person plural of the
 // > present tense - are identical with the infinitival forms, which we already have (They were needed
 // > for negation). 
 
 result.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "+"}),
                  [[term("V", {"num": "sing", "fin": "-", "trans": "+"})]],
                  undefined, 
                  undefined,
                  (name, types) => { 
                   return `([child], loc) => child`;
                  }
                  ));
 
 result.push(rule(term("V", {"num": "plur", "fin": "+", "trans": "-"}),
                  [[term("V", {"num": "sing", "fin": "-", "trans": "-"})]],
                  undefined, 
                  undefined,
                  (name, types) => { 
                   return `([child], loc) => child`;
                  }
                  ));
 
 // LI 21
 // TODO(goto): here is a first example of syntax that is determined by
 // the gender of the sentence.
 // "gen": ["male", "fem"]
 result.push(rule(term("RPRO", {"num": ["sing", "plur"]}),
                  [[literal("who")]]));
 // LI 22
 // "gen": "-hum"
 result.push(rule(term("RPRO", {"num": ["sing", "plur"]}),
                   [[literal("which")]]));
 
 // LI 23
 result.push(rule(term("PRO", {"num": "sing", "case": "-nom", "refl": "+"}),
                  [[literal("himself")]],
                  undefined,
                  {"gen": "male"}));

 // LI 24
 result.push(rule(term("PRO", {"num": "sing", "case": "-nom", "refl": "+"}),
                  [[literal("herself")]],
                  undefined,
                  {"gen": "fem"}));

 // LI 25
 result.push(rule(term("PRO", {"num": "sing", "case": "-nom", "refl": "+"}),
                  [[literal("itself")]],
                  undefined,
                  {"gen": "-hum"}));

 // GAP
 result.push(rule(term("GAP"),
                   [["null"]]));

 // ADJ
 result.push(rule(term("ADJ"),
                  [[literal("happy")], [literal("unhappy")], [literal("handsome")], [literal("beautiful")], [literal("fast")], [literal("slow")], [literal("mortal")], [literal("brazilian")]]));

 // BE
 result.push(rule(term("BE", {"num": "sing", "fin": 1}),
                  [[literal("is")]]));

 result.push(rule(term("BE", {"num": "plur", "fin": 1}),
                  [[literal("are")]]));

 // Relative Nouns
 result.push(rule(term("RN", {"num": "sing"}),
                  [[literal("husband")], 
                   [literal("father")], 
                   [literal("brother")],
                   ],
                  undefined,
                  {"gen": "male"}));

 result.push(rule(term("RN", {"num": "sing"}),
                  [[literal("wife")], 
                   [literal("mother")], 
                   [literal("sister")]
                   ],
                  undefined,
                  {"gen": "fem"}));

 result.push(rule(term("RN", {"num": "sing"}),
                  [[literal("parent")], 
                   [literal("child")], 
                   [literal("sibling")]],
                  undefined,
                  {"gen": ["male", "fem"]}));

 // to, of, about, at, before, after, by, behind, during, for,
 // from, in, over, under and with.
 // ADJ
 result.push(rule(term("PREP"),
                  [
                   // location
                   [literal("behind")],
                   [literal("in")],
                   [literal("over")],
                   [literal("under")],
                   [literal("near")],
                   // time
                   [literal("before")], 
                   [literal("after")], 
                   [literal("during")],
                   // general
                   [literal("from")],
                   [literal("to")], 
                   [literal("of")], 
                   [literal("about")], 
                   [literal("by")],
                   [literal("for")],
                   [literal("with")],
                   ]));

 // Extensible proper names.
 result.push(phrase(term("PN", {"num": "sing"}),
                    [term("FULLNAME")],
                    undefined,
                    {"gen": "?"}));

 // Variables
 result.push(phrase(term("PN", {"num": "sing"}),
                    [term("VAR")],
                    undefined,
                    {"gen": "?", "var": true}));
 
 return result;
}

function node(type, ...children) {
 return {"@type": type, "children": children} 
}

function clean(node) {
 if (Array.isArray(node)) {
  for (let entry of node) {
   if (entry) {
    clean(entry);
   }
  }
 } else if (typeof node == "object") {
  delete node.types;
  delete node.loc;
  clean(node.children);
 }
 return node;
}

function first(results, types = false) {
 let root = clone(results[0]).children[0];
 return types ? root : clean(root);
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
 grammar: grammar,
 first: first,
 clean: clean,
 nodes: {
  S: (...children) => node("S", ...children),
  NP: (...children) => node("NP", ...children),
  NP_: (...children) => node("NP'", ...children),
  PN: (...children) => node("PN", ...children),
  VP_: (...children) => node("VP'", ...children),
  VP: (...children) => node("VP", ...children),
  V: (...children) => node("V", ...children),
  BE: (...children) => node("BE", ...children),
  DET: (...children) => node("DET", ...children),
  N: (...children) => node("N", ...children),
  RN: (...children) => node("RN", ...children),
  PRO: (...children) => node("PRO", ...children),
  AUX: (...children) => node("AUX", ...children),
  RC: (...children) => node("RC", ...children),
  RPRO: (...children) => node("RPRO", ...children),
  GAP: (...children) => node("GAP", ...children),
  ADJ: (...children) => node("ADJ", ...children),
  PP: (...children) => node("PP", ...children),
  PREP: (...children) => node("PREP", ...children),
  Discourse: (...children) => node("Discourse", ...children),
  Sentence: (...children) => node("Sentence", ...children),
 }
};
