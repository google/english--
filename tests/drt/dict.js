const dict = [  
  // nouns
  ["man", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["woman", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["men", "word", [{"@type": "N", types: {"num": "plur", "gen": "male"}}]],
  ["women", "word", [{"@type": "N", types: {"num": "plur", "gen": "fem"}}]],
  ["girl", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["book", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["telescope", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["donkey", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["horse", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["cat", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["porsche", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["porsches", "word", [{"@type": "N", types: {"num": "plur", "gen": "-hum"}}]],
  ["dish", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["witch", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],
  ["judge", "word", [{"@type": "N", types: {"num": "sing", "gen": 1}}]],
  ["engineer", "word", [{"@type": "N", types: {"num": "sing", "gen": ["male", "fem"]}}]],
  ["reservation", "word", [{"@type": "N", types: {"num": "sing", "gen": "-hum"}}]],

  // RNs  
  ["brother", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["father", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["husband", "word", [{"@type": "N", types: {"num": "sing", "gen": "male"}}]],
  ["sister", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["mother", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],
  ["wife", "word", [{"@type": "N", types: {"num": "sing", "gen": "fem"}}]],

  // verbs
  //["beat", "word", [{"@type": "VERB", types: {
  //  "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["listen", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["own", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["walk", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["sleep", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["stink", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["leave", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s"}}]],
  ["left", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "-reg", "past": "-reg"}}]],
  ["come", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s"}}]],
  ["came", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "past": "-reg"}}]],
  ["give", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s"}}]],
  ["gave", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "past": "-reg"}}]],
  ["travelled", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "past": "-reg"}}]],

  ["make", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "s"}}]],
  ["made", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "past": "-reg"}}]],
  
  ["kiss", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["box", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["watch", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],
  ["crash", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+es", "past": "+ed"}}]],

  ["like", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["seize", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["tie", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  //["free", "word", [{"@type": "VERB", types: {
  //  "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["love", "word", [{"@type": "VERB", types: {
    "trans": 1, "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["surprise", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["fascinate", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  ["admire", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+d"}}]],
  
  ["ski", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["echo", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  
  ["play", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["decay", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  ["enjoy", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+s", "past": "+ed"}}]],
  
  ["cr", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["appl", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["cop", "word", [{"@type": "VERB", types: {
    "trans": "+", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["repl", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  ["tr", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+ies", "past": "+ied"}}]],
  
  ["compel", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+led"}}]],
  ["defer", "word", [{"@type": "VERB", types: {
    "trans": "-", "stat": "-", "pres": "+s", "past": "+red"}}]],    
  
  // Adjectives
  ["happy", "word", [{"@type": "ADJ"}]],
  ["unhappy", "word", [{"@type": "ADJ"}]],
  ["foolish", "word", [{"@type": "ADJ"}]],  
  ["fast", "word", [{"@type": "ADJ"}]],    
  ["beautiful", "word", [{"@type": "ADJ"}]],
  ["mortal", "word", [{"@type": "ADJ"}]],
  ["married", "word", [{"@type": "ADJ"}]],

  // Some words can take multiple roles
  ["brazilian", "word", [{
    "@type": "ADJ"
  }, {
    "@type": "N",
    "types": {"num": "sing"}
  }]],      

  ["brazilians", "word", [{
    "@type": "N",
    "types": {"num": "plur"}
  }]],      
];

module.exports = {
  dict: dict
};
