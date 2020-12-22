const {clone, print, child} = require("./base.js");
const {parse, first, nodes} = require("./parser.js");
const {DRS} = require("./drs.js");

const {
  S, S_, NP, NP_, PN, VP_, VP, V, BE, DET, N, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP, HAVE, VERB,
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
      if (b.children[i] && a.children[i].toLowerCase() != String((b.children[i]).value).toLowerCase()) {
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
      // console.log(this.args);
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
    
    let ref = find(name.types, refs, name.children[0].value, name.loc);
    // console.log(refs);
    // console.log(ref);
    //console.log(name.children[0].value);
    if (!ref) {
      ref = referent(this.id(), name.types, name.children[0].value, name.loc);
      head.push(ref);
      
      let pred = predicate(child(name, 0).value, [ref], name.types);
      body.push(pred);
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
    let last = node.children.length - 1;
    //let name = child(node, last);
    
    ///if (name["@type"] != "NP" && child(name, 0)["@type"] != "PN") {
    // return [[], [], [], []];
    //}
    
    // console.log("hi");
    let head = [];
    let body = [];
    let ref = find(name.types, refs, name.children[0].value, name.loc);
    
    if (!ref) {
      ref = referent(this.id(), name.types, name.children[0], name.loc);
      head.push(ref);
      let pred = predicate(child(name, 0).value, [ref], name.types);
      body.push(pred);
    }
    node.children[last] = ref;
    // console.log(JSON.stringify(node, undefined, 2));
    
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

    // console.log("hi");
    // console.log(node);

    // throw new Error(name.children[0].value);

    //console.log("hi");
    //console.log(name);
    // console.log(name.children[0].value);
    
    let ref = find(name.types, refs, name.children[0].value);
    //console.log(name.children[0].value);
    // console.log(ref);
    if (!ref) {
      ref = referent(this.id(), name.types, print(name));
      head.push(ref);
      let pred = predicate(child(name, 0).value, [ref], name.types);
      body.push(pred);
      // console.log(pred);
      //let pn = name;
      //pn.ref = ref;
      //body.push(pn);
    }
    // console.log(body);
    
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

    let ref = find(name.types, refs, name.children[0].value);
    if (!ref) {
      ref = referent(this.id(), name.types, print(name));
      head.push(ref);
      let pred = predicate(child(name, 0).value, [ref], name.types);
      body.push(pred);
    }

    node.children[1] = ref;

    // console.log(JSON.stringify(node, undefined, 2));
    //console.log("hi");
    //throw new Error("hi");
    
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
      throw new Error("Invalid reference: " + pronoun.children[0].value);
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
      throw new Error("Invalid Reference: " + pro.children[0].value);
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
    // console.log("hi");
    // console.log(det.children[0]);
    if (typeof det.children[0].value != "string" ||
        det.children[0].value.toLowerCase() != "a") {
      return [[], [], [], []];
    }
    
    // console.log();
    
    let ref = referent(this.id(), noun.types, print(child(node, 0), refs));
    noun.ref = ref;
    node.children[0] = ref;

    // console.log(ref);
    
    return [[ref], [noun], [], []];
  }
}

class CRVPID extends Rule {
  constructor(ids) {
    super(ids, VP(V(), NP(DET(capture("det")), N(capture("noun")))));
  }
  
  apply({det, noun}, node, refs) {
    // console.log("hi");
    if (!(det.children[0].value == "a" || det.children[0].value == "an")) {
      return [[], [], [], []];
    }
    
    // console.log("hi");
    
    let types = clone(noun.types);
    Object.assign(types, child(noun, 0).types);
    
    let ref = referent(this.id(), types, print(child(node, 1), refs));
    noun.ref = ref;
    node.children[1] = ref;
    
    // console.log(node);
    
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
    if (!node.ref || node.children.length != 1) {
      return [[], [], [], []];
    }
    let pred = predicate(child(noun, 0).value, [node.ref], node.types);
    
    return [[], [pred], [], [node]];
  }
}

class CRPPLIN extends Rule {
  constructor(ids) {
    super(ids, N(capture("noun"),
                 PP(PREP(capture("prep")), capture("np"))));
  }
  apply({prep, np}, node) {
    if (!node.ref) {
      return [[], [], [], []];
    }

    const noun = child(node, 0);
    
    let body = [];
    noun.ref = node.ref;
    body.push(noun);

    let cond = S(node.ref, VP_(VP(V(child(prep, 0).value), child(np, 1))));
    body.push(cond);
    
    return [[], body, [], [node]];
  }
}

class CRLIN extends CompositeRule {
  constructor(ids) {
    super([new CRPPLIN(ids), new CRNLIN(ids)]);
  }
}

class CRADV extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"),
                 VP_(VP(V(capture("verb"),
                          PP(PREP(capture("prep")),
                             capture("np")))))));
  }
  apply({subject, verb, prep, np}, node) {
    let body = [];
    let sub = child(node, 0);
    let e = referent("e");
    let cond = S(e, VP_(VP(V(child(prep, 0).value), child(np, 1))));
    
    body.push(cond);
    
    const s = clone(node);
    child(s, 1, 0).children[0] = child(verb, 0);
    body.push(s);
    
    return [[], body, [], [node]];
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
    
    // console.log(child(s, 1, 0));
    
    const g1 = S(NP(), VP_(AUX(), "not", VP(V(), NP(GAP(capture("gap"))))));
    
    if (match(g1, s)) {
      // console.log(child(s, 1, 2, 1));
      child(s, 1, 2).children[1] = node.ref;
    }
    
    // Binds gap to the referent.
    let object = child(s, 1, 0, 1);
    if (object && object.children && object.children[0]["@type"] == "GAP") {
      child(s, 1, 0).children[1] = node.ref;
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
    
    // console.log(child(s, 1, 2, 1));
    
    // console.log(child(s, 1, 0, 1));
    
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
    // sub.neg = true;
    
    let s = clone(node);
    // console.log(s);
    child(s, 1).children.splice(0, 2);
    // console.log(child(node, 1));
    
    sub.push(s);
    // console.log(sub);
    //console.log(sub.print());
    //console.log(sub instanceof DRS);
    
    return [[], [negation(sub)], [], [node]];
  }
}

