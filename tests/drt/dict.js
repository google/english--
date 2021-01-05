const N = (str, types = {}) => [str, "word", [{"@type": "N", types: types}]];
const ADJ = (str, types = {}) => [str, "word", [{"@type": "ADJ", types: types}]];
const INF = (str, types = {}) => [str, "word", [{
  "@type": "V",
  "types": Object.assign({
    "num": 1,
    "fin": "-",
    "stat": "-",
    "tense": "pres"
  }, types)}]];

const PRES = (str, types = {}) => [str, "word", [{
  "@type": "V",
  "types": Object.assign({
    "fin": "+",
    "stat": "-",
    "tense": "pres"
  }, types)}]];

const PAST = (str, types = {}) => [str, "word", [{
  "@type": "V",
  "types": Object.assign({
    "num": 1,
    "fin": "+",
    "stat": "-",
    "tense": "past",
    "tp": "-past"
  }, types)}]];

const PART = (str, types = {}) => [str, "word", [{
  "@type": "V",
  "types": Object.assign({
    "num": 1,
    "fin": "part",
    "stat": "-",
    "tense": ["pres", "past"],
    "tp": "-past"
  }, types)}]];

const dict = [  
  // Singular Nouns
  N("man", {"num": "sing", "gen": "male"}),
  N("woman", {"num": "sing", "gen": "fem"}),
  N("girl", {"num": "sing", "gen": "fem"}),
  N("book", {"num": "sing", "gen": "-hum"}),
  N("telescope", {"num": "sing", "gen": "-hum"}),
  N("donkey", {"num": "sing", "gen": "-hum"}),
  N("horse", {"num": "sing", "gen": "-hum"}),
  N("cat", {"num": "sing", "gen": "-hum"}),
  N("porsche", {"num": "sing", "gen": "-hum"}),
  N("dish", {"num": "sing", "gen": "-hum"}),
  N("witch", {"num": "sing", "gen": "-hum"}),
  N("judge", {"num": "sing", "gen": 1}),
  N("engineer", {"num": "sing", "gen": ["male", "fem"]}),
  N("reservation", {"num": "sing", "gen": "-hum"}),
  N("brazilian", {"num": "sing"}),

  // Plural Nouns
  N("brazilians", {"num": "plur"}),
  N("men", {"num": "plur", "gen": "male"}),
  N("women", {"num": "plur", "gen": "fem"}),
  N("porsches", {"num": "plur", "gen": "-hum"}),
  
  // RNs  
  N("brother", {"num": "sing", "gen": "male"}),
  N("father", {"num": "sing", "gen": "male"}),
  N("husband", {"num": "sing", "gen": "male"}),
  N("sister", {"num": "sing", "gen": "fem"}),
  N("mother", {"num": "sing", "gen": "fem"}),
  N("wife", {"num": "sing", "gen": "fem"}),

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
  INF("admire", {"trans": "+"}),
  INF("fascinate", {"trans": "+"}),
  INF("own", {"trans": "+"}),
  INF("kiss", {"trans": "+"}),
  INF("stink", {"trans": "-"}),
  INF("walk", {"trans": "-"}),
  INF("love", {"trans": ["+", "-"]}),
  INF("like", {"trans": "+"}),

  // Plural Present Tense
  PRES("ski", {"num": "plur", "trans": "-"}),
  PRES("like", {"num": "plur", "trans": "+"}),
  PRES("love", {"num": "plur", "trans": ["+", "-"]}),
  PRES("walk", {"num": "plur", "trans": "-"}),

  // Singular Present
  PRES("admires", {"num": "sing", "trans": "+"}),
  PRES("likes", {"num": "sing", "trans": "+"}),
  PRES("loves", {"num": "sing", "trans": 1}),
  PRES("fascinates", {"num": "sing", "trans": "+"}),
  PRES("owns", {"num": "sing", "trans": "+"}),
  PRES("skis", {"num": "sing", "trans": "-"}),
  PRES("walks", {"num": "sing", "trans": "-"}),
  PRES("surprises", {"num": "sing", "trans": "+"}),
  PRES("stinks", {"num": "sing", "trans": "-"}),
  PRES("watches", {"num": "sing", "trans": "+"}),

  // Past
  PAST("made", {"trans": "+"}),
  PAST("came", {"trans": 2}),
  PAST("travelled", {"trans": "-"}),
  PAST("gave", {"trans": "+"}),
  PAST("played", {"trans": "-"}),
  PAST("skied", {"trans": "-"}),
  PAST("liked", {"trans": "+"}),
  PAST("kissed", {"trans": "+"}),  
  PAST("walked", {"trans": "-"}),

  // Past Participle
  PART("owned", {"trans": "+"}),
  PART("loved", {"trans": "+"}),
  PART("walked", {"trans": "-"}),
  PART("kissed", {"trans": "+"}),
];

module.exports = {
  dict: dict
};
