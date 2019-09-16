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
 constructor(ids) {
  this.ids = ids || new Ids();
 }
 
 id() {
  return this.ids.get();
 }
}

class CRPN extends Rule {
 match(node) {
  let matcher1 = S(NP(PN(capture("name"))), VP_());
  
  let head = [];
  let body = [];
  let result = node;
  
  let m1 = match(matcher1, node);
  if (m1) {
   let name = m1.name.children[0];
   let ref = new Referent(this.id(), m1.name.types);
   head.push(ref);
   let pn = m1.name;
   pn.ref = ref;
   body.push(pn);
   node.children[0] = ref;
  }
  
  let matcher2 = VP(V(), NP(PN(capture("name"))));
  let m2 = match(matcher2, node);
  if (m2) {
   let name = m2.name.children[0];
   let ref = new Referent(this.id(), m2.name.types);
   head.push(ref);
   let pn = m2.name;
   pn.ref = ref;
   body.push(pn);
   result.children[1].children[0] = ref;
  }

  return [head, body, [], []];
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

class CRPRO extends Rule {
 find({gen, num}, refs) {
  return refs.find((ref) => {
    return ref.types.gen == gen && ref.types.num == num
   });
 }
 match(node, refs) {
  let head = [];
  let body = [];
  let matcher1 = S(NP(PRO(capture("pronoun"))), VP_(capture("?")));
  let m1 = match(matcher1, node);
  
  if (m1) {
   let u = this.find(m1.pronoun.types, refs);
   if (!u) {
    throw new Error("Invalid reference: " + m1.pronoun.children[0]);
   }
   node.children[0] = u;
  }

  let matcher2 = VP(V(), NP(PRO(capture("pronoun"))));
  let m2 = match(matcher2, node);
  
  // The types of head[2] agree with the types of the pronoun,
  // so bind it to it.
  if (m2) {
   let ref = this.find(m2.pronoun.types, refs);
   if (!ref) {
    throw new Error("Invalid Reference: " + m2.pronoun.children[0]);
   }
   node.children[1].children[0] = ref;
  }
  return [head, body, [], []];
 }
}

class CRID extends Rule {
 match(node) {
  let head = [];
  let body = [];
  
  let matcher1 = VP(V(), NP(DET(capture("det")), N(capture("noun"))));
  let m1 = match(matcher1, node);
  
  if (m1 && m1.det.children[0] == "a") {
   let ref = new Referent(this.id(), m1.noun.types);
   head.push(ref);
   let n = m1.noun;
   n.ref = ref;
   body.push(n);
   node.children[1] = ref;
  }
  
  let matcher2 = S(NP(DET(capture("det")), N(capture("noun"))), VP_());
  let m2 = match(matcher2, node);

  if (m2 && m2.det.children[0].toLowerCase() == "a") {
   let ref = new Referent(this.id(), m2.noun.types);
   head.push(ref);
   let n = m2.noun;
   n.ref = ref;
   body.push(n);
   node.children[0] = ref;
  }
  
  return [head, body, [], []];
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
 match(node) {
  let matcher = N(N(), RC(capture("rc")));
  let m = match(matcher, node);

  let head = [];
  let body = [];
  let remove = [];
  
  if (!m) {
   return [[], [], [], []];
  }
  
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
 match(node, refs) {
  let matcher = S(capture("np"), VP_(AUX("does"), "not", VP(capture("vp"))));
  let m = match(matcher, node);

  let head = [];
  let body = [];
  let subs = [];
  
  if (!m) {
   return [head, body, [], []];
  }
    
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

class CRBE extends Rule {
 match(node, refs) {
  let matcher1 = S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj")))));
  let m1 = match(matcher1, node);
  if (m1) {
   let ref = m1.ref.children[0];
   let adj = m1.adj;
   adj.ref = ref;
   return [[], [adj], [], [node]];
  }

  let matcher2 = S(capture("ref"), VP_(VP(BE(), "not", ADJ(capture("adj")))));
  let m2 = match(matcher2, node);
  if (m2) {
   let ref = m2.ref.children[0];
   let adj = m2.adj;
   adj.ref = ref;
   adj.neg = true;
   return [[], [adj], [], [node]];
  }

  return [[], [], [], [], []];
 }
}

class CRCOND extends Rule {
 match(node, refs) {
  let matcher = S("if", capture("antecedent"), "then", capture("consequent"));
  let m = match(matcher, node);
  
  if (m) {
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
  
  return [[], [], [], []];
 }
}

class CREVERY extends Rule {
 match(node, refs) {
  let matcher = S(NP(DET("every"), N(capture("noun"))), VP_(capture("verb")));
  let m = match(matcher, node);
  
  if (m) {
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
  
  return [[], [], [], []];
 }
}

class CRVPEVERY extends Rule {
 match(node, refs) {
  let matcher = S(capture("subject"), VP_(VP(V(), NP(DET("every"), N(capture("noun"))))));
  let m = match(matcher, node);
  
  // console.log(print(node));

  if (!m) {
   return [[], [], [], []];
  }
  
  // console.log("hi");

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
 match(node, refs) {
  let matcher = S(S(capture("a")), "or", S(capture("b")));
  let m = match(matcher, node);

  if (!m) {
   return [[], [], [], []];
  }
    
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
 match(node, refs) {
  let matcher = S(capture("n"), 
                  VP_(VP(VP(capture("a")), 
                         "or", 
                         VP(capture("b")))));
  let m = match(matcher, node);

  if (!m) {
   return [[], [], [], []];
  }

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
 match(node, refs) {
  let matcher = S(NP(NP(capture("a")), "or", NP(capture("b"))), 
                  VP_(capture("vp")));
  let m = match(matcher, node);

  if (!m) {
   return [[], [], [], []];
  }

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
