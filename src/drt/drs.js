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
  
  process(nodes, rules = []) {
    let queue = [...nodes];

    while (queue.length > 0) {
      let p = queue.shift();
      // breadth first search: iterate over
      // this level first ...
      let skip = false;
      for (let rule of rules) {
        let [head, body, remove] = rule.match(p, this.head);
        this.head.push(...head);
        this.body.push(...body);

        if (remove) {
          skip = true;
          let i = this.body.indexOf(remove);
          if (i == -1) {
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
      queue.push(...(p.children || []).flat(2));
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

    this.body.push(node);

    let result = this.process([node], this.rules);

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
    
    if (refs.length > 0) {
      result.push(`let ${refs.join(", ")}`);
    }
    
    for (let cond of this.body) {
      result.push(cond.print(nl));
    }
    
    return result.join(nl);
  }
}


module.exports = {
 DRS: DRS,
};
