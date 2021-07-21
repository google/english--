
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
      if (ref.done) {
        longest = i;
      }
      if (!ref[char]) {
        // Found a character that isn't available as
        // a continuation. If this is currently a
        // terminal node, return the substring.
        // Otherwise, this string isn't in the dictionary.
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
      let match = this.buffer.match(/^([0-9]+[KMBT]?)/);
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
    let match = this.buffer.match(/^([A-Z][A-Za-z\-]+)(\s[A-Z][A-Za-z\-]+)*/);
    //console.log(this.buffer);
    //console.log(match);
    
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

    // There are four possibilities here:
    //   - a match for an open word and not a proper name
    //   - no match for an open word and a match for a proper name
    //   - no match for both
    //   - a match for both the open word and the proper name
    let [name, first] = match || [];
    if (next && !name) {
      this.eat(next);
      return this.get(next);
    } else if (!next && name) {
      this.eat(name);
      return pn(name, this.loc);
    } else if (!next && !name) {
      return undefined;
    } else {
      // Both are defined.
      const tok = this.get(next);
      //console.log(name);
      //console.log(next);
      if (tok["@type"] != "%word" &&
         first.length <= next.length) {
        this.eat(next);
        return this.get(next);
      } else if (name.length > next.length) {
        // If the proper name is the longest string
        // it trumps the open word.
        this.eat(name);
        return pn(name, this.loc);
      } else if (name == next) {
        // If they are the same, they can be
        // interpreted multiple ways.
        this.eat(name);
        let result = this.get(name);
        result.tokens.push({
          "@type": "PN",
          "types": {"gen": "?", "num": "?"},
          "loc": this.loc - name.length,
        });
        return result;
      }
    } 

    return undefined;
  }
  eat(str) {
    this.buffer = this.buffer.substring(str.length);
    this.loc += str.length;
    //console.log(`eating [${str}]`);
    //console.log(JSON.stringify(this.get(str)));
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
