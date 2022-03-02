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
    const start = this.body.length;
    for (let s of sentences) {
      this.push(s);
    }
    const end = this.body.length;
    return this.body.slice(start, end);
  }

  apply(p, rules, path) {
    let result = [];

    for (let rule of rules) {
      let [head, body, remove, replace] = rule.match(p, this.head, path);
      this.head.push(...head);
      this.body.push(...body);
      
      result.push(...body.filter(c => !(c instanceof DRS)));

      if (remove || replace) {
        return [result, remove, replace];
      }
    }
    return [result];
  }

  process(node, rules, path = []) {
    const {children = []} = node;
    const head = []
    const body = [];

    let added = false;

    path.push(node);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const [more, remove, replace] = this.process(child, rules, path);
      if (remove) {
        node.children.splice(i, 1);
        added = true;
      } else if (replace) {
        node.children.splice(i, 1, replace);
        added = true;
      }
      if (more) {
        added = true;
      }
    }

    const [next, remove, replace] = this.apply(node, rules, path);

    path.pop();
    
    return [added || next.length > 0, remove, replace];
  }

  go(rules) {
    let done;

    do {
      done = true;

      for (let i = 0; i < this.body.length; i++) {
        const node = this.body[i];
        const [added, remove, replace] = this.process(node, rules);
        
        if (added) {
          done = false;
        }
      
        if (remove) {
          this.body.splice(i, 1);
        }
      }

    } while (!done);
  }
  
  push(node) {
    for (let ref of this.head) {
      // Reset all of the locations of previous
      // referents before new phrases are processed.
      ref.loc = 0;
    }

    this.body.push(node);

    this.go(this.setup);
    this.go(this.before);
    this.go(this.rules);
    this.go(this.after);

    return this;
  }
  
  print(nl = ".\n", inner = false, nodes) {
    let result = [];

    let body = nodes || this.body;
    
    for (let cond of body) {
      if (!cond.print) {
        throw new Error("Invalid node structure: " + JSON.stringify(cond, undefined, 2));
      }
      result.push(cond.print(inner ? "" : nl));
    }
    
    return result.join(inner ? nl : "");
  }
}


module.exports = {
 DRS: DRS,
};
