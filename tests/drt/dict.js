const {ADJ, N, V} = require("../../src/drt/dict.js");

const dict = [  
  // Singular Nouns
  N("porsche", "sing", "-hum"),
  N("brazilian", "sing", 1),
  N("man", "sing", "male"),
  N("woman", "sing", "fem"),
  N("girl", "sing", "fem"),
  N("book", "sing", "-hum"),
  N("telescope", "sing", "-hum"),
  N("donkey", "sing", "-hum"),
  N("horse", "sing", "-hum"),
  N("cat", "sing", "-hum"),
  N("dish", "sing", "-hum"),
  N("witch", "sing", "-hum"),
  N("judge", "sing", 1),
  N("engineer", "sing", ["male", "fem"]),
  N("reservation", "sing", "-hum"),

  // Plural Nouns
  N("brazilians", "plur", 1),
  N("porsches", "plur", "-hum"),
  N("men", "plur", "male"),
  N("women", "plur", "fem"),
  
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
  
  // Verbs
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
  ...V("cry", "-"),
  ...V("copy", ["+", "-"]),
  ...V("thrive", "-"),
  ...V("make", "+"),
  ...V("give", "+"),
  ...V("play", ["+", "-"]),
  ...V("come", ["+", "-"]),
  ...V("travel", "-"),
  ...V("marry", ["+", "-"]),
];

module.exports = {
  dict: dict
};
