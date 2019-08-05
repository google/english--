// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
 const node = (type, ...children) => { return {"@type": type, children: children}; }; var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "S", "symbols": ["NP", "VP_"], "postprocess": ([NP, VP_]) => node("S", NP, VP_)},
    {"name": "VP_", "symbols": ["VP"], "postprocess": ([VP]) => node("VP_", VP)},
    {"name": "VP", "symbols": ["V"], "postprocess": ([V]) => node("VP", V)},
    {"name": "NP", "symbols": ["PN", "_"], "postprocess": ([PN, s0]) => node("NP", PN)},
    {"name": "PN$string$1", "symbols": [{"literal":"J"}, {"literal":"o"}, {"literal":"n"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN", "symbols": ["PN$string$1"], "postprocess": ([n]) => node("PN", n)},
    {"name": "PN$string$2", "symbols": [{"literal":"S"}, {"literal":"m"}, {"literal":"i"}, {"literal":"t"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN", "symbols": ["PN$string$2"], "postprocess": ([n]) => node("PN", n)},
    {"name": "PN$string$3", "symbols": [{"literal":"B"}, {"literal":"i"}, {"literal":"l"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN", "symbols": ["PN$string$3"], "postprocess": ([n]) => node("PN", n)},
    {"name": "V$string$1", "symbols": [{"literal":"s"}, {"literal":"t"}, {"literal":"i"}, {"literal":"n"}, {"literal":"k"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V", "symbols": ["V$string$1"], "postprocess": ([n]) => node("V", n)},
    {"name": "V$string$2", "symbols": [{"literal":"r"}, {"literal":"o"}, {"literal":"t"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V", "symbols": ["V$string$2"], "postprocess": ([n]) => node("V", n)}
]
  , ParserStart: "S"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
