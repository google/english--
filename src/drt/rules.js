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
  return node.print();
 }

 let result = [];
 for (let child of node.children || []) {
  result.push(transcribe(child, refs));
 }
 let suffix = node.ref ? `(${node.ref.name})` : "";
 let prefix = node.neg ? "~" : "";
 prefix = node.time ? `${node.time.print()}: ${prefix}` : prefix;
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
 get(prefix) {
  if (prefix) {
   this.id = this.id == undefined ? 0 : (this.id + 1);
   return `${prefix}${this.id}`;
  }
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

 id(prefix) {
  return this.ids.get(prefix);
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

function find({gen, num}, refs, name, loc, exclude = []) {
 let match = (ref) => {
  let byName = name ? ref.value == name : true;
  let types = ref.types || {};
  // console.log(`I have a name=${ref.name} num=${types.num} gen=${types.gen} @${ref.loc}`);
  if (!byName || types.num != num || ref.loc > loc) {
   return false;
  } else if (exclude.map(x => x.name).includes(ref.name)) {
   return false;
  } else if (types.gen == "?") {
   types.gen = gen;
   return true;
  }
  return types.gen == gen;
 };

 // console.log(`Trying to find a num=${num} gen=${gen} loc=${loc} excluding=${exclude.map(x => x.name).join(", ")}`);

 for (let i = refs.length - 1; i >= 0; i--) {
  if (match(refs[i])) {
   return refs[i];
  }
 }

 return undefined;
}

function referent(name, types, value, loc, time = false) {
  return {
   "@type": "Referent",
    types: types,
    name: name,
    value: value,
    loc: loc,
    time: time,
    print() {
      return this.name;
   }
  }
}

function predicate(name, children) {
  return {
   "@type": "Predicate",
    name: name,
    children: children,
    print() {
      let children = [];
      for (let child of this.children) {
       children.push(print(child));
      }
      return `${this.name}(${children.join(", ")})`;
   }
  }
}

class CRSPN extends Rule {
 constructor(ids) {
  super(ids, S(NP(PN(capture("name"))), VP_()));
 }

 apply({name}, node, refs = []) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, print(name.children[0]), name.loc);

  if (!ref) {
   ref = referent(this.id(), name.types, print(name, refs), name.loc);
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
  super(ids, VP(capture("v"), NP(PN(capture("name")))));
 }
 apply({name}, node, refs = []) {
  // console.log(name);

  let head = [];
  let body = [];
  let ref = find(name.types, refs, name.children[0], name.loc);

  if (!ref) {
   ref = referent(this.id(), name.types, name.children[0], name.loc);
   // console.log(ref);
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

class CRPPPN extends Rule {
 constructor(ids) {
  super(ids, PP(PREP(), NP(PN(capture("name")))));
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
  
  node.children[1] = ref;

  return [head, body, [], []];
 }
}

class CRPN extends CompositeRule {
 constructor(ids) {
  super([new CRSPN(ids), new CRVPPN(ids), new CRDETPN(ids), new CRPPPN(ids)]);
 }
}

class CRSPRO extends Rule {
 constructor(ids) {
  super(ids, S(NP(PRO(capture("pronoun"))), VP_(capture("?"))));
 }

 apply({pronoun}, node, refs) {
  let u = find(pronoun.types, refs, undefined, pronoun.loc);

  if (!u) {
   throw new Error("Invalid reference: " + pronoun.children[0]);
  }

  node.children[0] = u;

  return [[], [], [], []];
 }
}

class CRVPPRO extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"),
               VP_(VP(V(), NP(PRO(capture("pro")))))
               ));
 }

 apply({sub, pro}, node, refs) {
  // Exclude the subject if the pronoun is non-reflexive.
  let exclude = pro.types.refl == "-" ? [child(sub, 0)] : [];
  let ref = find(pro.types, refs, undefined, undefined, exclude);

  if (!ref) {
   throw new Error("Invalid Reference: " + pro.children[0]);
  }

  child(node, 1, 0).children[1] = ref;
  
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

  let ref = referent(this.id(), noun.types, print(child(node, 0), refs));
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

  let types = clone(noun.types);
  Object.assign(types, child(noun, 0).types);

  let ref = referent(this.id(), types, print(child(node, 1), refs));
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

  // console.log("crnlin: " + print(node));

  // Simple noun
  //let pred = {
  // "@type": "Predicate", 
  // name: child(noun, 0), 
  // ref: node.ref
  //};
  let pred = predicate(child(noun, 0), [node.ref]);
  
  return [[], [pred], [], [node]];
 }
}