class CRPOSBE extends Rule {
  constructor(ids) {
    super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
  }
  apply({ref, adj}, node, refs) {
    //let s = S(adj);
    //console.log(s);
    //console.log("hi");
    //console.log(node.types);
    let s = predicate(adj.children[0].value, [ref.children[0]], node.types);
    // console.log(s);
    //adj.ref = ref.children[0];
    //s.types = node.types;   
    return [[], [s], [], [node]];
  }
}

class CRPREPBE extends Rule {
  constructor(ids) {
    super(ids, S(capture("ref"),
                 VP_(VP(BE("is"), PP(PREP(capture("prep")), capture("np"))))
                ));
  }
  apply({ref, prep, np}, node, refs) {
    let body = [];

    let s = S(child(ref, 0), VP_(VP(V(child(prep, 0).value), child(np, 1))));
    body.push(s);
    
    return [[], body, [], [node]];
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
    // console.log(sub);
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
    //console.log("hi");
    
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
    // console.log("hi");
    let sub = drs(this.ids);
    
    sub.head = clone(refs);
    sub.head.forEach(ref => ref.closure = true);
    
    let np = clone(noun);
    np.ref = child(ref, 0);
    
    //console.log(np);
    let prep = child(node, 1, 0, 2, 2);
    let cond;
    noun.ref = child(ref, 0);
    if (prep) {
      cond = S(NP(DET(), noun, prep));
      //cond.ref = child(ref, 0);
      //noun.ref = child(ref, 0);
      // console.log(cond);
      //sub.push(cond);
    } else {
      //sub.push(np);
      cond = np;
    }
    cond.ref = child(ref, 0);
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      cond.types = cond.types || {};
      cond.types.tense = node.types.tense;
    }
    //console.log(cond);
    sub.push(cond);
    
    return [[], [negation(sub)], [], [node]];
  }
}

