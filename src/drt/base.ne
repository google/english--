# hello

@{%
function node(type, types, children, loc) {
  // console.log(type + ": " + JSON.stringify(types) + " => ");
  return {
    "@type": type, 
    "types": types, 
    "children": children
      .filter(child => child != null)
      .filter(child => child != '.'),
    "loc": loc
  };
}

// TODO(goto): add all reserved keywords for terms that
// can occupy the same position as proper names (pronouns
// were most obvious, but maybe there are more).

const reserved = ["he", "she", "it", "they", "him", "her", "them", "his", "hers", "theirs"];

function name(head, tail, reject) {
  let result = head.join("") + tail.join("");
  if (reserved.includes(result.toLowerCase())) {
    return reject;
  }
  return result;
}
%}

Discourse -> ( _ Sentence _ {% (args) => args[1] %} ):+ {% (args) => node("Discourse", {}, ...args) %}

FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}
NAME -> [A-Z]:+ [a-z]:+ {% ([a, b], location, reject) => name(a, b, reject) %}

VAR -> [A-Z] {% (name) => node("VAR", {}, name) %}
