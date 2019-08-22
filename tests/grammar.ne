@builtin "whitespace.ne"

@{%
function node(type, types, children) {
  return {
    "@type": type, 
    "types": types, 
    "children": children.filter(child => child)
  }; 
}
%}

S -> 
  S_num_sing {% (args) => node("S", {}, args) %} |
  S_num_plur {% (args) => node("S", {}, args) %}
S_num_sing -> 
  NP_num_sing_gen_male_case_pnom _ VP__num_sing_fin_p {% (args) => node("S", {"num":"sing"}, args) %} |
  NP_num_sing_gen_fem_case_pnom _ VP__num_sing_fin_p {% (args) => node("S", {"num":"sing"}, args) %} |
  NP_num_sing_gen_nhum_case_pnom _ VP__num_sing_fin_p {% (args) => node("S", {"num":"sing"}, args) %}
S_num_plur -> 
  NP_num_plur_gen_male_case_pnom _ VP__num_plur_fin_p {% (args) => node("S", {"num":"plur"}, args) %} |
  NP_num_plur_gen_fem_case_pnom _ VP__num_plur_fin_p {% (args) => node("S", {"num":"plur"}, args) %} |
  NP_num_plur_gen_nhum_case_pnom _ VP__num_plur_fin_p {% (args) => node("S", {"num":"plur"}, args) %}
VP__num_sing_fin_p -> 
  VP_num_sing_fin_p {% (args) => node("VP'", {"num":"sing","fin":"+"}, args) %}
VP__num_plur_fin_p -> 
  VP_num_plur_fin_p {% (args) => node("VP'", {"num":"plur","fin":"+"}, args) %}
VP_num_sing_fin_p -> 
  V_num_sing_fin_p_trans_n {% (args) => node("VP", {"num":"sing","fin":"+"}, args) %}
VP_num_sing_fin_n -> 
  V_num_sing_fin_n_trans_n {% (args) => node("VP", {"num":"sing","fin":"-"}, args) %}
VP_num_plur_fin_p -> 
  V_num_plur_fin_p_trans_n {% (args) => node("VP", {"num":"plur","fin":"+"}, args) %}
VP_num_plur_fin_n -> 
  V_num_plur_fin_n_trans_n {% (args) => node("VP", {"num":"plur","fin":"-"}, args) %}
NP_num_sing_gen_male_case_pnom -> 
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom"}, args) %}
NP_num_sing_gen_male_case_nnom -> 
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom"}, args) %}
NP_num_sing_gen_fem_case_pnom -> 
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom"}, args) %}
NP_num_sing_gen_fem_case_nnom -> 
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom"}, args) %}
NP_num_sing_gen_nhum_case_pnom -> 
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom"}, args) %}
NP_num_sing_gen_nhum_case_nnom -> 
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom"}, args) %}
NP_num_plur_gen_male_case_pnom -> 
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom"}, args) %}
NP_num_plur_gen_male_case_nnom -> 
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom"}, args) %}
NP_num_plur_gen_fem_case_pnom -> 
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom"}, args) %}
NP_num_plur_gen_fem_case_nnom -> 
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom"}, args) %}
NP_num_plur_gen_nhum_case_pnom -> 
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom"}, args) %}
NP_num_plur_gen_nhum_case_nnom -> 
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom"}, args) %}
PN_num_sing_gen_male -> 
  "Jones" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "John" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %}
PN_num_sing_gen_fem -> 
  "Mary" {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %}
V_num_sing_fin_p_trans_p -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %}
V_num_plur_fin_p_trans_p -> 
  "loves" {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %}
V_num_sing_fin_p_trans_n -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %}
V_num_plur_fin_p_trans_n -> 
  "loves" {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %}