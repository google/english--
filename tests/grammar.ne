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
  DET_num_sing _ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom"}, args) %} |
  PRO_num_sing_gen_male_case_pnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"+nom"}, args) %}
NP_num_sing_gen_male_case_nnom -> 
  DET_num_sing _ N_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom"}, args) %} |
  PN_num_sing_gen_male {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom"}, args) %} |
  PRO_num_sing_gen_male_case_nnom {% (args) => node("NP", {"num":"sing","gen":"male","case":"-nom"}, args) %}
NP_num_sing_gen_fem_case_pnom -> 
  DET_num_sing _ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom"}, args) %} |
  PRO_num_sing_gen_fem_case_pnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"+nom"}, args) %}
NP_num_sing_gen_fem_case_nnom -> 
  DET_num_sing _ N_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom"}, args) %} |
  PN_num_sing_gen_fem {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom"}, args) %} |
  PRO_num_sing_gen_fem_case_nnom {% (args) => node("NP", {"num":"sing","gen":"fem","case":"-nom"}, args) %}
NP_num_sing_gen_nhum_case_pnom -> 
  DET_num_sing _ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom"}, args) %} |
  PRO_num_sing_gen_nhum_case_pnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"+nom"}, args) %}
NP_num_sing_gen_nhum_case_nnom -> 
  DET_num_sing _ N_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom"}, args) %} |
  PN_num_sing_gen_nhum {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom"}, args) %} |
  PRO_num_sing_gen_nhum_case_nnom {% (args) => node("NP", {"num":"sing","gen":"-hum","case":"-nom"}, args) %}
NP_num_plur_gen_male_case_pnom -> 
  DET_num_plur _ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom"}, args) %} |
  PRO_num_plur_gen_male_case_pnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"+nom"}, args) %}
NP_num_plur_gen_male_case_nnom -> 
  DET_num_plur _ N_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom"}, args) %} |
  PN_num_plur_gen_male {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom"}, args) %} |
  PRO_num_plur_gen_male_case_nnom {% (args) => node("NP", {"num":"plur","gen":"male","case":"-nom"}, args) %}
NP_num_plur_gen_fem_case_pnom -> 
  DET_num_plur _ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom"}, args) %} |
  PRO_num_plur_gen_fem_case_pnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"+nom"}, args) %}
NP_num_plur_gen_fem_case_nnom -> 
  DET_num_plur _ N_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom"}, args) %} |
  PN_num_plur_gen_fem {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom"}, args) %} |
  PRO_num_plur_gen_fem_case_nnom {% (args) => node("NP", {"num":"plur","gen":"fem","case":"-nom"}, args) %}
NP_num_plur_gen_nhum_case_pnom -> 
  DET_num_plur _ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom"}, args) %} |
  PRO_num_plur_gen_nhum_case_pnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"+nom"}, args) %}
NP_num_plur_gen_nhum_case_nnom -> 
  DET_num_plur _ N_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom"}, args) %} |
  PN_num_plur_gen_nhum {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom"}, args) %} |
  PRO_num_plur_gen_nhum_case_nnom {% (args) => node("NP", {"num":"plur","gen":"-hum","case":"-nom"}, args) %}
DET_num_sing -> 
  "a" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "every" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "the" {% (args) => node("DET", {"num":"sing"}, args) %} |
  "some" {% (args) => node("DET", {"num":"sing"}, args) %}
PRO_num_sing_gen_male_case_pnom -> 
  "he" {% (args) => node("PRO", {"num":"sing","gen":"male","case":"+nom"}, args) %}
PN_num_sing_gen_male -> 
  "Jones" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "John" {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %}
PN_num_sing_gen_fem -> 
  "Mary" {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Anna" {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %}
N_num_sing_gen_male -> 
  "stockbroker" {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "man" {% (args) => node("N", {"num":"sing","gen":"male"}, args) %}
N_num_sing_gen_fem -> 
  "stockbroker" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "woman" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "widow" {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %}
N_num_sing_gen_nhum -> 
  "book" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "donkey" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "horse" {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %}
V_num_sing_fin_p_trans_p -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %}
V_num_plur_fin_p_trans_p -> 
  "loves" {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %}
V_num_sing_fin_p_trans_n -> 
  "loves" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %}
V_num_plur_fin_p_trans_n -> 
  "loves" {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "stinks" {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %}