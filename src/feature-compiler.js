/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function tokenize(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (source.startsWith("->", i)) {
      tokens.push({"type": "ARROW"});
      i += 2;
      continue;
    }

    if (char == "[") {
      tokens.push({"type": "LBRACK"});
      i++;
      continue;
    }

    if (char == "]") {
      tokens.push({"type": "RBRACK"});
      i++;
      continue;
    }

    if (char == ",") {
      tokens.push({"type": "COMMA"});
      i++;
      continue;
    }

    if (char == "=") {
      tokens.push({"type": "EQUAL"});
      i++;
      continue;
    }

    if (char == "%") {
      tokens.push({"type": "PERCENT"});
      i++;
      continue;
    }

    if (char == ".") {
      tokens.push({"type": "DOT"});
      i++;
      continue;
    }

    if (char == "\"") {
      let value = "";
      i++;
      while (i < source.length) {
        const next = source[i];
        if (next == "\\") {
          i++;
          if (i >= source.length) {
            throw new Error("Unterminated string escape");
          }
          value += source[i];
          i++;
          continue;
        }
        if (next == "\"") {
          i++;
          break;
        }
        value += next;
        i++;
      }
      tokens.push({"type": "STRING", "value": value});
      continue;
    }

    if (/[0-9]/.test(char)) {
      let value = "";
      while (i < source.length && /[0-9]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({"type": "INT", "value": parseInt(value, 10)});
      continue;
    }

    if (/[A-Za-z_+\-]/.test(char)) {
      let value = "";
      while (i < source.length && /[A-Za-z0-9_+\-]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({"type": "WORD", "value": value});
      continue;
    }

    throw new Error(`Unexpected grammar character: ${char}`);
  }

  return tokens;
}

class Stream {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  peek(type) {
    const token = this.tokens[this.index];
    if (!type) {
      return token;
    }
    return token && token.type == type ? token : undefined;
  }

  take(type) {
    const token = this.peek(type);
    if (!token) {
      const next = this.tokens[this.index];
      throw new Error(`Expected ${type}, got ${next ? next.type : "EOF"}`);
    }
    this.index++;
    return token;
  }

  done() {
    return this.index >= this.tokens.length;
  }
}

function parseFeatureSource(source) {
  const stream = new Stream(tokenize(source));
  const rules = [];

  while (!stream.done()) {
    rules.push(parseRule(stream));
    stream.take("DOT");
  }

  return rules;
}

function parseRule(stream) {
  const head = parseName(stream);
  stream.take("ARROW");

  const tail = [];
  while (!stream.peek("DOT")) {
    tail.push(parseTerm(stream));
  }

  return {
    "head": head,
    "tail": tail,
  };
}

function parseTerm(stream) {
  if (stream.peek("PERCENT")) {
    stream.take("PERCENT");
    return {
      "kind": "token",
      "name": stream.take("WORD").value,
    };
  }

  if (stream.peek("STRING")) {
    return {
      "kind": "literal",
      "value": stream.take("STRING").value,
    };
  }

  return parseName(stream);
}

function parseName(stream) {
  const name = stream.take("WORD").value;
  return {
    "kind": "name",
    "name": name,
    "types": stream.peek("LBRACK") ? parseFeatures(stream) : {},
  };
}

function parseFeatures(stream) {
  const result = {};
  stream.take("LBRACK");

  while (!stream.peek("RBRACK")) {
    const [key, value] = parseFeature(stream);
    result[key] = value;

    if (!stream.peek("COMMA")) {
      break;
    }
    stream.take("COMMA");
  }

  stream.take("RBRACK");
  return result;
}

function parseFeature(stream) {
  const key = stream.take("WORD").value;
  stream.take("EQUAL");
  return [key, parseValue(stream)];
}

function parseValue(stream) {
  if (stream.peek("INT")) {
    return stream.take("INT").value;
  }

  if (stream.peek("LBRACK")) {
    return parseArray(stream);
  }

  return stream.take("WORD").value;
}

function parseArray(stream) {
  const result = [];
  stream.take("LBRACK");

  while (!stream.peek("RBRACK")) {
    result.push(parseValue(stream));
    if (!stream.peek("COMMA")) {
      break;
    }
    stream.take("COMMA");
  }

  stream.take("RBRACK");
  return result;
}

function termName(term) {
  if (term.kind == "token") {
    return `%${term.name}`;
  }

  if (term.kind == "literal") {
    return JSON.stringify(term.value);
  }

  return term.name;
}

function condition(term) {
  if (term.kind == "name") {
    return {
      "@type": term.name,
      "types": term.types,
    };
  }

  return {
    "@type": termName(term),
    "types": {},
  };
}

function symbol(term) {
  if (term.kind == "name") {
    if (term.name == "null") {
      return undefined;
    }
    return term.name;
  }

  if (term.kind == "token") {
    return {"type": term.name};
  }

  return {"literal": term.value};
}

function compileRule({head, tail}) {
  const terms = tail.map((term) => {
    return {
      "symbol": symbol(term),
      "condition": condition(term),
    };
  });
  const conditions = terms.map(({condition}) => condition);
  const symbols = terms.map(({symbol}) => symbol).filter(Boolean);
  const symbolConditions = terms
        .filter(({symbol}) => symbol !== undefined)
        .map(({condition}) => condition);
  const meta = {
    "type": head.name,
    "types": head.types,
    "conditions": conditions,
    "symbolConditions": symbolConditions,
  };

  return {
    "name": head.name,
    "symbols": symbols,
    "meta": meta,
  };
}

function compileFeatureGrammar(source, {Lexer, ParserStart, extraRules = []} = {}) {
  return {
    "Lexer": Lexer,
    "ParserStart": ParserStart,
    "ParserRules": extraRules.concat(parseFeatureSource(source).map(compileRule)),
  };
}

module.exports = {
  compileFeatureGrammar: compileFeatureGrammar,
  parseFeatureSource: parseFeatureSource,
};
