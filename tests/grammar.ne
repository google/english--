@builtin "whitespace.ne"

@{%
function node(type, types, children) {
  // console.log(type + ": " + JSON.stringify(types) + " => ");
  return {
    "@type": type, 
    "types": types, 
     "children": children
       .filter(child => child)
       .filter(child => child != '.')
  }; 
}
%}

S -> 
  S_num_sing _ "." {% (args) => node("S", {}, args) %} |
  S_num_plur _ "." {% (args) => node("S", {}, args) %}
S_num_sing -> 
  NP_num_sing_gen_male_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %}
S_num_plur -> 
  NP_num_plur_gen_male_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %}
S_num_sing_gap_n -> 
  NP_num_sing_gen_male_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %}
S_num_sing_gap_sing -> 
  NP_num_sing_gen_male_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_sing _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %}
S_num_sing_gap_plur -> 
  NP_num_sing_gen_male_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_plur _ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %}
S_num_plur_gap_n -> 
  NP_num_plur_gen_male_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %}
S_num_plur_gap_sing -> 
  NP_num_plur_gen_male_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_sing _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %}
S_num_plur_gap_plur -> 
  NP_num_plur_gen_male_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_plur _ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %}
VP__num_sing_fin_p_gap_n -> 
  AUX_num_sing_fin_p _ "not" _ VP_num_sing_fin_n_gap_n {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  VP_num_sing_fin_p_gap_n {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"-"}, args) %}
VP__num_sing_fin_p_gap_sing -> 
  AUX_num_sing_fin_p _ "not" _ VP_num_sing_fin_n_gap_sing {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  VP_num_sing_fin_p_gap_sing {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"sing"}, args) %}
VP__num_sing_fin_p_gap_plur -> 
  AUX_num_sing_fin_p _ "not" _ VP_num_sing_fin_n_gap_plur {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  VP_num_sing_fin_p_gap_plur {% (args) => node("VP'", {"num":"sing","fin":"+","gap":"plur"}, args) %}
VP__num_plur_fin_p_gap_n -> 
  AUX_num_plur_fin_p _ "not" _ VP_num_plur_fin_n_gap_n {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  VP_num_plur_fin_p_gap_n {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"-"}, args) %}
VP__num_plur_fin_p_gap_sing -> 
  AUX_num_plur_fin_p _ "not" _ VP_num_plur_fin_n_gap_sing {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  VP_num_plur_fin_p_gap_sing {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"sing"}, args) %}
VP__num_plur_fin_p_gap_plur -> 
  AUX_num_plur_fin_p _ "not" _ VP_num_plur_fin_n_gap_plur {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  VP_num_plur_fin_p_gap_plur {% (args) => node("VP'", {"num":"plur","fin":"+","gap":"plur"}, args) %}
VP_num_sing_fin_p_gap_sing -> 
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %}
VP_num_sing_fin_p_gap_plur -> 
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %}
VP_num_sing_fin_n_gap_sing -> 
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %}
VP_num_sing_fin_n_gap_plur -> 
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %}
VP_num_plur_fin_p_gap_sing -> 
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %}
VP_num_plur_fin_p_gap_plur -> 
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %}
VP_num_plur_fin_n_gap_sing -> 
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_male_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %}
VP_num_plur_fin_n_gap_plur -> 
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_male_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %}
VP_num_sing_fin_p_gap_n -> 
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %}
VP_num_sing_fin_n_gap_n -> 
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %}
VP_num_plur_fin_p_gap_n -> 
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %}
VP_num_plur_fin_n_gap_n -> 
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
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
  DET_num_sing _ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_male_case_pnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_male_case_nnom_gap_n -> 
  DET_num_sing _ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_male_case_nnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom","gap":"-"}, args) %}
NP_num_sing_gen_fem_case_pnom_gap_n -> 
  DET_num_sing _ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_fem_case_pnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_fem_case_nnom_gap_n -> 
  DET_num_sing _ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_fem_case_nnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom","gap":"-"}, args) %}
NP_num_sing_gen_nhum_case_pnom_gap_n -> 
  DET_num_sing _ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_nhum_case_pnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom","gap":"-"}, args) %}
