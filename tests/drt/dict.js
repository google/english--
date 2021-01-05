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
  
  // Verb Morphology

  // Infinitives
  INF("admire", "+"),
  INF("fascinate", "+"),
  INF("own", "+"),
  INF("kiss", "+"),
  INF("stink", "-"),
  INF("walk", "-"),
  INF("love", ["+", "-"]),
  INF("like", "+"),
  INF("live", "-"),
  
  // Plural Present Tense
  PRES("ski", "plur", "-"),
  PRES("like", "plur", "+"),
  PRES("love", "plur", ["+", "-"]),
  PRES("walk", "plur", "-"),

  // Singular Present
  PRES("admires", "sing", "+"),
  PRES("likes", "sing", "+"),
  PRES("loves", "sing", 1),
  PRES("fascinates", "sing", "+"),
  PRES("owns", "sing", "+"),
  PRES("skis", "sing", "-"),
  PRES("walks", "sing", "-"),
  PRES("surprises", "sing", "+"),
  PRES("stinks", "sing", "-"),
  PRES("watches", "sing", "+"),

  // Past
  PAST("made", "+"),
  PAST("came", 2),
  PAST("travelled", "-"),
  PAST("gave", "+"),
  PAST("played", "-"),
  PAST("skied", "-"),
  PAST("liked", "+"),
  PAST("kissed", "+"),  
  PAST("walked", "-"),

  // Past Participle
  PART("owned", "+"),
  PART("loved", "+"),
  PART("walked", "-"),
  PART("kissed", "+"),
];

module.exports = {
  dict: dict
};
