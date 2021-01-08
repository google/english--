const {clone, print} = require("./base.js");
const {parse} = require("./parser.js");

class DRS {
  constructor([setup, before, rules, after = []]) {
    this.head = [];
    this.body = [];
    this.setup = setup;
    this.before = before;
    this.rules = rules;
    this.after = after;
  }

  feed([sentences]) {
    for (let s of sentences) {
      this.push(s);
    }
    return this;    
  }
  
  bind(node) {
    let queue = [node];
    while (queue.length > 0) {
      let p = queue.shift();
      let [refs, names] = this.names.match(p, this.head);
      this.head.push(...refs);
      this.body.push(...names);
      // ... and recurse.
      let next = (p.children || [])
          .filter(c => typeof c != "string");
      queue.push(...next);
    }
  }

  process(nodes, rules = []) {
    let queue = [...nodes];

    while (queue.length > 0) {
      let p = queue.shift();
      // breadth first search: iterate over
      // this level first ...
      // console.log(p);
      let skip = false;
      for (let rule of rules) {
        let [head, body, drs, [remove]] = rule.match(p, this.head);
        this.head.push(...head);
        this.body.push(...body);

        if (remove) {
          skip = true;
          let i = this.body.indexOf(remove);
          if (i == -1) {
            //console.log(remove);
            //console.log(this.body);
            throw new Error("Ooops, deleting an invalid node.");
          }
          this.body.splice(i, 1);
        }
        
        queue.push(...body.filter(c => !(c instanceof DRS)));
        
        if (skip) {
          break;
        }
      }
      
      if (skip) {
        continue;
      }
      
      // ... and recurse.
      let next = (p && p.children || [])
          .filter(c => typeof c != "string");

      //next = next.map(x => Array.isArray(x) ? x.flat(3) : x);
      
      // console.log(next.flat(2));
      queue.push(...next.flat(2));
    }
    
    return this;
  }
  
  push(node) {
    for (let ref of this.head) {
      // Reset all of the locations of previous
      // referents before new phrases are processed.
      ref.loc = 0;
    }
    
    // Make simplications.
    this.process([node], this.setup);

    // Resolve all proper names.
    this.process([node], this.before);

    // return;
    
    this.body.push(node);

    // console.log("Applying all the rules");
    let result = this.process([node], this.rules);

    // console.log(this.body);

    this.process(this.body, this.after);

    return result;
  }
  
  print(nl = "\n") {
    let result = [];
    let refs = [];
    let individuals = this.head
        .filter(ref => !ref.closure);
    for (let ref of individuals) {
      refs.push(`${ref.print()}`);
    }
    
    let args = refs.join(", ");
    //let neg = this.neg ? "~" : "";
    // result.push(`${neg}drs(${args}) \{`);
    // result.push(`{`);
    // console.log(this.neg);
    if (refs.length > 0) {
      result.push(`let ${refs.join(", ")}`);
    }
    
    for (let cond of this.body) {
      if (cond instanceof DRS ||
          cond["@type"] == "Quantifier" ||
          cond["@type"] == "Negation" ||
          cond["@type"] == "Query" ||
          cond["@type"] == "Conjunction" ||
          cond["@type"] == "Disjunction") {
        result.push(cond.print(nl));
      } else {
        // console.log(cond);
        result.push(print(cond));
      }
    }
    
    // result.push("}");
    // console.log("hi");
    return result.join(nl);
  }
}


module.exports = {
 DRS: DRS,
};
