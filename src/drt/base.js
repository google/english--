function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
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
  child: child,
};
