@builtin "whitespace.ne"
@include "base.ne"

Sentence -> 
  S_num_sing _ "." {% (args) => node("Sentence", {}, args) %} |
  S_num_plur _ "." {% (args) => node("Sentence", {}, args) %} |
  "who"i _ NP_num_sing_case_pnom_gap_sing __ VP__num_sing_fin_p_gap_n _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "who"i _ NP_num_plur_case_pnom_gap_plur __ VP__num_plur_fin_p_gap_n _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_sing_fin_p_gap_sing _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_plur_fin_p_gap_sing _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_sing_fin_p_gap_plur _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_plur_fin_p_gap_plur _ "?"i {% (args) => node("Sentence", {}, args) %} |
  "is"i __ NP_num_sing_case_pnom_gap_n __ ADJ _ "?"i {% (args) => node("Sentence", {}, args) %}
S_num_sing -> 
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing"}, args) %} |
  "if"i __ S_num_sing __ "then"i __ S_num_sing {% (args) => node("S", {"num":"sing"}, args) %} |
  S_num_sing __ "or"i __ S_num_sing {% (args) => node("S", {"num":"sing"}, args) %} |
  S_num_sing __ "and"i __ S_num_sing {% (args) => node("S", {"num":"sing"}, args) %}
S_num_plur -> 
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur"}, args) %} |
  "if"i __ S_num_plur __ "then"i __ S_num_plur {% (args) => node("S", {"num":"plur"}, args) %} |
  S_num_plur __ "or"i __ S_num_plur {% (args) => node("S", {"num":"plur"}, args) %} |
  S_num_plur __ "and"i __ S_num_plur {% (args) => node("S", {"num":"plur"}, args) %}
S_num_sing_gap_n -> 
  NP__num_sing_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"-"}, args) %}
S_num_sing_gap_sing -> 
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_gap_sing {% (args) => node("S", {"num":"sing","gap":"sing"}, args) %}
S_num_sing_gap_plur -> 
  NP__num_sing_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_gap_n {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_gap_plur {% (args) => node("S", {"num":"sing","gap":"plur"}, args) %}
S_num_plur_gap_n -> 
  NP__num_plur_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"-"}, args) %}
S_num_plur_gap_sing -> 
  NP__num_plur_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_gap_sing {% (args) => node("S", {"num":"plur","gap":"sing"}, args) %}
