@builtin "whitespace.ne"
@include "base.ne"
@{% const {capture, match, merge, resolve, process, node} = require("./processor.js"); %}

Sentence -> S _ "." {% (d, l, r) => process("Sentence", {}, d, [{"num":1,"stat":2,"tp":4,"tense":3,"gap":"-"},{},{}], l, r, undefined) %}
Sentence -> "who"i _ NP __ VP_ _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":1,"gen":5,"case":"+nom","gap":"+"},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3},{},{}], l, r, undefined) %}
Sentence -> "who"i __ AUX __ NP __ VP _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","fin":"+","tp":5,"tense":4},{},{"num":1,"gen":6,"case":"+nom","gap":"-"},{},{"num":3,"fin":"+","stat":2,"gap":"+","tp":5,"tense":4},{},{}], l, r, undefined) %}
Sentence -> "is"i __ NP __ ADJ _ "?"i {% (d, l, r) => process("Sentence", {}, d, [{},{},{"num":"sing","gen":1,"case":"+nom","gap":"-"},{},{},{},{}], l, r, undefined) %}
S -> NP_ __ VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"-","tp":4,"tense":3}, d, [{"num":1,"gen":5,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":"-","tp":4,"tense":3}], l, r, undefined) %}
S -> NP_ WS VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":1,"gen":6,"case":"+nom","gap":"+"},{"gap":"-"},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r, undefined) %}
S -> NP_ WS VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":3,"gen":6,"case":"+nom","gap":"+"},{"gap":"-"},{"num":1,"fin":"+","stat":2,"gap":"-","tp":5,"tense":4}], l, r, undefined) %}
S -> NP_ __ VP_ {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":"+","tp":5,"tense":4}, d, [{"num":1,"gen":6,"case":"+nom","gap":"-"},{},{"num":1,"fin":"+","stat":2,"gap":"+","tp":5,"tense":4}], l, r, undefined) %}
VP_ -> AUX __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":4,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":4,"tense":"fut"},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":4,"tense":"pres"}], l, r, undefined) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":"fut"}, d, [{"num":1,"fin":"+","tp":5,"tense":"fut"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":5,"tense":"pres"}], l, r, undefined) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"pres"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"pres"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r, undefined) %}
VP_ -> AUX __ "not"i __ VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":"-past","tense":"past"}, d, [{"num":1,"fin":"+","tp":"-past","tense":"past"},{},{},{},{"num":1,"fin":"-","stat":3,"gap":2,"tp":"-past","tense":"pres"}], l, r, undefined) %}
VP_ -> VP {% (d, l, r) => process("VP'", {"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}, d, [{"num":1,"fin":"+","stat":3,"gap":2,"tp":5,"tense":4}], l, r, undefined) %}
VP -> V WS NP_ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":"+","tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{"gap":"-"},{"num":3,"gen":7,"case":"-nom","gap":"+"}], l, r, undefined) %}
VP -> V __ NP_ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":"-","tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"trans":"+","tp":6,"tense":5},{},{"num":3,"gen":7,"case":"-nom","gap":"-"}], l, r, undefined) %}
VP -> V {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":3,"gap":"-","tp":5,"tense":4}, d, [{"num":1,"fin":2,"stat":3,"trans":"-","tp":5,"tense":4}], l, r, undefined) %}
NP -> GAP {% (d, l, r) => process("NP", {"num":1,"gen":2,"case":3,"gap":"+"}, d, [{}], l, r, undefined) %}
NP -> DET __ N {% (d, l, r) => process("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, d, [{"num":1},{},{"num":1,"gen":2}], l, r, undefined) %}
NP -> PN {% (d, l, r) => process("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, d, [{"num":1,"gen":2}], l, r, undefined) %}
NP -> PRO {% (d, l, r) => process("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, d, [{"num":1,"gen":2,"case":3,"refl":4}], l, r, undefined) %}
NP_ -> NP __ "and"i __ NP {% (d, l, r) => process("NP'", {"num":"plur","gen":"?","case":2,"gap":"-"}, d, [{"num":3,"gen":5,"case":2,"gap":"-"},{},{},{},{"num":4,"gen":6,"case":2,"gap":"-"}], l, r, (root) => { return node('NP', root.types, root.children, root.loc); }) %}
NP_ -> NP {% (d, l, r) => process("NP'", {"num":1,"gen":2,"case":3,"gap":4}, d, [{"num":1,"gen":2,"case":3,"gap":4}], l, r, (root) => { return root.children[0]; }) %}
N -> N __ RC {% (d, l, r) => process("N", {"num":1,"gen":2}, d, [{"num":1,"gen":2},{},{"num":1}], l, r, undefined) %}
RC -> RPRO __ S {% (d, l, r) => process("RC", {"num":1}, d, [{"num":1},{},{"num":1,"stat":2,"gap":"+","tp":4,"tense":3}], l, r, undefined) %}
VP -> BE __ ADJ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r, undefined) %}
VP -> BE __ "not"i __ ADJ {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{},{},{}], l, r, undefined) %}
VP -> BE __ NP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":7,"tense":6}, d, [{"num":1,"fin":2,"tp":7,"tense":6},{},{"num":1,"gen":8,"case":5,"gap":3}], l, r, undefined) %}
VP -> BE __ PP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"tp":6,"tense":5},{},{}], l, r, undefined) %}
N -> ADJ __ N {% (d, l, r) => process("N", {"num":1,"gen":2}, d, [{},{},{"num":1,"gen":2}], l, r, undefined) %}
S -> "if"i __ S __ "then"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{},{},{"num":1,"stat":2,"gap":6,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":7,"tp":4,"tense":3}], l, r, undefined) %}
S -> S __ "or"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"gap":6,"tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":7,"tp":4,"tense":3}], l, r, undefined) %}
VP -> VP __ "or"i __ VP {% (d, l, r) => process("VP", {"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":4,"gap":3,"tp":6,"tense":5}], l, r, undefined) %}
NP_ -> NP __ "or"i __ NP {% (d, l, r) => process("NP'", {"num":3,"gen":4,"case":2,"gap":"-"}, d, [{"num":3,"gen":4,"case":2,"gap":"-"},{},{},{},{"num":3,"gen":4,"case":2,"gap":"-"}], l, r, (root) => { return node('NP', root.types, root.children, root.loc); }) %}
NP_ -> NP __ "or"i __ NP {% (d, l, r) => process("NP'", {"num":3,"gen":"?","case":2,"gap":"-"}, d, [{"num":3,"gen":4,"case":2,"gap":"-"},{},{},{},{"num":3,"gen":5,"case":2,"gap":"-"}], l, r, (root) => { return node('NP', root.types, root.children, root.loc); }) %}
S -> S __ "and"i __ S {% (d, l, r) => process("S", {"num":1,"stat":2,"gap":5,"tp":4,"tense":3}, d, [{"num":1,"stat":2,"gap":"-","tp":4,"tense":3},{},{},{},{"num":1,"stat":2,"gap":"-","tp":4,"tense":3}], l, r, undefined) %}
V -> V __ "and"i __ V {% (d, l, r) => process("V", {"num":1,"fin":2,"stat":4,"trans":3,"tp":6,"tense":5}, d, [{"num":1,"fin":2,"stat":7,"trans":3,"tp":6,"tense":5},{},{},{},{"num":1,"fin":2,"stat":8,"trans":3,"tp":6,"tense":5}], l, r, undefined) %}
NP -> DET __ RN {% (d, l, r) => process("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, d, [{"num":"sing","rn":"+"},{},{"num":1,"gen":2}], l, r, undefined) %}
DET -> PN "'s"i {% (d, l, r) => process("DET", {"num":"sing","rn":"+"}, d, [{"num":1,"gen":2},{}], l, r, undefined) %}
N -> N __ PP {% (d, l, r) => process("N", {"num":1,"gen":2}, d, [{"num":1,"gen":2},{},{}], l, r, undefined) %}
PP -> PREP __ NP {% (d, l, r) => process("PP", {}, d, [{},{},{"num":1,"gen":2,"case":3,"gap":"-"}], l, r, undefined) %}
VP -> HAVE __ VP {% (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r, undefined) %}
VP -> HAVE __ "not"i __ VP {% (d, l, r) => process("VP", {"num":1,"fin":"+","stat":"+","gap":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"+","tp":4,"tense":5},{},{},{},{"num":1,"fin":"part","stat":6,"gap":3,"tp":4,"tense":5}], l, r, undefined) %}
DET -> "a"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r, undefined) %}
DET -> "an"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r, undefined) %}
DET -> "every"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r, undefined) %}
DET -> "the"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r, undefined) %}
DET -> "some"i {% (d, l, r) => process("DET", {"num":["sing"]}, d, [{}], l, r, undefined) %}
PRO -> "he"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"male","case":"+nom","refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "him"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"male","case":"-nom","refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "she"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"fem","case":"+nom","refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "her"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"fem","case":"-nom","refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "it"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"-hum","case":["-nom","+nom"],"refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "they"i {% (d, l, r) => process("PRO", {"num":"plur","gen":["male","fem","-hum"],"case":"+nom","refl":"-"}, d, [{}], l, r, undefined) %}
PRO -> "them"i {% (d, l, r) => process("PRO", {"num":"plur","gen":["male","fem","-hum"],"case":"-nom","refl":"-"}, d, [{}], l, r, undefined) %}
PN -> "Jones"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "John"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Mel"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Leo"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Yuji"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Smith"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Socrates"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Sam"i {% (d, l, r) => process("PN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
PN -> "Mary"i {% (d, l, r) => process("PN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
PN -> "Dani"i {% (d, l, r) => process("PN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
PN -> "Anna"i {% (d, l, r) => process("PN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
PN -> "Brazil"i {% (d, l, r) => process("PN", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
PN -> "Italy"i {% (d, l, r) => process("PN", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
PN -> "Ulysses"i {% (d, l, r) => process("PN", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
N -> "stockbroker"i {% (d, l, r) => process("N", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
N -> "man"i {% (d, l, r) => process("N", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
N -> "engineer"i {% (d, l, r) => process("N", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
N -> "brazilian"i {% (d, l, r) => process("N", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
N -> "stockbroker"i {% (d, l, r) => process("N", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
N -> "woman"i {% (d, l, r) => process("N", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
N -> "widow"i {% (d, l, r) => process("N", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
N -> "engineer"i {% (d, l, r) => process("N", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
N -> "brazilian"i {% (d, l, r) => process("N", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
N -> "book"i {% (d, l, r) => process("N", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
N -> "donkey"i {% (d, l, r) => process("N", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
N -> "horse"i {% (d, l, r) => process("N", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
N -> "porsche"i {% (d, l, r) => process("N", {"num":"sing","gen":"-hum"}, d, [{}], l, r, undefined) %}
AUX -> "does"i {% (d, l, r) => process("AUX", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
AUX -> "do"i {% (d, l, r) => process("AUX", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
AUX -> "did"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r, undefined) %}
AUX -> "did"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"+past","tense":"past"}, d, [{}], l, r, undefined) %}
V -> "like"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "love"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "admire"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "know"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "own"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "fascinate"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "rotate"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "surprise"i {% (d, l, r) => process("V", {"trans":"+","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "love"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "stink"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "adore"i {% (d, l, r) => process("V", {"trans":"-","stat":"+"}, d, [{}], l, r, undefined) %}
V -> "leave"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "reach"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "kiss"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "hit"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "scold"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "beat"i {% (d, l, r) => process("V", {"trans":"+","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "leave"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "arrive"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "walk"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "sleep"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "come"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> "shine"i {% (d, l, r) => process("V", {"trans":"-","stat":"-"}, d, [{}], l, r, undefined) %}
V -> V {% (d, l, r) => process("V", {"num":1,"fin":"-","stat":3,"trans":2,"tp":4,"tense":"pres"}, d, [{"trans":2,"stat":3}], l, r, (root) => node(root['@type'], root.types, [root.children[0].children[0]], root.loc)) %}
V -> V "s"i {% (d, l, r) => process("V", {"num":"sing","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"},{}], l, r, (root) => node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc)) %}
V -> V {% (d, l, r) => process("V", {"num":"plur","fin":"+","stat":2,"trans":1,"tp":"-past","tense":"pres"}, d, [{"num":"sing","fin":"-","stat":2,"trans":1,"tp":"-past","tense":"pres"}], l, r, (root) => node(root['@type'], root.types, root.children[0].children, root.loc)) %}
V -> V "ed"i {% (d, l, r) => process("V", {"num":1,"fin":"+","stat":2,"trans":3,"tp":"+past","tense":"past"}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r, (root) => node(root['@type'], 
                                  root.types, 
                                  [root.children[0].children[0] + 'ed'], 
                                  root.loc, 
                                  {root: root.children[0].children[0]})) %}
V -> V "ed"i {% (d, l, r) => process("V", {"num":1,"fin":"part","stat":2,"trans":3,"tp":4,"tense":5}, d, [{"num":1,"fin":"-","stat":2,"trans":3,"tp":"+past","tense":"pres"},{}], l, r, (root) => node(root['@type'], 
                                  root.types, 
                                  [root.children[0].children[0] + 'ed'], 
                                  root.loc, 
                                  {root: root.children[0].children[0]})) %}
RPRO -> "who"i {% (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r, undefined) %}
RPRO -> "which"i {% (d, l, r) => process("RPRO", {"num":["sing","plur"]}, d, [{}], l, r, undefined) %}
PRO -> "himself"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"male","case":"-nom","refl":"+"}, d, [{}], l, r, undefined) %}
PRO -> "herself"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"fem","case":"-nom","refl":"+"}, d, [{}], l, r, undefined) %}
PRO -> "itself"i {% (d, l, r) => process("PRO", {"num":"sing","gen":"-hum","case":"-nom","refl":"+"}, d, [{}], l, r, undefined) %}
GAP -> null {% (d, l, r) => process("GAP", {}, d, [], l, r, undefined) %}
ADJ -> "happy"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "unhappy"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "handsome"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "beautiful"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "fast"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "slow"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "mortal"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
ADJ -> "brazilian"i {% (d, l, r) => process("ADJ", {}, d, [{}], l, r, undefined) %}
BE -> "is"i {% (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
BE -> "are"i {% (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
BE -> "was"i {% (d, l, r) => process("BE", {"num":"sing","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r, undefined) %}
BE -> "were"i {% (d, l, r) => process("BE", {"num":"plur","fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r, undefined) %}
RN -> "husband"i {% (d, l, r) => process("RN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
RN -> "father"i {% (d, l, r) => process("RN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
RN -> "brother"i {% (d, l, r) => process("RN", {"num":"sing","gen":"male"}, d, [{}], l, r, undefined) %}
RN -> "wife"i {% (d, l, r) => process("RN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
RN -> "mother"i {% (d, l, r) => process("RN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
RN -> "sister"i {% (d, l, r) => process("RN", {"num":"sing","gen":"fem"}, d, [{}], l, r, undefined) %}
RN -> "parent"i {% (d, l, r) => process("RN", {"num":"sing","gen":["male","fem"]}, d, [{}], l, r, undefined) %}
RN -> "child"i {% (d, l, r) => process("RN", {"num":"sing","gen":["male","fem"]}, d, [{}], l, r, undefined) %}
RN -> "sibling"i {% (d, l, r) => process("RN", {"num":"sing","gen":["male","fem"]}, d, [{}], l, r, undefined) %}
PREP -> "behind"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "in"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "over"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "under"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "near"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "before"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "after"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "during"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "from"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "to"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "of"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "about"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "by"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "for"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PREP -> "with"i {% (d, l, r) => process("PREP", {}, d, [{}], l, r, undefined) %}
PN -> FULLNAME {% (d, l, r) => process("PN", {"num":"sing","gen":"?"}, d, [{}], l, r, undefined) %}
PN -> VAR {% (d, l, r) => process("PN", {"num":"sing","gen":"?"}, d, [{}], l, r, undefined) %}
AUX -> "will"i {% (d, l, r) => process("AUX", {"num":1,"fin":"+","tp":"-past","tense":"fut"}, d, [{}], l, r, undefined) %}
HAVE -> "has"i {% (d, l, r) => process("HAVE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
HAVE -> "have"i {% (d, l, r) => process("HAVE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, d, [{}], l, r, undefined) %}
HAVE -> "had"i {% (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"-past","tense":"past"}, d, [{}], l, r, undefined) %}
HAVE -> "had"i {% (d, l, r) => process("HAVE", {"num":1,"fin":"+","tp":"+past","tense":["pres","past"]}, d, [{}], l, r, undefined) %}