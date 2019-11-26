@builtin "whitespace.ne"
@include "base.ne"

Sentence -> 
  S_num_sing_stat_p_tense_pres _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_sing_stat_p_tense_past _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_sing_stat_n_tense_pres _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_sing_stat_n_tense_past _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_plur_stat_p_tense_pres _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_plur_stat_p_tense_past _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_plur_stat_n_tense_pres _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  S_num_plur_stat_n_tense_past _ "." {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_sing_case_pnom_gap_sing __ VP__num_sing_fin_p_stat_p_gap_n_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_sing_case_pnom_gap_sing __ VP__num_sing_fin_p_stat_p_gap_n_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_sing_case_pnom_gap_sing __ VP__num_sing_fin_p_stat_n_gap_n_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_sing_case_pnom_gap_sing __ VP__num_sing_fin_p_stat_n_gap_n_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_plur_case_pnom_gap_plur __ VP__num_plur_fin_p_stat_p_gap_n_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_plur_case_pnom_gap_plur __ VP__num_plur_fin_p_stat_p_gap_n_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_plur_case_pnom_gap_plur __ VP__num_plur_fin_p_stat_n_gap_n_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i _ NP_num_plur_case_pnom_gap_plur __ VP__num_plur_fin_p_stat_n_gap_n_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_sing_fin_p_stat_p_gap_sing_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_sing_fin_p_stat_p_gap_sing_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_plur_fin_p_stat_p_gap_sing_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_plur_fin_p_stat_p_gap_sing_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_sing_fin_p_stat_n_gap_sing_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_sing_fin_p_stat_n_gap_sing_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_plur_fin_p_stat_n_gap_sing_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n __ VP_num_plur_fin_p_stat_n_gap_sing_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_sing_fin_p_stat_p_gap_plur_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_sing_fin_p_stat_p_gap_plur_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_plur_fin_p_stat_p_gap_plur_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_plur_fin_p_stat_p_gap_plur_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_sing_fin_p_stat_n_gap_plur_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_sing_fin_p_stat_n_gap_plur_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_plur_fin_p_stat_n_gap_plur_tense_pres _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "who"i __ AUX_num_sing_fin_p __ NP_num_plur_case_pnom_gap_n __ VP_num_plur_fin_p_stat_n_gap_plur_tense_past _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %} |
  "is"i __ NP_num_sing_case_pnom_gap_n __ ADJ _ "?"i {% (args, loc) => node("Sentence", {}, args, loc) %}
S_num_sing_stat_p_tense_pres -> 
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"pres"}, args, loc) %} |
  "if"i __ S_num_sing_stat_p_tense_pres __ "then"i __ S_num_sing_stat_p_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"pres"}, args, loc) %} |
  S_num_sing_stat_p_tense_pres __ "or"i __ S_num_sing_stat_p_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"pres"}, args, loc) %} |
  S_num_sing_stat_p_tense_pres __ "and"i __ S_num_sing_stat_p_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"pres"}, args, loc) %}
S_num_sing_stat_p_tense_past -> 
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"past"}, args, loc) %} |
  "if"i __ S_num_sing_stat_p_tense_past __ "then"i __ S_num_sing_stat_p_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"past"}, args, loc) %} |
  S_num_sing_stat_p_tense_past __ "or"i __ S_num_sing_stat_p_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"past"}, args, loc) %} |
  S_num_sing_stat_p_tense_past __ "and"i __ S_num_sing_stat_p_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","tense":"past"}, args, loc) %}
S_num_sing_stat_n_tense_pres -> 
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"pres"}, args, loc) %} |
  "if"i __ S_num_sing_stat_n_tense_pres __ "then"i __ S_num_sing_stat_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"pres"}, args, loc) %} |
  S_num_sing_stat_n_tense_pres __ "or"i __ S_num_sing_stat_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"pres"}, args, loc) %} |
  S_num_sing_stat_n_tense_pres __ "and"i __ S_num_sing_stat_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"pres"}, args, loc) %}
S_num_sing_stat_n_tense_past -> 
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"past"}, args, loc) %} |
  "if"i __ S_num_sing_stat_n_tense_past __ "then"i __ S_num_sing_stat_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"past"}, args, loc) %} |
  S_num_sing_stat_n_tense_past __ "or"i __ S_num_sing_stat_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"past"}, args, loc) %} |
  S_num_sing_stat_n_tense_past __ "and"i __ S_num_sing_stat_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","tense":"past"}, args, loc) %}
S_num_plur_stat_p_tense_pres -> 
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"pres"}, args, loc) %} |
  "if"i __ S_num_plur_stat_p_tense_pres __ "then"i __ S_num_plur_stat_p_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"pres"}, args, loc) %} |
  S_num_plur_stat_p_tense_pres __ "or"i __ S_num_plur_stat_p_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"pres"}, args, loc) %} |
  S_num_plur_stat_p_tense_pres __ "and"i __ S_num_plur_stat_p_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"pres"}, args, loc) %}
