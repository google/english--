const {
  parse, 
  parser, 
  term, 
  rule, 
  phrase, 
  space, 
  clone, 
  literal, 
  compile, 
  generate, 
  expand, 
  collect, 
  processor, 
  grammar,
  first,
  clean,
  nodes} = require("./parser.js");

const {
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ,
 Discourse, Sentence
} = nodes;


function transcribe(node) {
 if (typeof node == "string") {
  return node;
 } else if (node["@type"] == "Referent") {
  return node.name;
 }
 let result = [];
 for (let child of node.children || []) {
  result.push(transcribe(child));
 }
 let suffix = node.ref ? `(${node.ref.name})` : "";
 let prefix = node.neg ? "~" : "";
 return prefix + result.join(" ").trim() + suffix;
}

let capture = (name) => { return {"@type": "Match", "name": name} };
  
function match(a, b) {
 if (!b || a["@type"] != b["@type"]) {
  return false;
 }
 
 let result = {};
   
 for (let i = 0; i < a.children.length; i++) {
  if (typeof a.children[i] == "string") {
   if (a.children[i].toLowerCase() != String(b.children[i]).toLowerCase()) {
    // console.log(a.children[i]);
    return false;
   }
  } else if (a.children[i]["@type"] == "Match") {
   result[a.children[i].name] = b;
   continue;
  } else {
   let capture = match(a.children[i], b.children[i]);
   if (!capture) {
    return false;
   }

   result = Object.assign(result, capture);
  }
 }

 return result;
}

class Ids {
 constructor() {
  this.gen = (function*() {
    let i = 0;
    while (true) {
     let char = i % 26;
     let round = Math.floor(i / 26);
     yield `${String.fromCharCode(97 + char)}${round > 0 ? round : ""}`;
     i++;
    }
   })();
 }
 get() {
  return this.gen.next().value;
 }
}

class Rule {
 constructor(ids, trigger) {
  this.ids = ids || new Ids();
  this.trigger = trigger;
 }
 
 match(node, refs) {
  let m = match(this.trigger, node);

  if (!m) {
   return [[], [], [], []];
  }

  return this.apply(m, node, refs);
 }

 id() {
  return this.ids.get();
 }
}

class CompositeRule extends Rule {
 constructor(rules) {
  super();
  this.rules = rules;
 }
 match(node, refs) {
  let result = [[], [], [], []];
  for (let rule of this.rules) {
   let [head, body, drs, remove] = rule.match(node, refs);
   result[0].push(...head);
   result[1].push(...body);
   result[2].push(...drs);
   result[3].push(...remove);
  }
  return result;
 }
}

function print(node) {
 return transcribe(node);
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

function find({gen, num}, refs) {
 return refs.find((ref) => {
   return ref.types.gen == gen && ref.types.num == num
  });
}

class Referent {
 constructor(name, types) {
  this["@type"] = "Referent";
  this["types"] = types;
  this.name = name;
 }
}

class CRSPN extends Rule {
 constructor(ids) {
  super(ids, S(NP(PN(capture("name"))), VP_()));
 }

 apply({name}, node) {
  let ref = new Referent(this.id(), name.types);
  let pn = name;
  pn.ref = ref;
  node.children[0] = ref;

  return [[ref], [pn], [], []];
 }
}

class CRVPPN extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(PN(capture("name")))));
 }
 apply({name}, node) {
  let ref = new Referent(this.id(), name.types);
  let pn = name;
  pn.ref = ref;
  node.children[1].children[0] = ref;

  return [[ref], [pn], [], []];
 }
}

class CRDETPN extends Rule {
 constructor(ids) {
  super(ids, DET(PN(capture("name")), "'s"));
 }
 apply({name}, node) {
  let ref = new Referent(this.id(), name.types);
  let pn = name;
  pn.ref = ref;
  node.children[0] = ref;

  return [[ref], [pn], [], []];
 }
}

class CRPN extends CompositeRule {
 constructor(ids) {
  super([new CRSPN(ids), new CRVPPN(ids), new CRDETPN(ids)]);
 }
}

