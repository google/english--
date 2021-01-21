const {clone, print, child} = require("./base.js");
const {parse, first, nodes} = require("./parser.js");
const {DRS} = require("./drs.js");

const {
  S, S_, Q, Q_, NP, NP_, PN, VP_, VP, V, BE, DET, N, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP, HAVE, VERB, WH,
  Discourse, Sentence, Statement, Question
} = nodes;

let capture = (name) => { return {"@type": "Match", "name": name} };

let ANY = (...children) => { return {"@type": "ANY", "children": children} };

function match(a, b) {
  if (!a || !b) {
    return false;
  }

  if (a["@type"] != "ANY" &&
      b["@type"] != "ANY" &&
      a["@type"] != b["@type"]) {
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
      if (!a.children || !b.children) {
        //console.log(a);
        //console.log(b);
        return false;
      }
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
  // console.log(name);
  //console.log(refs);
  //console.log(loc);
  // console.log(`Trying to find ${name}`);
  let match = (ref) => {
    let byName = name ? ref.value == name : true;
    let types = ref.types || {};
    // console.log(`Ref name? ${ref.value}. By name? ${byName}. ${JSON.stringify(types)} ${types.num} preceeds? ${ref.loc} > ${loc}`);
    //console.log(exclude);
    //console.log(exclude);
    if (ref.loc > loc) {
      // A referent can never make a reference to a previous location.
      return false;
    } else if (name) {
      //console.log(name);
      return name == ref.value;
    } else if (exclude.map(x => x.name).includes(ref.name)) {
      return false;
    } else if (types.gen == "?" && types.num == "?") {
      types.gen = gen;
      types.num = num;
      return true;
    } else if (types.num != num) {
      return false;
    }
    return types.gen == gen;
  };
  
  for (let i = refs.length - 1; i >= 0; i--) {
    // console.log(refs[i]);
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

function predicate(name, args, types, infix = false) {
  // throw new Error("");
  return {
    "@type": "Predicate",
    name: name,
    args: args,
    types: types,
    print() {
      // console.log(args);
      // console.log(this.time);
      let params = this.args.map(arg => print(arg));
      if (infix) {
        return params.join(` ${this.name} `);
      }
      return `${this.name}(${params.join(", ")})`;
    }
  }
}

class CRPN1 extends Rule {
  constructor(ids) {
    super(ids, ANY(NP(PN(capture("name")))));
  }
  apply({name}, node, refs) {
    const pn = child(name, 0).value;
    let head = [];
    let body = [];

    let ref = find(name.types, refs, name.children[0].value, name.loc);

    if (!ref) {
      ref = referent(this.id(), name.types, name.children[0].value, name.loc);
      head.push(ref);
      let pred = predicate(pn, [ref], name.types);
      body.push(pred);
    }

    node.children[0] = ref;

    return [head, body, [], []];
  }
}

class CRPN2 extends Rule {
  constructor(ids) {
    super(ids, ANY(ANY(), NP(PN(capture("name")))));
  }
  apply({name}, node, refs) {
    const pn = child(name, 0).value;
    let head = [];
    let body = [];

    let ref = find(name.types, refs, name.children[0].value, name.loc);

    if (!ref) {
      ref = referent(this.id(), name.types, name.children[0].value, name.loc);
      head.push(ref);
      let pred = predicate(pn, [ref], name.types);
      body.push(pred);
    }

    node.children[1] = ref;

    return [head, body, [], []];
  }
}

class CRPN4 extends Rule {
  constructor(ids) {
    super(ids, ANY(ANY(), ANY(), ANY(), NP(PN(capture("name")))));
  }
  apply({name}, node, refs) {
    const pn = child(name, 0).value;
    let head = [];
    let body = [];

    let ref = find(name.types, refs, name.children[0].value, name.loc);

    if (!ref) {
      ref = referent(this.id(), name.types, name.children[0].value, name.loc);
      head.push(ref);
      let pred = predicate(pn, [ref], name.types);
      body.push(pred);
    }

    node.children[3] = ref;

    return [head, body, [], []];
  }
}

class CRPN extends CompositeRule {
  constructor(ids) {
    super([new CRPN1(ids), new CRPN2(ids), new CRPN4(ids)]);
  }
}

class CRSPRO extends Rule {
  constructor(ids) {
    super(ids, S(NP(PRO(capture("pronoun"))), VP_(capture("obj"))));
  }
  
  apply({pronoun, obj}, node, refs) {
    //let exclude = pronoun.types.refl != "+" ? [child(obj, 0, 1)] : [];
    //console.log(obj);
    //console.log(pronoun);
    let u = find(pronoun.types, refs, undefined, child(pronoun, 0).loc);
    
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
    // console.log(pro);
    let exclude = pro.types.refl != "+" ? [child(sub, 0)] : [];
    // console.log(exclude);
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
    if (child(det, 0)["@type"] == "Referent") {
      return [[], [], [], []];
    }

    let ref = referent(this.id(), noun.types, print(child(node, 0), refs));
    noun.ref = [ref];
    node.children[0] = ref;
    
    return [[ref], [noun], [], []];
  }
}

class CRVPID extends Rule {
  constructor(ids) {
    super(ids, VP(V(), NP(DET(capture("det")), N(capture("noun")))));
  }
  
  apply({det, noun}, node, refs) {
    let types = clone(noun.types);
    Object.assign(types, child(noun, 0).types);
    
    let ref = referent(this.id(), types, print(child(node, 1), refs));
    noun.ref = [ref];
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
    if (!node.ref || node.children.length != 1) {
      return [[], [], [], []];
    }

    let pred = predicate(noun.prop, node.ref, node.types);
    
    return [[], [pred], [], [node]];
  }
}

class CRPPLIN extends Rule {
  constructor(ids) {
    super(ids, N(capture("noun"),
                 PP(PREP(capture("prep")), capture("np"))));
  }
  apply({noun, prep, np}, node) {
    if (!node.ref) {
      return [[], [], [], []];
    }

    const n = child(node, 0);

    let body = [];
    n.ref = node.ref;
    body.push(n);

    let name = [];
    let i = child(noun, 0);
    while (i && i["@type"] == "N") {
      if (i.prop) {
        name.push(i.prop);
      } else if (child(i, 0).prop) {
        name.push(child(i, 0).prop);
      }
      i = child(i, 1);
    }

    name.push(child(prep, 0).value);

    child(prep, 0).value = name.join("-");
    
    let cond = S(node.ref[0], VP_(VP(V(child(prep, 0)), child(np, 1))));
    body.push(cond);
    
    return [[], body, [], [node]];
  }
}

class CRADJLIN extends Rule {
  constructor(ids) {
    super(ids, ADJ(capture("adj")));
  }
  
  apply({adj}, node) {
    if (!adj.ref || adj.children.length != 1) {
      return [[], [], [], []];
    }

    //console.log(adj);
    
    let pred = predicate(adj.prop, node.ref, node.types);
    
    return [[], [pred], [], [node]];
  }
}

class CRPPADJLIN extends Rule {
  constructor(ids) {
    super(ids, ADJ(capture("adj"),
                   PP(PREP(capture("prep")), capture("np"))));
  }
  apply({prep, np}, node) {
    if (!node.ref) {
      return [[], [], [], []];
    }

    const adj = child(node, 0);
    
    let body = [];
    adj.ref = node.ref;
    body.push(adj);

    let name = [];
    let i = adj;
    while (i && i["@type"] == "ADJ") {
      if (i.prop) {
        name.push(i.prop);
      } else if (child(i, 0).prop) {
        name.push(child(i, 0).prop);
      }
      i = child(i, 1);
    }

    name.push(child(prep, 0).value);
    child(prep, 0).value = name.join("-");
    
    let cond = S(node.ref[0], VP_(VP(V(child(prep, 0)), child(np, 1))));
    body.push(cond);
    
    return [[], body, [], [node]];
  }
}

class CRLIN extends CompositeRule {
  constructor(ids) {
    super([new CRPPLIN(ids), new CRNLIN(ids), new CRPPADJLIN(ids), new CRADJLIN(ids)]);
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
    if (child(subject, 0)["@type"] == "GAP" &&
        child(prep, 0)["@type"] == "%by") {
      let sub = child(np, 1);
      let s = clone(node);
      s.children[0] = sub;
      let vp = child(s, 1, 0);
      vp.children[0] = child(vp, 0, 0);
      return [[], [s], [], [node]];
    }
    
    let body = [];
    let sub = child(node, 0);

    let cond = S(node.time, VP_(VP(V(child(prep, 0)), child(np, 1))));
    
    body.push(cond);

    let name = [];
    let i = verb;

    while (i && i["@type"] == "V") {
      if (i.prop) {
        name.push(i.prop);
      }
      i = child(i, 0);
    }
    name.push(child(prep, 0).value);
    child(prep, 0).value = name.join("-");
    
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
      child(s, 1, 2).children[1] = node.ref[0];
    }
    
    // Binds gap to the referent.
    let object = child(s, 1, 0, 1);
    if (object && object.children && object.children[0]["@type"] == "GAP") {
      child(s, 1, 0).children[1] = node.ref[0];
    }
    
    let subject = s.children[0];
    if (subject && subject.children && subject.children[0]["@type"] == "GAP") {
      s.children[0] = node.ref[0];
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

class CRREFBE extends Rule {
  constructor(ids) {
    super(ids, S({"@type": "Referent", children:[capture("a")]},
                 VP_(VP(BE(), {"@type": "Referent", children: [capture("b")]}))));
  }
  apply({a, b}, node, refs) {
    let s = predicate("=", [a, b], node.types, true);
    return [[], [s], [], [node]];
  }
}

class CRPOSBE extends Rule {
  constructor(ids) {
    super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
  }
  apply({ref, adj}, node, refs) {
    // throw new Error("hi");
    //let s = S(adj);
    //console.log(s);
    //console.log("hi");
    //console.log(node.types);
    //let s = predicate(adj.prop, [ref.children[0]], node.types);
    // console.log(adj);
    // let s = clone(adj);
    adj.ref = [child(ref, 0)];
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      adj.types.tense = node.types.tense;
    }
    // let n = N();
    // console.log(s);
    //adj.ref = ref.children[0];
    //s.types = node.types;   
    return [[], [adj], [], [node]];
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

    let s = S(child(ref, 0), VP_(VP(V(child(prep, 0)), child(np, 1))));
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
    np.ref = [child(ref, 0)];
    // console.log("hi");
    // throw new Error("hi");
    
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      np.types.tense = node.types.tense;
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
    np.ref = [child(ref, 0)];
    
    //console.log(np);
    let prep = child(node, 1, 0, 2, 2);
    let cond;
    noun.ref = [child(ref, 0)];
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
    cond.ref = [child(ref, 0)];
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

class CRPASSIVEBE extends Rule {
  constructor(ids) {
    super(ids, S(capture("obj"),
                 VP_(VP(BE(capture("be")),
                        VP(V(capture("verb")),
                           NP(GAP()))))));
  }
  apply({obj, be, verb}, node, refs) {
    let s = S(GAP(), VP_(VP(verb, child(obj, 0))));
    // Matches the DRS found in (3.57) on page 269.
    s.types = {
      tense: be.types.tense
    };
    return [[], [s], [], [node]];
  }
}

class CRBE extends CompositeRule {
  constructor(ids) {
    super([
      new CRPASSIVEBE(ids),
      new CRREFBE(ids),
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
    if (!det.types.quant) {
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
    noun.ref = [ref];
    if (prep) {
      cond = S(NP(DET(), noun, prep));
      // console.log(prep);
    } else {
      cond = noun;
    }
    cond.ref = [ref];
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

    // console.log(n);
    // throw new Error("hi");
    // console.log(v);
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
    
    if (!det.types.quant) {
      return [[], [], [], []];
    }
    // console.log(det);

    // throw new Error("hi");
    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);
    // n.head.push(ref);
    noun.ref = [ref];
    n.push(noun);
    // console.log(noun);
    
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
    super(ids, S("either", S(capture("a")), "or", S(capture("b"))));
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
    super(ids, S(NP("either", ANY(capture("first")), "or", ANY(capture("second"))), 
                 VP_(capture("vp"))));
  }
  apply({first, second, vp}, node, refs) {
    let a = drs(this.ids);
    a.head.push(...clone(refs));
    a.head.forEach(ref => ref.closure = true);
    a.push(S(first, clone(vp)));
    
    let b = drs(this.ids);
    b.head.push(...clone(a.head));
    b.head.forEach(ref => ref.closure = true);
    b.push(S(second, clone(vp)));
    
    return [[], [disjunction(a, b)], [], [node]];
  }
}

class CRVPNPOR extends Rule {
  constructor(ids) {
    super(ids, S(capture("sub"), 
                 VP_(VP(V(capture("verb")), NP("either", ANY(capture("first")), "or", ANY(capture("second")))))));
  }
  apply({sub, verb, first, second}, node, refs) {
    let a = drs(this.ids);
    a.head.push(...clone(refs));
    a.head.forEach(ref => ref.closure = true);
    a.push(S(child(sub, 0), VP_(VP(verb, first))));
    
    let b = drs(this.ids);
    b.head.push(...clone(a.head));
    b.head.forEach(ref => ref.closure = true);
    b.push(S(child(sub, 0), VP_(VP(verb, second))));
    
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
    let u = referent(this.id(), noun.types, print(child(node, 0), refs));
    node.children[0] = u;
    node.ref = [u];
    
    // console.log("hi");
    
    // let s = S(u, VP_(VP(V(noun.children[0]), name.children[0])));
    let s = clone(noun);
    s.ref = [u, child(name, 0)];

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
    let poss = child(node, 1, 0, 1, 0, 1);
    if (!poss) {
      // TODO(goto): figure out why the "'s" isn't preventing this from
      // matching
      return [[], [], [], []];
    }
    // console.log(node);
    // throw new Error("hi");
    let u = referent(this.id(), noun.types, print(child(node, 1), refs));
    child(node, 1, 0).children[1] = u;
    // console.log(noun);
    // console.log(child(name, 0));
    let s = clone(noun);
    s.ref = [u, child(name, 0)];
    // console.log(child(name, 0));
    //noun.ref = child(name, 0);

    // let s = S(u, VP_(VP(BE("is"), NP(DET("a"), noun))));
    //let s = S(u, VP_(VP(V(noun.children[0]), name.children[0])));
    
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
    if (!node.ref) {
      return [[], [], [], []];
    }

    noun = clone(noun);
    noun.ref = node.ref;
    let name = [];
    let i = node;
    while (i && i["@type"] == "N") {
      if (i.prop) {
        name.push(i.prop);
      } else {
        name.push(child(i, 0).prop);
      }
      i = child(i, 1);
    }
    // console.log(name.join("-"));
    //console.log(node);
    let pred = predicate(name.join("-"), [node.ref[0]]);
    
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
    // TODO(goto): a lot of things are pushed as sentences
    // artificially, so verbs aren't represented anymore.
    // To fix that requires a bigger refactoring than we'd
    // want right now, so we return early here if the tree
    // Skip if a time was already assigned too.
    let {types} = node;
    let {tense, stat} = types || {};

    if (!tense || node.time) {
      return [[], [], [], []];
    }

    if (child(verb, 0, 0)["@type"] == "BE") {
      // TODO: deal with adjectives.
      return [[], [], [], []];
    }

    // Records the time relationship between the new
    // discourse referent e and the utterance time @n.
    
    // node.tense = tense;

    if (tense == "fut" &&
        verb.children[0]["@type"] == "AUX" &&
        verb.children[0].children[0] == "will") {
      // page 541: 
      //
      //   We face a minor technical complication in this case, 
      // which has to do with the auxiliary will. Will makes its 
      // semantic contribution via the feature value "fut". 
      //
      //   Once it has made this contribution it can be discarded. 
      // We account for this by pruning the auxiliary from the 
      // sentence structure that remains after the first construction
      // step, in the course of which the contribution of will is 
      // explicitly represented, has been performed.
      verb.children.shift();
    }

    if (stat == "-") {
      // let e = referent(this.id("e"), {}, undefined, node.loc, true);
      // node.time = e;
      // node.tense = tense;
      // let conds = [];
      //if (tense == "past") {
      // conds.push(before(e, referent("@now")));
      //} else if (tense == "fut") {
      // conds.push(before(referent("@now"), e));
      //}
      return [[], [], [], []];
    } else {
      let s = referent(this.id("s"), {}, undefined, node.loc, true);
      node.time = s;
      //let op = tense == "pres" ? "=" : (tense == "past" ? "<" : ">");
      let body = [];
      if (tense == "past" || tense == "fut") {
        let op = (tense == "past" ? "<" : ">");
        body.push(predicate(op, [s, referent("@now")], {}, true));
      }
      return [[s], body, [], []];
    }
    return [[], [], [], []];
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
    super(ids, Question(Q_(Q(
      BE(capture("be")),
      ANY(capture("sub")),
      ADJ(capture("adj"))))));
  }
  apply({be, sub, adj}, node) {
    let q = drs(this.ids);
    
    q.push(S(sub, VP_(VP(be, adj))));
    
    return [[], [query(q)], [], [node]];
  }
}

class CRQUESTIONBEPP extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(
      BE(capture("be")),
      ANY(capture("sub")),
      PP(capture("pp"))))));
  }
  apply({be, sub, pp}, node) {
    let q = drs(this.ids);
    
    q.push(S(sub, VP_(VP(be, pp))));
    
    return [[], [query(q)], [], [node]];
  }
}

class CRQUESTIONYESNO extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(AUX(), ANY(capture("sub")), VP(capture("vp")), "?"))));
  }
  apply({sub, vp}, node) {
    let q = drs(this.ids);
    
    q.push(S(sub, VP_(vp)));
    return [[], [query(q)], [], [node]];
  }
}

