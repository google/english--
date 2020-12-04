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
  }
    
  next() {
    // console.log("next");
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
        // console.log(`found a match: [${word}]!`);
        let result = this.tokens[m];
        let n = m + 1;
        while (n < this.tokens.length) {
          let [next] = this.tokens[n];
          // console.log(`next? ${next}, prefix? ${next.startsWith(word)}, match? ${this.match(next)}`);
          if (!next.startsWith(word)) {
            break;
          }
          if (this.match(next) == 0) {
            result = this.tokens[n];
            // console.log(result);
          }

          if (next.length > this.buffer.length &&
              next.substring(0, this.buffer.length) == this.buffer) {
            //console.log("hello");
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

module.exports = {
  Lexer: Lexer
};
