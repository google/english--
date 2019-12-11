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
    // uses a different namespace for
    // the variables from children.
    result["@" + a[key]] = value;
   } else if (Array.isArray(a[key])) {
    if (!a[key].includes(value)) {
     return false;
    }
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
   return false;
  }
  // console.log(binding);
  for (let [key, value] of Object.entries(binding)) {
   if (result[key] == undefined) {
    result[key] = value;
    // console.log(value);
   } else if (typeof value == "number") {
    result[value] = result[key];
   } else if (typeof result[key] == "string") {
    // console.log(result[key]);
    // console.log(value);
    if (Array.isArray(value)) {
     // console.log(key);
     // console.log("hi");
     if (!value.includes(result[key])) {
      return false;
     }
    } else if (result[key] != value) {
     return false;
    }
    // return false;
   }
  }
 }

 return result;
}

function merge(rule, bindings) {
 let result = JSON.parse(JSON.stringify(rule));

 //console.log(rule);
 //console.log(bindings);

 for (let [key, value] of Object.entries(rule)) {
  if (typeof value == "number") {
   // console.log(bindings);
   if (bindings[value] != undefined ||
       bindings["@" +value] != undefined) {
    // console.log(rule);
    // console.log(bindings);
    result[key] = bindings[value] || bindings["@" + value];
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
 // console.log(JSON.stringify(data));
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
 //console.log("yay!");
 //console.log("children: " + JSON.stringify(children));
 //console.log("conditions: " + JSON.stringify(conditions));
 //console.log("types" + JSON.stringify(types));
 //console.log("result: " + JSON.stringify(result));
 // console.log(JSON.stringify(data, 2, undefined));
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
