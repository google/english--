class Lexer {
  constructor(tokens) {
    this.buffer = "";
    this.tokens = [];
    this.load(tokens);
  }

  load(tokens) {
    // console.log(tokens);
    this.tokens = this.tokens.concat(tokens);
    this.tokens.sort(([a], [b]) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      }
      return 0;
    });
    // console.log(this.tokens);
    const j = 6659;
    for (let i = 0; i < 20; i++) {
      if (this.tokens.length > j) {
        console.log(`${j + i - 10} = ${this.tokens[j + i - 10]}`);
      }
    }
  }
    
  next() {
    // console.log("next");
    let p = 0;
    let q = this.tokens.length - 1;
    while (p <= q) {
      let m = p + Math.floor((q - p) / 2);
      let [word, value] = this.tokens[m];
      let result = this.match(word);
      console.log(`p=${p} q=${q} m=${m} ${this.buffer} and ${word}? ${result}`);
      if (result == -1) {
        p = m + 1;
      } else if (result == 1) {
        q = m - 1;
      } else {
        console.log(`found a match: [${word}]!`);
        let result = this.tokens[m];
        let n = m + 1;
        while (n < this.tokens.length) {
          let [next] = this.tokens[n];
          // console.log(`next? ${next}, prefix? ${next.startsWith(word)}, match? ${this.match(next)}`);
          if (!next.startsWith(word)) {
            // console.log("hi");
            break;
          }
          if (this.match(next) == 0) {
            result = this.tokens[n];
            // console.log(result);
          }

          if (next.length > this.buffer.length &&
              next.substring(0, this.buffer.length) == this.buffer) {
            console.log("hello");
            //console.log(next);
            return undefined;
          }
          
          n++;
        }

        // let result = this.tokens[n - 1];
        // value = this.tokens[n][1];
        this.eat(result[0]);
        // console.log(`eat: ${result[0]}`);
        return {
          "type": result[1],
          "value": result[0],
          "tokens": result[2] || []
        };
      }
    }
    //console.log(`eat: oops, need more food! ${p} ${q}`);
    //console.log(this.tokens[p]);
    //console.log(this.tokens[q]);
    return undefined;
  }
  match(word) {
    let head = this.buffer.substring(0, word.length);
    if (word < head) {
      return -1;
    } else if (word > head) {
      return 1;
    }
    return 0;
  }
  eat(word) {
    if (!this.buffer.startsWith(word)) {
      throw new Error("can't eat " + word);
    }
    this.buffer = this.buffer.substring(word.length);
    return true;
  }
  save() {
    // console.log("saving: " + this.buffer);
    // return {buffer: this.buffer, "foo": "bar"};
  }
  reset(chunk, info) {
    // console.log("reset: " + chunk + ", info: " + info);
    this.buffer += chunk;
  }
  formatError(token) {
    // console.log("formatError");
    // console.log(token);
    // throw new Error("Unexpected method call: " + token);
    return token;
  }
  has(name) {
    for (let [key, type, types] of this.tokens) {
      //for (let {type} of types) {
      if (name == type) {
        return true;
      }
      //}
    }

    throw new Error("Symbol not available in the lexicon: " + name);
    // return false;
  }
}


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
    for (let char of str) {
      ref[char] = ref[char] || {};
      ref = ref[char];
    }
        
    ref.done = ref.done || [];
    //if (value) {
    //  ref.done.push(value);
    //}
    ref.done = value;
    
    if (ref.type) {
      throw new Error(`Registering [${str}] which has already been registered under ${ref.type} [${type}]`);
    }
    
    ref.type = type;
    this.types[type] = true;
  }
  longest(str) {
    let ref = this.head;
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      if (!ref[char]) {
        // Found a character that isn't available as
        // a continuation. If this is currently a
        // terminal node, return the substring.
        // Otherwise, this string isn't in the dictionary.
        return ref.done ? str.substring(0, i) : false;
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
    if (!next) {
      return undefined;
    }
    return this.eat(next);
  }
  eat(str) {
    this.buffer = this.buffer.substring(str.length);
    return this.get(str);
  }
  get(str) {
    let ref = this.head;
    for (let char of str) {
      ref = ref[char];
    }
    // return ref.done;
    return {
      type: ref.type,
      value: str,
      tokens: ref.done,
    }
  }
}

module.exports = {
  Lexer: Lexer,
  Tokenizer: Tokenizer,
};
