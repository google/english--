// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

function node(type, types, children) {
  return {
    "@type": type, 
    "types": types, 
    "children": children.filter(child => child)
  }; 
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
    {"name": "S", "symbols": ["S_num_sing"], "postprocess": (args) => node("S", {}, args)},
    {"name": "S", "symbols": ["S_num_plur"], "postprocess": (args) => node("S", {}, args)},
    {"name": "S_num_sing", "symbols": ["NP_num_sing_gen_male_case_pnom", "_", "VP__num_sing_fin_p"], "postprocess": (args) => node("S", {"num":"sing"}, args)},
    {"name": "S_num_sing", "symbols": ["NP_num_sing_gen_fem_case_pnom", "_", "VP__num_sing_fin_p"], "postprocess": (args) => node("S", {"num":"sing"}, args)},
    {"name": "S_num_sing", "symbols": ["NP_num_sing_gen_nhum_case_pnom", "_", "VP__num_sing_fin_p"], "postprocess": (args) => node("S", {"num":"sing"}, args)},
    {"name": "S_num_plur", "symbols": ["NP_num_plur_gen_male_case_pnom", "_", "VP__num_plur_fin_p"], "postprocess": (args) => node("S", {"num":"plur"}, args)},
    {"name": "S_num_plur", "symbols": ["NP_num_plur_gen_fem_case_pnom", "_", "VP__num_plur_fin_p"], "postprocess": (args) => node("S", {"num":"plur"}, args)},
    {"name": "S_num_plur", "symbols": ["NP_num_plur_gen_nhum_case_pnom", "_", "VP__num_plur_fin_p"], "postprocess": (args) => node("S", {"num":"plur"}, args)},
    {"name": "VP__num_sing_fin_p", "symbols": ["VP_num_sing_fin_p"], "postprocess": (args) => node("VP'", {"num":"sing","fin":"+"}, args)},
    {"name": "VP__num_plur_fin_p", "symbols": ["VP_num_plur_fin_p"], "postprocess": (args) => node("VP'", {"num":"plur","fin":"+"}, args)},
    {"name": "VP_num_sing_fin_p", "symbols": ["V_num_sing_fin_p_trans_n"], "postprocess": (args) => node("VP", {"num":"sing","fin":"+"}, args)},
    {"name": "VP_num_sing_fin_n", "symbols": ["V_num_sing_fin_n_trans_n"], "postprocess": (args) => node("VP", {"num":"sing","fin":"-"}, args)},
    {"name": "VP_num_plur_fin_p", "symbols": ["V_num_plur_fin_p_trans_n"], "postprocess": (args) => node("VP", {"num":"plur","fin":"+"}, args)},
    {"name": "VP_num_plur_fin_n", "symbols": ["V_num_plur_fin_n_trans_n"], "postprocess": (args) => node("VP", {"num":"plur","fin":"-"}, args)},
    {"name": "NP_num_sing_gen_male_case_pnom", "symbols": ["PN_num_sing_gen_male"], "postprocess": (args) => node("NP", {"num":"sing","gen":"male","case":"+nom"}, args)},
    {"name": "NP_num_sing_gen_male_case_nnom", "symbols": ["PN_num_sing_gen_male"], "postprocess": (args) => node("NP", {"num":"sing","gen":"male","case":"-nom"}, args)},
    {"name": "NP_num_sing_gen_fem_case_pnom", "symbols": ["PN_num_sing_gen_fem"], "postprocess": (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom"}, args)},
    {"name": "NP_num_sing_gen_fem_case_nnom", "symbols": ["PN_num_sing_gen_fem"], "postprocess": (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom"}, args)},
    {"name": "NP_num_sing_gen_nhum_case_pnom", "symbols": ["PN_num_sing_gen_nhum"], "postprocess": (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom"}, args)},
    {"name": "NP_num_sing_gen_nhum_case_nnom", "symbols": ["PN_num_sing_gen_nhum"], "postprocess": (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom"}, args)},
    {"name": "NP_num_plur_gen_male_case_pnom", "symbols": ["PN_num_plur_gen_male"], "postprocess": (args) => node("NP", {"num":"plur","gen":"male","case":"+nom"}, args)},
    {"name": "NP_num_plur_gen_male_case_nnom", "symbols": ["PN_num_plur_gen_male"], "postprocess": (args) => node("NP", {"num":"plur","gen":"male","case":"-nom"}, args)},
    {"name": "NP_num_plur_gen_fem_case_pnom", "symbols": ["PN_num_plur_gen_fem"], "postprocess": (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom"}, args)},
    {"name": "NP_num_plur_gen_fem_case_nnom", "symbols": ["PN_num_plur_gen_fem"], "postprocess": (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom"}, args)},
    {"name": "NP_num_plur_gen_nhum_case_pnom", "symbols": ["PN_num_plur_gen_nhum"], "postprocess": (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom"}, args)},
    {"name": "NP_num_plur_gen_nhum_case_nnom", "symbols": ["PN_num_plur_gen_nhum"], "postprocess": (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom"}, args)},
    {"name": "PN_num_sing_gen_male$string$1", "symbols": [{"literal":"J"}, {"literal":"o"}, {"literal":"n"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN_num_sing_gen_male", "symbols": ["PN_num_sing_gen_male$string$1"], "postprocess": (args) => node("PN", {"num":"sing","gen":"male"}, args)},
    {"name": "PN_num_sing_gen_male$string$2", "symbols": [{"literal":"J"}, {"literal":"o"}, {"literal":"h"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN_num_sing_gen_male", "symbols": ["PN_num_sing_gen_male$string$2"], "postprocess": (args) => node("PN", {"num":"sing","gen":"male"}, args)},
    {"name": "PN_num_sing_gen_fem$string$1", "symbols": [{"literal":"M"}, {"literal":"a"}, {"literal":"r"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "PN_num_sing_gen_fem", "symbols": ["PN_num_sing_gen_fem$string$1"], "postprocess": (args) => node("PN", {"num":"sing","gen":"fem"}, args)},
    {"name": "V_num_sing_fin_p_trans_p$string$1", "symbols": [{"literal":"l"}, {"literal":"o"}, {"literal":"v"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V_num_sing_fin_p_trans_p", "symbols": ["V_num_sing_fin_p_trans_p$string$1"], "postprocess": (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args)},
    {"name": "V_num_plur_fin_p_trans_p$string$1", "symbols": [{"literal":"l"}, {"literal":"o"}, {"literal":"v"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V_num_plur_fin_p_trans_p", "symbols": ["V_num_plur_fin_p_trans_p$string$1"], "postprocess": (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args)},
    {"name": "V_num_sing_fin_p_trans_n$string$1", "symbols": [{"literal":"l"}, {"literal":"o"}, {"literal":"v"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V_num_sing_fin_p_trans_n", "symbols": ["V_num_sing_fin_p_trans_n$string$1"], "postprocess": (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args)},
    {"name": "V_num_plur_fin_p_trans_n$string$1", "symbols": [{"literal":"l"}, {"literal":"o"}, {"literal":"v"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "V_num_plur_fin_p_trans_n", "symbols": ["V_num_plur_fin_p_trans_n$string$1"], "postprocess": (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args)}
]
  , ParserStart: "S"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
