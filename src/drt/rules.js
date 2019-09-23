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
 S, NP, NP_, PN, VP_, VP, V, BE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP,
 Discourse, Sentence
} = nodes;


function transcribe(node, refs) {
 if (typeof node == "string") {
  return node;
 } else if (node["@type"] == "Referent") {
  if (refs) {
   // de-reference referents
   return refs.find(ref => ref.name == node.name).value;
  }
  return node.name;
 } else if (node["@type"] == "Predicate") {
  return `${node.name}(${node.ref.name})`;
 }
 let result = [];
 for (let child of node.children || []) {
  result.push(transcribe(child, refs));
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
  let result = match(this.trigger, node);

  if (!result) {
   return [[], [], [], []];
  }

  return this.apply(result, node, refs);
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

function print(node, refs) {
 return transcribe(node, refs);
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

function find({gen, num}, refs, name) {
 return refs.find((ref) => {
   let byName = name ? ref.value == name : true;
   let types = ref.types || {};
   return types.gen == gen && types.num == num && byName
  });
}

function referent(name, types, value) {
  return {
   "@type": "Referent",
    types: types,
    name: name,
    value: value
  }
}

class CRSPN extends Rule {
 constructor(ids) {
  super(ids, S(NP(PN(capture("name"))), VP_()));
 }

 apply({name}, node, refs = []) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, print(name.children[0]));

  if (!ref) {
   ref = referent(this.id(), name.types, print(name, refs));
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }

  node.children[0] = ref;

  return [head, body, [], []];
 }
}

class CRVPPN extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(PN(capture("name")))));
 }
 apply({name}, node, refs = []) {
  let head = [];
  let body = [];
  let ref = find(name.types, refs, name.children[0]);

  if (!ref) {
   ref = referent(this.id(), name.types, name.children[0]);
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }

  node.children[1].children[0] = ref;

  return [head, body, [], []];
 }
}

class CRDETPN extends Rule {
 constructor(ids) {
  super(ids, DET(PN(capture("name")), "'s"));
 }
 apply({name}, node, refs) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, name.children[0]);

  if (!ref) {
   ref = referent(this.id(), name.types, print(name));
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }
  
  node.children[0] = ref;

  return [head, body, [], []];
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
  super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_()));
 }

 apply({det, noun}, node, refs) {
  if (det.children[0].toLowerCase() != "a") {
   return [[], [], [], []];
  }

  let ref = referent(this.id(), noun.types, print(noun, refs));
  noun.ref = ref;
  node.children[0] = ref;

  return [[ref], [noun], [], []];
 }
}

class CRVPID extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(DET(capture("det")), N(capture("noun")))));
 }

 apply({det, noun}, node, refs) {
  if (!(det.children[0] == "a" || det.children[0] == "an")) {
   return [[], [], [], []];
  }

  let ref = referent(this.id(), noun.types, print(child(node, 1), refs));
  noun.ref = ref;
  node.children[1] = ref;

  return [[ref], [noun], [], []];
 }
}

class CRID extends CompositeRule {
 constructor(ids) {
  super([new CRSID(ids), new CRVPID(ids)]);
 }
}

class CRNLIN extends Rule {
 constructor(ids) {
  super(ids, N(capture("noun")));
 }
 apply({noun}, node) {
  if (!node.ref ||
      node.children.length != 1) {
   return [[], [], [], []];
  }

  // Simple noun
  let pred = {
   "@type": "Predicate", 
   name: child(noun, 0), 
   ref: node.ref
  };
  
  return [[], [pred], [], [node]];
 }
}

class CRPPLIN extends Rule {
 constructor(ids) {
  super(ids, N(N(capture("noun")), PP(PREP(capture("prep")), NP(capture("np")))));
 }
 apply({noun, prep, np}, node) {
  if (!node.ref) {
   return [[], [], [], []];
  }

  let u = referent(this.id(), noun.types);

  noun.ref = u;
  let cond = S(u, VP_(VP(V(prep), np)));

  return [[u], [noun, cond], [], [node]];
 }
}

