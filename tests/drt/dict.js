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
  N("president", "sing", ["male", "fem"]),
  N("cancelation", "sing", "-hum"),
  N("person", "sing", ["male", "fem"]),
  N("relative", "sing", ["male", "fem"]),
  N("country", "sing", "-hum"),
  N("someone", "sing", ["male", "fem"]),

  // Plural Nouns
  N("brazilians", "plur", 1, "brazilian"),
  N("porsches", "plur", "-hum", "porsche"),
  N("men", "plur", "male", "man"),
  N("women", "plur", "fem", "woman"),
  N("countries", "plur", "-hum", "country"),
  N("birds", "plur", "-hum", "bird"),
  N("people", "plur", ["male", "fem"], "person"),
  
  // RNs  
  N("brother", "sing", "male"),
  N("father", "sing", "male"),
  N("husband", "sing", "male"),
  N("sister", "sing", "fem"),
  N("mother", "sing", "fem"),
  N("wife", "sing", "fem"),
  N("uncle", "sing", "male"),
  N("aunt", "sing", "fem"),
  N("sibling", "sing", ["male", "fem"]),
  N("parent", "sing", ["male", "fem"]),

  // Adjectives
  ADJ("brazilian"),
  ADJ("happy"),
  ADJ("unhappy"),
  ADJ("foolish"),  
  ADJ("fast"),    
  ADJ("beautiful"),
  ADJ("mortal"),
  ADJ("married"),
  ADJ("rich"),
  ADJ("male"),
  
  // Verbs
  ...V("live", "-"),
  ...V("admire", "+"),
  ...V("fascinate", "+"),
  ...V("surprise", "+"),
  ...V("consider", "+"),
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
  ...V("border", "+"),
  ...V("fly", "-"),
];

module.exports = {
  dict: dict
};
