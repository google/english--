@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage`

@{% const {S, VP, NP, PN, V} = require("./ast.js"); %}

S -> NP VP "." {% args => S(args[0], args[1]) %}
VP -> V _ NP {% args => VP(V(args[0][0]), args[2]) %}
NP -> PN _  {% args => NP(PN(args[0][0])) %}
PN -> "Jones" | "Smith" | "Mary"
V -> "likes" | "loves"

