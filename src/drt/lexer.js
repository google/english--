class Lexer {
  constructor(tokens) {
    this.buffer = "";
    this.tokens = tokens;
    
    this.tokens.sort(([a], [b]) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      }
      return 0;
    });

    this.tokens.map(([key, value]) => {
      value["value"] = key;
    });
  }
    
  next() {
    // console.log(this.tokens);
    //console.log("next");
    //console.log(this.buffer);
    let p = 0;
    let q = this.tokens.length - 1;
    while (p <= q) {
      let m = p + Math.floor((q - p) / 2);
      let [word, value] = this.tokens[m];
      let result = this.match(word);
      // console.log(`p=${p} q=${q} m=${m} ${this.buffer} and ${word}? ${result}`);
      if (result == -1) {
        p = m + 1;
      } else if (result == 1) {
        q = m - 1;
      } else {
        // console.log("found a match!");
        let n = m + 1;
        // console.log(n);
        while (n < this.tokens.length) {
          let [next] = this.tokens[n];
          let buffer = this.buffer;
          if (this.match(next) == 0) {
            word = this.tokens[n][0];
            value = this.tokens[n][1];
            n++;
            continue;
          } else if (next.substring(0, buffer.length) == buffer) {
            return undefined;
          } else {
            break;
          }
        }
        this.eat(word);
        //console.log("eat: ");
        ///console.log(value);
        return value;
      }
    }
    // console.log("eat: oops, need more food!");
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
    // console.log("saving");
    return {};
  }
  reset(chunk, info) {
    // console.log("reset: " + chunk);
    this.buffer += chunk;
  }
  formatError(token) {
    // console.log("formatError");
    // throw new Error("Unexpected method call: " + token);
    return token;
  }
  has(name) {
    for (let [key, {type}] of this.tokens) {
      if (name == type) {
        return true;
      }
    }
      return false;
  }
}

module.exports = {
  Lexer: Lexer
};