class CRQUESTIONWHO extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(WH(), VP_(capture("vp_")))), "?"));
  }
  apply({vp_}, node, refs = []) {
    let q = drs(this.ids);
    
    let u = referent(this.id(), {}, "", refs);
    
    q.head.push(u);
    
    q.push(S(u, vp_));
    
    return [[u], [query(q, u)], [], [node]];
  }
}

class CRQUESTIONWHICH extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(WH(), N(capture("noun")), VP_(capture("vp_")))), "?"));
  }
  apply({noun, vp_}, node, refs = []) {
    let q = drs(this.ids);
    
    let u = referent(this.id(), {}, "", refs);
    
    q.head.push(u);
    
    q.push(S(u, vp_));
    
    return [[u], [query(q, u)], [], [node]];
  }
}

class CRQUESTIONWHOM extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(WH(), AUX(), NP(capture("sub")), V(capture("verb")))), "?"));
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
    super([new CRQUESTIONYESNO(ids),
           new CRQUESTIONIS(ids),
           new CRQUESTIONBEPP(ids),
           new CRQUESTIONWHICH(ids), 
           new CRQUESTIONWHO(ids), 
           new CRQUESTIONWHOM(ids)]);
  }
}

class CRNAMED extends Rule {
  constructor(ids) {
    super(ids, PN({"@type": "%the", "children": []}, PN(capture("name"))));
  }
  apply({name}, node, refs) {
    node.children = [{
      "type": "name",
      "value": child(name, 0).value
    }];
    
    return [[], [], [], []];
  }
}

