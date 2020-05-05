const {Parser} = require("nearley");
const {ParserRules, ParserStart} = require("./english.js");

let rule = (head = {}, tail = [], prod) => { 
 return {
  "@type": "Rule", 
  "head": head, 
  "tail": tail, 
  "prod": prod
 }
};

let space = (optional = false) => { return optional ? "_" : "__"};
let term = (name, types) => { return {"@type": "Term", name: name, types: types} };
let literal = (value) => { return {"@type": "Literal", name: value} };
let phrase = (head, tail, prod) => { return rule(head, [tail], prod); };

function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

const FEATURES = {
 "gap": ["-", "sing", "plur"],
 "num": ["sing", "plur"],
 "case": ["+nom", "-nom"],    
 "trans": ["+", "-"],
 "fin": ["+", "-", "part"],
 "stat": ["+", "-"],
 "refl": ["+", "-"],
 "tense": ["pres", "past", "fut"],
 "tp": ["+past", "-past"],
};

function parse(source, start = "Sentence") {
 const parser = new Parser(ParserRules, start, {
   keepHistory: true
  });
 parser.feed(source);
 return parser.results;
}


function grammar() {
 let result = [];

 // Root
 result.push(phrase(term("Sentence"),
                    [term("S", {"num": 1, "stat": 2, "tp": 4, "tense": 3, "gap": "-"}), 
                     space(true),
                     '"."']));

 // Questions
 result.push(phrase(term("Sentence"),
                    [literal("who"),
                     space(true),
                     term("NP", {"num": 1, "gen": 5, "case": "+nom", "gap": "+"}),
                     space(),
                     term("VP'", {"num": 1, "fin": "+", "stat": 2, "gap": "-", "tp": 4, "tense": 3}),
                     space(true),
                     literal("?")]));

 result.push(phrase(term("Sentence"),
                    [literal("who"),
                     space(),
                     term("AUX", {"num": "sing", "fin": "+", "tp": 5, "tense": 4}),
                     space(),
                     term("NP", {"num": 1, "gen": 6, "case": "+nom", "gap": "-"}),
                     space(),
                     term("VP", {"num": 3, "fin": "+", "stat": 2, "gap": "+", "tp": 5, "tense": 4}),
                     space(true),
                     literal("?")]));

 result.push(phrase(term("Sentence"),
                    [literal("is"),
                     space(),
                     term("NP", {"num": "sing", "gen": 1, "case": "+nom", "gap": "-"}),
                     space(),
                     term("ADJ"),
                     space(true),
                     literal("?")]));

 // PS 1
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": "-", "tp": 4, "tense": 3}),
                    [term("NP'", {"num": 1, "gen": 5, "case": "+nom", "gap": "-"}),
                     space(),
                     term("VP'", {"num": 1, "fin": "+", "stat": 2, "gap": "-", "tp": 4, "tense": 3})]));
 
 // PS 2
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": "+", "tp": 5, "tense": 4}),
                    [term("NP'", {"num": 1, "gen": 6, "case": "+nom", "gap": "+"}),
                     term("WS", {"gap": "-"}),
                     term("VP'", {"num": 1, "fin": "+", "stat": 2, "gap": "-", "tp": 5, "tense": 4})]));
 
 // PS 2.5
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": "+", "tp": 5, "tense": 4}),
                    [term("NP'", {"num": 3, "gen": 6, "case": "+nom", "gap": "+"}),
                     term("WS", {"gap": "-"}),
                     term("VP'", {"num": 1, "fin": "+", "stat": 2, "gap": "-", "tp": 5, "tense": 4})]));

 // PS 3
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": "+", "tp": 5, "tense": 4}),
                    [term("NP'", {"num": 1, "gen": 6, "case": "+nom", "gap": "-"}),
                     space(),
                     term("VP'", {"num": 1, "fin": "+", "stat": 2, "gap": "+", "tp": 5, "tense": 4})]));
 
 // PS 4a
 // NOTE(goto): this is slightly different in that the "num" variable
 // is tied to the same variable rather than a different one. This
 // may be a typo in the paper.
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": 4, "tense": "fut"}),
                    [term("AUX", {"num": 1, "fin": "+", "tp": 4, "tense": "fut"}),
                     space(),
                     term("VP", {"num": 1, "fin": "-", "stat": 3, "gap": 2, "tp": 4, "tense": "pres"})]));
 
 // PS 4b
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": 5, "tense": "fut"}),
                    [term("AUX", {"num": 1, "fin": "+", "tp": 5, "tense": "fut"}),
                     space(),
                     literal("not"),
                     space(),
                     term("VP", {"num": 1, "fin": "-", "stat": 3, "gap": 2, "tp": 5, "tense": "pres"})]));
 
 // PS 4c
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": "-past", "tense": "pres"}),
                    [term("AUX", {"num": 1, "fin": "+", "tp": "-past", "tense": "pres"}),
                     space(),
                     literal("not"),
                     space(),
                     term("VP", {"num": 1, "fin": "-", "stat": 3, "gap": 2, "tp": "-past", "tense": "pres"})]));
 
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": "-past", "tense": "past"}),
                    [term("AUX", {"num": 1, "fin": "+", "tp": "-past", "tense": "past"}),
                     space(),
                     literal("not"),
                     space(),
                     term("VP", {"num": 1, "fin": "-", "stat": 3, "gap": 2, "tp": "-past", "tense": "pres"})]));
 
 // PS 5
 result.push(phrase(term("VP'", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": 5, "tense": 4}),
                    [term("VP", {"num": 1, "fin": "+", "stat": 3, "gap": 2, "tp": 5, "tense": 4})]));
 
 // PS 6
 // TODO(goto): should we limit tense to ["past", "pres"] per page 684?
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": "+", "tp": 6, "tense": 5}),
                    [term("V", {"num": 1, "fin": 2, "stat": 4, "trans": "+", "tp": 6, "tense": 5}),
                     term("WS", {"gap": "-"}),
                     term("NP'", {"num": 3, "gen": 7, "case": "-nom", "gap": "+"})]));
 
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": "-", "tp": 6, "tense": 5}),
                    [term("V", {"num": 1, "fin": 2, "stat": 4, "trans": "+", "tp": 6, "tense": 5}),
                     space(),
                     term("NP'", {"num": 3, "gen": 7, "case": "-nom", "gap": "-"})]));
 
 // PS 7
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 3, "gap": "-", "tp": 5, "tense": 4}),
                    [term("V", {"num": 1, "fin": 2, "stat": 3, "trans": "-", "tp": 5, "tense": 4})]));
 
 // PS 8
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "+"}),
                    [term("GAP")]));
 
 // page 36 makes a simplification, which we introduce back manually:
 // The intended meaning is that the left-hand side can have either of 
 // the case values +nom and -nom. 
 
 // PS 9
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                     [term("DET", {"num": 1}), 
                      space(),
                      term("N", {"num": 1, "gen": 2})]));
 
 // PS 10
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                    [term("PN", {"num": 1, "gen": 2})]));
  
 // PS 11
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                    [term("PRO", {"num": 1, "gen": 2, "case": 3, "refl": 4})]));

 // PS 12
 result.push(phrase(term("NP'", {"num": "plur", "gen": "?", "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "gen": 5,"case": 2, "gap": "-"}),
                     space(),
                     literal("and"),
                     space(),
                     term("NP", {"num": 4, "gen": 6, "case": 2, "gap": "-"})], 
                    "(root) => { return node('NP', root.types, root.children, root.loc); }"));
 
 // PS 12.5
 result.push(phrase(term("NP'", {"num": 1, "gen": 2, "case": 3, "gap": 4}),
                    [term("NP", {"num": 1, "gen": 2, "case": 3, "gap": 4})], 
                    "(root) => { return root.children[0]; }",
                    ));
 

 // PS 13
 result.push(phrase(term("N", {"num": 1, "gen": 2}),
                    [term("N", {"num": 1, "gen": 2}),
                     space(),
                     term("RC", {"num": 1})]));
 // PS 14
 // NOTE(goto): this is in slight disagreement with the book, because it is forcing
 // the sentence to agree with the relative clause number feature to disallow the
 // following example:
 // A stockbroker who DO not love her likes him.
 // TODO(goto): isn't "S" missing a "fin" feature?
 result.push(phrase(term("RC", {"num": 1}),
                     [term("RPRO", {"num": 1}),
                      space(),
                      term("S", {"num": 1, "stat": 2, "gap": "+", "tp": 4, "tense": 3})]));

 // PS Adjectives (page 57)
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5}),
                    [term("BE", {"num": 1, "fin": 2, "tp": 6, "tense": 5}),
                     space(),
                     term("ADJ")]));

 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5}),
                    [term("BE", {"num": 1, "fin": 2, "tp": 6, "tense": 5}),
                     space(),
                     literal("not"),
                     space(),
                     term("ADJ")]));
 
 // 3.6 Identity and Predication
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 7, "tense": 6}),
                    [term("BE", {"num": 1, "fin": 2, "tp": 7, "tense": 6}),
                     space(),
                     term("NP", {"num": 1, "gen": 8, "case": 5, "gap": 3})]));

 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5}),
                    [term("BE", {"num": 1, "fin": 2, "tp": 6, "tense": 5}),
                     space(),
                     term("PP")]));

 // Adnominal adjectives (page 271)
 result.push(phrase(term("N", {"num": 1, "gen": 2}),
                     [term("ADJ"),
                      space(),
                      term("N", {"num": 1, "gen": 2})]));

 // Conditionals
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": 5, "tp": 4, "tense": 3}),
                    [literal("if"),
                     space(),
                     term("S", {"num": 1, "stat": 2, "gap": 6, "tp": 4, "tense": 3}),
                     space(),
                     literal("then"),
                     space(),
                     term("S", {"num": 1, "stat": 2, "gap": 7, "tp": 4, "tense": 3})]));
 
 // Sentential Disjunctions
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": 5, "tp": 4, "tense": 3}),
                    [term("S", {"num": 1, "stat": 2, "gap": 6, "tp": 4, "tense": 3}),
                     space(),
                     literal("or"),
                     space(),
                     term("S", {"num": 1, "stat": 2, "gap": 7, "tp": 4, "tense": 3})]));

 // VP Disjunctions
 result.push(phrase(term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5}),
                    [term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5}),
                     space(),
                     literal("or"),
                     space(),
                     term("VP", {"num": 1, "fin": 2, "stat": 4, "gap": 3, "tp": 6, "tense": 5})]));

 // NP Disjunctions
 result.push(phrase(term("NP'", {"num": 3, "gen": 4, "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "gen": 4, "case": 2, "gap": "-"}),
                     space(),
                     literal("or"),
                     space(),
                     term("NP", {"num": 3, "gen": 4, "case": 2, "gap": "-"})], 
                    "(root) => { return node('NP', root.types, root.children, root.loc); }"));

 result.push(phrase(term("NP'", {"num": 3, "gen": "?", "case": 2, "gap": "-"}),
                    [term("NP", {"num": 3, "gen": 4, "case": 2, "gap": "-"}),
                     space(),
                     literal("or"),
                     space(),
                     term("NP", {"num": 3, "gen": 5, "case": 2, "gap": "-"})], 
                    "(root) => { return node('NP', root.types, root.children, root.loc); }"));
 
 // Sentential Conjunctions
 result.push(phrase(term("S", {"num": 1, "stat": 2, "gap": 5, "tp": 4, "tense": 3}),
                    [term("S", {"num": 1, "stat": 2, "gap": "-", "tp": 4, "tense": 3}),
                     space(),
                     literal("and"),
                     space(),
                     term("S", {"num": 1, "stat": 2, "gap": "-", "tp": 4, "tense": 3})]));

 // V Conjunctions
 result.push(phrase(term("V", {"num": 1, "fin": 2, "stat": 4, "trans": 3, "tp": 6, "tense": 5}),
                    [term("V", {"num": 1, "fin": 2, "stat": 7, "trans": 3, "tp": 6, "tense": 5}),
                     space(),
                     literal("and"),
                     space(),
                     term("V", {"num": 1, "fin": 2, "stat": 8, "trans": 3, "tp": 6, "tense": 5})]));
 
 // Non-pronomial possessive phrases
 result.push(phrase(term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"}),
                    [term("DET", {"num": "sing", "rn": "+"}), 
                     space(),
                     term("RN", {"num": 1, "gen": 2})]));

 result.push(phrase(term("DET", {"num": "sing", "rn": "+"}),
                    [term("PN", {"num": 1, "gen": 2}), 
                     literal("'s")]));

 // Noun Prepositional Phrases
 result.push(phrase(term("N", {"num": 1, "gen": 2}),
                    [term("N", {"num": 1, "gen": 2}), 
                     space(),
                     term("PP")]));

 result.push(phrase(term("PP"),
                    [term("PREP"),
                     space(),
                     term("NP", {"num": 1, "gen": 2, "case": 3, "gap": "-"})]));

 // 17a
 result.push(phrase(term("VP", {"num": 1, "fin": "+", "stat": "+", "gap": 3, "tp": 4, "tense": 5}),
                    [term("HAVE", {"num": 1, "fin": "+", "tp": 4, "tense": 5}),
                     space(),
                     term("VP", {"num": 1, "fin": "part", "stat": 6, "gap": 3, "tp": 4, "tense": 5})]));

 // 17b
 result.push(phrase(term("VP", {"num": 1, "fin": "+", "stat": "+", "gap": 3, "tp": 4, "tense": 5}),
                    [term("HAVE", {"num": 1, "fin": "+", "tp": 4, "tense": 5}),
                     space(),
                     literal("not"),
                     space(),
                     term("VP", {"num": 1, "fin": "part", "stat": 6, "gap": 3, "tp": 4, "tense": 5})]));

 // LI 1
 result.push(rule(term("DET", {"num": ["sing"]}),
                  [[literal("a")], [literal("an")], [literal("every")], [literal("the")], [literal("some")]]));
 
 // LI 2
 result.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "+nom", "refl": "-"}),
                  [[literal("he")]]));
 
 // LI 3
 result.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom", "refl": "-"}),
                  [[literal("him")]]));
 
 // LI 4
 result.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "+nom", "refl": "-"}),
                  [[literal("she")]]));
 
 // LI 5
 result.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom", "refl": "-"}),
                  [[literal("her")]]));
 
 // LI 6
 result.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": ["-nom", "+nom"], "refl": "-"}),
                  [[literal("it")]]));
  
 // LI 7
 result.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "+nom", "refl": "-"}),
                  [[literal("they")]]));
 
 // LI 8
 result.push(rule(term("PRO", {"num": "plur", "gen": ["male", "fem", "-hum"], "case": "-nom", "refl": "-"}),
                  [[literal("them")]]));
 
 // LI 9
 result.push(rule(term("PN", {"num": "sing", "gen": "male"}),
                  [[literal("Jones")], [literal("John")], [literal("Mel")], [literal("Leo")], [literal("Yuji")], [literal("Smith")], [literal("Socrates")], [literal("Sam")]]));
 
 // LI 10
 result.push(rule(term("PN", {"num": "sing", "gen": "fem"}),
                  [[literal("Mary")], [literal("Dani")], [literal("Anna")]]));
 
 // LI 11
 result.push(rule(term("PN", {"num": "sing", "gen": "-hum"}),
                  [[literal("Brazil")], [literal("Italy")], [literal("Ulysses")]]));
 
 // LI 12
 result.push(rule(term("N", {"num": "sing", "gen": "male"}),
                  [[literal("stockbroker")], [literal("man")], [literal("engineer")], [literal("brazilian")]]));
 
 // LI 13
 result.push(rule(term("N", {"num": "sing", "gen": "fem"}),
                  [[literal("stockbroker")], [literal("woman")], [literal("widow")], [literal("engineer")], [literal("brazilian")]]));
 
 // LI 14
 result.push(rule(term("N", {"num": "sing", "gen": "-hum"}),
                  [[literal("book")], [literal("donkey")], [literal("horse")], [literal("porsche")]]));
 
 // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
 // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
 // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
 
 // LI 15
 result.push(rule(term("AUX", {"num": "sing", "fin": "+", "tp": "-past", "tense": "pres"}),
                   [[literal("does")]]));
 
 // LI 16
 result.push(rule(term("AUX", {"num": "plur", "fin": "+", "tp": "-past", "tense": "pres"}),
                   [[literal("do")]]));

 // LI 30
 result.push(rule(term("AUX", {"num": 1, "fin": "+", "tp": "-past", "tense": "past"}),
                   [[literal("did")]]));

 // LI 31
 result.push(rule(term("AUX", {"num": 1, "fin": "+", "tp": "+past", "tense": "past"}),
                   [[literal("did")]]));
 
 // Stative berbs in their inifinitive form.
 
 result.push(rule(term("V", {"trans": "+", "stat": "+"}),
                  [[literal("like")],
                   [literal("love")],
                   [literal("admire")],
                   [literal("know")],
                   [literal("own")],
                   [literal("fascinate")],
                   [literal("rotate")],
                   [literal("surprise")],
                   ]));

 result.push(rule(term("V", {"trans": "-", "stat": "+"}),
                  [[literal("love")],
                   [literal("stink")],
                   [literal("adore")]]));

 // Non-stative berbs in their inifinitive form.
 
 result.push(rule(term("V", {"trans": "+", "stat": "-"}),
                  [[literal("leave")],
                   [literal("reach")],
                   [literal("kiss")],
                   [literal("hit")],
                   [literal("scold")],
                   [literal("beat")],
                   ]));

 result.push(rule(term("V", {"trans": "-", "stat": "-"}),
                  [[literal("leave")],
                   [literal("arrive")],
                   [literal("walk")],
                   [literal("sleep")],
                   [literal("come")],
                   [literal("shine")],
                   ]));

 // LI 17
 // LI 18
 result.push(rule(term("V", {"num": 1, "fin": "-", "stat": 3, "trans": 2, "tp": 4, "tense": "pres"}),
                  [[term("V", {"trans": 2, "stat": 3})]],
                  "(root) => {  return node(root['@type'], root.types, [root.children[0].children[0]], root.loc); }"));
 
 // LI 19
 // Manually expanding into the present / third person.
 // > Plural nouns are, of course, usually formed by tacking an s onto the singular form
 // > of the noun, with the familiar regular exceptions (oxen, feet, etc.) and with the proviso that
 // > when a noun ends on an -s, -x, -sh, -ch or -z, in which case the suffix is not -s but -es.
 // It seems like the same applies to verbs:
 // https://parentingpatch.com/third-person-singular-simple-present-verbs/
 // LI 49
 result.push(rule(term("V", {"num": "sing", "fin": "+", "stat": 2, "trans": 1, "tp": "-past", "tense": "pres"}),
                  [[term("V", {"num": "sing", "fin": "-", "stat": 2, "trans": 1, "tp": "-past", "tense": "pres"}), literal("s")]],
                  "(root) => { return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); }"));
 
 // LI 20
 // Manually expanding into the present / plural.
 // > Except for the verb be, plural verb forms we want here - i.e. the third person plural of the
 // > present tense - are identical with the infinitival forms, which we already have (They were needed
 // > for negation). 
 
 // LI 50
 result.push(rule(term("V", {"num": "plur", "fin": "+", "stat": 2, "trans": 1, "tp": "-past", "tense": "pres"}),
                  [[term("V", {"num": "sing", "fin": "-", "stat": 2, "trans": 1, "tp": "-past", "tense": "pres"})]],
                  "(root) => { return node(root['@type'], root.types, root.children[0].children, root.loc); }"));
 // Past tense
 // LI 51
 //result.push(rule(term("V", {"num": 1, "fin": "+", "stat": 2, "trans": 3, "tp": "-past", "tense": "pres"}),
 //                 [[term("V", {"num": 1, "fin": "-", "stat": 2, "trans": 3, "tp": "+past", "tense": "pres"}), literal("ed")]],
 //                 undefined, 
 //                 undefined,
 //                 (name, types) => { 
 //                  return "([inf, s], loc) => { inf.children[0] += s; return inf; }";
 //                 }
 //                 ));

 // LI 52
 result.push(rule(term("V", {"num": 1, "fin": "+", "stat": 2, "trans": 3, "tp": "+past", "tense": "past"}),
                  [[term("V", {"num": 1, "fin": "-", "stat": 2, "trans": 3, "tp": "+past", "tense": "pres"}), literal("ed")]],
                  "(root) => { return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); }"));

 // LI 54
 result.push(rule(term("V", {"num": 1, "fin": "part", "stat": 2, "trans": 3, "tp": 4, "tense": 5}),
                  [[term("V", {"num": 1, "fin": "-", "stat": 2, "trans": 3, "tp": "+past", "tense": "pres"}), literal("ed")]],
                  "(root) => { return node(root['@type'], root.types, [root.children[0].children[0] + root.children[1]], root.loc); }"));

 
 // LI 21
 // TODO(goto): here is a first example of syntax that is determined by
 // the gender of the sentence.
 // "gen": ["male", "fem"]
 result.push(rule(term("RPRO", {"num": ["sing", "plur"]}),
                  [[literal("who")]]));
 // LI 22
 // "gen": "-hum"
 result.push(rule(term("RPRO", {"num": ["sing", "plur"]}),
                   [[literal("which")]]));
 
 // LI 23
 result.push(rule(term("PRO", {"num": "sing", "gen": "male", "case": "-nom", "refl": "+"}),
                  [[literal("himself")]]));

 // LI 24
 result.push(rule(term("PRO", {"num": "sing", "gen": "fem", "case": "-nom", "refl": "+"}),
                  [[literal("herself")]]));

 // LI 25
 result.push(rule(term("PRO", {"num": "sing", "gen": "-hum", "case": "-nom", "refl": "+"}),
                  [[literal("itself")]]));

 // GAP
 result.push(rule(term("GAP"),
                  [["null"]]));

 // ADJ
 result.push(rule(term("ADJ"),
                  [[literal("happy")], [literal("unhappy")], [literal("handsome")], [literal("beautiful")], [literal("fast")], [literal("slow")], [literal("mortal")], [literal("brazilian")]]));

 // BE
 result.push(rule(term("BE", {"num": "sing", "fin": "+", "tp": "-past", "tense": "pres"}),
                  [[literal("is")]]));

 result.push(rule(term("BE", {"num": "plur", "fin": "+", "tp": "-past", "tense": "pres"}),
                  [[literal("are")]]));

 result.push(rule(term("BE", {"num": "sing", "fin": "+", "tp": "-past", "tense": "past"}),
                  [[literal("was")]]));

 result.push(rule(term("BE", {"num": "plur", "fin": "+", "tp": "-past", "tense": "past"}),
                  [[literal("were")]]));

 // Relative Nouns
 result.push(rule(term("RN", {"num": "sing", "gen": "male"}),
                  [[literal("husband")], 
                   [literal("father")], 
                   [literal("brother")],
                   ]));

 result.push(rule(term("RN", {"num": "sing", "gen": "fem"}),
                  [[literal("wife")], 
                   [literal("mother")], 
                   [literal("sister")]]));

 result.push(rule(term("RN", {"num": "sing", "gen": ["male", "fem"]}),
                  [[literal("parent")], 
                   [literal("child")], 
                   [literal("sibling")]]));

 // to, of, about, at, before, after, by, behind, during, for,
 // from, in, over, under and with.
 // ADJ
 result.push(rule(term("PREP"),
                  [
                   // location
                   [literal("behind")],
                   [literal("in")],
                   [literal("over")],
                   [literal("under")],
                   [literal("near")],
                   // time
                   [literal("before")], 
                   [literal("after")], 
                   [literal("during")],
                   // general
                   [literal("from")],
                   [literal("to")], 
                   [literal("of")], 
                   [literal("about")], 
                   [literal("by")],
                   [literal("for")],
                   [literal("with")],
                   ]));

 // Extensible proper names.
 result.push(phrase(term("PN", {"num": "sing", "gen": "?"}),
                    [term("FULLNAME")]));

 // Variables
 result.push(phrase(term("PN", {"num": "sing", "gen": "?"}),
                    [term("VAR")]));

 // LI 33
 result.push(rule(term("AUX", {"num": 1, "fin": "+", "tp": "-past", "tense": "fut"}),
                   [[literal("will")]]));

 // LI 44
 result.push(rule(term("HAVE", {"num": "sing", "fin": "+", "tp": "-past", "tense": "pres"}),
                   [[literal("has")]]));
 
 // LI 45
 result.push(rule(term("HAVE", {"num": "plur", "fin": "+", "tp": "-past", "tense": "pres"}),
                   [[literal("have")]]));
 // LI 46
 result.push(rule(term("HAVE", {"num": 1, "fin": "+", "tp": "-past", "tense": "past"}),
                   [[literal("had")]]));

 // LI 47
 result.push(rule(term("HAVE", {"num": 1, "fin": "+", "tp": "+past", "tense": ["pres", "past"]}),
                   [[literal("had")]]));
 
 return result;
}

function node(type, ...children) {
 return {"@type": type, "children": children} 
}

function clean(node) {
 if (Array.isArray(node)) {
  for (let entry of node) {
   if (entry) {
    clean(entry);
   }
  }
 } else if (typeof node == "object") {
  delete node.types;
  delete node.loc;
  clean(node.children);
 }
 return node;
}

function first(results, types = false) {
 let root = clone(results[0]).children[0];
 return types ? root : clean(root);
}

module.exports = {
 space: space,
 rule: rule,
 term: term,
 rule: rule,
 phrase: phrase,
 literal: literal,
 clone: clone,
 parse: parse,
 grammar: grammar,
 first: first,
 clean: clean,
 nodes: {
  S: (...children) => node("S", ...children),
  NP: (...children) => node("NP", ...children),
  NP_: (...children) => node("NP'", ...children),
  PN: (...children) => node("PN", ...children),
  VP_: (...children) => node("VP'", ...children),
  VP: (...children) => node("VP", ...children),
  V: (...children) => node("V", ...children),
  BE: (...children) => node("BE", ...children),
  HAVE: (...children) => node("HAVE", ...children),
  DET: (...children) => node("DET", ...children),
  N: (...children) => node("N", ...children),
  RN: (...children) => node("RN", ...children),
  PRO: (...children) => node("PRO", ...children),
  AUX: (...children) => node("AUX", ...children),
  RC: (...children) => node("RC", ...children),
  RPRO: (...children) => node("RPRO", ...children),
  GAP: (...children) => node("GAP", ...children),
  ADJ: (...children) => node("ADJ", ...children),
  PP: (...children) => node("PP", ...children),
  PREP: (...children) => node("PREP", ...children),
  Discourse: (...children) => node("Discourse", ...children),
  Sentence: (...children) => node("Sentence", ...children),
 }
};
