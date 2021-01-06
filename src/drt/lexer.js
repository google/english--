
class Tokenizer {
  constructor(tokens = []) {
    this.head = {};
    this.types = {};
    this.buffer = "";
    this.loc = 0;

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

    {
      // numbers.
      let match = this.buffer.match(/^([0-9]+)/);
      if (match) {
        let [full, number] = match;
        this.eat(number);
        return {
          "@type": "%UNSIGNED_INT",
          "type": "UNSIGNED_INT",
          "value": number,
          "loc": this.loc - number.length,
          "tokens": []};        
      }
    }

    let next = this.longest(this.buffer);

    // proper names form.
    let match = this.buffer.match(/^([A-Z][A-Za-z\-]+)/);
    // proper names can't collide with reserved dictionary words.
    let proper = match && match[1] != next;

    let pn = (name, loc) => {
      return {
        "@type": "%word",
        "type": "word",
        "value": name,
        "loc": loc - name.length,
        "tokens": [{
          "@type": "PN",
          "types": {"gen": "?", "num": "?"},
          "loc": loc - name.length,
        }]
      }
    };

    // If the proper name is the longest string
    // use it.
    if (match && !next) {
      let [full, name] = match;
      this.eat(name);
      return pn(name, this.loc);
    } else if (match && next) {
      let [full, name] = match;
      if (name.length > next.length) {
        this.eat(name);
        return pn(name, this.loc);
      } else if (name.length == next.length) {
        this.eat(next);
        let token = this.get(next);
        token.tokens.push(pn(name, this.loc).tokens[0]);
        return token;
      }
    }
    
    if (next) {
      this.eat(next);
      return this.get(next);
    }
    
    return undefined;
  }
  eat(str) {
    this.buffer = this.buffer.substring(str.length);
    this.loc += str.length;
    //console.log(`eating ${str}`);
    return this;
  }
  get(str) {
    let ref = this.head;
    for (let char of str) {
      ref = ref[char.toLowerCase()];
    }
    return {
      "@type": "%" + ref.type,
      "type": ref.type,
      "value": str,
      "tokens": ref.done,
      "loc": this.loc - str.length,
    }
  }
}

module.exports = {
  Tokenizer: Tokenizer,
};