class CRLIN extends CompositeRule {
 constructor(ids) {
  super([new CRNLIN(ids), new CRPPLIN(ids)]);
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
  
  let sub = drs(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  sub.neg = true;

  let s = node;
  s.children[1].children.splice(0, 2);

  sub.push(s);

  return [head, [sub], [], [node]];
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
  let antecedent = drs(this.ids);
  antecedent.head.push(...clone(refs));
  antecedent.head.forEach(ref => ref.closure = true);
  antecedent.push(head.children[1]);
   
  let consequent = drs(this.ids);
  consequent.head.push(...clone(antecedent.head));
  consequent.head.forEach(ref => ref.closure = true);
  consequent.push(tail.children[3]);
   
  return [[], [implication(antecedent, consequent)], [], [node]];
 }
}

class CREVERY extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET("every"), N(capture("noun"))), VP_(capture("verb"))));
 }
 apply({noun, verb}, node, refs) {
  let ref = referent(this.id(), noun.types);
  let n = drs(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  n.push(noun);

  let v = drs(this.ids);
  v.head.push(...clone(n.head));
  v.head.forEach(ref => ref.closure = true);
  node.children[0] = ref;
  v.push(node);

  let result = implication(n, v);
   
  return [[], [result], [], [node]];
 }
}

class CRVPEVERY extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(), NP(DET("every"), N(capture("noun")))))));
 }
 apply({subject, noun}, node, refs) {
  let ref = referent(this.id(), noun.types);
  let n = drs(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  n.push(noun);
   
  let verb = drs(this.ids);
  verb.head.push(...clone(n.head));
  verb.head.forEach(ref => ref.closure = true);
  child(node, 1, 0).children[1] = ref;
  verb.push(node);
  
  return [[], [implication(n, verb)], [], [node]];
 }
}

class CROR extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "or", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  return [[], [disjunction(first, second)], [], [node]];
 }
}

class CRVPOR extends Rule {
 constructor(ids) {
  super(ids, S(capture("n"), VP_(VP(VP(capture("a")), "or", VP(capture("b"))))));
 }
 apply({a, b, n}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(n.children[0]), VP_(a)));

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(n.children[0]), VP_(b)));
  
  return [[], [disjunction(first, second)], [], [node]];
 }
}

class CRNPOR extends Rule {
 constructor(ids) {
  super(ids, S(NP(NP(capture("first")), "or", NP(capture("second"))), 
                  VP_(capture("vp"))));
 }
 apply({first, second, vp}, node, refs) {
  let a = drs(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(S(first, VP_(clone(vp))));

  let b = drs(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(S(second, VP_(clone(vp))));
  
  return [[], [disjunction(a, b)], [], [node]];
 }
}

class CRSAND extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "and", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  return [[], [conjunction(first, second)], [], [node]];
 }
}

class CRVPAND extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(V(capture("a")), "and", V(capture("b"))), NP(capture("object"))))));
 }
 apply({subject, a, b, object}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(subject.children[0]), VP_(VP(a, clone(object)))));

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(subject.children[0]), VP_(VP(b, clone(object)))));
  
  return [[], [conjunction(first, second)], [], [node]];
 }
}

class CRAND extends CompositeRule {
 constructor(ids) {
  super([new CRSAND(ids), new CRVPAND(ids)]);
 }
}

// Possessive Phrases
class CRSPOSS extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node, refs) {
  // console.log(child(node, 0, 0));

