@builtin "whitespace.ne"

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


Sentence -> 
  S_num_sing _ "." {% (args) => node("Sentence", {}, args) %} |
  S_num_plur _ "." {% (args) => node("Sentence", {}, args) %}
S_num_sing -> 
  NP__num_sing_gen_male_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %}
S_num_plur -> 
  NP__num_plur_gen_male_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %}
S_num_sing_gap_n -> 
  NP__num_sing_gen_male_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_gen_male_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %}
S_num_sing_gap_sing -> 
  NP__num_sing_gen_male_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_male_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_male_case_pnom_gap_n __ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_n __ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_n __ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %}
S_num_sing_gap_plur -> 
  NP__num_sing_gen_male_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_plur_gen_male_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_gen_male_case_pnom_gap_n __ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_n __ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_n __ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %}
S_num_plur_gap_n -> 
  NP__num_plur_gen_male_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_gen_male_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %}
S_num_plur_gap_sing -> 
  NP__num_plur_gen_male_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_sing_gen_male_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_sing_gen_fem_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_sing_gen_nhum_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_gen_male_case_pnom_gap_n __ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_n __ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_n __ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %}
S_num_plur_gap_plur -> 
  NP__num_plur_gen_male_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_male_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_male_case_pnom_gap_n __ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_fem_case_pnom_gap_n __ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_gen_nhum_case_pnom_gap_n __ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %}
VP__num_sing_fin_p_gap_n -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_gap_n {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  VP_num_sing_fin_p_gap_n {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"-"}, args) %}
VP__num_sing_fin_p_gap_sing -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_gap_sing {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  VP_num_sing_fin_p_gap_sing {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"sing"}, args) %}
VP__num_sing_fin_p_gap_plur -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_gap_plur {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  VP_num_sing_fin_p_gap_plur {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"plur"}, args) %}
VP__num_plur_fin_p_gap_n -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_gap_n {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  VP_num_plur_fin_p_gap_n {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"-"}, args) %}
VP__num_plur_fin_p_gap_sing -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_gap_sing {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  VP_num_plur_fin_p_gap_sing {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"sing"}, args) %}
VP__num_plur_fin_p_gap_plur -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_gap_plur {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  VP_num_plur_fin_p_gap_plur {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"plur"}, args) %}
VP_num_sing_fin_p_gap_sing -> 
  V_num_sing_fin_p_trans_p WS_gap_sing NP__num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  V_num_sing_fin_p_trans_p WS_gap_sing NP__num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  V_num_sing_fin_p_trans_p WS_gap_sing NP__num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %}
VP_num_sing_fin_p_gap_plur -> 
  V_num_sing_fin_p_trans_p WS_gap_plur NP__num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  V_num_sing_fin_p_trans_p WS_gap_plur NP__num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  V_num_sing_fin_p_trans_p WS_gap_plur NP__num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %}
VP_num_sing_fin_n_gap_sing -> 
  V_num_sing_fin_n_trans_p WS_gap_sing NP__num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  V_num_sing_fin_n_trans_p WS_gap_sing NP__num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  V_num_sing_fin_n_trans_p WS_gap_sing NP__num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %}
VP_num_sing_fin_n_gap_plur -> 
  V_num_sing_fin_n_trans_p WS_gap_plur NP__num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  V_num_sing_fin_n_trans_p WS_gap_plur NP__num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  V_num_sing_fin_n_trans_p WS_gap_plur NP__num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %}
VP_num_plur_fin_p_gap_sing -> 
  V_num_plur_fin_p_trans_p WS_gap_sing NP__num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  V_num_plur_fin_p_trans_p WS_gap_sing NP__num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  V_num_plur_fin_p_trans_p WS_gap_sing NP__num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %}
VP_num_plur_fin_p_gap_plur -> 
  V_num_plur_fin_p_trans_p WS_gap_plur NP__num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  V_num_plur_fin_p_trans_p WS_gap_plur NP__num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  V_num_plur_fin_p_trans_p WS_gap_plur NP__num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %}
VP_num_plur_fin_n_gap_sing -> 
  V_num_plur_fin_n_trans_p WS_gap_sing NP__num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  V_num_plur_fin_n_trans_p WS_gap_sing NP__num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  V_num_plur_fin_n_trans_p WS_gap_sing NP__num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %}
VP_num_plur_fin_n_gap_plur -> 
  V_num_plur_fin_n_trans_p WS_gap_plur NP__num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  V_num_plur_fin_n_trans_p WS_gap_plur NP__num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  V_num_plur_fin_n_trans_p WS_gap_plur NP__num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %}
VP_num_sing_fin_p_gap_n -> 
  V_num_sing_fin_p_trans_p __ NP__num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %}
VP_num_sing_fin_n_gap_n -> 
  V_num_sing_fin_n_trans_p __ NP__num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %}
VP_num_plur_fin_p_gap_n -> 
  V_num_plur_fin_p_trans_p __ NP__num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %}
VP_num_plur_fin_n_gap_n -> 
  V_num_plur_fin_n_trans_p __ NP__num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %}
NP_num_sing_gen_male_case_pnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"sing"}, args) %}
NP_num_sing_gen_male_case_nnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"sing"}, args) %}
NP_num_sing_gen_fem_case_pnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"sing"}, args) %}
NP_num_sing_gen_fem_case_nnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"sing"}, args) %}
NP_num_sing_gen_nhum_case_pnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"sing"}, args) %}
NP_num_sing_gen_nhum_case_nnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"sing"}, args) %}
NP_num_plur_gen_male_case_pnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"plur"}, args) %}
NP_num_plur_gen_male_case_nnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"plur"}, args) %}
NP_num_plur_gen_fem_case_pnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"plur"}, args) %}
NP_num_plur_gen_fem_case_nnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"plur"}, args) %}
NP_num_plur_gen_nhum_case_pnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"plur"}, args) %}
NP_num_plur_gen_nhum_case_nnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"plur"}, args) %}
NP_num_sing_gen_male_case_pnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_male_case_pnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_male_case_nnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_male_case_nnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %}
NP_num_sing_gen_fem_case_pnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_fem_case_pnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_fem_case_nnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_fem_case_nnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %}
NP_num_sing_gen_nhum_case_pnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_nhum_case_pnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_nhum_case_nnom_gap_n -> 
  DET_num_sing __ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_nhum_case_nnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_male_case_pnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_male_case_pnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_male_case_nnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_male_case_nnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_fem_case_pnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_fem_case_pnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_fem_case_nnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_fem_case_nnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_nhum_case_pnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_nhum_case_pnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_nhum_case_nnom_gap_n -> 
  DET_num_plur __ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_nhum_case_nnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %}
NP__num_plur_gen_male_case_pnom_gap_n -> 
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args))(args) %}
NP__num_plur_gen_male_case_nnom_gap_n -> 
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args))(args) %}
NP__num_plur_gen_fem_case_pnom_gap_n -> 
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args))(args) %}
NP__num_plur_gen_fem_case_nnom_gap_n -> 
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args))(args) %}
NP__num_plur_gen_nhum_case_pnom_gap_n -> 
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %}
NP__num_plur_gen_nhum_case_nnom_gap_n -> 
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n __ "and"i __ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_male_case_pnom_gap_n -> 
  NP_num_sing_gen_male_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_male_case_pnom_gap_sing -> 
  NP_num_sing_gen_male_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_male_case_pnom_gap_plur -> 
  NP_num_sing_gen_male_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_sing_gen_male_case_nnom_gap_n -> 
  NP_num_sing_gen_male_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_male_case_nnom_gap_sing -> 
  NP_num_sing_gen_male_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_male_case_nnom_gap_plur -> 
  NP_num_sing_gen_male_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_sing_gen_fem_case_pnom_gap_n -> 
  NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_fem_case_pnom_gap_sing -> 
  NP_num_sing_gen_fem_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_fem_case_pnom_gap_plur -> 
  NP_num_sing_gen_fem_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_sing_gen_fem_case_nnom_gap_n -> 
  NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_fem_case_nnom_gap_sing -> 
  NP_num_sing_gen_fem_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_fem_case_nnom_gap_plur -> 
  NP_num_sing_gen_fem_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_sing_gen_nhum_case_pnom_gap_n -> 
  NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_nhum_case_pnom_gap_sing -> 
  NP_num_sing_gen_nhum_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_nhum_case_pnom_gap_plur -> 
  NP_num_sing_gen_nhum_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_sing_gen_nhum_case_nnom_gap_n -> 
  NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_gen_nhum_case_nnom_gap_sing -> 
  NP_num_sing_gen_nhum_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_sing_gen_nhum_case_nnom_gap_plur -> 
  NP_num_sing_gen_nhum_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_male_case_pnom_gap_sing -> 
  NP_num_plur_gen_male_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_male_case_pnom_gap_plur -> 
  NP_num_plur_gen_male_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_male_case_nnom_gap_sing -> 
  NP_num_plur_gen_male_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_male_case_nnom_gap_plur -> 
  NP_num_plur_gen_male_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_fem_case_pnom_gap_sing -> 
  NP_num_plur_gen_fem_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_fem_case_pnom_gap_plur -> 
  NP_num_plur_gen_fem_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_fem_case_nnom_gap_sing -> 
  NP_num_plur_gen_fem_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_fem_case_nnom_gap_plur -> 
  NP_num_plur_gen_fem_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_nhum_case_pnom_gap_sing -> 
  NP_num_plur_gen_nhum_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_nhum_case_pnom_gap_plur -> 
  NP_num_plur_gen_nhum_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_plur_gen_nhum_case_nnom_gap_sing -> 
  NP_num_plur_gen_nhum_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_plur_gen_nhum_case_nnom_gap_plur -> 
  NP_num_plur_gen_nhum_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"plur"}, args))(args) %}
N_num_sing_gen_male -> 
  N_num_sing_gen_male __ RC_num_sing_gen_male {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "stockbroker"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "man"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %}
N_num_sing_gen_fem -> 
  N_num_sing_gen_fem __ RC_num_sing_gen_fem {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "stockbroker"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "woman"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "widow"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %}
N_num_sing_gen_nhum -> 
  N_num_sing_gen_nhum __ RC_num_sing_gen_nhum {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "book"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "donkey"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "horse"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %}
N_num_plur_gen_male -> 
  N_num_plur_gen_male __ RC_num_plur_gen_male {% (args) => node("N", {"num":"plur","gen":"male"}, args) %}
N_num_plur_gen_fem -> 
  N_num_plur_gen_fem __ RC_num_plur_gen_fem {% (args) => node("N", {"num":"plur","gen":"fem"}, args) %}
N_num_plur_gen_nhum -> 
  N_num_plur_gen_nhum __ RC_num_plur_gen_nhum {% (args) => node("N", {"num":"plur","gen":"-hum"}, args) %}
RC_num_sing_gen_male -> 
  RPRO_num_sing_gen_male __ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"male"}, args) %}
RC_num_sing_gen_fem -> 
  RPRO_num_sing_gen_fem __ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"fem"}, args) %}
RC_num_sing_gen_nhum -> 
  RPRO_num_sing_gen_nhum __ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"-hum"}, args) %}
RC_num_plur_gen_male -> 
  RPRO_num_plur_gen_male __ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"male"}, args) %}
RC_num_plur_gen_fem -> 
  RPRO_num_plur_gen_fem __ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"fem"}, args) %}
RC_num_plur_gen_nhum -> 
  RPRO_num_plur_gen_nhum __ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"-hum"}, args) %}
DET_num_sing -> 
  "a"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "every"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "the"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "some"i {% (args) => node("DET", {"num":"sing"}, args) %}
PRO_num_sing_gen_male_case_pnom -> 
  "he"i {% (args) => node("PRO", {"num":"sing","gen":"male","case":"+nom"}, args) %}
PRO_num_sing_gen_male_case_nnom -> 
  "him"i {% (args) => node("PRO", {"num":"sing","gen":"male","case":"-nom"}, args) %}
PRO_num_sing_gen_fem_case_pnom -> 
  "she"i {% (args) => node("PRO", {"num":"sing","gen":"fem","case":"+nom"}, args) %}