class CRSPRO extends Rule {
 constructor(ids) {
  super(ids, S(NP(PRO(capture("pronoun"))), VP_(capture("?"))));
 }

 apply({pronoun}, node, refs) {
  let u = find(pronoun.types, refs);

  if (!u) {
   throw new Error("Invalid reference: " + pronoun.children[0]);
  }

  node.children[0] = u;

  return [[], [], [], []];
 }
}

class CRVPPRO extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(PRO(capture("pronoun")))));
 }

 apply({pronoun}, node, refs) {
  let ref = find(pronoun.types, refs);

  if (!ref) {
   throw new Error("Invalid Reference: " + pronoun.children[0]);
  }

  node.children[1].children[0] = ref;
  
  return [[], [], [], []];
 }
}

class CRPRO extends CompositeRule {
 constructor(ids) {
  super([new CRSPRO(ids), new CRVPPRO(ids)]);
 }
}

class CRSID extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(DET(capture("det")), N(capture("noun")))));
 }

 apply({det, noun}, node) {
  if (det.children[0] != "a") {
   return [[], [], [], []];
  }

  let ref = new Referent(this.id(), noun.types);
  noun.ref = ref;
  node.children[1] = ref;
  
  return [[ref], [noun], [], []];
 }
}

class CRVPID extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_()));
 }

 apply({det, noun}, node) {
  if (det.children[0].toLowerCase() != "a") {
   return [[], [], [], []];
  }

  let ref = new Referent(this.id(), noun.types);
  noun.ref = ref;
  node.children[0] = ref;

  return [[ref], [noun], [], []];
 }
}

class CRID extends CompositeRule {
 constructor(ids) {
  super([new CRSID(ids), new CRVPID(ids)]);
 }
}

class CRLIN extends Rule {
 match(node) {
  let matcher = N(capture("noun"));
  let m = match(matcher, node);
  
  let head = [];
  let body = [];
  
  return [head, body, [], []];
  
  if (m && 
      m.noun.ref && 
      m.noun.children.length == 1 &&
      typeof m.noun.children[0] == "string") {
   let name = m.noun.children[0];
   let u = m.noun.ref.name;
   node.assign(predicate(name, [arg(u)]));
  }
  
  return [head, body, [], []];
 }
}

class CRNRC extends Rule {
 constructor(ids) {
  super(ids, N(N(), RC(capture("rc"))));
 }

 apply(m, node) {
  let head = [];
  let body = [];
  let remove = [];
  
  let rc = node.children.pop();
    
  let s = rc.children[1];
  
  const g1 = S(NP(), VP_(AUX(), "not", VP(V(), NP(GAP(capture("gap"))))));

  if (match(g1, s)) {
   child(s, 1, 2, 1).children[0] = node.ref;
  }

  // Binds gap to the referent.
  let object = child(s, 1, 0, 1);
  if (object && object.children[0]["@type"] == "GAP") {
   object.children[0] = node.ref;
  }
  
  let subject = s.children[0];
  if (subject && subject.children && subject.children[0]["@type"] == "GAP") {
   s.children[0] = node.ref;
  }
  
  let noun = node.children.pop();
  noun.ref = node.ref;
  body.push(noun);
  remove.push(node);
  
  body.push(s);
    
  return [head, body, [], remove];
 }
}

class CRNEG extends Rule {
 constructor(ids) {
  super(ids, S(capture("np"), VP_(AUX("does"), "not", VP(capture("vp")))));
 }

 apply({np, vp}, node, refs) {
  let head = [];
  let body = [];
  let subs = [];
    
  let noun = np.children[0];
  
  let sub = new DRS(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  sub.neg = true;

  let s = node;
  s.children[1].children.splice(0, 2);

  sub.push(s);

  return [head, body, [sub], [node]];
 }
}

class CRPOSBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  adj.ref = ref.children[0];
  return [[], [adj], [], [node]];
 }
}

class CRNEGBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  adj.ref = ref.children[0];
  adj.neg = true;
  return [[], [adj], [], [node]];
 }
}

class CRBE extends CompositeRule {
 constructor(ids) {
  super([new CRPOSBE(ids), new CRNEGBE(ids)]);
 }
}

class CRCOND extends Rule {
 constructor(ids) {
  super(ids, S("if", capture("head"), "then", capture("tail")));
 }
 apply({head, tail}, node, refs) {
  let antecedent = new DRS(this.ids);
  antecedent.head.push(...clone(refs));
  antecedent.head.forEach(ref => ref.closure = true);
  antecedent.push(head.children[1]);
   
  let consequent = new DRS(this.ids);
  consequent.head.push(...clone(antecedent.head));
  consequent.head.forEach(ref => ref.closure = true);
  consequent.push(tail.children[3]);
   
  let implication = new Implication(antecedent, consequent);
   
  return [[], [], [implication], [node]];
 }
}

class CREVERY extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET("every"), N(capture("noun"))), VP_(capture("verb"))));
 }
 apply({noun, verb}, node, refs) {
  let ref = new Referent(this.id(), noun.types);
  let n = new DRS(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  n.push(noun);
   
  let v = new DRS(this.ids);
  v.head.push(...clone(n.head));
  v.head.forEach(ref => ref.closure = true);
  node.children[0] = ref;
  v.push(node);
   
  let implication = new Implication(n, v);
     
  return [[], [], [implication], [node]];
 }
}

class CRVPEVERY extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(), NP(DET("every"), N(capture("noun")))))));
 }
 apply({subject, noun}, node, refs) {
  let ref = new Referent(this.id(), noun.types);
  let n = new DRS(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  n.push(noun);
   
  let verb = new DRS(this.ids);
  verb.head.push(...clone(n.head));
  verb.head.forEach(ref => ref.closure = true);
  child(node, 1, 0).children[1] = ref;
  verb.push(node);
   
  let implication = new Implication(n, verb);
  
  return [[], [], [implication], [node]];
 }
}

class CROR extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "or", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = new DRS(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = new DRS(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  let disjunction = new Disjunction(first, second);
  
  return [[], [], [disjunction], [node]];
 }
}

class CRVPOR extends Rule {
 constructor(ids) {
  super(ids, S(capture("n"), VP_(VP(VP(capture("a")), "or", VP(capture("b"))))));
 }
 apply({a, b, n}, node, refs) {
  let first = new DRS(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(n.children[0]), VP_(a)));

  let second = new DRS(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(n.children[0]), VP_(b)));
  
  let disjunction = new Disjunction(first, second);
  
  return [[], [], [disjunction], [node]];
 }
}

class CRNPOR extends Rule {
 constructor(ids) {
  super(ids, S(NP(NP(capture("first")), "or", NP(capture("second"))), 
                  VP_(capture("vp"))));
 }
 apply({first, second, vp}, node, refs) {
  let a = new DRS(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(S(first, VP_(clone(vp))));

  let b = new DRS(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(S(second, VP_(clone(vp))));
  
  let disjunction = new Disjunction(a, b);
  
  return [[], [], [disjunction], [node]];
 }
}

class CRSAND extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "and", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = new DRS(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = new DRS(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  let result = new Conjunction(first, second);
  
  return [[], [], [result], [node]];
 }
}

class CRVPAND extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(V(capture("a")), "and", V(capture("b"))), NP(capture("object"))))));
 }
 apply({subject, a, b, object}, node, refs) {
  let first = new DRS(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(subject.children[0]), VP_(VP(a, clone(object)))));

  let second = new DRS(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(subject.children[0]), VP_(VP(b, clone(object)))));
  
  let conjunction = new Conjunction(first, second);
  
  return [[], [], [conjunction], [node]];
 }
}

class CRAND extends CompositeRule {
 constructor(ids) {
  super([new CRSAND(ids), new CRVPAND(ids)]);
 }
}

