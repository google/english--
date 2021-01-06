const {Inflectors} = require("en-inflectors");

const N = (str, num, gen, prop) => [str, "word", [{
  "@type": "N",
  "prop": prop || str,
  "types": {
    "num": num,
    "gen": gen,
  }
}]];

const ADJ = (str, prop) => [str, "word", [{
  "@type": "ADJ",
  "prop": prop || str,
  "types": {
  }
}]];

const INF = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "-",
    "stat": "-",
    "tense": "pres",
  }}]];

const PRES = (str, num, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": num,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "pres"
  }}]];

const PAST = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "past",
    "tp": "-past",
  }}]];

const PART = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "part",
    "stat": "-",
    "tense": ["pres", "past"],
    "tp": "-past"
  }}]];

const V = (str, trans, pp, prop) => [
  // Infinitive
  INF(str, trans),
  // Plural Present Tense
  PRES(new Inflectors(str).toPresent(), "plur", trans, str),
  // Singular Present Tense
  PRES(new Inflectors(str).toPresentS(), "sing", trans, str),
  // Past
  PAST(pp ? pp : new Inflectors(str).toPast(), trans, str),
  // Past Participle
  PART(pp ? pp : new Inflectors(str).toPastParticiple(), trans, str),
];

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

const {verbs, nouns, adjs} = require("../../src/drt/wordlist.js");

for (let {inf, trans, pp} of verbs) {
  dict.push(...V(inf, trans, pp));
}

for (let {name, num, gen} of nouns) {
  dict.push(N(name, num, gen));
}

for (let {name} of adjs) {
  dict.push(ADJ(name));
}

module.exports = {
  ADJ: ADJ,
  N: N,
  V: V,
  dict: dict,
};