NP_num_sing_gen_nhum_case_nnom_gap_n -> 
  DET_num_sing _ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_gen_nhum_case_nnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_male_case_pnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_male_case_pnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_male_case_nnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_male_case_nnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_fem_case_pnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_fem_case_pnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_fem_case_nnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_fem_case_nnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom","gap":"-"}, args) %}
NP_num_plur_gen_nhum_case_pnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_nhum_case_pnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_male_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_pnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom","gap":"-"}, args) %}
NP_num_plur_gen_nhum_case_nnom_gap_n -> 
  DET_num_plur _ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_gen_nhum_case_nnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_sing_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_male_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_fem_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_sing_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_male_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_fem_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %} |
  NP_num_plur_gen_nhum_case_nnom_gap_n _ "and" _ NP_num_plur_gen_nhum_case_nnom_gap_n {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom","gap":"-"}, args) %}
N_num_sing_gen_male -> 
  N_num_sing_gen_male _ RC_num_sing_gen_male {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "stockbroker" {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "man" {% (args) => node("N", {"num":"sing","gen":"male"}, args) %}
N_num_sing_gen_fem -> 
  N_num_sing_gen_fem _ RC_num_sing_gen_fem {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "stockbroker" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "woman" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "widow" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %}
N_num_sing_gen_nhum -> 
  N_num_sing_gen_nhum _ RC_num_sing_gen_nhum {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "book" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "donkey" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "horse" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %}
N_num_plur_gen_male -> 
  N_num_plur_gen_male _ RC_num_plur_gen_male {% (args) => node("N", {"num":"plur","gen":"male"}, args) %}
N_num_plur_gen_fem -> 
  N_num_plur_gen_fem _ RC_num_plur_gen_fem {% (args) => node("N", {"num":"plur","gen":"fem"}, args) %}
N_num_plur_gen_nhum -> 
  N_num_plur_gen_nhum _ RC_num_plur_gen_nhum {% (args) => node("N", {"num":"plur","gen":"-hum"}, args) %}
RC_num_sing_gen_male -> 
  RPRO_num_sing_gen_male _ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"male"}, args) %} |
  RPRO_num_sing_gen_male _ S_num_plur_gap_sing {% (args) => node("RC", {"num":"sing","gen":"male"}, args) %}
RC_num_sing_gen_fem -> 
  RPRO_num_sing_gen_fem _ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"fem"}, args) %} |
  RPRO_num_sing_gen_fem _ S_num_plur_gap_sing {% (args) => node("RC", {"num":"sing","gen":"fem"}, args) %}
RC_num_sing_gen_nhum -> 
  RPRO_num_sing_gen_nhum _ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing","gen":"-hum"}, args) %} |
  RPRO_num_sing_gen_nhum _ S_num_plur_gap_sing {% (args) => node("RC", {"num":"sing","gen":"-hum"}, args) %}
RC_num_plur_gen_male -> 
  RPRO_num_plur_gen_male _ S_num_sing_gap_plur {% (args) => node("RC", {"num":"plur","gen":"male"}, args) %} |
  RPRO_num_plur_gen_male _ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"male"}, args) %}
RC_num_plur_gen_fem -> 
  RPRO_num_plur_gen_fem _ S_num_sing_gap_plur {% (args) => node("RC", {"num":"plur","gen":"fem"}, args) %} |
  RPRO_num_plur_gen_fem _ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"fem"}, args) %}
RC_num_plur_gen_nhum -> 
  RPRO_num_plur_gen_nhum _ S_num_sing_gap_plur {% (args) => node("RC", {"num":"plur","gen":"-hum"}, args) %} |
  RPRO_num_plur_gen_nhum _ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur","gen":"-hum"}, args) %}
DET_num_sing -> 
  "a" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "every" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "the" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "some" {% (args) => node("DET", {"num":"sing"}, args) %}
PRO_num_sing_gen_male_case_pnom -> 
  "he" {% (args) => node("PRO", {"num":"sing","gen":"male","case":"+nom"}, args) %}
