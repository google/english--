const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./../tests/grammar.js");

let l = (value) => { return literal(value); };
let space = (optional = false) => { return optional ? "_" : "__"};
let rule = (head = {}, tail = []) => { return {"@type": "Rule", head: head, tail: tail}};
let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
let literal = (value) => { return {"@type": "Literal", name: value} };
let phrase = (head, tail) => { return rule(head, [tail]); };

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

function parse(source) {
 const parser = new Parser(ParserRules, ParserStart, {
   keepHistory: true
  });
 parser.feed(source);
 return parser.results;
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
};