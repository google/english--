function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

function time({types}) {
    // let {types} = node;
    let {tense} = types || {};
    if (tense == "fut") {
        return "> ";
    } else if (tense == "past") {
        return "< ";
    }
    return "";  
};

function print(node, refs) {
 if (typeof node == "string") {
   return node;
 } else if (node["@type"] == "Predicate") {
   return time(node) + node.print();
 } else  if (node["@type"] == "Referent") {
  if (refs) {
   // de-reference referents
   return refs.find(ref => ref.name == node.name).value;
  }
  return node.name;
 }

 let result = (node.children || []).map(child => print(child, refs));
 //for (let child of node.children || []) {
 // result.push(print(child, refs));
 //}

 let prefix = node["@type"] == "S" ? time(node) : "";
 let suffix = node.ref ? `(${node.ref.name})` : "";
 return prefix + result.join(" ").trim() + suffix;
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

module.exports = {
  clone: clone,
  print: print,
  child: child,
};