S_num_plur_stat_p_tense_past -> 
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"past"}, args, loc) %} |
  "if"i __ S_num_plur_stat_p_tense_past __ "then"i __ S_num_plur_stat_p_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"past"}, args, loc) %} |
  S_num_plur_stat_p_tense_past __ "or"i __ S_num_plur_stat_p_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"past"}, args, loc) %} |
  S_num_plur_stat_p_tense_past __ "and"i __ S_num_plur_stat_p_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","tense":"past"}, args, loc) %}
S_num_plur_stat_n_tense_pres -> 
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"pres"}, args, loc) %} |
  "if"i __ S_num_plur_stat_n_tense_pres __ "then"i __ S_num_plur_stat_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"pres"}, args, loc) %} |
  S_num_plur_stat_n_tense_pres __ "or"i __ S_num_plur_stat_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"pres"}, args, loc) %} |
  S_num_plur_stat_n_tense_pres __ "and"i __ S_num_plur_stat_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"pres"}, args, loc) %}
S_num_plur_stat_n_tense_past -> 
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"past"}, args, loc) %} |
  "if"i __ S_num_plur_stat_n_tense_past __ "then"i __ S_num_plur_stat_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"past"}, args, loc) %} |
  S_num_plur_stat_n_tense_past __ "or"i __ S_num_plur_stat_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"past"}, args, loc) %} |
  S_num_plur_stat_n_tense_past __ "and"i __ S_num_plur_stat_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","tense":"past"}, args, loc) %}
S_num_sing_stat_p_gap_n_tense_pres -> 
  NP__num_sing_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
S_num_sing_stat_p_gap_n_tense_past -> 
  NP__num_sing_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"-","tense":"past"}, args, loc) %}
S_num_sing_stat_p_gap_sing_tense_pres -> 
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
S_num_sing_stat_p_gap_sing_tense_past -> 
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
S_num_sing_stat_p_gap_plur_tense_pres -> 
  NP__num_sing_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
S_num_sing_stat_p_gap_plur_tense_past -> 
  NP__num_sing_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
S_num_sing_stat_n_gap_n_tense_pres -> 
  NP__num_sing_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
S_num_sing_stat_n_gap_n_tense_past -> 
  NP__num_sing_case_pnom_gap_n WS_gap_n VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"-","tense":"past"}, args, loc) %}
S_num_sing_stat_n_gap_sing_tense_pres -> 
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
S_num_sing_stat_n_gap_sing_tense_past -> 
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
S_num_sing_stat_n_gap_plur_tense_pres -> 
  NP__num_sing_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
S_num_sing_stat_n_gap_plur_tense_past -> 
  NP__num_sing_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_n __ VP__num_sing_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("S", {"num":"sing","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
S_num_plur_stat_p_gap_n_tense_pres -> 
  NP__num_plur_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
S_num_plur_stat_p_gap_n_tense_past -> 
  NP__num_plur_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"-","tense":"past"}, args, loc) %}
S_num_plur_stat_p_gap_sing_tense_pres -> 
  NP__num_plur_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
S_num_plur_stat_p_gap_sing_tense_past -> 
  NP__num_plur_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
S_num_plur_stat_p_gap_plur_tense_pres -> 
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
S_num_plur_stat_p_gap_plur_tense_past -> 
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
S_num_plur_stat_n_gap_n_tense_pres -> 
  NP__num_plur_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
S_num_plur_stat_n_gap_n_tense_past -> 
  NP__num_plur_case_pnom_gap_n WS_gap_n VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"-","tense":"past"}, args, loc) %}
S_num_plur_stat_n_gap_sing_tense_pres -> 
  NP__num_plur_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
S_num_plur_stat_n_gap_sing_tense_past -> 
  NP__num_plur_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_sing_case_pnom_gap_sing WS_gap_sing VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
S_num_plur_stat_n_gap_plur_tense_pres -> 
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
S_num_plur_stat_n_gap_plur_tense_past -> 
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_plur WS_gap_plur VP__num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  NP__num_plur_case_pnom_gap_n __ VP__num_plur_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("S", {"num":"plur","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_n_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_n_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_n_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_n_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_sing_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_sing_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_sing_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_sing_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_plur_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_p_gap_plur_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_p_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_plur_tense_pres -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP__num_sing_fin_p_stat_n_gap_plur_tense_past -> 
  AUX_num_sing_fin_p __ "not"i __ VP_num_sing_fin_n_stat_n_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_n_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_n_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_n_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_n_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_sing_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_sing_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_sing_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_sing_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_plur_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_p_gap_plur_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_p_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_plur_tense_pres -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP__num_plur_fin_p_stat_n_gap_plur_tense_past -> 
  AUX_num_plur_fin_p __ "not"i __ VP_num_plur_fin_n_stat_n_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("VP'", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_sing_tense_pres -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_sing_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_sing_tense_past -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_sing_tense_past __ "or"i __ VP_num_sing_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_sing_tense_pres -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_sing_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_sing_tense_past -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_sing_tense_past __ "or"i __ VP_num_sing_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_plur_tense_pres -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_plur_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_plur_tense_past -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_plur_tense_past __ "or"i __ VP_num_sing_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_plur_tense_pres -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_plur_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_plur_tense_past -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_plur_tense_past __ "or"i __ VP_num_sing_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_sing_tense_pres -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_sing_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_sing_tense_past -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_sing_tense_past __ "or"i __ VP_num_sing_fin_n_stat_p_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_sing_tense_pres -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_sing_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_sing_tense_past -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_sing_tense_past __ "or"i __ VP_num_sing_fin_n_stat_n_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_plur_tense_pres -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_plur_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_plur_tense_past -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_plur_tense_past __ "or"i __ VP_num_sing_fin_n_stat_p_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_plur_tense_pres -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_plur_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_plur_tense_past -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_plur_tense_past __ "or"i __ VP_num_sing_fin_n_stat_n_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_sing_tense_pres -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_sing_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_sing_tense_past -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_sing_tense_past __ "or"i __ VP_num_plur_fin_p_stat_p_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_sing_tense_pres -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_sing_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_sing_tense_past -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_sing_tense_past __ "or"i __ VP_num_plur_fin_p_stat_n_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_plur_tense_pres -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_plur_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_plur_tense_past -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_plur_tense_past __ "or"i __ VP_num_plur_fin_p_stat_p_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_plur_tense_pres -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_plur_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_plur_tense_past -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_plur_tense_past __ "or"i __ VP_num_plur_fin_p_stat_n_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_sing_tense_pres -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_sing_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_p_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_sing_tense_past -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_sing_tense_past __ "or"i __ VP_num_plur_fin_n_stat_p_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"sing","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_sing_tense_pres -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_pres WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_sing_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_n_gap_sing_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_sing_tense_past -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_past WS_gap_sing NP__num_sing_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_sing {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_sing_tense_past __ "or"i __ VP_num_plur_fin_n_stat_n_gap_sing_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"sing","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_plur_tense_pres -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_plur_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_p_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_plur_tense_past -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_plur_tense_past __ "or"i __ VP_num_plur_fin_n_stat_p_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"plur","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_plur_tense_pres -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_pres WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_plur_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_n_gap_plur_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_plur_tense_past -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_past WS_gap_plur NP__num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_plur {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_plur_tense_past __ "or"i __ VP_num_plur_fin_n_stat_n_gap_plur_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"plur","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_n_tense_pres -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_p_stat_p_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_p_stat_p_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_n_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_p_gap_n_tense_past -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_p_stat_p_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_p_stat_p_trans_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_p_gap_n_tense_past __ "or"i __ VP_num_sing_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_n_tense_pres -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_p_stat_n_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_p_stat_n_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_n_tense_pres __ "or"i __ VP_num_sing_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP_num_sing_fin_p_stat_n_gap_n_tense_past -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_p_stat_n_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_p_stat_n_trans_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_p __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_p_stat_n_gap_n_tense_past __ "or"i __ VP_num_sing_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_n_tense_pres -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_n_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_p_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_p_gap_n_tense_past -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_p_gap_n_tense_past __ "or"i __ VP_num_sing_fin_n_stat_p_gap_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_n_tense_pres -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_n_tense_pres __ "or"i __ VP_num_sing_fin_n_stat_n_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP_num_sing_fin_n_stat_n_gap_n_tense_past -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_sing_fin_n __ PP {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_sing_fin_n_stat_n_gap_n_tense_past __ "or"i __ VP_num_sing_fin_n_stat_n_gap_n_tense_past {% (args, loc) => node("VP", {"num":"sing","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_n_tense_pres -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_p_stat_p_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_p_stat_p_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_n_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_p_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_p_gap_n_tense_past -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_p_stat_p_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_p_stat_p_trans_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_p_gap_n_tense_past __ "or"i __ VP_num_plur_fin_p_stat_p_gap_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_n_tense_pres -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_p_stat_n_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_p_stat_n_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_n_tense_pres __ "or"i __ VP_num_plur_fin_p_stat_n_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP_num_plur_fin_p_stat_n_gap_n_tense_past -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_p_stat_n_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_p_stat_n_trans_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_p __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_p_stat_n_gap_n_tense_past __ "or"i __ VP_num_plur_fin_p_stat_n_gap_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"+","stat":"-","gap":"-","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_n_tense_pres -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_n_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_p_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_p_gap_n_tense_past -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_p_gap_n_tense_past __ "or"i __ VP_num_plur_fin_n_stat_p_gap_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"+","gap":"-","tense":"past"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_n_tense_pres -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_pres __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_p_tense_pres __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_n_tense_pres __ "or"i __ VP_num_plur_fin_n_stat_n_gap_n_tense_pres {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"pres"}, args, loc) %}
VP_num_plur_fin_n_stat_n_gap_n_tense_past -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_past __ NP__num_sing_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_p_tense_past __ NP__num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ "not"i __ ADJ {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  BE_num_plur_fin_n __ PP {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %} |
  VP_num_plur_fin_n_stat_n_gap_n_tense_past __ "or"i __ VP_num_plur_fin_n_stat_n_gap_n_tense_past {% (args, loc) => node("VP", {"num":"plur","fin":"-","stat":"-","gap":"-","tense":"past"}, args, loc) %}
NP_num_sing_case_pnom_gap_sing -> 
  GAP {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"sing"}, args, loc) %}
NP_num_sing_case_nnom_gap_sing -> 
  GAP {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"sing"}, args, loc) %}
NP_num_plur_case_pnom_gap_plur -> 
  GAP {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"plur"}, args, loc) %}
NP_num_plur_case_nnom_gap_plur -> 
  GAP {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"plur"}, args, loc) %}
NP_num_sing_case_pnom_gap_n -> 
  DET_num_sing __ N_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc) %} |
  PN_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc) %} |
  PRO_num_sing_case_pnom_refl_p {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc) %} |
  PRO_num_sing_case_pnom_refl_n {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc) %} |
  DET_num_sing_rn_p __ RN_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc) %}
NP_num_sing_case_nnom_gap_n -> 
  DET_num_sing __ N_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc) %} |
  PN_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc) %} |
  PRO_num_sing_case_nnom_refl_p {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc) %} |
  PRO_num_sing_case_nnom_refl_n {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc) %} |
  DET_num_sing_rn_p __ RN_num_sing {% (args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc) %}
NP_num_plur_case_pnom_gap_n -> 
  DET_num_plur __ N_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc) %} |
  PN_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc) %} |
  PRO_num_plur_case_pnom_refl_p {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc) %} |
  PRO_num_plur_case_pnom_refl_n {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc) %} |
  DET_num_sing_rn_p __ RN_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc) %}
NP_num_plur_case_nnom_gap_n -> 
  DET_num_plur __ N_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc) %} |
  PN_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc) %} |
  PRO_num_plur_case_nnom_refl_p {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc) %} |
  PRO_num_plur_case_nnom_refl_n {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc) %} |
  DET_num_sing_rn_p __ RN_num_plur {% (args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc) %}
NP__num_plur_case_pnom_gap_n -> 
  NP_num_sing_case_pnom_gap_n __ "and"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_sing_case_pnom_gap_n __ "and"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "and"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "and"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_pnom_gap_n __ "or"i __ NP_num_plur_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"-"}, args, loc))(args) %}
NP__num_plur_case_nnom_gap_n -> 
  NP_num_sing_case_nnom_gap_n __ "and"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_sing_case_nnom_gap_n __ "and"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "and"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "and"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_plur_case_nnom_gap_n __ "or"i __ NP_num_plur_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"-"}, args, loc))(args) %}
NP__num_sing_case_pnom_gap_n -> 
  NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc))(args) %} |
  NP_num_sing_case_pnom_gap_n __ "or"i __ NP_num_sing_case_pnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"-"}, args, loc))(args) %}
NP__num_sing_case_pnom_gap_sing -> 
  NP_num_sing_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"sing"}, args, loc))(args) %}
NP__num_sing_case_pnom_gap_plur -> 
  NP_num_sing_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"+nom","gap":"plur"}, args, loc))(args) %}
NP__num_sing_case_nnom_gap_n -> 
  NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc))(args) %} |
  NP_num_sing_case_nnom_gap_n __ "or"i __ NP_num_sing_case_nnom_gap_n {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"-"}, args, loc))(args) %}
NP__num_sing_case_nnom_gap_sing -> 
  NP_num_sing_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"sing"}, args, loc))(args) %}
NP__num_sing_case_nnom_gap_plur -> 
  NP_num_sing_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"sing","case":"-nom","gap":"plur"}, args, loc))(args) %}
NP__num_plur_case_pnom_gap_sing -> 
  NP_num_plur_case_pnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"sing"}, args, loc))(args) %}
NP__num_plur_case_pnom_gap_plur -> 
  NP_num_plur_case_pnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"+nom","gap":"plur"}, args, loc))(args) %}
NP__num_plur_case_nnom_gap_sing -> 
  NP_num_plur_case_nnom_gap_sing {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"sing"}, args, loc))(args) %}
NP__num_plur_case_nnom_gap_plur -> 
  NP_num_plur_case_nnom_gap_plur {% (args) => args.length == 1 ? args[0] : ((args, loc) => node("NP", {"num":"plur","case":"-nom","gap":"plur"}, args, loc))(args) %}
N_num_sing -> 
  N_num_sing __ RC_num_sing {% (args, loc) => node("N", {"num":"sing"}, args, loc) %} |
  ADJ __ N_num_sing {% (args, loc) => node("N", {"num":"sing"}, args, loc) %} |
  N_num_sing __ PP {% (args, loc) => node("N", {"num":"sing"}, args, loc) %} |
  "stockbroker"i {% (args, loc) => node("N", {"num":"sing","gen":"male"}, args, loc) %} |
  "man"i {% (args, loc) => node("N", {"num":"sing","gen":"male"}, args, loc) %} |
  "engineer"i {% (args, loc) => node("N", {"num":"sing","gen":"male"}, args, loc) %} |
  "brazilian"i {% (args, loc) => node("N", {"num":"sing","gen":"male"}, args, loc) %} |
  "stockbroker"i {% (args, loc) => node("N", {"num":"sing","gen":"fem"}, args, loc) %} |
  "woman"i {% (args, loc) => node("N", {"num":"sing","gen":"fem"}, args, loc) %} |
  "widow"i {% (args, loc) => node("N", {"num":"sing","gen":"fem"}, args, loc) %} |
  "engineer"i {% (args, loc) => node("N", {"num":"sing","gen":"fem"}, args, loc) %} |
  "brazilian"i {% (args, loc) => node("N", {"num":"sing","gen":"fem"}, args, loc) %} |
  "book"i {% (args, loc) => node("N", {"num":"sing","gen":"-hum"}, args, loc) %} |
  "donkey"i {% (args, loc) => node("N", {"num":"sing","gen":"-hum"}, args, loc) %} |
  "horse"i {% (args, loc) => node("N", {"num":"sing","gen":"-hum"}, args, loc) %} |
  "porsche"i {% (args, loc) => node("N", {"num":"sing","gen":"-hum"}, args, loc) %}
N_num_plur -> 
  N_num_plur __ RC_num_plur {% (args, loc) => node("N", {"num":"plur"}, args, loc) %} |
  ADJ __ N_num_plur {% (args, loc) => node("N", {"num":"plur"}, args, loc) %} |
  N_num_plur __ PP {% (args, loc) => node("N", {"num":"plur"}, args, loc) %}
RC_num_sing -> 
  RPRO_num_sing __ S_num_sing_stat_p_gap_sing_tense_pres {% (args, loc) => node("RC", {"num":"sing"}, args, loc) %} |
  RPRO_num_sing __ S_num_sing_stat_p_gap_sing_tense_past {% (args, loc) => node("RC", {"num":"sing"}, args, loc) %} |
  RPRO_num_sing __ S_num_sing_stat_n_gap_sing_tense_pres {% (args, loc) => node("RC", {"num":"sing"}, args, loc) %} |
  RPRO_num_sing __ S_num_sing_stat_n_gap_sing_tense_past {% (args, loc) => node("RC", {"num":"sing"}, args, loc) %}
RC_num_plur -> 
  RPRO_num_plur __ S_num_plur_stat_p_gap_plur_tense_pres {% (args, loc) => node("RC", {"num":"plur"}, args, loc) %} |
  RPRO_num_plur __ S_num_plur_stat_p_gap_plur_tense_past {% (args, loc) => node("RC", {"num":"plur"}, args, loc) %} |
  RPRO_num_plur __ S_num_plur_stat_n_gap_plur_tense_pres {% (args, loc) => node("RC", {"num":"plur"}, args, loc) %} |
  RPRO_num_plur __ S_num_plur_stat_n_gap_plur_tense_past {% (args, loc) => node("RC", {"num":"plur"}, args, loc) %}
V_num_sing_fin_p_stat_p_trans_p_tense_pres -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_pres __ "and"i __ V_num_sing_fin_p_stat_p_trans_p_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"+","trans":"+","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_p_tense_pres "s"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_p_trans_p_tense_past -> 
  V_num_sing_fin_p_stat_p_trans_p_tense_past __ "and"i __ V_num_sing_fin_p_stat_p_trans_p_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"+","trans":"+","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_p_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_n_trans_p_tense_pres -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_pres __ "and"i __ V_num_sing_fin_p_stat_n_trans_p_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"-","trans":"+","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_p_tense_pres "s"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_n_trans_p_tense_past -> 
  V_num_sing_fin_p_stat_n_trans_p_tense_past __ "and"i __ V_num_sing_fin_p_stat_n_trans_p_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"-","trans":"+","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_p_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_p_trans_n_tense_pres -> 
  V_num_sing_fin_p_stat_p_trans_n_tense_pres __ "and"i __ V_num_sing_fin_p_stat_p_trans_n_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"+","trans":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_n_tense_pres "s"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_p_trans_n_tense_past -> 
  V_num_sing_fin_p_stat_p_trans_n_tense_past __ "and"i __ V_num_sing_fin_p_stat_p_trans_n_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"+","trans":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_n_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_n_trans_n_tense_pres -> 
  V_num_sing_fin_p_stat_n_trans_n_tense_pres __ "and"i __ V_num_sing_fin_p_stat_n_trans_n_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"-","trans":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_n_tense_pres "s"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_p_stat_n_trans_n_tense_past -> 
  V_num_sing_fin_p_stat_n_trans_n_tense_past __ "and"i __ V_num_sing_fin_p_stat_n_trans_n_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"+","stat":"-","trans":"-","tense":"past"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_n_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_sing_fin_n_stat_p_trans_p_tense_pres -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_pres __ "and"i __ V_num_sing_fin_n_stat_p_trans_p_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"+","trans":"+","tense":"pres"}, args, loc) %} |
  V_trans_p_stat_p {% ([child], loc) => child %}
V_num_sing_fin_n_stat_p_trans_p_tense_past -> 
  V_num_sing_fin_n_stat_p_trans_p_tense_past __ "and"i __ V_num_sing_fin_n_stat_p_trans_p_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"+","trans":"+","tense":"past"}, args, loc) %}
V_num_sing_fin_n_stat_n_trans_p_tense_pres -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_pres __ "and"i __ V_num_sing_fin_n_stat_n_trans_p_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"-","trans":"+","tense":"pres"}, args, loc) %} |
  V_trans_p_stat_n {% ([child], loc) => child %}
V_num_sing_fin_n_stat_n_trans_p_tense_past -> 
  V_num_sing_fin_n_stat_n_trans_p_tense_past __ "and"i __ V_num_sing_fin_n_stat_n_trans_p_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"-","trans":"+","tense":"past"}, args, loc) %}
V_num_sing_fin_n_stat_p_trans_n_tense_pres -> 
  V_num_sing_fin_n_stat_p_trans_n_tense_pres __ "and"i __ V_num_sing_fin_n_stat_p_trans_n_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"+","trans":"-","tense":"pres"}, args, loc) %} |
  V_trans_n_stat_p {% ([child], loc) => child %}
V_num_sing_fin_n_stat_p_trans_n_tense_past -> 
  V_num_sing_fin_n_stat_p_trans_n_tense_past __ "and"i __ V_num_sing_fin_n_stat_p_trans_n_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"+","trans":"-","tense":"past"}, args, loc) %}
V_num_sing_fin_n_stat_n_trans_n_tense_pres -> 
  V_num_sing_fin_n_stat_n_trans_n_tense_pres __ "and"i __ V_num_sing_fin_n_stat_n_trans_n_tense_pres {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"-","trans":"-","tense":"pres"}, args, loc) %} |
  V_trans_n_stat_n {% ([child], loc) => child %}
V_num_sing_fin_n_stat_n_trans_n_tense_past -> 
  V_num_sing_fin_n_stat_n_trans_n_tense_past __ "and"i __ V_num_sing_fin_n_stat_n_trans_n_tense_past {% (args, loc) => node("V", {"num":"sing","fin":"-","stat":"-","trans":"-","tense":"past"}, args, loc) %}
V_num_plur_fin_p_stat_p_trans_p_tense_pres -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_pres __ "and"i __ V_num_plur_fin_p_stat_p_trans_p_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"+","trans":"+","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_p_tense_pres {% ([child], loc) => child %}
V_num_plur_fin_p_stat_p_trans_p_tense_past -> 
  V_num_plur_fin_p_stat_p_trans_p_tense_past __ "and"i __ V_num_plur_fin_p_stat_p_trans_p_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"+","trans":"+","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_p_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_plur_fin_p_stat_n_trans_p_tense_pres -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_pres __ "and"i __ V_num_plur_fin_p_stat_n_trans_p_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"-","trans":"+","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_p_tense_pres {% ([child], loc) => child %}
V_num_plur_fin_p_stat_n_trans_p_tense_past -> 
  V_num_plur_fin_p_stat_n_trans_p_tense_past __ "and"i __ V_num_plur_fin_p_stat_n_trans_p_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"-","trans":"+","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_p_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_plur_fin_p_stat_p_trans_n_tense_pres -> 
  V_num_plur_fin_p_stat_p_trans_n_tense_pres __ "and"i __ V_num_plur_fin_p_stat_p_trans_n_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"+","trans":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_p_trans_n_tense_pres {% ([child], loc) => child %}
V_num_plur_fin_p_stat_p_trans_n_tense_past -> 
  V_num_plur_fin_p_stat_p_trans_n_tense_past __ "and"i __ V_num_plur_fin_p_stat_p_trans_n_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"+","trans":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_p_trans_n_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_plur_fin_p_stat_n_trans_n_tense_pres -> 
  V_num_plur_fin_p_stat_n_trans_n_tense_pres __ "and"i __ V_num_plur_fin_p_stat_n_trans_n_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"-","trans":"-","tense":"pres"}, args, loc) %} |
  V_num_sing_fin_n_stat_n_trans_n_tense_pres {% ([child], loc) => child %}
V_num_plur_fin_p_stat_n_trans_n_tense_past -> 
  V_num_plur_fin_p_stat_n_trans_n_tense_past __ "and"i __ V_num_plur_fin_p_stat_n_trans_n_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"+","stat":"-","trans":"-","tense":"past"}, args, loc) %} |
  V_num_plur_fin_n_stat_n_trans_n_tense_pres "ed"i {% ([inf, s], loc) => { inf.children[0] += s; return inf; } %}
V_num_plur_fin_n_stat_p_trans_p_tense_pres -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_pres __ "and"i __ V_num_plur_fin_n_stat_p_trans_p_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"+","trans":"+","tense":"pres"}, args, loc) %} |
  V_trans_p_stat_p {% ([child], loc) => child %}
V_num_plur_fin_n_stat_p_trans_p_tense_past -> 
  V_num_plur_fin_n_stat_p_trans_p_tense_past __ "and"i __ V_num_plur_fin_n_stat_p_trans_p_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"+","trans":"+","tense":"past"}, args, loc) %}
V_num_plur_fin_n_stat_n_trans_p_tense_pres -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_pres __ "and"i __ V_num_plur_fin_n_stat_n_trans_p_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"-","trans":"+","tense":"pres"}, args, loc) %} |
  V_trans_p_stat_n {% ([child], loc) => child %}
V_num_plur_fin_n_stat_n_trans_p_tense_past -> 
  V_num_plur_fin_n_stat_n_trans_p_tense_past __ "and"i __ V_num_plur_fin_n_stat_n_trans_p_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"-","trans":"+","tense":"past"}, args, loc) %}
V_num_plur_fin_n_stat_p_trans_n_tense_pres -> 
  V_num_plur_fin_n_stat_p_trans_n_tense_pres __ "and"i __ V_num_plur_fin_n_stat_p_trans_n_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"+","trans":"-","tense":"pres"}, args, loc) %} |
  V_trans_n_stat_p {% ([child], loc) => child %}
V_num_plur_fin_n_stat_p_trans_n_tense_past -> 
  V_num_plur_fin_n_stat_p_trans_n_tense_past __ "and"i __ V_num_plur_fin_n_stat_p_trans_n_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"+","trans":"-","tense":"past"}, args, loc) %}
V_num_plur_fin_n_stat_n_trans_n_tense_pres -> 
  V_num_plur_fin_n_stat_n_trans_n_tense_pres __ "and"i __ V_num_plur_fin_n_stat_n_trans_n_tense_pres {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"-","trans":"-","tense":"pres"}, args, loc) %} |
  V_trans_n_stat_n {% ([child], loc) => child %}
V_num_plur_fin_n_stat_n_trans_n_tense_past -> 
  V_num_plur_fin_n_stat_n_trans_n_tense_past __ "and"i __ V_num_plur_fin_n_stat_n_trans_n_tense_past {% (args, loc) => node("V", {"num":"plur","fin":"-","stat":"-","trans":"-","tense":"past"}, args, loc) %}
DET_num_sing_rn_p -> 
  PN_num_sing "'s"i {% (args, loc) => node("DET", {"num":"sing","rn":"+"}, args, loc) %} |
  PN_num_plur "'s"i {% (args, loc) => node("DET", {"num":"sing","rn":"+"}, args, loc) %}
PP -> 
  PREP __ NP_num_sing_case_pnom_gap_n {% (args, loc) => node("PP", {}, args, loc) %} |
  PREP __ NP_num_sing_case_nnom_gap_n {% (args, loc) => node("PP", {}, args, loc) %} |
  PREP __ NP_num_plur_case_pnom_gap_n {% (args, loc) => node("PP", {}, args, loc) %} |
  PREP __ NP_num_plur_case_nnom_gap_n {% (args, loc) => node("PP", {}, args, loc) %}
DET_num_sing -> 
  "a"i {% (args, loc) => node("DET", {"num":"sing"}, args, loc) %} |
  "an"i {% (args, loc) => node("DET", {"num":"sing"}, args, loc) %} |
  "every"i {% (args, loc) => node("DET", {"num":"sing"}, args, loc) %} |
  "the"i {% (args, loc) => node("DET", {"num":"sing"}, args, loc) %} |
  "some"i {% (args, loc) => node("DET", {"num":"sing"}, args, loc) %}
PRO_num_sing_case_pnom_refl_n -> 
  "he"i {% (args, loc) => node("PRO", {"num":"sing","case":"+nom","refl":"-","gen":"male"}, args, loc) %} |
  "she"i {% (args, loc) => node("PRO", {"num":"sing","case":"+nom","refl":"-","gen":"fem"}, args, loc) %} |
  "it"i {% (args, loc) => node("PRO", {"num":"sing","case":"+nom","refl":"-","gen":"-hum"}, args, loc) %}
PRO_num_sing_case_nnom_refl_n -> 
  "him"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"-","gen":"male"}, args, loc) %} |
  "her"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"-","gen":"fem"}, args, loc) %} |
  "it"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"-","gen":"-hum"}, args, loc) %}
PRO_num_plur_case_pnom_refl_n -> 
  "they"i {% (args, loc) => node("PRO", {"num":"plur","case":"+nom","refl":"-","gen":["male","fem","-hum"]}, args, loc) %}
PRO_num_plur_case_nnom_refl_n -> 
  "them"i {% (args, loc) => node("PRO", {"num":"plur","case":"-nom","refl":"-","gen":["male","fem","-hum"]}, args, loc) %}
AUX_num_sing_fin_p -> 
  "does"i {% (args, loc) => node("AUX", {"num":"sing","fin":"+"}, args, loc) %}
AUX_num_plur_fin_p -> 
  "do"i {% (args, loc) => node("AUX", {"num":"plur","fin":"+"}, args, loc) %}
V_trans_p_stat_p -> 
  "like"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "love"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "admire"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "know"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "own"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "fascinate"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "rotate"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %} |
  "surprise"i {% (args, loc) => node("V", {"trans":"+","stat":"+"}, args, loc) %}
V_trans_n_stat_p -> 
  "love"i {% (args, loc) => node("V", {"trans":"-","stat":"+"}, args, loc) %} |
  "stink"i {% (args, loc) => node("V", {"trans":"-","stat":"+"}, args, loc) %} |
  "adore"i {% (args, loc) => node("V", {"trans":"-","stat":"+"}, args, loc) %}
V_trans_p_stat_n -> 
  "leave"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %} |
  "reach"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %} |
  "kiss"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %} |
  "hit"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %} |
  "scold"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %} |
  "beat"i {% (args, loc) => node("V", {"trans":"+","stat":"-"}, args, loc) %}
V_trans_n_stat_n -> 
  "leave"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %} |
  "arrive"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %} |
  "walk"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %} |
  "sleep"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %} |
  "come"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %} |
  "shine"i {% (args, loc) => node("V", {"trans":"-","stat":"-"}, args, loc) %}
RPRO_num_sing -> 
  "who"i {% (args, loc) => node("RPRO", {"num":"sing"}, args, loc) %} |
  "which"i {% (args, loc) => node("RPRO", {"num":"sing"}, args, loc) %}
RPRO_num_plur -> 
  "who"i {% (args, loc) => node("RPRO", {"num":"plur"}, args, loc) %} |
  "which"i {% (args, loc) => node("RPRO", {"num":"plur"}, args, loc) %}
PRO_num_sing_case_nnom_refl_p -> 
  "himself"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"+","gen":"male"}, args, loc) %} |
  "herself"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"+","gen":"fem"}, args, loc) %} |
  "itself"i {% (args, loc) => node("PRO", {"num":"sing","case":"-nom","refl":"+","gen":"-hum"}, args, loc) %}
GAP -> 
  null {% (args, loc) => node("GAP", {}, args, loc) %}
ADJ -> 
  "happy"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "unhappy"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "handsome"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "beautiful"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "fast"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "slow"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "mortal"i {% (args, loc) => node("ADJ", {}, args, loc) %} |
  "brazilian"i {% (args, loc) => node("ADJ", {}, args, loc) %}
BE_num_sing_fin_p -> 
  "is"i {% (args, loc) => node("BE", {"num":"sing","fin":"+"}, args, loc) %}
BE_num_sing_fin_n -> 
  "is"i {% (args, loc) => node("BE", {"num":"sing","fin":"-"}, args, loc) %}
BE_num_plur_fin_p -> 
  "are"i {% (args, loc) => node("BE", {"num":"plur","fin":"+"}, args, loc) %}
BE_num_plur_fin_n -> 
  "are"i {% (args, loc) => node("BE", {"num":"plur","fin":"-"}, args, loc) %}
RN_num_sing -> 
  "husband"i {% (args, loc) => node("RN", {"num":"sing","gen":"male"}, args, loc) %} |
  "father"i {% (args, loc) => node("RN", {"num":"sing","gen":"male"}, args, loc) %} |
  "brother"i {% (args, loc) => node("RN", {"num":"sing","gen":"male"}, args, loc) %} |
  "wife"i {% (args, loc) => node("RN", {"num":"sing","gen":"fem"}, args, loc) %} |
  "mother"i {% (args, loc) => node("RN", {"num":"sing","gen":"fem"}, args, loc) %} |
  "sister"i {% (args, loc) => node("RN", {"num":"sing","gen":"fem"}, args, loc) %} |
  "parent"i {% (args, loc) => node("RN", {"num":"sing","gen":["male","fem"]}, args, loc) %} |
  "child"i {% (args, loc) => node("RN", {"num":"sing","gen":["male","fem"]}, args, loc) %} |
  "sibling"i {% (args, loc) => node("RN", {"num":"sing","gen":["male","fem"]}, args, loc) %}
PREP -> 
  "behind"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "in"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "over"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "under"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "near"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "before"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "after"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "during"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "from"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "to"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "of"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "about"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "by"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "for"i {% (args, loc) => node("PREP", {}, args, loc) %} |
  "with"i {% (args, loc) => node("PREP", {}, args, loc) %}
PN_num_sing -> 
  FULLNAME {% (args, loc) => node("PN", {"num":"sing","gen":"?"}, args, loc) %} |
  VAR {% (args, loc) => node("PN", {"num":"sing","gen":"?","var":true}, args, loc) %}

# whitespaces
WS_gap_sing -> _ {% () => null %}
WS_gap_plur -> _ {% () => null %}
WS_gap_n -> __ {% () => null %}