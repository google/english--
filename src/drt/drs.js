const {clone, print} = require("./base.js");
const {parse} = require("./parser.js");

class DRS {
 constructor(names, rules) {
  this.head = [];
  this.body = [];
  this.names = names;
  this.rules = rules;
 }

 feed(source) {
  let [[lines]] = parse(source, "Discourse");
  for (let s of lines) {
   this.push(s);
  }
 }

 bind(node) {
  let queue = [node];
  while (queue.length > 0) {
   let p = queue.shift();
   // console.log(`${p["@type"]}`);
   // console.log(p);
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

  while (queue.length > 0) {
   let p = queue.shift();
   // breadth first search: iterate over
   // this level first ...
   let skip = false;
   for (let rule of this.rules) {
    let [head, body, drs, [remove]] = rule.match(p, this.head);
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
   refs.push(`${ref.print()}`);
  }
  
  let args = refs.join(", ");
  let neg = this.neg ? "~" : "";
  result.push(`${neg}drs(${args}) \{`);

  for (let cond of this.body) {
    if (cond instanceof DRS ||
        cond["@type"] == "Implication" ||
        cond["@type"] == "Negation" ||
        cond["@type"] == "Query" ||
        cond["@type"] == "Conjunction" ||
        cond["@type"] == "Disjunction") {
     result.push(cond.print());
   } else {
     result.push(print(cond));
   }
  }
  
  result.push("}");
  
  return result.join("\n");
 }
}


module.exports = {
 DRS: DRS,
};
