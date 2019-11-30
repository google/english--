@{%

function match(a, b) {
 if (JSON.stringify(b) == "{}") {
  return true;
 }

 let first = Object.entries(a);
 let second = Object.entries(b);

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

function process(head, types, tail, features, location, reject) {
 // console.log(`process ${head}`);
 // console.log(`${tail.length} ${features.length}`);
 if (tail.length != features.length) {
  console.log("Invalid number of args?");
  return reject;
 }
 for (let i = 0; i < tail.length; i++) {
  if (!match(tail[i].types, features[i])) {
   return reject;
  }
 }
 // console.log(`Valid match ${JSON.stringify(types)}: ${JSON.stringify(tail)}`);
 return {
  "@type": head,
  "types": types,
  "children": tail
 }
}

%}