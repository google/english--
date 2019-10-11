# hello

@{%
function node(type, types, children) {
  // console.log(type + ": " + JSON.stringify(types) + " => ");
  return {
    "@type": type, 
    "types": types, 
    "children": children
      .filter(child => child != null)
      .filter(child => child != '.')
  }; 
}
%}

Discourse -> ( _ Sentence _ {% (args) => args[1] %} ):+ {% (args) => node("Discourse", {}, ...args) %}

FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}
NAME -> [A-Z]:+ [a-z]:+ {% ([a, b]) => a.join("") + b.join("") %}
