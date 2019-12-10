@{%

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
WS -> _ {% (data, loc, reject) => process("WS", {"gap": "-"}, [], [], loc) %}
WS -> __ {% (data, loc, reject) => process("WS", {"gap": "sing"}, [], [], loc) %}
WS -> __ {% (data, loc, reject) => process("WS", {"gap": "plur"}, [], [], loc) %}