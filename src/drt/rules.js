const {clone, print, child} = require("./base.js");
const {parse, first, nodes} = require("./parser.js");
const {DRS} = require("./drs.js");

const {
 S, S_, NP, NP_, PN, VP_, VP, V, BE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP, HAVE, VERB,
  Discourse, Sentence, Statement, Question
} = nodes;


let capture = (name) => { return {"@type": "Match", "name": name} };
  
function match(a, b) {
 if (!a || !b) {
  return false;
 }

 if (a["@type"] != b["@type"]) {
  return false;
 }
 
 let result = {};
 
 for (let i = 0; i < a.children.length; i++) {
  if (typeof a.children[i] == "string") {
   if (a.children[i].toLowerCase() != String(b.children[i]).toLowerCase()) {
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

function find({gen, num}, refs, name, loc, exclude = []) {
 let match = (ref) => {
  let byName = name ? ref.value == name : true;
  let types = ref.types || {};
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

 for (let i = refs.length - 1; i >= 0; i--) {
  if (match(refs[i])) {
   return refs[i];
  }
 }

 return undefined;
}

function referent(name, types, value, loc) {
  return {
   "@type": "Referent",
    types: types,
    name: name,
    value: value,
    loc: loc,
    print() {
    return `${this.name}`;
   }
  }
}

function predicate(name, args, types) {
  return {
   "@type": "Predicate",
    name: name,
    args: args,
    types: types,
    print() {
      let args = this.args.map(arg => print(arg));
      return `${this.name}(${args.join(", ")})`;
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
  super(ids, DET(NP(PN(capture("name"))), "'s"));
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

  // console.log(node);

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

  // console.log(pronoun.loc);
  // console.log(refs);

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
  if (typeof det.children[0] != "string" ||
      det.children[0].toLowerCase() != "a") {
   return [[], [], [], []];
  }

  // console.log("hi");

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
     
  let pred = predicate(child(noun, 0), [node.ref], node.types);
  
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

  // console.log(node);

  noun.ref = node.ref;
  let cond = S(node.ref, VP_(VP(V(prep), child(np, 1))));

  // noun.neg = node.neg;

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
  super(ids, S(capture("np"), VP_(AUX(), "not", VP(capture("vp")))));
 }

 apply({np, vp}, node, refs) {
  let sub = drs(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  sub.neg = true;

  let s = clone(node);
  // console.log(s);
  child(s, 1).children.splice(0, 2);
  // console.log(child(node, 1));

  sub.push(s);
  //console.log(sub.print());
  //console.log(sub instanceof DRS);
 
  return [[], [sub], [], [node]];
 }
}

class CRPOSBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  let s = S(adj);
  adj.ref = ref.children[0];
  s.types = node.types;   
  return [[], [s], [], [node]];
 }
}

class CRPREPBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE("is"), PP(PREP(capture("prep")), capture("np"))))));
 }
 apply({ref, prep, np}, node, refs) {
  // console.log("hi");
  //console.log(print(node));
  let s = S(child(ref, 0), VP_(VP(V(child(prep, 0)), child(np, 1))));
  // console.log(print(child(np, 1)));
  // console.log(child(s, 1, 0, 1, 1));
  return [[], [s], [], [node]];
 }
}

class CRNEGBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  let sub = drs(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  let s = S(ref.children[0], VP_(VP(BE(), adj)));
  s.types = node.types;   
  sub.push(s);
  
  return [[], [negation(sub)], [], [node]];
 }
}

class CRNBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), NP(DET(capture("det")), N(capture("noun")))))));
 }
 apply({ref, det, noun}, node, refs) {
  let np = clone(noun);
  np.ref = child(ref, 0);

  // Matches the DRS found in (3.57) on page 269.
  if (node.types && node.types.tense) {
      np.types.tense = node.types.tense;
      // console.log(np);
  }

  return [[], [np], [], [node]];
 }
}

class CRNEGNBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", NP(DET(capture("det")), N(capture("noun")))))));
 }
 apply({ref, det, noun}, node, refs) {
  let sub = drs(this.ids);

  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  
  let np = clone(noun);
  np.ref = child(ref, 0);

  // Matches the DRS found in (3.57) on page 269.
  if (node.types && node.types.tense) {
   np.types.tense = node.types.tense;
  }

  sub.push(np);

  return [[], [negation(sub)], [], [node]];
 }
}

class CRBE extends CompositeRule {
 constructor(ids) {
  super([new CRPOSBE(ids), new CRNEGBE(ids), new CRNBE(ids), new CRNEGNBE(ids), new CRPREPBE(ids)]);
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
    
    return [[], [implication("every", antecedent, consequent)], [], [node]];
  }
}

class CREVERY extends Rule {
 constructor(ids) {
   super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_(capture("verb"))));
 }
  apply({det, noun, verb}, node, refs) {
    // console.log();
    if (!det.types.quantifier) {
      return [[], [], [], []];
    }

    let quantifier = det.children.join("-").toLowerCase();
    
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

    let s = clone(node);
    
    s.children[0] = ref;
    v.push(s);
    
    let result = implication(quantifier, n, v);
    
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

    let s = clone(node);

    child(s, 1, 0).children[1] = ref;
    verb.push(s);
  
    return [[], [implication("every", n, verb)], [], [node]];
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
  // console.log("hi");
  
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
    super(ids, S(NP(DET(), N(N(capture("noun")), PP(PREP(capture("prep")), capture("np")))), VP_()));
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
               VP_(VP(V(), 
                      NP(DET(), 
                         N(N(capture("noun")), 
                           PP(PREP(capture("prep")), 
                              NP(capture("np")))))))));
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

