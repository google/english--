@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage`

@{% const {S, VP, NP, PN, V, PRO, DET, N, AND} = require("./ast.js"); %}

S -> 
  NP VP "." {% ([np, vp]) => S(np, vp) %}

VP -> 
  V _ NP {% ([v, _, np]) => VP(V(v[0]), np) %}

NP -> 
  PN _ {% ([pn]) => NP(PN(pn[0])) %} |
  PRO _ {% ([pro]) => NP(PRO(pro[0])) %} |
  DET _ N _ {% ([det, _, n]) => NP(DET(det[0]), N(n[0])) %}  |
  NP "and" _ NP {% ([np1, sp1, sp2, np2]) => NP(AND(np1, np2)) %} 

PN -> "Jones" | "Smith" | "Mary"
V -> "likes" | "loves"
N -> "book" | "man" | "woman" | "donkey" | "car"
DET -> "a" | "every" | "the" | "some" | "all" | "most"
PRO -> "he" | "him" | "she" | "her" | "it" | "they"



