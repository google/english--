const {clone, print, child} = require("./base.js");
const {parse, first, node, nodes} = require("./parser.js");
const {DRS} = require("./drs.js");

const {
  S, S_, Q, Q_, NP, NP_, PN, VP_, VP, V, BE, DET, N, N_, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP, HAVE, VERB, WH,
  Discourse, Sentence, Statement, Question,
} = nodes;


const ANY = node("ANY");
const REF = node("Referent");

let capture = (name) => { return {"@type": "Match", "name": name} };

function drs(ids) {
  return new DRS(Rules.from(ids));
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
  return {
    "@type": "Predicate",
    name: name,
    args: args,
    types: types,
    print(separator = ".") {
      if (!this.name) {
        throw new Error("Invalid predicate structure: " + JSON.stringify(this, undefined, 2));
      }
      let params = this.args.map(arg => arg.name);
      if (infix) {
        return params.join(` ${this.name} `) + separator;
      }
      const name = this.name.split(" ").join("-");
      return `${name}(${params.join(", ")})${separator}`;
    }
  }
}

function disjunction(a, b) {
  return {
    "@type": "Disjunction",
    "a": a,
    "b": b,
    print() {
      let result = [];
      result.push("either (");
      result.push(this.a.print() + ") or (");
      result.push(this.b.print() + ").");
      result.push("");
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
      const cond = a ? `: ${this.a.print(" ", true)}` : ``;
      result.push(`for (let ${q} ${ref.name}${cond}) {`);
      result.push(`${this.b.print()}}`);
      result.push("");
      return result.join("\n");
    }
  };
}

function conditional(a, b, ref) {
  return {
    "@type": "Quantifier",
    "a": a,
    "b": b,
    "ref": ref,
    print() {
      let result = [];
      result.push(`if (${this.a.print(" ", true)}) {`);
      result.push(`${this.b.print()}}`);
      result.push("");
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
      result.push(`not (`);
      result.push(`${this.a.print(".\n")}).`);
      result.push("");
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
      result.push("(");
      result.push(this.a.print() + ") and (");
      result.push(this.b.print() + ").");
      return result.join("\n");
    }
  };
}

function equals(a, b) {
  return {
    "@type": "Equality",
    "a": a,
    "b": b,
    print() {
      return this.a.print() + " == " + this.b.print();
    }
  };
}

function query(drs, x, resolve) {
  return {
    "@type": "Query",
    "a": drs,
    resolve() {
      return "Yes.";
    },
    print() {
      let result = [];
      let refs = [];
      let names = this.a.head
          .filter(ref => !ref.closure)
          .map((ref) => ref.print());

      if (names.length > 0) {
        result.push(`let ${names.join(", ")}: `);
      }
      
      result.push(this.a.print(" ", true));
      result.push("?");
      return result.join("");
    }
  };
}

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
    let m = match(this.trigger, node);
    
    if (!m) {
      return [[], []];
    }
    
    let result = this.apply(m, node, refs);

    if (!result) {
      return [[], []];
    }
    
    return result;
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
    let result = [[], []];
    for (let rule of this.rules) {
      let [head, body, remove] = rule.match(node, refs);
      result[0].push(...head);
      result[1].push(...body);
      if (remove) {
        result[2] = remove;
      }
    }
    return result;
  }
}

