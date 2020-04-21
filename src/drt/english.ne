@builtin "whitespace.ne"
@include "base.ne"
@{% const {capture, match, merge, resolve, process, node} = require("./processor.js"); %}

Sentence -> S _ "." {% (d, l, r) => process("Sentence", {}, d, [{"num":1,"stat":2,"tp":4,"tense":3,"gap":"-"},{},{}], l, r) %}
Sentence -> "who"i _ NP __ VP_ _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":1,"case":"+nom","gap":"+"},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3},{},{}], l, r) %}
Sentence -> "who"i __ AUX __ NP __ VP _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","fin":"+","tp":5,"tense":4},{},{"num":1,"case":"+nom","gap":"-"},{},{"num":3,"fin":"+","stat":2,"gap":"+","tp":5,"tense":4},{},{}], l, r) %}
Sentence -> "is"i __ NP __ ADJ _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","case":"+nom","gap":"-"},{},{},{},{}], l, r) %}
S -> NP_ __ VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"-","tp":4,"tense":3}, d, [{"num":1,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3}], l, r) %}
S -> NP_ WS VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":1,"case":"+nom","gap":"+"},{"gap":"-"},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r) %}
S -> NP_ WS VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":3,"case":"+nom","gap":"+"},{"gap":"-"},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r) %}
S -> NP_ __ VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":1,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":"+","tp":5,"tense":4}], l, r) %}
VP_ -> AUX __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":4,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":4,"tense":"fut"},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":4,"tense":"pres"}], l, r) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":5,"tense":"fut"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":5,"tense":"pres"}], l, r) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"pres"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"pres"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"past"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"past"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r) %}
VP_ -> VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}, d, [{"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}], l, r) %}
VP -> V WS NP_ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":"+","tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{"gap":"-"},{"num":3,"case":"-nom","gap":"+"}], l, r) %}
VP -> V __ NP_ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":"-","tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{},{"num":3,"case":"-nom","gap":"-"}], l, r) %}
VP -> V {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":3,"gap":"-","tp":5,"tense":4}, d, [{"num":1,"fin":2,"stat":3,"trans":"-","tp":5,"tense":4}], l, r) %}
NP -> GAP {% (d, l, r) => process("NP", {"num":1,"case":3,"gap":"+"}, d, [{}], l, r) %}
NP -> DET __ N {% (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1},{},{"num":1}], l, r) %}
NP -> PN {% (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1}], l, r) %}
NP -> PRO {% (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":1,"case":3,"refl":4}], l, r) %}
NP_ -> NP __ "and"i __ NP {% (d, l, r) => ((root) => { return node('NP', root.types, root.children, root.loc); })(process("NP'", {"num":"plur","case":2,"gap":"-"}, d, [{"num":3,"case":2,"gap":"-"},{},{},{},{"num":4,"case":2,"gap":"-"}], l, r)) %}
NP_ -> NP {% (d, l, r) => ((root) => { return root.children[0]; })(process("NP'", {"num":1,"case":3,"gap":4}, d, [{"num":1,"case":3,"gap":4}], l, r)) %}
N -> N __ RC {% (d, l, r) => process("N", {"num":1}, d, [{"num":1},{},{"num":1}], l, r) %}
RC -> RPRO __ S {% (d, l, r) => process("RC", {"num":1}, d, [{"num":1},{},{"num":1,"stat":2,"gap":"+","tp":4,"tense":3}], l, r) %}
VP -> BE __ ADJ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r) %}
VP -> BE __ "not"i __ ADJ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{},{},{}], l, r) %}
VP -> BE __ NP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":7,"tense":6}, d, [{"num":1,"fin":2,"tp":7,"tense":6},{},{"num":1,"case":5,"gap":3}], l, r) %}
VP -> BE __ PP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r) %}
N -> ADJ __ N {% (d, l, r) => process("N", {"num":1}, d, [{},{},{"num":1}], l, r) %}
S -> "if"i __ S __ "then"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{},{},{"num":1,"stat":2,"gap":6,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":7,"tp":4,"tense":3}], l, r) %}
S -> S __ "or"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"gap":6,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":7,"tp":4,"tense":3}], l, r) %}
VP -> VP __ "or"i __ VP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}], l, r) %}
NP_ -> NP __ "or"i __ NP {% (d, l, r) => ((root) => { return node('NP', root.types, root.children, root.loc); })(process("NP'", {"num":3,"case":2,"gap":"-"}, d, [{"num":3,"case":2,"gap":"-"},{},{},{},{"num":3,"case":2,"gap":"-"}], l, r)) %}
S -> S __ "and"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"gap":6,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":7,"tp":4,"tense":3}], l, r) %}
V -> V __ "and"i __ V {% (d, l, r) => process("V", {"num":1,"fin":2,"stat":4,"trans":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":7,"trans":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":8,"trans":3,"tp":6,"tense":5}], l, r) %}
NP -> DET __ RN {% (d, l, r) => process("NP", {"num":1,"case":3,"gap":"-"}, d, [{"num":"sing","rn":"+"},{},{"num":1}], l, r) %}
DET -> PN "'s"i {% (d, l, r) => process("DET", {"num":"sing","rn":"+"}, d, [{"num":1},{}], l, r) %}
N -> N __ PP {% (d, l, r) => process("N", {"num":1}, d, [{"num":1},{},{}], l, r) %}
PP -> PREP __ NP {% (d, l, r) => process("PP", {}, d, [{},{},{"num":1,"case":3,"gap":"-"}], l, r) %}
VP -> HAVE __ VP {% (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r) %}
VP -> HAVE __ "not"i __ VP {% (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r) %}
DET -> "a"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r) %}
DET -> "an"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r) %}
DET -> "every"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r) %}
DET -> "the"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r) %}
DET -> "some"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r) %}
PRO -> "he"i {% (d, l, r) => process("PRO", {"num":"sing","case":"+nom","refl":"-"}, d, [{}], l, r) %}
PRO -> "him"i {% (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"-"}, d, [{}], l, r) %}
PRO -> "she"i {% (d, l, r) => process("PRO", {"num":"sing","case":"+nom","refl":"-"}, d, [{}], l, r) %}
PRO -> "her"i {% (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"-"}, d, [{}], l, r) %}
PRO -> "it"i {% (d, l, r) => process("PRO", {"num":"sing","case":["-nom","+nom"],"refl":"-"}, d, [{}], l, r) %}
PRO -> "they"i {% (d, l, r) => process("PRO", {"num":"plur","case":"+nom","refl":"-"}, d, [{}], l, r) %}
PRO -> "them"i {% (d, l, r) => process("PRO", {"num":"plur","case":"-nom","refl":"-"}, d, [{}], l, r) %}
N -> "stockbroker"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "man"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "engineer"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "brazilian"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "stockbroker"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "woman"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "widow"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "engineer"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "brazilian"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "book"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "donkey"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "horse"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
N -> "porsche"i {% (d, l, r) => process("N", {"num":"sing"}, d, [{}], l, r) %}
AUX -> "does"i {% (d, l, r) => process("AUX", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
AUX -> "do"i {% (d, l, r) => process("AUX", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
AUX -> "did"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r) %}
AUX -> "did"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"+past","tense":"past"}, d, [{}], l, r) %}
V -> "like"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "love"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "admire"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "know"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "own"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "fascinate"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "rotate"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "surprise"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r) %}
V -> "love"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r) %}
V -> "stink"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r) %}
V -> "adore"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r) %}
V -> "leave"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "reach"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "kiss"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "hit"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "scold"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "beat"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r) %}
V -> "leave"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> "arrive"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> "walk"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> "sleep"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> "come"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> "shine"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r) %}
V -> V {% (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0]], root.loc); })(process("V", {"num":1,"fin":"-","stat":3,"trans":2,"tp":4,"tense":"pres"}, d, [{"trans":2,"stat":3}], l, r)) %}
V -> V "s"i {% (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":"sing","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"},{}], l, r)) %}
V -> V {% (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, root.children[0].children, root.loc); })(process("V", {"num":"plur","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"}], l, r)) %}
V -> V "ed"i {% (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":1,"fin":"+","stat":2,"trans":3,"tp":"+past","tense":"past"}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r)) %}
V -> V "ed"i {% (d, l, r) => ((root) => { if (root == r) return r; return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); })(process("V", {"num":1,"fin":"part","stat":2,"trans":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r)) %}
RPRO -> "who"i {% (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r) %}
RPRO -> "which"i {% (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r) %}
PRO -> "himself"i {% (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r) %}
PRO -> "herself"i {% (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r) %}
PRO -> "itself"i {% (d, l, r) => process("PRO", {"num":"sing","case":"-nom","refl":"+"}, d, [{}], l, r) %}
GAP -> null {% (d, l, r) => process("GAP", {}, d, [], l, r) %}
ADJ -> "happy"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "unhappy"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "handsome"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "beautiful"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "fast"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "slow"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "mortal"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
ADJ -> "brazilian"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r) %}
BE -> "is"i {% (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
BE -> "are"i {% (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
BE -> "was"i {% (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r) %}
BE -> "were"i {% (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r) %}
RN -> "husband"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "father"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "brother"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "wife"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "mother"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "sister"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "parent"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "child"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
RN -> "sibling"i {% (d, l, r) => process("RN", {"num":"sing"}, d, [{}], l, r) %}
PREP -> "behind"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "in"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "over"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "under"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "near"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "before"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "after"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "during"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "from"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "to"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "of"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "about"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "by"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "for"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PREP -> "with"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r) %}
PN -> FULLNAME {% (d, l, r) => process("PN", {"num":"sing"}, d, [{}], l, r) %}
PN -> VAR {% (d, l, r) => process("PN", {"num":"sing"}, d, [{}], l, r) %}
AUX -> "will"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"fut"}, d, [{}], l, r) %}
HAVE -> "has"i {% (d, l, r) => process("HAVE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
HAVE -> "have"i {% (d, l, r) => process("HAVE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r) %}
HAVE -> "had"i {% (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r) %}
HAVE -> "had"i {% (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"+past","tense":["pres","past"]}, d, [{}], l, r) %}