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
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, PRO, AUX, RC, RPRO, GAP, ADJ,
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

class CRSPN extends Rule {
 constructor(ids) {
  super(ids, S(NP(PN(capture("name"))), VP_()));
 }

 apply(m1, node) {
  let name = m1.name.children[0];
  let ref = new Referent(this.id(), m1.name.types);
  let pn = m1.name;
  pn.ref = ref;
  node.children[0] = ref;

  return [[ref], [pn], [], []];
 }
}

class CRVPPN extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(PN(capture("name")))));
 }
 apply(m2, node) {
  let name = m2.name.children[0];
  let ref = new Referent(this.id(), m2.name.types);
  let pn = m2.name;
  pn.ref = ref;
  node.children[1].children[0] = ref;

  return [[ref], [pn], [], []];
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

class CRPN extends CompositeRule {
 constructor(ids) {
  super([new CRSPN(ids), new CRVPPN(ids)]);
 }
}

class Referent {
 constructor(name, types) {
  this["@type"] = "Referent";
  this["types"] = types;
  this.name = name;
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


class CRSPRO extends Rule {
 constructor(ids) {
  super(ids, S(NP(PRO(capture("pronoun"))), VP_(capture("?"))));
 }

 apply(m1, node, refs) {
  let u = find(m1.pronoun.types, refs);

  if (!u) {
   throw new Error("Invalid reference: " + m1.pronoun.children[0]);
  }

  node.children[0] = u;

  return [[], [], [], []];
 }
}

class CRVPPRO extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(PRO(capture("pronoun")))));
 }

 apply(m2, node, refs) {
  let ref = find(m2.pronoun.types, refs);

  if (!ref) {
   throw new Error("Invalid Reference: " + m2.pronoun.children[0]);
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

 apply(m1, node) {
  if (m1.det.children[0] != "a") {
   return [[], [], [], []];
  }

  let ref = new Referent(this.id(), m1.noun.types);
  let n = m1.noun;
  n.ref = ref;
  node.children[1] = ref;
  
  return [[ref], [n], [], []];
 }
}

class CRVPID extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_()));
 }

 apply(m2, node) {
  if (m2.det.children[0].toLowerCase() != "a") {
   return [[], [], [], []];
  }

  let ref = new Referent(this.id(), m2.noun.types);
  let n = m2.noun;
  n.ref = ref;
  node.children[0] = ref;

  return [[ref], [n], [], []];
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

 apply(m, node, refs) {
  let head = [];
  let body = [];
  let subs = [];
    
  let noun = m.np.children[0];
  
  let sub = new DRS(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  sub.neg = true;

  let s = node;
  s.children[1].children.splice(0, 2);

  // console.log(print(s));
  sub.push(s);

  // node.assign(noun);
  // node.remove();
  
  return [head, body, [sub], [node]];
 }
}

class CRPOSBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
 }
 apply(m1, node, refs) {
  let ref = m1.ref.children[0];
  let adj = m1.adj;
  adj.ref = ref;
  return [[], [adj], [], [node]];
 }
}

class CRNEGBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", ADJ(capture("adj"))))));
 }
 apply(m2, node, refs) {
  let ref = m2.ref.children[0];
  let adj = m2.adj;
  adj.ref = ref;
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
  super(ids, S("if", capture("antecedent"), "then", capture("consequent")));
 }
 apply(m, node, refs) {
  let antecedent = new DRS(this.ids);
  antecedent.head.push(...clone(refs));
  antecedent.head.forEach(ref => ref.closure = true);
  antecedent.push(m.antecedent.children[1]);
   
  let consequent = new DRS(this.ids);
  consequent.head.push(...clone(antecedent.head));
  consequent.head.forEach(ref => ref.closure = true);
  consequent.push(m.consequent.children[3]);
   
  let implication = new Implication(antecedent, consequent);
   
  return [[], [], [implication], [node]];
 }
}

class CREVERY extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET("every"), N(capture("noun"))), VP_(capture("verb"))));
 }
 apply(m, node, refs) {
  let ref = new Referent(this.id(), m.noun.types);
  let noun = new DRS(this.ids);
  noun.head.push(...clone(refs));
  noun.head.forEach(ref => ref.closure = true);
  noun.head.push(ref);
  m.noun.ref = ref;
  noun.push(m.noun);
   
  let verb = new DRS(this.ids);
  verb.head.push(...clone(noun.head));
  verb.head.forEach(ref => ref.closure = true);
  node.children[0] = ref;
  verb.push(node);
   
  let implication = new Implication(noun, verb);
     
  return [[], [], [implication], [node]];
 }
}

class CRVPEVERY extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(), NP(DET("every"), N(capture("noun")))))));
 }
 apply(m, node, refs) {
  let ref = new Referent(this.id(), m.noun.types);
  let noun = new DRS(this.ids);
  noun.head.push(...clone(refs));
  noun.head.forEach(ref => ref.closure = true);
  noun.head.push(ref);
  m.noun.ref = ref;
  noun.push(m.noun);
   
  let verb = new DRS(this.ids);
  verb.head.push(...clone(noun.head));
  verb.head.forEach(ref => ref.closure = true);
  child(node, 1, 0).children[1] = ref;
  verb.push(node);
   
  let implication = new Implication(noun, verb);
  
  return [[], [], [implication], [node]];
 }
}

class CROR extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "or", S(capture("b"))));
 }
 apply(m, node, refs) {
  let a = new DRS(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(m.a);

  let b = new DRS(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(m.b);
  
  let disjunction = new Disjunction(a, b);
  
  return [[], [], [disjunction], [node]];
 }
}

class CRVPOR extends Rule {
 constructor(ids) {
  super(ids, S(capture("n"), VP_(VP(VP(capture("a")), "or", VP(capture("b"))))));
 }
 apply(m, node, refs) {
  let a = new DRS(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(S(clone(m.n.children[0]), VP_(m.a)));

  let b = new DRS(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(S(clone(m.n.children[0]), VP_(m.b)));
  
  let disjunction = new Disjunction(a, b);
  
  return [[], [], [disjunction], [node]];
 }
}

class CRNPOR extends Rule {
 constructor(ids) {
  super(ids, S(NP(NP(capture("a")), "or", NP(capture("b"))), 
                  VP_(capture("vp"))));
 }
 apply(m, node, refs) {
  let a = new DRS(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(S(m.a, VP_(clone(m.vp))));

  let b = new DRS(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(S(m.b, VP_(clone(m.vp))));
  
  let disjunction = new Disjunction(a, b);
  
  return [[], [], [disjunction], [node]];
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
    new CRBE(ids),
    new CRCOND(ids),
    new CREVERY(ids),
    new CRVPEVERY(ids),
    new CROR(ids),
    new CRVPOR(ids),
    new CRNPOR(ids)];
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
};