S_num_plur_gap_plur -> 
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_gap_n {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_gap_plur {% (args) => node("S", {"num":"plur","gap":"plur"}, args) %}
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
  V_num_sing_fin_p_trans_p WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  BE_num_sing_fin_p __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  BE_num_sing_fin_p __ PP {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %} |
  VP_num_sing_fin_p_gap_sing __ "or"i __ VP_num_sing_fin_p_gap_sing {% (args) => node("VP", {"num":"sing","fin":"+","gap":"sing"}, args) %}
VP_num_sing_fin_p_gap_plur -> 
  V_num_sing_fin_p_trans_p WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  BE_num_sing_fin_p __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  BE_num_sing_fin_p __ PP {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %} |
  VP_num_sing_fin_p_gap_plur __ "or"i __ VP_num_sing_fin_p_gap_plur {% (args) => node("VP", {"num":"sing","fin":"+","gap":"plur"}, args) %}
VP_num_sing_fin_n_gap_sing -> 
  V_num_sing_fin_n_trans_p WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  BE_num_sing_fin_n __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  BE_num_sing_fin_n __ PP {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %} |
  VP_num_sing_fin_n_gap_sing __ "or"i __ VP_num_sing_fin_n_gap_sing {% (args) => node("VP", {"num":"sing","fin":"-","gap":"sing"}, args) %}
VP_num_sing_fin_n_gap_plur -> 
  V_num_sing_fin_n_trans_p WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  BE_num_sing_fin_n __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  BE_num_sing_fin_n __ PP {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %} |
  VP_num_sing_fin_n_gap_plur __ "or"i __ VP_num_sing_fin_n_gap_plur {% (args) => node("VP", {"num":"sing","fin":"-","gap":"plur"}, args) %}
VP_num_plur_fin_p_gap_sing -> 
  V_num_plur_fin_p_trans_p WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  BE_num_plur_fin_p __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  BE_num_plur_fin_p __ PP {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %} |
  VP_num_plur_fin_p_gap_sing __ "or"i __ VP_num_plur_fin_p_gap_sing {% (args) => node("VP", {"num":"plur","fin":"+","gap":"sing"}, args) %}
VP_num_plur_fin_p_gap_plur -> 
  V_num_plur_fin_p_trans_p WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  BE_num_plur_fin_p __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  BE_num_plur_fin_p __ PP {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %} |
  VP_num_plur_fin_p_gap_plur __ "or"i __ VP_num_plur_fin_p_gap_plur {% (args) => node("VP", {"num":"plur","fin":"+","gap":"plur"}, args) %}
VP_num_plur_fin_n_gap_sing -> 
  V_num_plur_fin_n_trans_p WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  BE_num_plur_fin_n __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  BE_num_plur_fin_n __ PP {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %} |
  VP_num_plur_fin_n_gap_sing __ "or"i __ VP_num_plur_fin_n_gap_sing {% (args) => node("VP", {"num":"plur","fin":"-","gap":"sing"}, args) %}
VP_num_plur_fin_n_gap_plur -> 
  V_num_plur_fin_n_trans_p WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  BE_num_plur_fin_n __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  BE_num_plur_fin_n __ PP {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %} |
  VP_num_plur_fin_n_gap_plur __ "or"i __ VP_num_plur_fin_n_gap_plur {% (args) => node("VP", {"num":"plur","fin":"-","gap":"plur"}, args) %}
VP_num_sing_fin_p_gap_n -> 
  V_num_sing_fin_p_trans_p __ NP__num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_p __ NP__num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  V_num_sing_fin_p_trans_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  BE_num_sing_fin_p __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  BE_num_sing_fin_p __ PP {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %} |
  VP_num_sing_fin_p_gap_n __ "or"i __ VP_num_sing_fin_p_gap_n {% (args) => node("VP", {"num":"sing","fin":"+","gap":"-"}, args) %}
VP_num_sing_fin_n_gap_n -> 
  V_num_sing_fin_n_trans_p __ NP__num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_p __ NP__num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  V_num_sing_fin_n_trans_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  BE_num_sing_fin_n __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  BE_num_sing_fin_n __ PP {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %} |
  VP_num_sing_fin_n_gap_n __ "or"i __ VP_num_sing_fin_n_gap_n {% (args) => node("VP", {"num":"sing","fin":"-","gap":"-"}, args) %}
VP_num_plur_fin_p_gap_n -> 
  V_num_plur_fin_p_trans_p __ NP__num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_p __ NP__num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  V_num_plur_fin_p_trans_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  BE_num_plur_fin_p __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  BE_num_plur_fin_p __ PP {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %} |
  VP_num_plur_fin_p_gap_n __ "or"i __ VP_num_plur_fin_p_gap_n {% (args) => node("VP", {"num":"plur","fin":"+","gap":"-"}, args) %}
VP_num_plur_fin_n_gap_n -> 
  V_num_plur_fin_n_trans_p __ NP__num_sing_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_p __ NP__num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  V_num_plur_fin_n_trans_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  BE_num_plur_fin_n __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  BE_num_plur_fin_n __ PP {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %} |
  VP_num_plur_fin_n_gap_n __ "or"i __ VP_num_plur_fin_n_gap_n {% (args) => node("VP", {"num":"plur","fin":"-","gap":"-"}, args) %}
NP_num_sing_case_pnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","case":"+nom","gap":"sing"}, args) %}
NP_num_sing_case_nnom_gap_sing -> 
  GAP {% (args) => node("NP", {"num":"sing","case":"-nom","gap":"sing"}, args) %}
NP_num_plur_case_pnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","case":"+nom","gap":"plur"}, args) %}
NP_num_plur_case_nnom_gap_plur -> 
  GAP {% (args) => node("NP", {"num":"plur","case":"-nom","gap":"plur"}, args) %}
NP_num_sing_case_pnom_gap_n -> 
  DET_num_sing __ N_num_sing {% (args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args) %} |
  PN_num_sing {% (args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args) %} |
  PRO_num_sing_case_pnom {% (args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args) %} |
  DET_num_sing_rn_p __ RN_num_sing {% (args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args) %}
NP_num_sing_case_nnom_gap_n -> 
  DET_num_sing __ N_num_sing {% (args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args) %} |
  PN_num_sing {% (args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args) %} |
  PRO_num_sing_case_nnom {% (args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args) %} |
  DET_num_sing_rn_p __ RN_num_sing {% (args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args) %}
NP_num_plur_case_pnom_gap_n -> 
  DET_num_plur __ N_num_plur {% (args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args) %} |
  PN_num_plur {% (args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args) %} |
  PRO_num_plur_case_pnom {% (args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args) %} |
  DET_num_sing_rn_p __ RN_num_plur {% (args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args) %}
NP_num_plur_case_nnom_gap_n -> 
  DET_num_plur __ N_num_plur {% (args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args) %} |
  PN_num_plur {% (args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args) %} |
  PRO_num_plur_case_nnom {% (args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args) %} |
  DET_num_sing_rn_p __ RN_num_plur {% (args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args) %}
NP__num_plur_case_pnom_gap_n -> 
  NP_num_sing_case_pnom_gap_n __ "and"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_case_pnom_gap_n __ "and"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "and"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "and"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "or"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args))(args) %}
NP__num_plur_case_nnom_gap_n -> 
  NP_num_sing_case_nnom_gap_n __ "and"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_case_nnom_gap_n __ "and"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "and"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "and"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "or"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_case_pnom_gap_n -> 
  NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args))(args) %} |
  NP_num_sing_case_pnom_gap_n __ "or"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args))(args) %}
NP__num_sing_case_pnom_gap_sing -> 
  NP_num_sing_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_sing_case_pnom_gap_plur -> 
  NP_num_sing_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_sing_case_nnom_gap_n -> 
  NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args))(args) %} |
  NP_num_sing_case_nnom_gap_n __ "or"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args))(args) %}
NP__num_sing_case_nnom_gap_sing -> 
  NP_num_sing_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_sing_case_nnom_gap_plur -> 
  NP_num_sing_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"sing","case":"-nom","gap":"plur"}, args))(args) %}
NP__num_plur_case_pnom_gap_sing -> 
  NP_num_plur_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"sing"}, args))(args) %}
NP__num_plur_case_pnom_gap_plur -> 
  NP_num_plur_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"+nom","gap":"plur"}, args))(args) %}
NP__num_plur_case_nnom_gap_sing -> 
  NP_num_plur_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"sing"}, args))(args) %}
NP__num_plur_case_nnom_gap_plur -> 
  NP_num_plur_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args) => node("NP", {"num":"plur","case":"-nom","gap":"plur"}, args))(args) %}
N_num_sing -> 
  N_num_sing __ RC_num_sing {% (args) => node("N", {"num":"sing"}, args) %} |
  ADJ __ N_num_sing {% (args) => node("N", {"num":"sing"}, args) %} |
  N_num_sing __ PP {% (args) => node("N", {"num":"sing"}, args) %} |
  "stockbroker"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "man"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "engineer"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "brazilian"i {% (args) => node("N", {"num":"sing","gen":"male"}, args) %} |
  "stockbroker"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "woman"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "widow"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "engineer"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "brazilian"i {% (args) => node("N", {"num":"sing","gen":"fem"}, args) %} |
  "book"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "donkey"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "horse"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %} |
  "porsche"i {% (args) => node("N", {"num":"sing","gen":"-hum"}, args) %}
N_num_plur -> 
  N_num_plur __ RC_num_plur {% (args) => node("N", {"num":"plur"}, args) %} |
  ADJ __ N_num_plur {% (args) => node("N", {"num":"plur"}, args) %} |
  N_num_plur __ PP {% (args) => node("N", {"num":"plur"}, args) %}
RC_num_sing -> 
  RPRO_num_sing __ S_num_sing_gap_sing {% (args) => node("RC", {"num":"sing"}, args) %}
RC_num_plur -> 
  RPRO_num_plur __ S_num_plur_gap_plur {% (args) => node("RC", {"num":"plur"}, args) %}
V_num_sing_fin_p_trans_p -> 
  V_num_sing_fin_p_trans_p __ "and"i __ V_num_sing_fin_p_trans_p {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "likes"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "loves"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "admires"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "knows"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "owns"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "fascinates"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "rotates"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %} |
  "surprises"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"+"}, args) %}
V_num_sing_fin_p_trans_n -> 
  V_num_sing_fin_p_trans_n __ "and"i __ V_num_sing_fin_p_trans_n {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "loves"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "stinks"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %} |
  "adores"i {% (args) => node("V", {"num":"sing","fin":"+","trans":"-"}, args) %}
V_num_sing_fin_n_trans_p -> 
  V_num_sing_fin_n_trans_p __ "and"i __ V_num_sing_fin_n_trans_p {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "like"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "admire"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"+"}, args) %}
V_num_sing_fin_n_trans_n -> 
  V_num_sing_fin_n_trans_n __ "and"i __ V_num_sing_fin_n_trans_n {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %} |
  "love"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %} |
  "adore"i {% (args) => node("V", {"num":"sing","fin":"-","trans":"-"}, args) %}
V_num_plur_fin_p_trans_p -> 
  V_num_plur_fin_p_trans_p __ "and"i __ V_num_plur_fin_p_trans_p {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "like"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "admire"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"+"}, args) %}
V_num_plur_fin_p_trans_n -> 
  V_num_plur_fin_p_trans_n __ "and"i __ V_num_plur_fin_p_trans_n {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %} |
  "adore"i {% (args) => node("V", {"num":"plur","fin":"+","trans":"-"}, args) %}
V_num_plur_fin_n_trans_p -> 
  V_num_plur_fin_n_trans_p __ "and"i __ V_num_plur_fin_n_trans_p {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "like"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "admire"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "know"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "own"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "fascinate"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "rotate"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %} |
  "surprise"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"+"}, args) %}
V_num_plur_fin_n_trans_n -> 
  V_num_plur_fin_n_trans_n __ "and"i __ V_num_plur_fin_n_trans_n {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %} |
  "love"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %} |
  "stink"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %} |
  "adore"i {% (args) => node("V", {"num":"plur","fin":"-","trans":"-"}, args) %}
DET_num_sing_rn_p -> 
  PN_num_sing "'s"i {% (args) => node("DET", {"num":"sing","rn":"+"}, args) %} |
  PN_num_plur "'s"i {% (args) => node("DET", {"num":"sing","rn":"+"}, args) %}
PP -> 
  PREP __ NP_num_sing_case_pnom_gap_n {% (args) => node("PP", {}, args) %} |
  PREP __ NP_num_sing_case_nnom_gap_n {% (args) => node("PP", {}, args) %} |
  PREP __ NP_num_plur_case_pnom_gap_n {% (args) => node("PP", {}, args) %} |
  PREP __ NP_num_plur_case_nnom_gap_n {% (args) => node("PP", {}, args) %}
DET_num_sing -> 
  "a"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "an"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "every"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "the"i {% (args) => node("DET", {"num":"sing"}, args) %} |
  "some"i {% (args) => node("DET", {"num":"sing"}, args) %}
PRO_num_sing_case_pnom -> 
  "he"i {% (args) => node("PRO", {"num":"sing","case":"+nom","gen":"male"}, args) %} |
  "she"i {% (args) => node("PRO", {"num":"sing","case":"+nom","gen":"fem"}, args) %} |
  "it"i {% (args) => node("PRO", {"num":"sing","case":"+nom","gen":"-hum"}, args) %}
PRO_num_sing_case_nnom -> 
  "him"i {% (args) => node("PRO", {"num":"sing","case":"-nom","gen":"male"}, args) %} |
  "her"i {% (args) => node("PRO", {"num":"sing","case":"-nom","gen":"fem"}, args) %} |
  "it"i {% (args) => node("PRO", {"num":"sing","case":"-nom","gen":"-hum"}, args) %}
PRO_num_plur_case_pnom -> 
  "they"i {% (args) => node("PRO", {"num":"plur","case":"+nom","gen":["male","fem","-hum"]}, args) %}
PRO_num_plur_case_nnom -> 
  "them"i {% (args) => node("PRO", {"num":"plur","case":"-nom","gen":["male","fem","-hum"]}, args) %}