function find({gen, num}, refs, name, loc, exclude = []) {
  let match = (ref) => {
    let byName = name ? ref.value == name : true;
    let types = ref.types || {};
    if (ref.loc > loc) {
      // A referent can never make a reference to a previous location.
      return false;
    } else if (name) {
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
    if (match(refs[i])) {
      return refs[i];
    }
  }

  return undefined;
}

class CRPN1 extends Rule {
  constructor(ids) {
    super(ids, ANY(NP(PN(capture("name")))));
  }
  apply({name}, node, refs) {
    const pn = child(name, 0).value;
    let head = [];
    let body = [];

    const value = name.children[0].value;
    
    let ref = find(name.types, refs, value, name.loc);

    if (!ref) {
      ref = referent(this.id(), name.types, value, name.loc);
      head.push(ref);
      let pred = predicate(pn, [ref], name.types);
      body.push(pred);
    }

    node.children[0] = ref;

    return [head, body];
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

    return [head, body];
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

    return [head, body];
  }
}

class CRPN extends CompositeRule {
  constructor(ids) {
    super([new CRPN1(ids), new CRPN2(ids), new CRPN4(ids), new CRTHE(ids),]);
  }
}

class CRPRO1 extends Rule {
  constructor(ids) {
    super(ids, ANY(NP(PRO(capture("pro")))));
  }
  
  apply({pro}, node, refs) {
    let u = find(pro.types, refs, undefined, child(pro, 0).loc);
    
    if (!u) {
      throw new Error("Invalid reference: " + pro.children[0].value);
    }
    
    node.children[0] = u;
  }
}

class CRPRO2 extends Rule {
  constructor(ids) {
    super(ids, ANY(ANY(), NP(PRO(capture("pro")))));
  }
  
  apply({pro}, node, refs) {
    let u = find(pro.types, refs, undefined, child(pro, 0).loc);
    
    if (!u) {
      throw new Error("Invalid reference: " + pro.children[0].value);
    }
    
    node.children[1] = u;
  }
}

class CRPRO extends CompositeRule {
  constructor(ids) {
    super([new CRPRO1(ids), new CRPRO2(ids)]);
  }
}

class CRSID extends Rule {
  constructor(ids) {
    super(ids, S(NP(DET(capture("det")), N_(capture("noun"))), VP_()));
  }
  
  apply({det, noun}, node, refs) {
    if (det.types.quant != "some") {
      return;
    }

    let ref = referent(this.id(), noun.types);
    noun.ref = [ref];
    node.children[0] = ref;
    
    return [[ref], [noun]];
  }
}

class CRVPID extends Rule {
  constructor(ids) {
    super(ids, VP(ANY(), NP(DET(capture("det")), N_(capture("noun")))));
  }
  
  apply({det, noun}, node, refs) {
    if (det.types.quant != "some") {
      return;
    }

    let types = clone(noun.types);
    Object.assign(types, child(noun, 0).types);
    
    let ref = referent(this.id(), types);
    noun.ref = [ref];
    node.children[1] = ref;
    
    return [[ref], [noun]];
  }
}

class CRID extends CompositeRule {
  constructor(ids) {
    super([new CRSID(ids), new CRVPID(ids)]);
  }
}

class CRNLIN extends Rule {
  constructor(ids) {
    super(ids, N_(N(capture("noun"))));
  }
  
  apply({noun}, node) {
    if (!node.ref || node.children.length != 1 || !noun.prop) {
      return;
    }
    //console.log(node);
    //throw new Error("hi");

    // console.log(noun);
    // console.log(noun);
    // noun.ref = node.ref;
    
    //const n = child(noun, 0);
    //console.log(n);
    //throw new Error("hi");
    //console.log(noun);
    //throw new Error("hi");
    let pred = predicate(noun.prop, node.ref, node.types);
    // console.log(pred);
    // throw new Error("hello");
    
    return [[], [pred], node];
  }
}

class CRPPLIN extends Rule {
  constructor(ids) {
    super(ids, N_(capture("noun"),
                  PP(PREP(capture("prep")), capture("np"))));
  }
  apply({noun, prep, np}, node) {
    if (!node.ref) {
      return;
    }

    let i = child(noun, 0);
    //while (i) {
      // console.log(i);
    //  if (i["@type"] != "N_") {
    //    return;
    //  }
    //  i = child(i, 0);      
      // throw new Error("hi");
    //}
    
    // console.log(noun);

    //console.log(node);
    //throw new Error("hi");
    //console.log(JSON.stringify(noun, undefined, 2));
    // throw new Error("hi");
    
    const n = child(node, 0);

    // console.log(n);

    let body = [];
    n.ref = node.ref;
    body.push(n);

    let name = [];
    // console.log(i);
    // console.log(JSON.stringify(noun, undefined, 2));
    while (i && i["@type"] == "N_") {
    // while (i && i[""]) {
      // console.log(i);
      if (child(i, 0)["@type"] == "ADJ") {
        name.push(child(i, 0).prop);
        // throw new Error("hi");
        i = child(i, 1);
        continue;
      }

      if (i.prop) {
        name.push(i.prop);
      }
      i = child(i, 0);
      // throw new Error();
      //else if (child(i, 0).prop) {
      //  name.push(child(i, 0).prop);
      //}
      //console.log(i);
    }

   
    name.push(i.prop);
    name.push(child(prep, 0).value);

    //console.log(name);
    //console.log(i);
    //throw new Error("hi");

    // console.log(name);
    child(prep, 0).value = name.join("-");

    // console.log(child(np, 1));
    // console.log(child(np, 1));
    // console.log(child(prep, 0));
    // console.log(child(np, 1));
    
    let cond = S(node.ref[0], VP_(VP(V(child(prep, 0)), child(np, 1))));
    body.push(cond);
    
    //console.log(JSON.stringify(cond, undefined, 2));
    //throw new Error("hi");

    return [[], body, node];
  }
}

class CRADJLIN extends Rule {
  constructor(ids) {
    super(ids, ADJ(capture("adj")));
  }
  
  apply({adj}, node) {
    //console.log(node);
    //throw new Error("hi");
    if (!adj.ref || adj.children.length != 1) {
      return [[], []];
    }

    let pred = predicate(adj.prop, node.ref, node.types);
    
    return [[], [pred], node];
  }
}

class CRPPADJLIN extends Rule {
  constructor(ids) {
    super(ids, ADJ(capture("adj"),
                   PP(PREP(capture("prep")), capture("np"))));
  }
  apply({prep, np}, node) {
    if (!node.ref) {
      return;
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

    //console.log(name);
    //throw new Error("foo");
    
    name.push(child(prep, 0).value);
    child(prep, 0).value = name.join("-");
    
    let cond = S(node.ref[0], VP_(VP(V(child(prep, 0)), child(np, 1))));
    body.push(cond);
    
    return [[], body, node];
  }
}

class CRLIN extends CompositeRule {
  constructor(ids) {
    super([new CRPPLIN(ids), new CRNLIN(ids), new CRPPADJLIN(ids), new CRADJLIN(ids)]);
  }
}

class CRADV extends Rule {
  constructor(ids) {
    super(ids, S(ANY(capture("subject")),
                 VP_(VP(V(capture("verb"),
                          PP(PREP(capture("prep")),
                             ANY(capture("np"))))))));
  }
  apply({subject, verb, prep, np}, node) {
    if (subject["@type"] == "GAP" &&
        child(prep, 0)["@type"] == "%by") {
      let s = clone(node);
      s.children[0] =  np;
      let vp = child(s, 1, 0);
      vp.children[0] = child(vp, 0, 0);
      return [[], [s], node];
    }
    
    let body = [];

    let cond = S(node.time, VP_(VP(V(child(prep, 0)), np)));
    
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
    
    return [[], body, node];
  }
}

class CRNRC extends Rule {
  constructor(ids) {
    super(ids, N_(N_(), RC(capture("rc"))));
  }
  
  apply(m, node) {
    if (!node.ref) {
      return;
    }
    
    let head = [];
    let body = [];    

    let rc = node.children.pop();
    let s = rc.children[1];
    
    const g1 = S(REF(), VP_(AUX(), "not", VP(V(), NP(GAP(capture("gap"))))));

    //console.log(rc);
    //throw new Error("hi");
    if (match(g1, s)) {
      //throw new Error("hi");
      child(s, 1, 2).children[1] = node.ref[0];
    }
    
    // Binds gap to the referent.
    // console.log(rc);
    // console.log(rc);
    let object = child(s, 1, 0, 1);
    if (object && object.children && object.children[0]["@type"] == "GAP") {
      child(s, 1, 0).children[1] = node.ref[0];
    }
    
    let subject = s.children[0];
    if (subject && subject.children && subject.children[0]["@type"] == "GAP") {
      // console.log(child(node, 0));
      //console.log(s.children[0]);
      //console.log(node);
      s.children[0] = node.ref[0];
    }

    // Fills the GAP.
    s.types.gap = "-";

    let noun = node.children.pop();
    noun.ref = node.ref;
    body.push(noun);
    
    body.push(s);
    
    return [head, body, node];
  }
}

class CRREFBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("a")),
                 VP_(VP(BE(), REF(capture("b"))))));
  }
  apply({a, b}, node, refs) {
    //if (node.types.gap != "-") {
    //  return;
    //}

    // throw new Error("hi");
    let s = predicate("=", [a, b], node.types, true);
    return [[], [s], node];
  }
}

class CRPOSBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")), VP_(VP(BE(), ADJ(capture("adj"))))));
  }
  apply({ref, adj}, node, refs) {
    //if (node.types.gap != "-") {
    //  return;
    //}

    // throw new Error("hi");
    adj.ref = [ref];
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      adj.types.tense = node.types.tense;
    }
    return [[], [adj], node];
  }
}

class CRPREPBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")),
                 VP_(VP(BE("is"), PP(PREP(capture("prep")), ANY(capture("np")))))
                ));
  }
  apply({ref, prep, np}, node, refs) {
    //if (node.types.gap != "-") {
    //  return;
    //}

    let body = [];

    let s = S(ref, VP_(VP(V(child(prep, 0)), np)));
    body.push(s);
    
    return [[], body, node];
  }
}

class CRNEGBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")), VP_(VP(BE(), "not", ADJ(capture("adj"))))));
  }
  apply({ref, adj}, node, refs) {
    //if (node.types.gap != "-") {
    //  return;
    //}

    let sub = drs(this.ids);
    sub.head = clone(refs);
    sub.head.forEach(ref => ref.closure = true);
    let s = S(ref, VP_(VP(BE(), adj)));
    s.types = node.types;   
    sub.push(s);
    return [[], [negation(sub)], node];
  }
}

class CRNBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")), VP_(VP(BE(), NP(DET(capture("det")), N_(capture("noun")))))));
  }
  apply({ref, det, noun}, node, refs) {
    if ((node.types || {}).gap != "-") {
      return;
    }

    //throw new Error("hi");
    return;
    let np = clone(noun);
    np.ref = [ref];
    
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      np.types.tense = node.types.tense;
    }
    
    return [[], [np], node];
  }
}

class CRGENERICBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")), VP_(VP(BE(), NP(N_(capture("noun")))))));
  }
  apply({ref, noun}, node, refs) {
    if (node.types.gap != "-") {
      return;
    }

    let np = clone(noun);
    np.ref = [ref];
    console.log();
    // throw new Error("hi");
    
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      np.types.tense = node.types.tense;
    }
    
    return [[], [np], node];
  }
}

class CRNEGNBE extends Rule {
  constructor(ids) {
    super(ids, S(REF(capture("ref")), VP_(VP(BE(), "not", NP(DET(capture("det")), N_(capture("noun")))))));
  }
  apply({ref, det, noun}, node, refs) {
    if (node.types.gap != "-") {
      return;
    }

    let sub = drs(this.ids);
    
    sub.head = clone(refs);
    sub.head.forEach(ref => ref.closure = true);
    
    let np = clone(noun);
    np.ref = [ref];
    
    let prep = child(node, 1, 0, 2, 2);
    let cond;
    noun.ref = [ref];
    if (prep) {
      cond = S(NP(DET(), noun, prep));
    } else {
      cond = np;
    }
    cond.ref = [ref];
    // Matches the DRS found in (3.57) on page 269.
    if (node.types && node.types.tense) {
      cond.types = cond.types || {};
      cond.types.tense = node.types.tense;
    }
    //console.log(cond);
    sub.push(cond);
    
    return [[], [negation(sub)], node];
  }
}

class CRPASSIVEBE extends Rule {
  constructor(ids) {
    super(ids, S(ANY(capture("obj")),
                 VP_(VP(BE(capture("be")),
                        VP(V(capture("verb")),
                           NP(GAP()))))));
  }
  apply({obj, be, verb}, node, refs) {
    if (node.types.gap != "-") {
      return;
    }

    let s = S(GAP(), VP_(VP(verb, obj)));
    // Matches the DRS found in (3.57) on page 269.
    s.types = {
      tense: be.types.tense
    };
    return [[], [s], node];
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
      new CRGENERICBE(ids),
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
    
    let consequent = drs(this.ids);
    consequent.head.push(...clone(antecedent.head));
    consequent.head.forEach(ref => ref.closure = true);
    consequent.push(tail.children[3]);
    
    return [[], [conditional(antecedent, consequent)], node];
  }
}

class CRGENERIC extends Rule {
  constructor(ids) {
    super(ids, S(NP(N_(capture("noun"))), VP_(capture("verb"))));
  }
  apply({noun, verb}, node, refs) {
    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);

    noun.ref = [ref];
    n.push(noun);

    let v = drs(this.ids);
    v.head.push(...clone(n.head));
    v.head.forEach(ref => ref.closure = true);

    let s = clone(node);
    
    s.children[0] = ref;
    v.push(s);

    let result = quantifier("every", n, v, ref);
    
    return [[], [result], node];
  }
}

class CRVPGENERIC extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"), VP_(VP(V(), NP(N_(capture("noun")))))));
  }
  apply({subject, noun}, node, refs) {
    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);

    noun.ref = [ref];
    n.push(noun);

    let v = drs(this.ids);
    v.head.push(...clone(n.head));
    v.head.forEach(ref => ref.closure = true);

    let s = clone(node);
    
    child(s, 1, 0).children[1] = ref;

    v.push(s);

    let result = quantifier("every", n, v, ref);
    
    return [[], [result], node];
  }
}

class CREVERYONE extends Rule {
  constructor(ids) {
    super(ids, S(NP("everyone"), VP_(capture("verb"))));
  }
  apply({}, node, refs) {
    let ref = referent(this.id(), {});
    let head = drs(this.ids);
    
    let v = drs(this.ids);

    let s = clone(node);
    
    s.children[0] = ref;
    v.push(s);

    let result = quantifier("every", undefined, v, ref);

    return [[], [result], node];
  }
}

class CREVERYONE2 extends Rule {
  constructor(ids) {
    super(ids, S(NP(DET(NP("Everyone"), "'s"), N_(capture("noun"))), VP_(capture("verb"))));
  }
  apply({verb, noun}, node, refs) {
    let ref2 = referent(this.id(), {});
    let ref = referent(this.id(), {});
    
    let head = clone(node.children[0]);
    head.children[0].children[0] = ref2;
    let u = drs(this.ids);
    noun.ref = [ref, ref2];
    u.push(noun);

    let s = clone(node);
    s.children[0] = ref;
    let v = drs(this.ids);
    v.push(s);

    let inner = quantifier("every", u, v, ref);

    let everyone = quantifier("every", undefined, inner, ref2);

    return [[], [everyone], node];
  }
}

class CREVERY extends Rule {
  constructor(ids) {
    super(ids, S(NP(DET(capture("det")), N_(capture("noun"))), VP_(capture("verb"))));
  }
  apply({det, noun, verb}, node, refs) {
    // throw new Error("hi");
    if (det.types.quant != "+") {
      return;
    }
    
    let ref = referent(this.id(), noun.types);
    let n = drs(this.ids);
    n.head.push(...clone(refs));
    n.head.forEach(ref => ref.closure = true);

    let prep = child(node, 0, 2);
    let cond;
    noun.ref = [ref];
    if (prep) {
      cond = S(NP(DET(), noun, prep));
    } else {
      cond = noun;
    }
    cond.ref = [ref];
    n.push(cond);
    
    let v = drs(this.ids);
    v.head.push(...clone(n.head));
    v.head.forEach(ref => ref.closure = true);

    let s = clone(node);
    
    s.children[0] = ref;
    v.push(s);

    let q = det.children
        .filter((d) => d["@type"] != "%UNSIGNED_INT")
        .map((d) => d.value)
        .join("-")
        .toLowerCase();
    if (det.children[det.children.length - 1]["@type"]
        == "%UNSIGNED_INT") {
      if (det.children.length == 1) {
        q = "exactly";
      }
      q += `(${det.children[det.children.length - 1].value})`;
    }
    // console.log(q);
    if (q == "all") {
      q = "every";
    }
    let result = quantifier(q, n, v, ref);
    
    return [[], [result], node];
  }
}

class CRVPEVERY extends Rule {
  constructor(ids) {
    super(ids, S(capture("subject"), VP_(VP(V(), NP(DET(capture("det")), N_(capture("noun")))))));
  }
  apply({det, subject, noun}, node, refs) {
    if (det.types.quant != "+") {
      return;
    }
    // console.log(det);

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
    return [[], [quantifier(q, n, verb, ref)], node];
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
    
    return [[], [disjunction(first, second)], node];
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
    
    return [[], [disjunction(first, second)], node];
  }
}

class CRNPOR extends Rule {
  constructor(ids) {
    super(ids, S(NP("either", ANY(capture("first")), "or", ANY(capture("second"))), 
                 VP_(capture("vp"))));
  }
  apply({first, second, vp}, node, refs) {
    // throw new Error("hi");
    let a = drs(this.ids);
    a.head.push(...clone(refs));
    a.head.forEach(ref => ref.closure = true);
    a.push(S(first, clone(vp)));
    
    let b = drs(this.ids);
    b.head.push(...clone(a.head));
    b.head.forEach(ref => ref.closure = true);
    b.push(S(second, clone(vp)));
    
    return [[], [disjunction(a, b)], node];
  }
}

class CRVPNPOR extends Rule {
  constructor(ids) {
    super(ids, S(capture("sub"), 
                 VP_(VP(ANY(capture("verb")), NP("either", ANY(capture("first")), "or", ANY(capture("second")))))));
  }
  apply({sub, verb, first, second}, node, refs) {
    if ((node.types || {}).gap != "-") {
      return;
    }
    // throw new Error("hi");
    let a = drs(this.ids);
    a.head.push(...clone(refs));
    a.head.forEach(ref => ref.closure = true);
    a.push(S(child(sub, 0), VP_(VP(verb, first))));
    
    let b = drs(this.ids);
    b.head.push(...clone(a.head));
    b.head.forEach(ref => ref.closure = true);
    b.push(S(child(sub, 0), VP_(VP(verb, second))));
    
    return [[], [disjunction(a, b)], node];
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
    
    return [[], [conjunction(first, second)], node];
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
    
    return [[], [conjunction(first, second)], node];
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
    super(ids, S(NP(DET(capture("name"), "'s"), N_(capture("noun")))));
  }
  
  apply({name, noun, verb}, node, refs) {
    let u = referent(this.id(), noun.types);
    node.children[0] = u;
    node.ref = [u];
    
    let s = clone(noun);
    s.ref = [u, child(name, 0)];

    return [[u], [s]];
  }
}

class CRVPPOSS extends Rule {
  constructor(ids) {
    super(ids, S(capture("sub"), VP_(VP(capture("verb"), NP(DET(capture("name"), "'s"), N_(capture("noun")))))));
  }
  
  apply({name, noun, verb}, node, refs) {
    let poss = child(node, 1, 0, 1, 0, 1);
    if (!poss) {
      // TODO(goto): figure out why the "'s" isn't preventing this from
      // matching
      return;
    }
    // throw new Error("hio");
    // console.log(child(node, 1));
    // throw new Error("hi");
    let u = referent(this.id(), noun.types);
    child(node, 1, 0).children[1] = u;
    // console.log(noun);
    // console.log(child(name, 0));
    // console.log(child(name, 0));
    // console.log(JSON.stringify(name, undefined, 2));
    let s = clone(noun);
    s.ref = [u, child(name, 0)];
    // console.log(child(name, 0));
    //noun.ref = child(name, 0);

    // let s = S(u, VP_(VP(BE("is"), NP(DET("a"), noun))));
    //let s = S(u, VP_(VP(V(noun.children[0]), name.children[0])));
    
    return [[u], [s]];
  }
}

class CRPOSS extends CompositeRule {
  constructor(ids) {
    super([new CRSPOSS(ids), new CRVPPOSS(ids)]);
  }
}

