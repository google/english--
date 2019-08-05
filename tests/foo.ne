
@builtin "whitespace.ne"

@{% const node = (type, ...children) => { return {"@type": type, children: children}; }; %}

S ->
  NP VP_ {% ([NP, VP_]) => node("S", NP, VP_) %}
VP_ ->
  VP {% ([VP]) => node("VP_", VP) %}
VP ->
  V {% ([V]) => node("VP", V) %}
NP ->
  PN _ {% ([PN, s0]) => node("NP", PN) %}
PN ->
  "Jones" {% ([n]) => node("PN", n) %} |
  "Smith" {% ([n]) => node("PN", n) %} |
  "Bill" {% ([n]) => node("PN", n) %}
V ->
  "stinks" {% ([n]) => node("V", n) %} |
  "rotates" {% ([n]) => node("V", n) %}
