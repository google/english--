@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage`

@{% const {S, VP, NP, PN, V, PRO, DET, N, AND} = require("./ast.js"); %}

S -> NP VP "." {% args => S(args[0], args[1]) %}
VP -> V _ NP {% args => VP(V(args[0][0]), args[2]) %}
NP -> PN _ {% args => NP(PN(args[0][0])) %} |
      PRO _ {% args => NP(PRO(args[0][0])) %} |
      DET _ N _ {% args => NP(DET(args[0][0]), N(args[2][0])) %}  |
      NP "and" _ NP {% args => NP(AND(args[0], args[3])) %} 

PN -> "Jones" | "Smith" | "Mary"
V -> "likes" | "loves"
N -> "book" | "man" | "woman" | "donkey" | "car"
DET -> "a" | "every" | "the" | "some" | "all" | "most"
PRO -> "he" | "him" | "she" | "her" | "it" | "they"