class CRADJ extends Rule {
  constructor(ids) {
    super(ids, N_(ADJ(capture("adj")), N_(capture("noun"))));
  }
  apply({adj, noun}, node, refs) {
    if (!node.ref) {
      return;
    }

    noun = clone(noun);
    noun.ref = node.ref;
    let name = [];
    let i = node;

    //console.log(JSON.stringify(i, undefined, 2));
    //throw new Error();
    while (i && i["@type"] == "N_") {
      // console.log(i);
      if (child(i, 0)["@type"] == "ADJ") {
        name.push(child(i, 0).prop);
        //console.log(name);
        //throw new Error("hi");
        i = child(i, 1);
        //console.log(i);
        //throw new Error("hi");
        continue;
      } else if (child(i, 0)["@type"] == "N") {
        name.push(child(i, 0).prop);
        //console.log(child(i, 0).prop);
        //console.log();
        //throw new Error();
        i = child(i, 0);
        //throw  new Error("hi");
        continue;
      } else if (i.prop) {
        name.push(i.prop);
        // i = child(i, 0);
        
      }
      i = child(i, 0);
      //else {
      //throw new Error("hi");
      // name.push(child(i, 0).prop);
      //}
      //console.log(i);
      //throw new Error("hi");
    }
    
    //console.log(JSON.stringify(node, undefined, 2));
    //console.log(name.join("-"));
    //console.log(node);
    //throw new Error("hi");
    let pred = predicate(name.join("-"), [node.ref[0]]);
    
    return [[], [noun, pred], node];
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
      return;
    }

    if (child(verb, 0, 0)["@type"] == "BE") {
      // TODO: deal with adjectives.
      return;
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
      // let e = REF(this.id("e"), {}, undefined, node.loc, true);
      // node.time = e;
      // node.tense = tense;
      // let conds = [];
      //if (tense == "past") {
      // conds.push(before(e, REF("@now")));
      //} else if (tense == "fut") {
      // conds.push(before(REF("@now"), e));
      //}
      return;
    } else {
      let s = referent(this.id("s"), {}, undefined, node.loc, true);
      node.time = s;
      //let op = tense == "pres" ? "=" : (tense == "past" ? "<" : ">");
      let body = [];
      if (tense == "past" || tense == "fut") {
        let op = (tense == "past" ? "<" : ">");
        body.push(predicate(op, [s, referent("__now__")], {}, true));
      }
      return [[s], body];
    }
    return;
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
      return;
    }
    
    child(node, 1).children[0] = child(node, 1, 0, 1);
  }
}

function unwrap({["@type"]: type, value, children = []}) {
  if (value) {
    return type == "Referent" ? value : value.toLowerCase();
  }
  const result = [];
  for (let child of children) {
    result.push(unwrap(child));
  }
  return result.join(" ");
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
    // const n = S(sub, VP_(VP(be, adj)));
    return [[], [query(q, undefined)], node];
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
    
    return [[], [query(q)], node];
  }
}

class CRQUESTIONBEDETN extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(
      BE(capture("be")),
      ANY(capture("sub")),
      DET(capture("det")),
      N_(capture("noun")),
    ))));
  }
  apply({be, sub, det, noun}, node) {
    let q = drs(this.ids);

    q.push(S(sub, VP_(VP(be, NP(det, noun)))));
    
    return [[], [query(q)], node];
  }
}

class CRQUESTIONYESNO extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(AUX(), ANY(capture("sub")), VP(capture("vp")), "?"))));
  }
  apply({sub, vp}, node) {
    // throw new Error("hi");
    let q = drs(this.ids);
    
    q.push(S(sub, VP_(vp)));
    return [[], [query(q)], node];
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
    
    return [[u], [query(q, u)], node];
  }
}

class CRQUESTIONWHICH extends Rule {
  constructor(ids) {
    super(ids, Question(Q_(Q(WH(), N_(capture("noun")), VP_(capture("vp_")))), "?"));
  }
  apply({noun, vp_}, node, refs = []) {
    let q = drs(this.ids);
    
    let u = referent(this.id(), {}, "", refs);
    
    q.head.push(u);
    
    q.push(S(u, vp_));
    
    return [[u], [query(q, u)], node];
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
    
    return [[u], [query(q, u)], node];
  }
}

class CRQUESTION extends CompositeRule {
  constructor(ids) {
    super([new CRQUESTIONYESNO(ids),
           new CRQUESTIONIS(ids),
           new CRQUESTIONBEPP(ids),
           new CRQUESTIONBEDETN(ids),
           new CRQUESTIONWHICH(ids), 
           new CRQUESTIONWHO(ids), 
           new CRQUESTIONWHOM(ids)]);
  }
}

