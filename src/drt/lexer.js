
class Tokenizer {
  constructor(tokens = []) {
    this.head = {};
    this.types = {};
    this.buffer = "";

    for (let [value, type, types] of tokens) {
      this.push(value, type, types);
    }
  }
  reset(buffer) {
    this.buffer += buffer;
  }
  save() {
  }
  formatError(token) {
  }
  has(name) {
    return this.types[name] || false;
  }
  push(str, type, value = []) {
    let ref = this.head;
    for (let char of str.toLowerCase()) {
      ref[char] = ref[char] || {};
      ref = ref[char];
    }

    if (ref.type && ref.type != type) {
      // console.log(`Ignoring [${str}] as a token %${type} because if conflicts with a reserved keyword token %${ref.type}`);
      return;
    }
    
    ref.done = ref.done || [];
    ref.done = ref.done.concat(value);
        
    ref.type = type;
    this.types[type] = true;
  }
  longest(str) {
    let ref = this.head;
    let longest;
    for (let i = 0; i < str.length; i++) {
      let char = str[i].toLowerCase();
      // console.log(`char ${char} at #${i}. done? ${ref.done || false}.`);
      if (ref.done) {
        //console.log(this.head["l"]["o"]["v"]["e"]);
        //console.log(`new longest ending in ${char} at #${i}`);
        longest = i;
      }
      if (!ref[char]) {
        // Found a character that isn't available as
        // a continuation. If this is currently a
        // terminal node, return the substring.
        // Otherwise, this string isn't in the dictionary.
        // console.log(`char #${i} of [${str}] ([${str[i]}]), longest = ${longest}`);
        // console.log(longest);
        return longest ? str.substring(0, longest) : false;
      }
      ref = ref[char];
    }
    
    // Matches all characters of the string ...
    
    if (Object.keys(ref).length > 2) {
      // ... but there are longer strings beyond
      // what we have seen so far.
      return undefined;
    }
    
    if (!ref.done) {
      // ... but isn't a terminal node.
      return undefined;
    }
    
    // Terminal node with no further longer strings.
    return str;
  }
  next() {
    let next = this.longest(this.buffer);

    //console.log(`next!`);

    // proper names form.
    let match = this.buffer.match(/^([A-Z][A-Za-z]+)/);
    // proper names can't collide with reserved dictionary words.
    let proper = match && match[1] != next;
    
    if (next && !proper) {
      // If this is a dictionary word and is not a proper name
      this.eat(next);
      return this.get(next);
    }

    if (proper) {
      let [full, name] = match;
      this.eat(name);
      return {type: "name", value: name, tokens: []};
    }
    
    return undefined;
  }
  eat(str) {
    this.buffer = this.buffer.substring(str.length);
    return this;
  }
  get(str) {
    let ref = this.head;
    for (let char of str) {
      ref = ref[char.toLowerCase()];
    }
    return {
      type: ref.type,
      value: str,
      tokens: ref.done,
    }
  }
}

module.exports = {
  Tokenizer: Tokenizer,
};