// Possessive Phrases
class CRSPP extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node) {
  let u = new Referent(this.id(), noun.types);
  node.children[0] = u;
  node.ref = u;

  // console.log(print(node));
  // console.log(child(node, 1, 0, 1));

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRVPPP extends Rule {
 constructor(ids) {
  super(ids, VP(V(capture("verb")), NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node) {
  let u = new Referent(this.id(), noun.types);
  node.children[1] = u;
  // node.ref = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRPP extends CompositeRule {
 constructor(ids) {
  super([new CRSPP(ids), new CRVPPP(ids)]);
 }
}

class DRS {
 constructor(ids = new Ids()) {
  this.head = [];
  this.body = [];
  this.subs = [];
  this.names = new CRPN(ids);
  this.rules =
   [new CRID(ids), 
    new CRNRC(ids), 
    new CRPRO(ids),
    new CRNEG(ids),
    new CRPP(ids),
    new CRBE(ids),
    new CRCOND(ids),
    new CREVERY(ids),
    new CRVPEVERY(ids),
    new CROR(ids),
    new CRVPOR(ids),
    new CRNPOR(ids),
    new CRAND(ids),
    ];
 }
 
 feed(s) {
  this.push(first(parse(s), true));
 }
 
 bind(node) {
  let queue = [node];
  while (queue.length > 0) {
   let p = queue.shift();
   // console.log(print(p));
   let [refs, names] = this.names.match(p);
   this.head.push(...refs);
   this.body.push(...names);
   // ... and recurse.
   let next = (p.children || [])
    .filter(c => typeof c != "string");
   queue.push(...next);
  }
 }

 push(node) {
  // Resolve all proper names first.
  this.bind(node);

  let queue = [node];

  this.body.push(node);

  while (queue.length > 0) {
   let p = queue.shift();
   // breadth first search: iterate over
   // this level first ...
   for (let rule of this.rules) {
    let [head, body, drs, remove] = rule.match(p, this.head);
    this.head.push(...head);
    this.body.push(...body);
    this.subs.push(...drs);
    for (let del of remove) {
     let i = this.body.indexOf(del);
     this.body.splice(i, 1);
    }
    queue.push(...body);
   }
   // ... and recurse.
   let next = (p && p.children || [])
    .filter(c => typeof c != "string");
   queue.push(...next);
  }

  return this;
 }

 print() {
  let result = [];
  let refs = [];
  for (let ref of this.head.filter(ref => !ref.closure)) {
   refs.push(`${ref.name}`);
  }
  
  let args = refs.join(", ");
  let neg = this.neg ? "~" : "";
  result.push(`${neg}drs(${args}) \{`);
  
  for (let cond of this.body) {
   result.push(transcribe(cond));
  }
  
  for (let sub of this.subs) {
   result.push(sub.print());
  }
  
  result.push("}");
  
  return result.join("\n");
 }
}

class Implication {
 constructor(antecedent, consequent) {
  this.antecedent = antecedent;
  this.consequent = consequent;
 }
 print() {
  return this.antecedent.print() + " => " + this.consequent.print();
 }
}

class Disjunction {
 constructor(a, b) {
  this.a = a;
  this.b = b;
 }
 print() {
  return this.a.print() + " or " + this.b.print();
 }
}

class Conjunction {
 constructor(a, b) {
  this.a = a;
  this.b = b;
 }
 print() {
  return this.a.print() + " and " + this.b.print();
 }
}

module.exports = {
 match: match,
 capture: capture,
 child: child,
 print: print,
 Ids: Ids,
 DRS: DRS,
 CRPN: CRPN,
 CRPRO: CRPRO,
 CRID: CRID,
 CRLIN: CRLIN,
 CRNRC: CRNRC,
 CRNEG: CRNEG,
 CRBE: CRBE,
 CRCOND: CRCOND,
 CREVERY: CREVERY,
 CRVPEVERY: CRVPEVERY,
 CROR: CROR,
 CRVPOR: CRVPOR,
 CRNPOR: CRNPOR,
 CRAND: CRAND,
 CRPP: CRPP,
};