  let u = referent(this.id(), noun.types, print(child(node, 0), refs));
  node.children[0] = u;
  node.ref = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRVPPOSS extends Rule {
 constructor(ids) {
  super(ids, VP(V(capture("verb")), NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node, refs) {
  let u = referent(this.id(), noun.types, print(child(node, 1), refs));
  node.children[1] = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRPOSS extends CompositeRule {
 constructor(ids) {
  super([new CRSPOSS(ids), new CRVPPOSS(ids)]);
 }
}

class CRADJ extends Rule {
 constructor(ids) {
  super(ids, N(ADJ(capture("adj")), N(capture("noun"))));
 }
 apply({adj, noun}, node, refs) {
  adj.ref = node.ref;
  noun.ref = node.ref;
  return [[], [noun, adj], [], [node]];
 }
}

class CRSPP extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(), N(N(capture("noun")), PP(PREP(capture("prep")), NP(capture("np"))))), 
               VP_()));
 }
 apply({noun, prep, np}, node, refs) {
  let u = referent(this.id(), noun.types);
  if (child(node, 0, 0)["@type"] == "DET" &&
      child(node, 0, 0, 0) == "Every") {
   child(node, 0).children[1] = u;
  } else {
   node.children[0] = u;
  }

  noun.ref = u;
  let cond = S(u, VP_(VP(V(prep), np)));

  return [[u], [noun, cond], [], []];
 }
}

class CRVPPP extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), 
               VP_(VP(V(), NP(DET(), 
                              N(N(capture("noun")), PP(PREP(capture("prep")), NP(capture("np"))))
                              )))));
 }
 apply({noun, prep, np}, node, refs) {
  let u = referent(this.id(), noun.types);
  child(node, 1, 0).children[1] = u;

  noun.ref = u;
  let cond = S(u, VP_(VP(V(prep), np)));

  return [[u], [noun, cond], [], []];
 }
}

class CRPP extends CompositeRule {
 constructor(ids) {
  super([new CRSPP(ids), new CRVPPP(ids)]);
 }
}

function drs(ids) {
 return DRS.from(ids);
}

class DRS {
 constructor(names, rules) {
  this.head = [];
  this.body = [];
  this.names = names;
  this.rules = rules;
 }

 static from(ids = new Ids()) {
  let rules = 
   [new CREVERY(ids),
    new CRVPEVERY(ids),
    new CRPP(ids),
    new CRID(ids),
    new CRLIN(ids),
    new CRNRC(ids), 
    new CRPRO(ids),
    new CRNEG(ids),
    new CRPOSS(ids),
    new CRBE(ids),
    new CRCOND(ids),
    new CROR(ids),
    new CRVPOR(ids),
    new CRNPOR(ids),
    new CRAND(ids),
    new CRADJ(ids),
    ];
  return new DRS(new CRPN(ids), rules);
 }

 feed(s) {
  this.push(first(parse(s), true));
 }
 
 bind(node) {
  let queue = [node];
  while (queue.length > 0) {
   let p = queue.shift();
   // console.log(`${p["@type"]}`);
   let [refs, names] = this.names.match(p, this.head);
   this.head.push(...refs);
   this.body.push(...names);
   // ... and recurse.
   // console.log(p);
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
    // console.log(body);
    this.head.push(...head);
    this.body.push(...body);
    for (let del of remove) {
     let i = this.body.indexOf(del);
     this.body.splice(i, 1);
    }
    queue.push(...body.filter(c => !(c instanceof DRS)));
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
   if (cond instanceof DRS) {
    result.push(cond.print());
   } else if (cond["@type"] == "Implication" ||
              cond["@type"] == "Conjunction" ||
              cond["@type"] == "Disjunction") {
    result.push(cond.print());
   } else {
    result.push(transcribe(cond));
   }
  }
  
  result.push("}");
  
  return result.join("\n");
 }
}


function disjunction(a, b) {
 return {
  "@type": "Disjunction",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " or " + this.b.print();
  }
 };
}

function implication(a, b) {
 return {
   "@type": "Implication",
   "a": a,
   "b": b,
   print() {
   return this.a.print() + " => " + this.b.print();
  }
 };
}

function conjunction(a, b) {
 return {
  "@type": "Conjunction",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " and " + this.b.print();
  }
 };
}

module.exports = {
 match: match,
 capture: capture,
 child: child,
 print: print,
 referent: referent,
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
 CRPOSS: CRPOSS,
 CRADJ: CRADJ,
 CRPP: CRPP,
};
