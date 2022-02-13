const {verbs, nouns, adjs} = require("./wordlist.js");
const {N, V, ADJ} = require("./dict.js");

const dict = [  
  // Singular Nouns
  N("porsche", "sing", "-hum"),
  N("brazilian", "sing", 1),

  // Plural Nouns
  N("brazilians", "plur", 1, "brazilian"),
  N("porsches", "plur", "-hum", "porsche"),

  // Adjectives
  ADJ("brazilian"),
  
  // Verbs
];

for (let {inf, trans, pp} of verbs) {
  dict.push(...V(inf, trans, pp));
}

for (let {name, num, gen, prop} of nouns) {
  dict.push(N(name, num, gen, prop));
}

for (let {name} of adjs) {
  dict.push(ADJ(name));
}

module.exports = {
  dict: dict,
};
