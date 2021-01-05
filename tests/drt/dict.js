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
    // "num": "plur",
    "fin": "+",
    "stat": "-",
    "tense": "pres"
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

  
  // Past participle
  ["owned", "word", [{"@type": "V", types: {
    "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": ["pres", "past"], "tp": "-past"}}]],
  ["loved", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": "pres", "tp": "-past"
    }
  }]],
  
  ["walked", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "part", "trans": "-", "stat": "-", "tense": ["pres", "past"], "tp": "-past"
    }
  }]],
  
  ["kissed", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": ["pres", "past"], "tp": "-past"
    }
  }]],
  
  // Past
  ["made", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "+", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["came", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": 2, "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["travelled", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["gave", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "+", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["played", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["skied", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["liked", "word", [{"@type": "V", types: {
    "num": 1, "fin": "+", "trans": "+", "stat": "-", "tense": "past", "tp": "-past"}}]],
  ["kissed", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": "+", "stat": "-", "tense": "past", "tp": "-past"
    }
  }]],  
  ["walked", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "past", "tp": "-past"
    }
  }]],
];

module.exports = {
  dict: dict
};