class CRBE extends CompositeRule {
  constructor(ids) {
    super([
      new CRPOSBE(ids),
      new CRNEGBE(ids),
      new CRNBE(ids),
      new CRNEGNBE(ids),
      new CRPREPBE(ids)
    ]);
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
    // let ref = head.children[1];
    // console.log(ref);
    
    let consequent = drs(this.ids);
    consequent.head.push(...clone(antecedent.head));
    consequent.head.forEach(ref => ref.closure = true);
    consequent.push(tail.children[3]);
    
    return [[], [quantifier("if", antecedent, consequent)], [], [node]];
  }
}

class CREVERY extends Rule {
  constructor(ids) {
    super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_(capture("verb"))));
  }
  apply({det, noun, verb}, node, refs) {
    // console.log("crevery");
    // console.log(det.types);
    if (!det.types.quantifier) {
      return [[], [], [], []];
    }
    //console.log("CREVERY");
    //console.log(child(node, 0));
    // console.log(det);
    
    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);

    // const s = S();
    
    // n.head.push(ref);
    // n.push(noun);

    let prep = child(node, 0, 2);
    let cond;
    noun.ref = ref;
    if (prep) {
      cond = S(NP(DET(), noun, prep));
      // console.log(prep);
    } else {
      cond = noun;
    }
    cond.ref = ref;
    // console.log(child(cond, 0));
    n.push(cond);
    //if (prep && prep["@type"] == "PP") {
    //  console.log(child(prep, 0));
   // }
    // console.log(noun);
    
    // console.log(ref);
    
    let v = drs(this.ids);
    v.head.push(...clone(n.head));
    v.head.forEach(ref => ref.closure = true);

    let s = clone(node);
    
    s.children[0] = ref;
    v.push(s);

    // console.log(v);
    
    // console.log(n);
    // console.log(det);
    let q = det.children.map((d) => d.value).join("-").toLowerCase();
    let result = quantifier(q, n, v, ref);
    
    return [[], [result], [], [node]];
  }
}

class CRVPEVERY extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"), VP_(VP(V(), NP(DET(capture("det")), N(capture("noun")))))));
  }
  apply({det, subject, noun}, node, refs) {
    
    if (!det.types.quantifier) {
      return [[], [], [], []];
    }
    // console.log(det);

    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);
    // n.head.push(ref);
    noun.ref = ref;
    n.push(noun);
    
    let verb = drs(this.ids);
    verb.head.push(...clone(n.head));
    verb.head.forEach(ref => ref.closure = true);

    let s = clone(node);

    // console.log("hello");
    child(s, 1, 0).children[1] = ref;
    verb.push(s);
  
    let q = det.children.map((d) => d.value).join("-").toLowerCase();
    return [[], [quantifier(q, n, verb, ref)], [], [node]];
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
    super(ids, S(NP(DET(capture("name"), "'s"), N(capture("noun")))));
  }
  
  apply({name, noun, verb}, node, refs) {
    // throw new Error("hi");
    let u = referent(this.id(), noun.types, print(child(node, 0), refs));
    node.children[0] = u;
    node.ref = u;
    
    // console.log("hi");
    
    let s = S(u, VP_(VP(V(noun.children[0].value), name.children[0])));
    // console.log(noun.children[0]);
    // console.log(child(s, 1, 0, 0));
    
    return [[u], [s], [], []];
  }
}

class CRVPPOSS extends Rule {
  constructor(ids) {
    super(ids, S(capture("sub"), VP_(VP(capture("verb"), NP(DET(capture("name"), "'s"), N(capture("noun")))))));
  }
  