class CRNAMET extends Rule {
  constructor(ids) {
    super(ids, PN(PN(capture("first")), PN(capture("middle")), PN(capture("last"))));
  }
  apply({first, middle, last}, node, refs) {
    let name = first.children[0].value +
        "-" +
        middle.children[0].value +
        "-" +
        last.children[0].value;

    node.children = [{
      "type": "name",
      "value": name
    }];
    
    return [[], [], [], []];
  }
}

class CRNAME extends CompositeRule {
  constructor(ids) {
    super([
      new CRNAMET(ids),
      new CRNAMED(ids), 
    ]);
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
    super([
      new CRPUNCT1(ids), 
      new CRPUNCT2(ids),
    ]);
  }
}

class CRPRED extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"),
                 VP_(VP(V(capture("verb")),
                        capture("object")))));
  }
  
  apply({verb, object}, node, refs = []) {
    let sub = child(node, 0);
    let obj = child(node, 1, 0, 1);
    let args = [];

    let head = [];
    let body = [];
    
    if (node.time) {
      args.push(node.time);
    }
    if (sub["@type"] == "Referent") {
      args.push(sub.name);
    } else if (sub["@type"] == "GAP") {
      let u = referent(this.id(), {}, "", refs);
      head.push(u);
      args.push(u.name);
    }
    if (obj) {
      args.push(obj.name);
    }
    
    let name = verb.prop || verb.children[0].value;

    body.push(predicate(name, args, node.types));

    return [head, body, [], [node]];
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
      result.push("either {");
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
      // result.push(`${q} (${ref ? (ref.name + ": {") : "{"}`);
      //let head = q == "if" ? q : `for ${q}`;
      //console.log(q);
      let letty = q == "if" ? "" : `${q} ${ref.name}: `;
      let head = q == "if" ? "if" : "for";
      result.push(`${head} (${letty}${this.a.print(" and ")}) {`);
      //result.push();
      //result.push("}) {");
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
      // console.log("hi");
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
      result.push("question (" + `${x ? x.print() : ""}` + ") {");
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
      new CRTENSE(ids),
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
      new CRVPNPOR(ids),
      new CRAND(ids),
      new CRADJ(ids),
      new CRWILL(ids),
      new CRQUESTION(ids),
      new CRPLURAL(ids),
      // new CRSTEM(ids),
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
  CRASPECT: CRASPECT,
  CRWILL: CRWILL,
  CRQUESTION: CRQUESTION,
};
