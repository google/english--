function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

function transcribe(node, refs) {
 if (typeof node == "string") {
  return node;
 } else  if (node["@type"] == "Referent") {
  if (refs) {
   // de-reference referents
   return refs.find(ref => ref.name == node.name).value;
  }
  return node.name;
 } else if (node["@type"] == "Predicate") {
  // console.log(node);
  return node.print();
 } else if (node["@type"] == "V" && node.root) {
  return node.root;
 }
 //else if (node["@type"] == "S") {
 // console.log(node);
 //}

 // console.log(node);

 let result = [];
 for (let child of node.children || []) {
  result.push(transcribe(child, refs));
 }

 let suffix = node.ref ? `(${node.ref.name})` : "";
 let prefix = node.neg ? "~" : "";

 // console.log(node.neg);
    
 // prefix = node.time ? `${node.time.print()}: ${prefix}` : prefix;
 //if (node.types.tense) {
 // console.log(node);
 //}

 // console.log(node);
 let time = "";
 switch (node.time) {
  case "past": 
   time = "< ";
   break;
  case "fut": 
   time = "> ";
   break;
 }
 return time + prefix + result.join(" ").trim() + suffix;
}

function print(node, refs) {
 return transcribe(node, refs);
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
    transcribe: transcribe,
    print: print,
    child: child,
};
