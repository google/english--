const N = (str, num, gen) => [str, "word", [{"@type": "N", "types": {"num": num, "gen": gen}}]];
const ADJ = (str, types = {}) => [str, "word", [{"@type": "ADJ", types: types}]];
const INF = (str, trans) => [str, "word", [{
  "@type": "V",
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "-",
    "stat": "-",
    "tense": "pres"
  }}]];

const PRES = (str, num, trans) => [str, "word", [{
  "@type": "V",
  "types": {
    "num": num,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "pres"
  }}]];

const PAST = (str, trans) => [str, "word", [{
  "@type": "V",
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "past",
    "tp": "-past"
  }}]];

const PART = (str, trans) => [str, "word", [{
  "@type": "V",
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "part",
    "stat": "-",
    "tense": ["pres", "past"],
    "tp": "-past"
  }}]];

const V = (str, trans) => [
  // Infinitive
  INF(str, trans),
  // Plural Present Tense
  PRES(str, "plur", trans),
  // Singular Present Tense
  PRES(str + (str.endsWith("ch") ? "es" : "s"), "sing", trans),
  // Past
  PAST(str + (str.endsWith("e") ? "d" : "ed"), trans),
  // Past Participle
  PART(str + (str.endsWith("e") ? "d" : "ed"), trans),
];

const dict = [  
  // Singular Nouns
  N("man", "sing", "male"),
  N("woman", "sing", "fem"),
  N("girl", "sing", "fem"),
  N("book", "sing", "-hum"),
  N("telescope", "sing", "-hum"),
  N("donkey", "sing", "-hum"),
  N("horse", "sing", "-hum"),
  N("cat", "sing", "-hum"),
  N("porsche", "sing", "-hum"),
  N("dish", "sing", "-hum"),
  N("witch", "sing", "-hum"),
  N("judge", "sing", 1),
  N("engineer", "sing", ["male", "fem"]),
  N("reservation", "sing", "-hum"),
  N("brazilian", "sing", 1),

  // Plural Nouns
  N("brazilians", "plur", 1),
  N("men", "plur", "male"),
  N("women", "plur", "fem"),
  N("porsches", "plur", "-hum"),
  
  // RNs  
  N("brother", "sing", "male"),
  N("father", "sing", "male"),
  N("husband", "sing", "male"),
  N("sister", "sing", "fem"),
  N("mother", "sing", "fem"),
  N("wife", "sing", "fem"),

  // Adjectives
  ADJ("brazilian"),
  ADJ("happy"),
  ADJ("unhappy"),
  ADJ("foolish"),  
  ADJ("fast"),    
  ADJ("beautiful"),
  ADJ("mortal"),
  ADJ("married"),
  
  // Regular Verbs
  ...V("live", "-"),
  ...V("admire", "+"),
  ...V("fascinate", "+"),
  ...V("surprise", "+"),
  ...V("like", "+"),
  ...V("love", ["+", "-"]),
  ...V("walk", "-"),
  ...V("own", "+"),
  ...V("kiss", "+"),
  ...V("stink", "-"),
  ...V("ski", "-"),
  ...V("watch", "+"),

  // Irregular Verbs
  PAST("made", "+"),
  PAST("came", 2),
  PAST("travelled", "-"),
  PAST("gave", "+"),
  PAST("played", "-"),
];

module.exports = {
  dict: dict
};