PN_num_sing -> 
  "Jones"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "John"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Mel"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Leo"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Yuji"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Smith"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Socrates"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Sam"i {% (args) => node("PN", {"num":"sing","gen":"male"}, args) %} |
  "Mary"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Dani"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Anna"i {% (args) => node("PN", {"num":"sing","gen":"fem"}, args) %} |
  "Brazil"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %} |
  "Italy"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %} |
  "Ulysses"i {% (args) => node("PN", {"num":"sing","gen":"-hum"}, args) %}
AUX_num_sing_fin_p -> 
  "does"i {% (args) => node("AUX", {"num":"sing","fin":"+"}, args) %}
AUX_num_plur_fin_p -> 
  "do"i {% (args) => node("AUX", {"num":"plur","fin":"+"}, args) %}
RPRO_num_sing -> 
  "who"i {% (args) => node("RPRO", {"num":"sing"}, args) %} |
  "which"i {% (args) => node("RPRO", {"num":"sing"}, args) %}
RPRO_num_plur -> 
  "who"i {% (args) => node("RPRO", {"num":"plur"}, args) %} |
  "which"i {% (args) => node("RPRO", {"num":"plur"}, args) %}
GAP -> 
  null {% (args) => node("GAP", {}, args) %}
ADJ -> 
  "happy"i {% (args) => node("ADJ", {}, args) %} |
  "unhappy"i {% (args) => node("ADJ", {}, args) %} |
  "handsome"i {% (args) => node("ADJ", {}, args) %} |
  "beautiful"i {% (args) => node("ADJ", {}, args) %} |
  "fast"i {% (args) => node("ADJ", {}, args) %} |
  "slow"i {% (args) => node("ADJ", {}, args) %} |
  "mortal"i {% (args) => node("ADJ", {}, args) %} |
  "brazilian"i {% (args) => node("ADJ", {}, args) %}
BE_num_sing_fin_p -> 
  "is"i {% (args) => node("BE", {"num":"sing","fin":"+"}, args) %}
BE_num_sing_fin_n -> 
  "is"i {% (args) => node("BE", {"num":"sing","fin":"-"}, args) %}
BE_num_plur_fin_p -> 
  "are"i {% (args) => node("BE", {"num":"plur","fin":"+"}, args) %}
BE_num_plur_fin_n -> 
  "are"i {% (args) => node("BE", {"num":"plur","fin":"-"}, args) %}
RN_num_sing -> 
  "husband"i {% (args) => node("RN", {"num":"sing","gen":"male"}, args) %} |
  "father"i {% (args) => node("RN", {"num":"sing","gen":"male"}, args) %} |
  "brother"i {% (args) => node("RN", {"num":"sing","gen":"male"}, args) %} |
  "wife"i {% (args) => node("RN", {"num":"sing","gen":"fem"}, args) %} |
  "mother"i {% (args) => node("RN", {"num":"sing","gen":"fem"}, args) %} |
  "sister"i {% (args) => node("RN", {"num":"sing","gen":"fem"}, args) %}
PREP -> 
  "behind"i {% (args) => node("PREP", {}, args) %} |
  "in"i {% (args) => node("PREP", {}, args) %} |
  "over"i {% (args) => node("PREP", {}, args) %} |
  "under"i {% (args) => node("PREP", {}, args) %} |
  "near"i {% (args) => node("PREP", {}, args) %} |
  "before"i {% (args) => node("PREP", {}, args) %} |
  "after"i {% (args) => node("PREP", {}, args) %} |
  "during"i {% (args) => node("PREP", {}, args) %} |
  "from"i {% (args) => node("PREP", {}, args) %} |
  "to"i {% (args) => node("PREP", {}, args) %} |
  "of"i {% (args) => node("PREP", {}, args) %} |
  "about"i {% (args) => node("PREP", {}, args) %} |
  "by"i {% (args) => node("PREP", {}, args) %} |
  "for"i {% (args) => node("PREP", {}, args) %} |
  "with"i {% (args) => node("PREP", {}, args) %}

# whitespaces
WS_gap_sing -> _ {% () => null %}
WS_gap_plur -> _ {% () => null %}
WS_gap_n -> __ {% () => null %}