PRO_num_sing_gen_fem_case_nnom -> 
  "her"i {% (args) => node("PRO", {"num":"sing","gen":"fem","case":"-nom"}, args) %}
PRO_num_sing_gen_nhum_case_nnom -> 
  "it"i {% (args) => node("PRO", {"num":"sing","gen":"-hum","case":"-nom"}, args) %}
PRO_num_sing_gen_nhum_case_pnom -> 
  "it"i {% (args) => node("PRO", {"num":"sing","gen":"-hum","case":"+nom"}, args) %}
PRO_num_plur_gen_male_case_pnom -> 
  "they"i {% (args) => node("PRO", {"num":"plur","gen":"male","case":"+nom"}, args) %}
PRO_num_plur_gen_fem_case_pnom -> 
  "they"i {% (args) => node("PRO", {"num":"plur","gen":"fem","case":"+nom"}, args) %}
PRO_num_plur_gen_nhum_case_pnom -> 
  "they"i {% (args) => node("PRO", {"num":"plur","gen":"-hum","case":"+nom"}, args) %}
PRO_num_plur_gen_male_case_nnom -> 
  "them"i {% (args) => node("PRO", {"num":"plur","gen":"male","case":"-nom"}, args) %}
PRO_num_plur_gen_fem_case_nnom -> 
  "them"i {% (args) => node("PRO", {"num":"plur","gen":"fem","case":"-nom"}, args) %}
PRO_num_plur_gen_nhum_case_nnom -> 
  "them"i {% (args) => node("PRO", {"num":"plur","gen":"-hum","case":"-nom"}, args) %}
PN_num_sing_gen_male -> 
  "Jones"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "John"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Mel"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Leo"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Yuji"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %}
PN_num_sing_gen_fem -> 
  "Mary"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Dani"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Anna"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %}
PN_num_sing_gen_nhum -> 
  "Brazil"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %} |
  "Italy"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %} |
  "Ulysses"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %}
AUX_num_sing_fin_p -> 
  "does"i {% (args) => node("AUX", {"num":"sing","fin":"+"}, args) %}
AUX_num_plur_fin_p -> 
  "do"i {% (args) => node("AUX", {"num":"plur","fin":"+"}, args) %}
V_num_sing_fin_n_trans_p -> 
  "like"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %}
V_num_plur_fin_n_trans_p -> 
  "like"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %}
V_num_sing_fin_n_trans_n -> 
  "love"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %}
V_num_plur_fin_n_trans_n -> 
  "love"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %}
V_num_sing_fin_p_trans_p -> 
  "likes"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "loves"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "knows"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "owns"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "fascinates"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "rotates"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "surprises"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %}
V_num_sing_fin_p_trans_n -> 
  "loves"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "stinks"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %}
V_num_plur_fin_p_trans_p -> 
  "like"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %}
V_num_plur_fin_p_trans_n -> 
  "love"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %}
RPRO_num_sing_gen_male -> 
  "who"i {% (args) => node("RPRO", {"num":"sing","gen":"male"}, args) %}
RPRO_num_sing_gen_fem -> 
  "who"i {% (args) => node("RPRO", {"num":"sing","gen":"fem"}, args) %}
RPRO_num_plur_gen_male -> 
  "who"i {% (args) => node("RPRO", {"num":"plur","gen":"male"}, args) %}
RPRO_num_plur_gen_fem -> 
  "who"i {% (args) => node("RPRO", {"num":"plur","gen":"fem"}, args) %}
RPRO_num_sing_gen_nhum -> 
  "which"i {% (args) => node("RPRO", {"num":"sing","gen":"-hum"}, args) %}
RPRO_num_plur_gen_nhum -> 
  "which"i {% (args) => node("RPRO", {"num":"plur","gen":"-hum"}, args) %}
GAP -> 
  null {% (args) => node("GAP", {}, args) %}

#  whitespaces
WS_gap_sing -> _ {% () => null %}
WS_gap_plur -> _ {% () => null %}
WS_gap_n -> __ {% () => null %}