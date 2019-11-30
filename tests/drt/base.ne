@{%

function node(type, types, children, loc) {
  return {
    "@type": type,
    "types": types,
    "children": children
      .filter(child => child != null)
      .filter(child => child != '.'),
    "loc": loc
  };
}

function match(a, b) {
 if (JSON.stringify(b) == "{}") {
  return true;
 }

 let first = Object.entries(a || {});
 let second = Object.entries(b || {});

 if (first.length != second.length) {
  return false;
 }

 for (let i = 0; i < first.length; i++) {
  let [key, value] = second[i];
  if (typeof first[i][1] == "number" ||
      typeof second[i][1] == "number") {
   continue;
  }
  if (first[i][1] != second[i][1]) {
   // console.log(`${JSON.stringify(a)} doesnt match ${JSON.stringify(b)}?`);
   return false;
  }
 }

 // console.log(`${JSON.stringify(a)} matches ${JSON.stringify(b)}?`);

 return true;
}

function process(head, types, children, features, location, reject) {
 // console.log(`process ${head}`);
 // console.log(`${tail.length} ${features.length}`);
 if (children.length != features.length) {
  // console.log("Invalid number of args?");
  return reject;
 }
 for (let i = 0; i < children.length; i++) {
  if (!match((children[i] || {}).types, features[i])) {
   return reject;
  }
 }
 // console.log(`Valid match ${JSON.stringify(types)}: ${JSON.stringify(children)}`);
 return node(head, types, children, location);
}

const reserved = ["he", "she", "it", "they", "him", "her", "them", "his", "hers", "theirs"];

function name(head, tail, reject) {
  let result = head.join("") + tail.join("");
  if (reserved.includes(result.toLowerCase())) {
    return reject;
  }
  return result;
}

%}

FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}
NAME -> [A-Z]:+ [a-z]:+ {% ([a, b], location, reject) => name(a, b, reject) %}
VAR -> [A-Z] {% ([name]) => name %}
