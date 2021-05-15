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
    // let result = [];
    //return sentences.map((s) => this.push(s));
    const start = this.body.length;
    for (let s of sentences) {
      this.push(s);
    }
    const end = this.body.length;
    return this.print(undefined, undefined, [start, end])
    // console.log(`${end - start} predicates added`);
    // return this.body.slice(start, end);
    // return this;
  }

  apply(p, rules) {
    let result = [];

    for (let rule of rules) {
      let [head, body, remove] = rule.match(p, this.head);
      this.head.push(...head);
      this.body.push(...body);
      
      result.push(...body.filter(c => !(c instanceof DRS)));

      if (remove) {
        return [result, remove];
      }
    }
    return [result];
  }

  process(nodes, rules = []) {
    let queue = [...nodes];
    
    while (queue.length > 0) {
      let p = queue.shift();
      // Breadth first search: apply all rules for this node
      // until we get asked to remove it.
      let [next, remove] = this.apply(p, rules);

      // Queue up new roots that are introduced to the body.
      queue.push(...next);

      // If this is a node that we want to replace, remove it.
      if (remove) {
        let i = this.body.indexOf(p);
        if (i == -1) {
          throw new Error("Ooops, deleting an invalid node.");
        }
        this.body.splice(i, 1);
        continue;
      }

      // If not, queue up all of its children to descend.
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
  
  print(nl = ".\n", inner = false, slice) {
    let result = [];
    let refs = [];
    let individuals = this.head
        .filter(ref => !ref.closure);
    //for (let ref of individuals) {
    //  refs.push(`${ref.print()}`);
    //}
    
    //if (refs.length > 0) {
    //  result.push(`let ${refs.join(", ")}`);
    //}

    let body = this.body;
    if (slice) {
      body = this.body.slice(slice[0], slice[1]);
    }
    
    for (let cond of body) {
      //let suffix = "";
      //if (cond["@type"] == "PRED") {
      //  suffix = ".";
      //} else if (cond["@type"] == "Question") {
      //  suffix = "?";
      //}
      // console.log(cond);
      result.push(cond.print(inner ? "" : nl));
    }
    
    return result.join(inner ? nl : "");
  }
}


module.exports = {
 DRS: DRS,
};
