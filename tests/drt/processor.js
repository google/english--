function capture(a, b) {
 let result = {};
 if (Object.entries(a).length != Object.entries(b).length) {
  return false;
 }
 for (let [key, value] of Object.entries(b)) {
  if (typeof value == "number") {
   if (a[key] == undefined) {
    // console.log("hi");
    return false;
   } else {
    result[value] = a[key];
   }
  } else if (typeof value == "string") {
   if (a[key] == undefined) {
    return false;
   } else if (typeof a[key] == "number") {
    result[a[key]] = value;
   } else if (a[key] != value) {
    return false;
   }
  }
 }
 return result;
}

function match(a, b) {
 if (a.length != b.length) {
  return false;
 }
   
 let result = {};

 for (let i = 0; i < a.length; i++) {
  let binding = capture(a[i], b[i]);
  if (!binding) {
   // console.log("hi");
   // console.log(a[i]);
   // console.log(b[i]);
   return false;
  }
  for (let [key, value] of Object.entries(binding)) {
   if (result[key] && result[key] != value) {
    return false;
   }
   result[key] = value;
  }
 }

 return result;
}

function merge(rule, bindings) {
 let result = JSON.parse(JSON.stringify(rule));
 for (let [key, value] of Object.entries(rule)) {
  if (typeof value == "number") {
   if (bindings[value] != undefined) {
    // console.log(rule);
    // console.log(bindings);
    result[key] = bindings[value];
   }
  }
 }
 return result;
}
  

function resolve(features, children, conditions) {
 let bindings = match(children, conditions);
 if (!bindings) {
  return false;
 }
 let result = merge(features, bindings);
 return result;
}

function node(type, types = {}, children = [], loc = 0) {
  return {
    "@type": type,
    "types": types,
    "children": children
      .filter(child => child != null)
      .filter(child => child["@type"] != "WS")
      .filter(child => child != '.'),
    "loc": loc
  };
}

function process(type, types, data, conditions, location, reject) {
 // console.log(type);
 // console.log(data);
 let children = data.map(c => c || {}).map(c => c.types || {});
 //console.log(data);
 // console.log(data.map(c => c || {}).map(c => c["@type"] || {}));
 // console.log(children);
 // console.log(JSON.stringify(data, 2, undefined));
 // console.log(conditions);
 let result = resolve(types, children, conditions);
 if (!result) {
  // console.log("Rejecting");
  return reject;
 }
 // console.log(result);
 // console.log("yay!");
 let n = node(type, result, data, location);
 // console.log(n);
 return n;
}

module.exports = {
 capture: capture,
 match: match,
 merge: merge,
 resolve: resolve,
 process: process,
 node: node,
};