PRO_num_sing_gen_male_case_nnom -> 
  "him" {% (args) => node("PRO", {"num":"sing","gen":"male","case":"-nom"}, args) %}
PRO_num_sing_gen_fem_case_pnom -> 
  "she" {% (args) => node("PRO", {"num":"sing","gen":"fem","case":"+nom"}, args) %}
PRO_num_sing_gen_fem_case_nnom -> 
  "her" {% (args) => node("PRO", {"num":"sing","gen":"fem","case":"-nom"}, args) %}
PRO_num_sing_gen_nhum_case_nnom -> 
  "it" {% (args) => node("PRO", {"num":"sing","gen":"-hum","case":"-nom"}, args) %}
PRO_num_sing_gen_nhum_case_pnom -> 
  "it" {% (args) => node("PRO", {"num":"sing","gen":"-hum","case":"+nom"}, args) %}
PRO_num_plur_gen_male_case_pnom -> 
  "they" {% (args) => node("PRO", {"num":"plur","gen":"male","case":"+nom"}, args) %}
PRO_num_plur_gen_fem_case_pnom -> 
  "they" {% (args) => node("PRO", {"num":"plur","gen":"fem","case":"+nom"}, args) %}
PRO_num_plur_gen_nhum_case_pnom -> 
  "they" {% (args) => node("PRO", {"num":"plur","gen":"-hum","case":"+nom"}, args) %}
PRO_num_plur_gen_male_case_nnom -> 
  "them" {% (args) => node("PRO", {"num":"plur","gen":"male","case":"-nom"}, args) %}
PRO_num_plur_gen_fem_case_nnom -> 
  "them" {% (args) => node("PRO", {"num":"plur","gen":"fem","case":"-nom"}, args) %}
PRO_num_plur_gen_nhum_case_nnom -> 
  "them" {% (args) => node("PRO", {"num":"plur","gen":"-hum","case":"-nom"}, args) %}
PN_num_sing_gen_male -> 
  "Jones" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "John" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %}
PN_num_sing_gen_fem -> 
  "Mary" {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Anna" {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %}
PN_num_sing_gen_nhum -> 
  "Brazil" {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %} |
  "Italy" {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %}
AUX_num_sing_fin_p -> 
  "does" {% (args) => node("AUX", {"num":"sing","fin":"+"}, args) %}
AUX_num_plur_fin_p -> 
  "do" {% (args) => node("AUX", {"num":"plur","fin":"+"}, args) %}
V_num_sing_fin_n_trans_p -> 
  "like" {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "love" {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "own" {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "fascinate" {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %}
V_num_plur_fin_n_trans_p -> 
  "like" {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "love" {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "own" {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "fascinate" {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %}
V_num_sing_fin_n_trans_n -> 
  "love" {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %} |
  "stink" {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %}
V_num_plur_fin_n_trans_n -> 
  "love" {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %} |
  "stink" {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %}
V_num_sing_fin_p_trans_p -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "surprises" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "knows" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %}
V_num_sing_fin_p_trans_n -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "surprises" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "knows" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %}
V_num_plur_fin_p_trans_p -> 
  "love" {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "stink" {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %}
V_num_plur_fin_p_trans_n -> 
  "love" {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "stink" {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %}
RPRO_num_sing_gen_male -> 
  "who" {% (args) => node("RPRO", {"num":"sing","gen":"male"}, args) %}
RPRO_num_sing_gen_fem -> 
  "who" {% (args) => node("RPRO", {"num":"sing","gen":"fem"}, args) %}
RPRO_num_plur_gen_male -> 
  "who" {% (args) => node("RPRO", {"num":"plur","gen":"male"}, args) %}
RPRO_num_plur_gen_fem -> 
  "who" {% (args) => node("RPRO", {"num":"plur","gen":"fem"}, args) %}
RPRO_num_sing_gen_nhum -> 
  "which" {% (args) => node("RPRO", {"num":"sing","gen":"-hum"}, args) %}
RPRO_num_plur_gen_nhum -> 
  "which" {% (args) => node("RPRO", {"num":"plur","gen":"-hum"}, args) %}
GAP -> 
  null {% (args) => node("GAP", {}, args) %}