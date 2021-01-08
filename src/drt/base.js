function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

function print(node, refs) {
 // console.log(node);
 if (typeof node == "string") {
   return node;
 } else if (node["type"] && node["type"] == node["value"]) {
   // console.log(node);
   return node["value"];
 } else if (node["@type"] == "Predicate") {
   return node.print();
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

 // let prefix = node["@type"] == "S" ? time(node) : "";
 let suffix = node.ref ? `(${node.ref.name})` : "";
 return result.join(" ").trim() + suffix;
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