class CRWILL extends Rule {
 constructor(ids) {
  super(ids, VP_(AUX("will"), VP(capture("verb"))));
 }
 apply({verb, aux}, node, refs) {
  let {types} = node;
  let {tense} = types || {};

  if (tense != "fut") {
   return [[], [], [], []];
  }

  // page 541: 
  //
  // We face a minor technical complication in this case, 
  // which has to do with the auxiliary will. Will makes its 
  // semantic contribution via the feature value "fut". 
  //
  // Once it has made this contribution it can be discarded. 
  // We account for this by pruning the auxiliary from the 
  // sentence structure that remains after the first construction
  // step, in the course of which the contribution of will is 
  // explicitly represented, has been performed.
  node.children.shift();

  return [[], [], [], []];
 }
}

// Construction Rule described in page 543
class CRTENSE extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"), VP_(capture("verb"))));
 }
 apply({verb}, node, refs) {
 }
}

// Construction Rule described in page 589
class CRASPECT extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"), VP_(VP(HAVE(), VP(capture("verb"))))));
 }
 apply({sub, verb}, node) {
  let stat = (verb.types || {}).stat;

  if (!stat) {
   return [[], [], [], []];
  }

  child(node, 1).children[0] = child(node, 1, 0, 1);

  if (stat == "-") {
   return [[], [], [], []];
  } else if (stat == "+") {
   return [[], [], [], []];
  }
 }
}

class CRQUESTIONIS extends Rule {
 constructor(ids) {
  super(ids, Question(BE(capture("be")), NP(capture("sub")), ADJ(capture("adj")), "?"));
 }
 apply({be, sub, adj}, node) {
  let q = drs(this.ids);

  q.push(S(sub, VP_(VP(be, adj))));

  return [[], [query(q)], [], [node]];
 }
}

class CRQUESTIONWHO extends Rule {
 constructor(ids) {
  super(ids, Question("Who", VP_(capture("vp_")), "?"));
 }
 apply({vp_}, node, refs = []) {
  let q = drs(this.ids);

  let u = referent(this.id(), {}, "", refs);

  q.head.push(u);

  q.push(S(u, vp_));

  return [[u], [query(q, u)], [], [node]];
 }
}

class CRQUESTIONWHOM extends Rule {
 constructor(ids) {
  super(ids, Question("Who", AUX(), NP(capture("sub")), V(capture("verb")), "?"));
 }
 apply({sub, verb}, node, refs = []) {
  let q = drs(this.ids);

  let u = referent(this.id(), {}, "", refs);

  q.head.push(u);

  q.push(S(sub, VP_(VP(verb, u))));

  return [[u], [query(q, u)], [], [node]];
 }
}

class CRQUESTION extends CompositeRule {
 constructor(ids) {
  super([new CRQUESTIONIS(ids), 
         new CRQUESTIONWHO(ids), 
         new CRQUESTIONWHOM(ids)]);
 }
}

class CRSTEM extends Rule {
 constructor(ids) {
  super(ids, V(VERB(capture("stem"))));
 }
 apply({stem}, node, refs) {
  let root = stem.children[0];
  
  if (node.children.length > 1) {
   root += node.children[1];
  }

  node.children = [root];

  return [[], [], [], []];
 }
}

class CRPLURAL extends Rule {
 constructor(ids) {
  super(ids, N(N(capture("stem"))));
 }
 apply({stem}, node, refs) {
  let root = stem.children[0];
  
  if (node.children.length > 1) {
   root += node.children[1];
  }

  node.children = [root];

  return [[], [], [], []];
 }
}

class CRPUNCT1 extends Rule {
 constructor(ids) {
  super(ids, Sentence(Statement(S_(S(capture("s"))))));
 }
 apply({s}, node) {
  return [[], [s], [], [node]];
 }
}

class CRPUNCT2 extends Rule {
 constructor(ids) {
  super(ids, Sentence(Question(capture("q"))));
 }
 apply({q}, node) {
  return [[], [q], [], [node]];
 }
}

class CRPUNCT extends CompositeRule {
 constructor(ids) {
  super([new CRPUNCT1(ids), 
         new CRPUNCT2(ids)]);
 }
}

function drs(ids) {
    return new DRS(Rules.from(ids));
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

function implication(q, a, b) {
 return {
   "@type": "Quantifier",
   "q": q,
   "a": a,
   "b": b,
   print() {
     return this.a.print()
       + (q == "every" ? " => " : ` ${q} `)
       + this.b.print();
   }
 };
}

function negation(a) {
 return {
   "@type": "Negation",
   "a": a,
   print() {
   return "~" + this.a.print();
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

function equals(a, b) {
 return {
  "@type": "Equals",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " == " + this.b.print();
  }
 };
}

function query(drs, x) {
 return {
   "@type": "Query",
   "drs": drs,
   print() {
    return "exists(" + `${x ? x.print() : ""}` + ") " + this.drs.print() + " ?";
   }
 };
}

class Rules {
    static from(ids = new Ids()) {
        let rules = [
            new CRASPECT(ids),
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
            // new CRTENSE(ids),
            new CRWILL(ids),
            new CRQUESTION(ids),
            new CRPLURAL(ids),
            new CRSTEM(ids),
            new CRPUNCT(ids),
        ];
        return [new CRPN(ids), rules];
    }
}

module.exports = {
 match: match,
 capture: capture,
 referent: referent,
 Ids: Ids,
 Rules: Rules,
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
 CRASPECT: CRASPECT,
 CRWILL: CRWILL,
 CRQUESTION: CRQUESTION,
};
