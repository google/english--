function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

function print(node, refs) {
 if (typeof node == "string") {
  return node;
 } else  if (node["@type"] == "Referent") {
  if (refs) {
   // de-reference referents
   return refs.find(ref => ref.name == node.name).value;
  }
  return node.name;
 } else if (node["@type"] == "Predicate") {
  return node.print();
 } else if (node["@type"] == "V" && node.root) {
  return node.root;
 }

 let result = [];
 for (let child of node.children || []) {
  result.push(print(child, refs));
 }

 let suffix = node.ref ? `(${node.ref.name})` : "";
 
 if (node.neg) {
   throw new Error("?");
 }

 let time = "";
 switch (node.time) {
  case "past": 
   time = "< ";
   break;
  case "fut": 
   time = "> ";
   break;
 }
 return time + result.join(" ").trim() + suffix;
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