class CRPPLIN extends Rule {
 constructor(ids) {
  super(ids, N(N(capture("noun")), PP(PREP(capture("prep")), capture("np"))));
 }
 apply({noun, prep, np}, node) {
  if (!node.ref) {
   return [[], [], [], []];
  }

  noun.ref = node.ref;
  let cond = S(node.ref, VP_(VP(V(prep), child(np, 1))));

  return [[], [noun, cond], [], [node]];
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
  // console.log(node);
  adj.time = node.time;
  return [[], [adj], [], [node]];
 }
}

class CRPREPBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE("is"), PP(PREP(capture("prep")), capture("np"))))));
 }
 apply({ref, prep, np}, node, refs) {
  let s = S(child(ref, 0), VP_(VP(V(child(prep, 0)), child(np, 1))));
  return [[], [s], [], [node]];
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

class CRNBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), NP(DET(capture("det")), N(capture("noun")))))));
 }
 apply({ref, det, noun}, node, refs) {
  let np = clone(noun);
  np.ref = child(ref, 0);
  return [[], [np], [], [node]];
 }
}

class CRBE extends CompositeRule {
 constructor(ids) {
  super([new CRPOSBE(ids), new CRNEGBE(ids), new CRNBE(ids), new CRPREPBE(ids)]);
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
  // console.log(noun);
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
  let u = referent(this.id(), noun.types, print(child(node, 0), refs));
  node.children[0] = u;
  node.ref = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRVPPOSS extends Rule {
 constructor(ids) {
  super(ids, VP(capture("verb"), NP(DET(capture("name"), "'s"), RN(capture("noun")))));
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
  adj = clone(adj);
  noun = clone(noun);
  adj.ref = node.ref;
  noun.ref = node.ref;
  return [[], [noun, adj], [], [node]];
 }
}

class CRSPP extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(), N(N(capture("noun")), PP(PREP(capture("prep")), capture("np")))), 
               VP_()));
 }
 apply({noun, prep, np}, node, refs) {
  let u = referent(this.id(), noun.types);
  u.value = print(child(node, 0), refs);

  if (child(node, 0, 0)["@type"] == "DET" &&
      child(node, 0, 0, 0) == "Every") {
   child(node, 0).children[1] = u;
  } else {
   node.children[0] = u;
  }

  noun.ref = u;
  let cond = S(u, VP_(VP(V(prep), child(np, 1))));

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

class CRTENSE extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"), VP_(VP(capture("verb")))));
 }
 apply({verb}, node, refs) {
  // TODO(goto): a lot of things are pushed as sentences
  // artificially, so verbs aren't represented anymore.
  // To fix that requires a bigger refactoring than we'd
  // want right now, so we return early here if the tree
  // Skip if a time was already assigned too.
  let tense = (node.types || {}).tense;
  if (node.time || !tense || tense != "past") {
   return [[], [], [], []];
  }

  // console.log("hi");

  let state = node.types.stat;

  // records at the sentence level the eventuality.
  let u = referent(this.id(state == "+" ? "s" : "e"), {}, undefined, node.loc, true);
  node.time = u;
  
  // Records the time relationship between the new
  // discourse referent e and the utterance time @n.
  // TODO(goto): support temporal anaphora.
  let time = tense == "past" ? before(u, referent("@n")) : included(u, referent("@n"));
  // let time = predicate("@before", [u, referent("@n")]);
  //let time = before(u, referent("@n"));

  return [[u], [time], [], []];
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
   [
    new CRTENSE(ids),
    new CREVERY(ids),
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
   let next = (p.children || [])
    .filter(c => typeof c != "string");
   queue.push(...next);
  }
 }

 push(node) {
  for (let ref of this.head) {
   // Reset all of the locations of previous
   // referents before new phrases are processed.
   ref.loc = 0;
  }

  // Resolve all proper names first.
  this.bind(node);

  let queue = [node];
  this.body.push(node);

  // console.log(JSON.stringify(node, undefined, 2));

  while (queue.length > 0) {
   let p = queue.shift();
   // breadth first search: iterate over
   // this level first ...
   // console.log(`${p["@type"]}`);
   let skip = false;
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
    skip = skip || remove.length > 0;
   }
   if (skip) {
    continue;
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
  let individuals = this.head
   .filter(ref => !ref.closure);
  for (let ref of individuals) {
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
              cond["@type"] == "Disjunction" ||
              cond["@type"] == "Included" ||
              cond["@type"] == "Before"
              ) {
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

function before(a, b) {
 return {
  "@type": "Before",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " < " + this.b.print();
  }
 };
}

function included(a, b) {
 return {
  "@type": "Included",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " <> " + this.b.print();
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
 CRTENSE: CRTENSE,
};