class CRTHE extends Rule {
  constructor(ids) {
    super(ids, PN({"@type": "%the", "children": []}, PN(capture("name"))));
  }
  apply({name}, node, refs) {
    node.children = [{
      "type": "name",
      "value": child(name, 0).value
    }];
  }
}

class CRPUNCT1 extends Rule {
  constructor(ids) {
    super(ids, Sentence(Statement(S_(S(capture("s"))))));
  }
  apply({s}, node) {
    return [[], [s], node];
  }
}

class CRPUNCT2 extends Rule {
  constructor(ids) {
    super(ids, Sentence(Question(capture("q"))));
  }
  apply({q}, node) {
    return [[], [q], node];
  }
}

class CRPUNCT3 extends Rule {
  constructor(ids) {
    super(ids, NP("[", ANY(capture("q")), "]"));
  }
  apply({q}, node) {
    const types = clone(node.types);
    //console.log(types);
    //console.log(q);
    //console.log(node);
    //Object.assign(node, q);
    // overrides the current node with its inner part.
    // TODO(goto): the node delegation code relies
    // on deleting top-level nodes, rather than inner
    // nodes, so we override it here. we should probably
    // make that better.
    //console.log(node);
    Object.assign(node, q);
    //console.log(node);
    //throw new Error("hi");
    // Object.assign(node.types, types);
    return [[], []];
  }
}

class CRPUNCT extends CompositeRule {
  constructor(ids) {
    super([new CRPUNCT1(ids), new CRPUNCT2(ids), new CRPUNCT3(ids)]);
  }
}

class CRNEG extends Rule {
  constructor(ids) {
    super(ids, S(ANY(), VP_(AUX(), "not", VP())));
  }
  
  apply({}, node, refs) {
    if (node.types.gap != "-") {
      return;
    }
    
    let sub = drs(this.ids);
    sub.head = clone(refs);
    sub.head.forEach(ref => ref.closure = true);

    let s = clone(node);
    child(s, 1).children.splice(0, 2);
    
    sub.push(s);
    
    return [[], [negation(sub)], node];
  }
}

class CRPRED extends Rule {
  constructor(ids) {
    super(ids, S(ANY(capture("sub")),
                 VP_(VP(V(capture("verb")),
                        capture("obj")))));
  }
  
  apply({sub, verb}, node, refs = []) {
    //throw new Error("hi");
    let obj = child(node, 1, 0, 1);
    //console.log(obj);
    //throw new Error();
    let args = [];

    let head = [];
    let body = [];
    
    if (node.time) {
      args.push(node.time);
    }
    if (sub["@type"] == "Referent") {
      args.push(sub);
    } else if (sub["@type"] == "GAP") {
      let u = referent(this.id(), {}, "", refs);
      head.push(u);
      args.push(u);
    }
    if (obj) {
      args.push(obj);
    }
    
    let name = verb.prop || verb.children[0].value;

    body.push(predicate(name, args, node.types));

    return [head, body, node];
  }
}

class CRORS extends CompositeRule {
  constructor(ids) {
    super([new CROR(ids), new CRVPOR(ids), new CRNPOR(ids), new CRVPNPOR(ids)]);
  }
}

class Rules {
  static from(ids = new Ids()) {
    let rules = [
      new CRID(ids),
      new CRLIN(ids),
      new CRASPECT(ids),
      new CRTENSE(ids),
      new CRADV(ids),
      new CRNRC(ids), 
      new CRPRO(ids),
      new CRPOSS(ids),
      new CRADJ(ids),
      new CRBE(ids),
      new CRNEG(ids),
      new CRORS(ids),
      new CRBE(ids),
    ];
    return [
      [
        new CRPN(ids),
        new CRPUNCT(ids),
      ],
      [
        new CREVERY(ids),
        new CRVPEVERY(ids),
        new CRCOND(ids),
        new CREVERYONE(ids),
        new CREVERYONE2(ids),
        new CRGENERIC(ids),
        new CRVPGENERIC(ids),
        new CRORS(ids),
        new CRAND(ids),
        new CRQUESTION(ids),
      ],
      rules,
      [
        new CRPRED(ids),
      ]];
  }
}

module.exports = {
  match: match,
  capture: capture,
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
  CRQUESTION: CRQUESTION,
};
