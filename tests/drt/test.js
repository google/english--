// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


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

function process(head, types, children, features, location, reject) {
 // console.log(`process ${head}`);
 // console.log(`${tail.length} ${features.length}`);
 if (children.length != features.length) {
  console.log("Invalid number of args?");
  return reject;
 }
 for (let i = 0; i < children.length; i++) {
  if (!match(children[i].types, features[i])) {
   return reject;
  }
 }
 // console.log(`Valid match ${JSON.stringify(types)}: ${JSON.stringify(children)}`);
 return node(head, types, children, location);
}

var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "Sentence", "symbols": ["S", "_", {"literal":"."}], "postprocess": (d, l, r) => process("Sentence", {}, d, [{"num":1,"stat":2,"tp":4,"tense":3},{},{}], l, r)},
    {"name": "Sentence$subexpression$1", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence$subexpression$2", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence", "symbols": ["Sentence$subexpression$1", "_", "NP", "__", "VP_", "_", "Sentence$subexpression$2"], "postprocess": (d, l, r) => process("Sentence", {}, d, [{},{},{"num":1,"case":"+nom","gap":1},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3},{},{}], l, r)},
    {"name": "Sentence$subexpression$3", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence$subexpression$4", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence", "symbols": ["Sentence$subexpression$3", "__", "AUX", "__", "NP", "__", "VP", "_", "Sentence$subexpression$4"], "postprocess": (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","fin":"+","tp":5,"tense":4},{},{"num":1,"case":"+nom","gap":"-"},{},{"num":3,"fin":"+","stat":2,"gap":1,"tp":5,"tense":4},{},{}], l, r)},
    {"name": "Sentence$subexpression$5", "symbols": [/[iI]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence$subexpression$6", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Sentence", "symbols": ["Sentence$subexpression$5", "__", "NP", "__", "ADJ", "_", "Sentence$subexpression$6"], "postprocess": (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","case":"+nom","gap":"-"},{},{},{},{}], l, r)},
    {"name": "S", "symbols": ["NP_", "__", "VP_"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"tp":4,"tense":3}, d, [{"num":1,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3}], l, r)},
    {"name": "S", "symbols": ["NP_", "WS", "VP_"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"gap":3,"tp":5,"tense":4}, d, [{"num":1,"case":"+nom","gap":3},{"gap":3},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r)},
    {"name": "S", "symbols": ["NP_", "WS", "VP_"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"gap":3,"tp":5,"tense":4}, d, [{"num":3,"case":"+nom","gap":3},{"gap":3},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r)},
    {"name": "S", "symbols": ["NP_", "__", "VP_"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"gap":3,"tp":5,"tense":4}, d, [{"num":1,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":3,"tp":5,"tense":4}], l, r)},
    {"name": "VP_", "symbols": ["AUX", "__", "VP"], "postprocess": (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":4,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":4,"tense":"fut"},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":4,"tense":"pres"}], l, r)},
    {"name": "VP_$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP_", "symbols": ["AUX", "__", "VP_$subexpression$1", "__", "VP"], "postprocess": (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":5,"tense":"fut"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":5,"tense":"pres"}], l, r)},
    {"name": "VP_$subexpression$2", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP_", "symbols": ["AUX", "__", "VP_$subexpression$2", "__", "VP"], "postprocess": (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"pres"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"pres"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r)},
    {"name": "VP_$subexpression$3", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP_", "symbols": ["AUX", "__", "VP_$subexpression$3", "__", "VP"], "postprocess": (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"past"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"past"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r)},
    {"name": "VP_", "symbols": ["VP"], "postprocess": (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}, d, [{"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}], l, r)},
    {"name": "VP", "symbols": ["V", "WS", "NP_"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{"gap":3},{"num":3,"case":"-nom","gap":3}], l, r)},
    {"name": "VP", "symbols": ["V", "__", "NP_"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":"-","tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{},{"num":3,"case":"-nom","gap":"-"}], l, r)},
    {"name": "VP", "symbols": ["V"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":3,"gap":"-","tp":5,"tense":4}, d, [{"num":1,"fin":2,"stat":3,"trans":"-","tp":5,"tense":4}], l, r)},
    {"name": "NP", "symbols": ["GAP"], "postprocess": (d, l, r) => process("NP", {"num":1,"case":3,"gap":1}, d, [{}], l, r)},
    {"name": "NP", "symbols": ["DET", "__", "N"], "postprocess": (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1},{},{"num":1}], l, r)},
    {"name": "NP", "symbols": ["PN"], "postprocess": (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1}], l, r)},
    {"name": "NP", "symbols": ["PRO"], "postprocess": (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1,"case":3,"refl":4}], l, r)},
    {"name": "NP_$subexpression$1", "symbols": [/[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "NP_", "symbols": ["NP", "__", "NP_$subexpression$1", "__", "NP"], "postprocess": (d, l, r) => process("NP'", {"num":"plur","case":2,"gap":"-"}, d, [{"num":3,"case":2,"gap":"-"},{},{},{},{"num":4,"case":2,"gap":"-"}], l, r)},
    {"name": "NP_", "symbols": ["NP"], "postprocess": (d, l, r) => process("NP'", {"num":1,"case":3,"gap":4}, d, [{"num":1,"case":3,"gap":4}], l, r)},
    {"name": "N", "symbols": ["N", "__", "RC"], "postprocess": (d, l, r) => process("N", {"num":1}, d, [{"num":1},{},{"num":1}], l, r)},
    {"name": "RC", "symbols": ["RPRO", "__", "S"], "postprocess": (d, l, r) => process("RC", {"num":1}, d, [{"num":1},{},{"num":1,"stat":2,"gap":1,"tp":4,"tense":3}], l, r)},
    {"name": "VP", "symbols": ["BE", "__", "ADJ"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r)},
    {"name": "VP$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["BE", "__", "VP$subexpression$1", "__", "ADJ"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{},{},{}], l, r)},
    {"name": "VP", "symbols": ["BE", "__", "NP"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":7,"tense":6}, d, [{"num":1,"fin":2,"tp":7,"tense":6},{},{"num":1,"case":5,"gap":3}], l, r)},
    {"name": "VP", "symbols": ["BE", "__", "PP"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r)},
    {"name": "N", "symbols": ["ADJ", "__", "N"], "postprocess": (d, l, r) => process("N", {"num":1}, d, [{},{},{"num":1}], l, r)},
    {"name": "S$subexpression$1", "symbols": [/[iI]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S$subexpression$1", "__", "S", "__", "S$subexpression$2", "__", "S"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"tp":4,"tense":3}, d, [{},{},{"num":1,"stat":2,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"tp":4,"tense":3}], l, r)},
    {"name": "S$subexpression$3", "symbols": [/[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S", "__", "S$subexpression$3", "__", "S"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"tp":4,"tense":3}], l, r)},
    {"name": "VP$subexpression$2", "symbols": [/[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["VP", "__", "VP$subexpression$2", "__", "VP"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}], l, r)},
    {"name": "NP_$subexpression$2", "symbols": [/[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "NP_", "symbols": ["NP", "__", "NP_$subexpression$2", "__", "NP"], "postprocess": (d, l, r) => process("NP'", {"num":3,"case":2,"gap":"-"}, d, [{"num":3,"case":2,"gap":"-"},{},{},{},{"num":3,"case":2,"gap":"-"}], l, r)},
    {"name": "S$subexpression$4", "symbols": [/[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S", "__", "S$subexpression$4", "__", "S"], "postprocess": (d, l, r) => process("S", {"num":1,"stat":2,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"tp":4,"tense":3}], l, r)},
    {"name": "V$subexpression$1", "symbols": [/[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V", "__", "V$subexpression$1", "__", "V"], "postprocess": (d, l, r) => process("V", {"num":1,"fin":2,"stat":4,"trans":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":4,"trans":3,"tp":6,"tense":5}], l, r)},
    {"name": "NP", "symbols": ["DET", "__", "RN"], "postprocess": (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":"sing","rn":"+"},{},{"num":1}], l, r)},
    {"name": "DET$subexpression$1", "symbols": [{"literal":"'"}, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["PN", "DET$subexpression$1"], "postprocess": (d, l, r) => process("DET", {"num":"sing","rn":"+"}, d, [{"num":1},{}], l, r)},
    {"name": "N", "symbols": ["N", "__", "PP"], "postprocess": (d, l, r) => process("N", {"num":1}, d, [{"num":1},{},{}], l, r)},
    {"name": "PP", "symbols": ["PREP", "__", "NP"], "postprocess": (d, l, r) => process("PP", {}, d, [{},{},{"num":1,"case":3,"gap":"-"}], l, r)},
    {"name": "VP", "symbols": ["HAVE", "__", "VP"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r)},
    {"name": "VP$subexpression$3", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["HAVE", "__", "VP$subexpression$3", "__", "VP"], "postprocess": (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r)},
    {"name": "DET$subexpression$2", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$2"], "postprocess": (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r)},
    {"name": "DET$subexpression$3", "symbols": [/[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$3"], "postprocess": (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r)},
    {"name": "DET$subexpression$4", "symbols": [/[eE]/, /[vV]/, /[eE]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$4"], "postprocess": (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r)},
    {"name": "DET$subexpression$5", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$5"], "postprocess": (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r)},
    {"name": "DET$subexpression$6", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$6"], "postprocess": (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r)},
    {"name": "PRO$subexpression$1", "symbols": [/[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$1"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"+nom","refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$2", "symbols": [/[hH]/, /[iI]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$2"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$3", "symbols": [/[sS]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$3"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"+nom","refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$4", "symbols": [/[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$4"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$5", "symbols": [/[iI]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$5"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":["-nom","+nom"],"refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$6", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$6"], "postprocess": (d, l, r) => process("PRO", {"num":"plur","case":"+nom","refl":"-"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$7", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$7"], "postprocess": (d, l, r) => process("PRO", {"num":"plur","case":"-nom","refl":"-"}, d, [{}], l, r)},
    {"name": "N$subexpression$1", "symbols": [/[sS]/, /[tT]/, /[oO]/, /[cC]/, /[kK]/, /[bB]/, /[rR]/, /[oO]/, /[kK]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$1"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$2", "symbols": [/[mM]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$2"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$3", "symbols": [/[eE]/, /[nN]/, /[gG]/, /[iI]/, /[nN]/, /[eE]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$3"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$4", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/, /[iI]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$4"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$5", "symbols": [/[sS]/, /[tT]/, /[oO]/, /[cC]/, /[kK]/, /[bB]/, /[rR]/, /[oO]/, /[kK]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$5"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$6", "symbols": [/[wW]/, /[oO]/, /[mM]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$6"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$7", "symbols": [/[wW]/, /[iI]/, /[dD]/, /[oO]/, /[wW]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$7"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$8", "symbols": [/[eE]/, /[nN]/, /[gG]/, /[iI]/, /[nN]/, /[eE]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$8"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$9", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/, /[iI]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$9"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$10", "symbols": [/[bB]/, /[oO]/, /[oO]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$10"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$11", "symbols": [/[dD]/, /[oO]/, /[nN]/, /[kK]/, /[eE]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$11"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$12", "symbols": [/[hH]/, /[oO]/, /[rR]/, /[sS]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$12"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "N$subexpression$13", "symbols": [/[pP]/, /[oO]/, /[rR]/, /[sS]/, /[cC]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$13"], "postprocess": (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r)},
    {"name": "AUX$subexpression$1", "symbols": [/[dD]/, /[oO]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$1"], "postprocess": (d, l, r) => process("AUX", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "AUX$subexpression$2", "symbols": [/[dD]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$2"], "postprocess": (d, l, r) => process("AUX", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "AUX$subexpression$3", "symbols": [/[dD]/, /[iI]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$3"], "postprocess": (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r)},
    {"name": "AUX$subexpression$4", "symbols": [/[dD]/, /[iI]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$4"], "postprocess": (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"+past","tense":"past"}, d, [{}], l, r)},
    {"name": "V$subexpression$2", "symbols": [/[lL]/, /[iI]/, /[kK]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$2"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$3", "symbols": [/[lL]/, /[oO]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$3"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$4", "symbols": [/[aA]/, /[dD]/, /[mM]/, /[iI]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$4"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$5", "symbols": [/[kK]/, /[nN]/, /[oO]/, /[wW]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$5"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$6", "symbols": [/[oO]/, /[wW]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$6"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$7", "symbols": [/[fF]/, /[aA]/, /[sS]/, /[cC]/, /[iI]/, /[nN]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$7"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$8", "symbols": [/[rR]/, /[oO]/, /[tT]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$8"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$9", "symbols": [/[sS]/, /[uU]/, /[rR]/, /[pP]/, /[rR]/, /[iI]/, /[sS]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$9"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$10", "symbols": [/[lL]/, /[oO]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$10"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$11", "symbols": [/[sS]/, /[tT]/, /[iI]/, /[nN]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$11"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$12", "symbols": [/[aA]/, /[dD]/, /[oO]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$12"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r)},
    {"name": "V$subexpression$13", "symbols": [/[lL]/, /[eE]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$13"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$14", "symbols": [/[rR]/, /[eE]/, /[aA]/, /[cC]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$14"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$15", "symbols": [/[kK]/, /[iI]/, /[sS]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$15"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$16", "symbols": [/[hH]/, /[iI]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$16"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$17", "symbols": [/[sS]/, /[cC]/, /[oO]/, /[lL]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$17"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$18", "symbols": [/[bB]/, /[eE]/, /[aA]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$18"], "postprocess": (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$19", "symbols": [/[lL]/, /[eE]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$19"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$20", "symbols": [/[aA]/, /[rR]/, /[rR]/, /[iI]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$20"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$21", "symbols": [/[wW]/, /[aA]/, /[lL]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$21"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$22", "symbols": [/[sS]/, /[lL]/, /[eE]/, /[eE]/, /[pP]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$22"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$23", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$23"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V$subexpression$24", "symbols": [/[sS]/, /[hH]/, /[iI]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V$subexpression$24"], "postprocess": (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r)},
    {"name": "V", "symbols": ["V"], "postprocess": (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0]], root.loc); })(process("V", {"num":1,"fin":"-","stat":3,"trans":2,"tp":4,"tense":"pres"}, d, [{"trans":2,"stat":3}], l, r))},
    {"name": "V$subexpression$25", "symbols": [/[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V", "V$subexpression$25"], "postprocess": (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":"sing","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"},{}], l, r))},
    {"name": "V", "symbols": ["V"], "postprocess": (d, l, r) => process("V", {"num":"plur","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"}], l, r)},
    {"name": "V$subexpression$26", "symbols": [/[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V", "V$subexpression$26"], "postprocess": (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":1,"fin":"+","stat":2,"trans":3,"tp":"+past","tense":"past"}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r))},
    {"name": "V$subexpression$27", "symbols": [/[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["V", "V$subexpression$27"], "postprocess": (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":1,"fin":"part","stat":2,"trans":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r))},
    {"name": "RPRO$subexpression$1", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RPRO", "symbols": ["RPRO$subexpression$1"], "postprocess": (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r)},
    {"name": "RPRO$subexpression$2", "symbols": [/[wW]/, /[hH]/, /[iI]/, /[cC]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RPRO", "symbols": ["RPRO$subexpression$2"], "postprocess": (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r)},
    {"name": "PRO$subexpression$8", "symbols": [/[hH]/, /[iI]/, /[mM]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$8"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$9", "symbols": [/[hH]/, /[eE]/, /[rR]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$9"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r)},
    {"name": "PRO$subexpression$10", "symbols": [/[iI]/, /[tT]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$10"], "postprocess": (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r)},
    {"name": "GAP", "symbols": [], "postprocess": (d, l, r) => process("GAP", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$1", "symbols": [/[hH]/, /[aA]/, /[pP]/, /[pP]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$1"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$2", "symbols": [/[uU]/, /[nN]/, /[hH]/, /[aA]/, /[pP]/, /[pP]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$2"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$3", "symbols": [/[hH]/, /[aA]/, /[nN]/, /[dD]/, /[sS]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$3"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$4", "symbols": [/[bB]/, /[eE]/, /[aA]/, /[uU]/, /[tT]/, /[iI]/, /[fF]/, /[uU]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$4"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$5", "symbols": [/[fF]/, /[aA]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$5"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$6", "symbols": [/[sS]/, /[lL]/, /[oO]/, /[wW]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$6"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$7", "symbols": [/[mM]/, /[oO]/, /[rR]/, /[tT]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$7"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "ADJ$subexpression$8", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/, /[iI]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$8"], "postprocess": (d, l, r) => process("ADJ", {}, d, [{}], l, r)},
    {"name": "BE$subexpression$1", "symbols": [/[iI]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$1"], "postprocess": (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "BE$subexpression$2", "symbols": [/[aA]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$2"], "postprocess": (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "BE$subexpression$3", "symbols": [/[wW]/, /[aA]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$3"], "postprocess": (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r)},
    {"name": "BE$subexpression$4", "symbols": [/[wW]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$4"], "postprocess": (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r)},
    {"name": "RN$subexpression$1", "symbols": [/[hH]/, /[uU]/, /[sS]/, /[bB]/, /[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$1"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$2", "symbols": [/[fF]/, /[aA]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$2"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$3", "symbols": [/[bB]/, /[rR]/, /[oO]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$3"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$4", "symbols": [/[wW]/, /[iI]/, /[fF]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$4"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$5", "symbols": [/[mM]/, /[oO]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$5"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$6", "symbols": [/[sS]/, /[iI]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$6"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$7", "symbols": [/[pP]/, /[aA]/, /[rR]/, /[eE]/, /[nN]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$7"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$8", "symbols": [/[cC]/, /[hH]/, /[iI]/, /[lL]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$8"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "RN$subexpression$9", "symbols": [/[sS]/, /[iI]/, /[bB]/, /[lL]/, /[iI]/, /[nN]/, /[gG]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$9"], "postprocess": (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "PREP$subexpression$1", "symbols": [/[bB]/, /[eE]/, /[hH]/, /[iI]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$1"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$2", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$2"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$3", "symbols": [/[oO]/, /[vV]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$3"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$4", "symbols": [/[uU]/, /[nN]/, /[dD]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$4"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$5", "symbols": [/[nN]/, /[eE]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$5"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$6", "symbols": [/[bB]/, /[eE]/, /[fF]/, /[oO]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$6"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$7", "symbols": [/[aA]/, /[fF]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$7"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$8", "symbols": [/[dD]/, /[uU]/, /[rR]/, /[iI]/, /[nN]/, /[gG]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$8"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$9", "symbols": [/[fF]/, /[rR]/, /[oO]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$9"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$10", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$10"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$11", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$11"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$12", "symbols": [/[aA]/, /[bB]/, /[oO]/, /[uU]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$12"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$13", "symbols": [/[bB]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$13"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$14", "symbols": [/[fF]/, /[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$14"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PREP$subexpression$15", "symbols": [/[wW]/, /[iI]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$15"], "postprocess": (d, l, r) => process("PREP", {}, d, [{}], l, r)},
    {"name": "PN", "symbols": ["FULLNAME"], "postprocess": (d, l, r) => process("PN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "PN", "symbols": ["VAR"], "postprocess": (d, l, r) => process("PN", {"num":"sing"}, d, [{}], l, r)},
    {"name": "AUX$subexpression$5", "symbols": [/[wW]/, /[iI]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$5"], "postprocess": (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"fut"}, d, [{}], l, r)},
    {"name": "HAVE$subexpression$1", "symbols": [/[hH]/, /[aA]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$1"], "postprocess": (d, l, r) => process("HAVE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "HAVE$subexpression$2", "symbols": [/[hH]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$2"], "postprocess": (d, l, r) => process("HAVE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r)},
    {"name": "HAVE$subexpression$3", "symbols": [/[hH]/, /[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$3"], "postprocess": (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r)},
    {"name": "HAVE$subexpression$4", "symbols": [/[hH]/, /[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$4"], "postprocess": (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"+past","tense":["pres","past"]}, d, [{}], l, r)},
    {"name": "WS", "symbols": ["_"]}
]
  , ParserStart: "Sentence"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();