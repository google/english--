const dict = [  
  // Singular Nouns
  ["man", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["woman", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["girl", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["book", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["telescope", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["donkey", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["horse", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["cat", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["porsche", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["dish", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["witch", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["judge", "word", [{"@type": "N", types: {"num": "sing", "gen": 1}}]],
  ["engineer", "word", [{"@type": "N", types: {"num": "sing", "gen": ["male", "fem"]}}]],
  ["reservation", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["brazilian", "word", [{"@type": "N","types": {"num": "sing"}}]],

  // Plural Nouns
  ["brazilians", "word", [{"@type": "N", "types": {"num": "plur"}}]],      
  ["men", "word", [{"@type": "N", types: {"num": "plur", "gen": "male"}}]],
  ["women", "word", [{"@type": "N", types: {"num": "plur", "gen": "fem"}}]],
  ["porsches", "word", [{"@type": "N", types: {"num": "plur", "gen": "-hum"}}]],
  
  // RNs  
  ["brother", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["father", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["husband", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["sister", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["mother", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["wife", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],

  // Adjectives
  ["brazilian", "word", [{"@type": "ADJ"}]],
  ["happy", "word", [{"@type": "ADJ"}]],
  ["unhappy", "word", [{"@type": "ADJ"}]],
  ["foolish", "word", [{"@type": "ADJ"}]],  
  ["fast", "word", [{"@type": "ADJ"}]],    
  ["beautiful", "word", [{"@type": "ADJ"}]],
  ["mortal", "word", [{"@type": "ADJ"}]],
  ["married", "word", [{"@type": "ADJ"}]],
  
  // Verb Morphology

  // First Person Present
  ["admires", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["likes", "word", [{"@type": "V", types: { 
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["loves", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": 1, "stat": "-", "tense": "pres"}}]],
  ["fascinates", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["owns", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["skis", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "-", "stat": "-", "tense": "pres"}}]],
  ["walks", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "-", "stat": "-", "tense": "pres"}}]],
  ["surprises", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["stinks", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "-", "stat": "-", "tense": "pres"}}]],
  ["watches", "word", [{"@type": "V", types: {
    "num": "sing", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"}}]],

  // Third Person Present
  ["ski", "word", [{"@type": "V", types: {
    "num": "plur", "fin": "+", "trans": "-", "stat": "-", "tense": "pres"}}]],
  
  // Past participle
  ["owned", "word", [{"@type": "V", types: {
    "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": ["pres", "past"], "tp": "-past"}}]],

  // Simple past
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
      "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": ["pres", "past"], "tp": "-past"
    }
  }]],
  
  ["kissed", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": "+", "stat": "-", "tense": "past", "tp": "-past"
    }
  }]],

  ["walked", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "part", "trans": "-", "stat": "-", "tense": ["pres", "past"], "tp": "-past"
    }
  }]],
  
  ["walked", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "past", "tp": "-past"
    }
  }]],
  
  // Third person present and inifinitives
  ["like", "word", [{
    "@type": "V",
    "types": { 
      "num": 1, "fin": "-", "trans": "+", "stat": "-", "tense": "pres"
    }
  }]],

  ["like", "word", [{
    "@type": "V",
    "types": {
      "num": "plur", "fin": "+", "trans": "+", "stat": "-", "tense": "pres"
    }
  }]],
  
  // TODO(goto): if you invert the order here tests break. Figure out why.
  ["love", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "-", "trans": ["+", "-"], "stat": "-", "tense": "pres"
    }
  }]],

  ["love", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": ["+", "-"], "stat": "-", "tense": "pres"
    }
  }]],

  ["loved", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "part", "trans": "+", "stat": "-", "tense": "pres", "tp": "-past"
    }
  }]],
  
  ["walk", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "-", "trans": "-", "stat": "-", "tense": "pres"
    }
  }]],

  ["walk", "word", [{
    "@type": "V",
    "types": {
      "num": 1, "fin": "+", "trans": "-", "stat": "-", "tense": "pres"
    }
  }]],

  
  // Infinitives
  ["admire", "word", [{"@type": "V", types: {
    "num": 1, "fin": "-", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["fascinate", "word", [{"@type": "V", types: {
    "num": 1, "fin": "-", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["own", "word", [{"@type": "V", types: {
    "num": 1, "fin": "-", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["kiss", "word", [{"@type": "V", types: {
    "num": 1, "fin": "-", "trans": "+", "stat": "-", "tense": "pres"}}]],
  ["stink", "word", [{"@type": "V", types: {
    "num": 1, "fin": "-", "trans": "-", "stat": "-", "tense": "pres"}}]],
];

module.exports = {
  dict: dict
};