  apply({name, noun, verb}, node, refs) {
    // console.log("hello");
    let poss = child(node, 1, 0, 1, 0, 1);
    if (!poss) {
      // TODO(goto): figure out why the "'s" isn't preventing this from
      // matching
      return [[], [], [], []];
    }
    // console.log(node);
    let u = referent(this.id(), noun.types, print(child(node, 1), refs));
    child(node, 1, 0).children[1] = u;
    let s = S(u, VP_(VP(V(noun.children[0].value), name.children[0])));
    
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
    // adj = clone(adj);
    noun = clone(noun);
    // adj.ref = node.ref;
    noun.ref = node.ref;
    // console.log(adj);
    let pred = predicate(adj.children[0].value, [node.ref]);
    // console.log(pred);
    
    return [[], [noun, pred], [], [node]];
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
    let root = stem.children[0].value;
    if (node.children.length > 1) {
      root += node.children[1].value;
    }
    node.children = [root];
    
    return [[], [], [], []];
  }
}

class CRNAME extends Rule {
  constructor(ids) {
    super(ids, PN(PN(capture("first")), PN(capture("last"))));
  }
  apply({first, last}, node, refs) {
    node.children = [{
      "type": "name",
      "value": first.children[0].value + "-" + last.children[0].value
    }];
    
    return [[], [], [], []];
  }
}

class CRPLURAL extends Rule {
  constructor(ids) {
    super(ids, N(N(capture("stem"))));
  }
  apply({stem}, node, refs) {
    let root = stem.children[0].value;
    
    if (node.children.length > 1) {
      root += node.children[1].value;
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

class CRPRED extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"),
                 VP_(VP(V(capture("verb")),
                        capture("object")))));
  }
  
  apply({verb, object}, node, refs = []) {
    // console.log("hi");
    let sub = child(node, 0);
    let obj = child(node, 1, 0, 1);
    // console.log(object);
    // console.log(child(node, 1, 0).children.length);
    // console.log(child(sub, 0));
    if (sub["@type"] != "Referent") {
      throw new Error("Expected referent, got " + sub["@type"] + ".");
    }
    let args = [sub.name];
    if (obj) {
      args.push(obj.name);
    }
    // console.log(child(obj, 0));
    // console.log(args);
    // console.log(sub.name);
    let name = verb.children.join("");
    // console.log(verb);
    let pred = predicate(name, args, node.types);
    
    return [[], [pred], [], [node]];
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
      let result = [];
      result.push("{");
      result.push(this.a.print());
      result.push("} or {");
      result.push(this.b.print());
      result.push("}");
      return result.join("\n");
    }
  };
}

function quantifier(q, a, b, ref) {
  return {
    "@type": "Quantifier",
    "q": q,
    "a": a,
    "b": b,
    "ref": ref,
    print() {
      let result = [];
      result.push(`${q} (${ref ? (ref.name + ": {") : "{"}`);
      result.push(this.a.print());
      result.push("}) {");
      result.push(this.b.print());
      result.push("}");
      return result.join("\n");
    }
  };
}

function negation(a) {
  return {
    "@type": "Negation",
    "a": a,
    print() {
      let result = [];
      result.push("not {");
      result.push(this.a.print());
      result.push("}");
     return result.join("\n");
    }
  };
}

function conjunction(a, b) {
  return {
    "@type": "Conjunction",
    "a": a,
    "b": b,
    print() {
      let result = [];
      result.push("{");
      result.push(this.a.print());
      result.push("} and {");
      result.push(this.b.print());
      result.push("}");
      return result.join("\n");
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
      let result = [];
      result.push("for (" + `${x ? x.print() : ""}` + ") {");
      result.push(this.drs.print());;
      result.push("} ?");
      return result.join("\n");
    }
  };
}

class Rules {
  static from(ids = new Ids()) {
    let rules = [
      new CREVERY(ids),
      new CRVPEVERY(ids),
      new CRASPECT(ids),
      new CRLIN(ids),
      new CRID(ids),
      new CRADV(ids),
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
      new CRWILL(ids),
      new CRQUESTION(ids),
      new CRPLURAL(ids),
      new CRSTEM(ids),
      new CRPUNCT(ids),
    ];
    return [[new CRNAME(ids)], [new CRPN(ids)], rules, [new CRPRED(ids)]];
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
  CRTENSE: CRTENSE,
  CRASPECT: CRASPECT,
  CRWILL: CRWILL,
  CRQUESTION: CRQUESTION,
};
