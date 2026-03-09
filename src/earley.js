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

const REJECT = Symbol("reject");
const {evaluateAction} = require("./unify.js");

class StringLexer {
  constructor() {
    this.buffer = "";
    this.loc = 0;
  }

  reset(chunk) {
    this.buffer += chunk;
  }

  save() {
    return {
      "loc": this.loc,
    };
  }

  formatError(token) {
    return `Unexpected token: ${JSON.stringify(token)}`;
  }

  has() {
    return false;
  }

  next() {
    if (this.buffer.length == 0) {
      return undefined;
    }

    const value = this.buffer[0];
    this.buffer = this.buffer.substring(1);

    const token = {
      "value": value,
      "loc": this.loc,
      "offset": this.loc,
    };

    this.loc += value.length;

    return token;
  }
}

function bestFamily(families) {
  if (!families || families.length == 0) {
    return undefined;
  }

  return families[0];
}

function joinSignature(prefix, suffix) {
  if (!prefix) {
    return suffix;
  }
  if (!suffix) {
    return prefix;
  }
  return `${prefix}\u001f${suffix}`;
}

function tokenSignature(token) {
  const offset = token.loc !== undefined ? token.loc :
        token.offset !== undefined ? token.offset :
        "?";
  const type = token.type || "";
  const value = token.value !== undefined ? `${token.value}` : "";
  return `t:${offset}:${type}:${value}`;
}

function emptyFamily() {
  return {
    "values": [],
    "trace": [],
    "signature": "",
  };
}

function postprocess(rule, values, reference) {
  if (rule.action) {
    return evaluateAction(rule.action, values, reference, REJECT);
  }

  if (!rule.postprocess) {
    return values;
  }

  return rule.postprocess(values, reference, REJECT);
}

function normalizeRule(rule, id) {
  return {
    "id": id,
    "name": rule.name,
    "symbols": rule.symbols || [],
    "action": rule.action,
    "postprocess": rule.postprocess,
    toString() {
      return `${this.id}:${this.name}`;
    },
  };
}

function byName(rules) {
  const result = new Map();

  for (let rule of rules) {
    result.set(rule.name, result.get(rule.name) || []);
    result.get(rule.name).push(rule);
  }

  return result;
}

function terminalValue(symbol, token) {
  if (symbol.literal !== undefined) {
    if (token.value === symbol.literal) {
      return token.type ? token : token.value;
    }
    return false;
  }

  if (symbol instanceof RegExp) {
    if (symbol.test(token.value)) {
      return token.type ? token : token.value;
    }
    return false;
  }

  if (symbol.type) {
    if (token.type === symbol.type) {
      return token;
    }
    return false;
  }

  return false;
}

function tokenLeaf(data) {
  return {
    "data": data,
    "isComplete": true,
  };
}

function childAlternatives(state) {
  return state.families.map((family) => {
    return {
      "value": family.data,
      "trace": family.trace,
      "signature": family.signature,
    };
  });
}

function tokenAlternative(token, value) {
  return [{
    "value": value,
    "trace": [],
    "signature": tokenSignature(token),
  }];
}

function advanceFamilies(parents, children) {
  const result = [];

  for (let parent of parents) {
    for (let child of children) {
      result.push({
        "values": parent.values.concat([child.value]),
        "trace": parent.trace.concat(child.trace),
        "signature": joinSignature(parent.signature, child.signature),
      });
    }
  }

  return result;
}

class Column {
  constructor(index) {
    this.index = index;
    this.states = [];
    this.cache = new Map();
    this.agenda = [];
  }

  key({rule, dot, reference}) {
    return `${rule.id}:${dot}:${reference}`;
  }

  add(state) {
    const key = this.key(state);
    if (this.cache.has(key)) {
      const existing = this.cache.get(key);
      const families = state.pendingFamilies || state.families || [];

      for (let parent of state.wantedBy || []) {
        if (!existing.wantedBy.includes(parent)) {
          existing.wantedBy.push(parent);
        }
      }

      if (this.mergeFamilies(existing, families)) {
        this.agenda.push(existing);
      }

      return existing;
    }

    state.familyCache = new Map();
    state.families = [];
    this.mergeFamilies(state, state.pendingFamilies || state.families || []);
    delete state.pendingFamilies;

    this.cache.set(key, state);
    this.states.push(state);
    this.agenda.push(state);
    return state;
  }

  mergeFamilies(state, families) {
    let changed = false;

    for (let family of families) {
      if (state.familyCache.has(family.signature)) {
        continue;
      }

      state.familyCache.set(family.signature, family);
      state.families.push(family);
      changed = true;
    }

    if (!changed) {
      return false;
    }

    state.bestFamily = bestFamily(state.families);
    state.values = state.bestFamily ? state.bestFamily.values : [];
    state.data = state.isComplete && state.bestFamily ?
      state.bestFamily.data :
      undefined;

    return true;
  }
}

class EarleyParser {
  constructor(compiled, start) {
    this.rules = compiled.ParserRules.map((rule, i) => normalizeRule(rule, i));
    this.start = start || compiled.ParserStart;
    this.lexer = compiled.Lexer || new StringLexer();
    this.table = [new Column(0)];
    this.results = [];
    this.current = 0;
    this.byName = byName(this.rules);
    this.tokens = [];

    this.registerTerminals();
    this.seed();
    this.results = this.finish();
  }

  registerTerminals() {
    if (!this.lexer || !this.lexer.has) {
      return;
    }

    const seen = new Set();

    for (let rule of this.rules) {
      for (let symbol of rule.symbols) {
        if (!symbol || !symbol.type || seen.has(symbol.type)) {
          continue;
        }
        seen.add(symbol.type);
        this.lexer.has(symbol.type);
      }
    }
  }

  seed() {
    const queue = this.byName.get(this.start) || [];
    const column = this.table[0];

    for (let rule of queue) {
      const state = this.state(rule, 0, 0, [], undefined, undefined, [emptyFamily()]);
      if (state) {
        column.add(state);
      }
    }

    this.close(0);
  }

  state(rule, dot, reference, wantedBy, left, right, families = [emptyFamily()]) {
    const complete = dot == rule.symbols.length;
    const state = {
      "rule": rule,
      "dot": dot,
      "reference": reference,
      "wantedBy": wantedBy || [],
      "left": left,
      "right": right,
      "values": [],
      "isComplete": complete,
      "data": undefined,
      "families": [],
      "familyCache": new Map(),
      "bestFamily": undefined,
    };

    let pendingFamilies = families;

    if (complete) {
      pendingFamilies = [];
      for (let family of families) {
        const result = postprocess(rule, family.values, reference);
        if (result === REJECT) {
          continue;
        }

        pendingFamilies.push({
          "values": family.values,
          "data": result,
          "trace": [rule.id].concat(family.trace),
          "signature": `r:${rule.id}(${family.signature})`,
        });
      }

      if (pendingFamilies.length == 0) {
        return undefined;
      }
    }

    state.pendingFamilies = pendingFamilies;
    return state;
  }

  close(index) {
    const column = this.table[index];

    for (let i = 0; i < column.agenda.length; i++) {
      const state = column.agenda[i];

      if (state.isComplete) {
        this.complete(index, state);
        continue;
      }

      const symbol = state.rule.symbols[state.dot];
      if (typeof symbol == "string") {
        this.predict(index, symbol, state);
        this.attach(index, state, symbol);
      }
    }
  }

  attach(index, parent, name) {
    const column = this.table[index];

    for (let child of column.states) {
      if (!child.isComplete) {
        continue;
      }
      if (child.reference != index) {
        continue;
      }
      if (child.rule.name != name) {
        continue;
      }

      const families = advanceFamilies(parent.families, childAlternatives(child));
      if (families.length == 0) {
        continue;
      }

      const state = this.state(
        parent.rule,
        parent.dot + 1,
        parent.reference,
        [...parent.wantedBy],
        parent,
        child,
        families
      );

      if (!state) {
        continue;
      }

      column.add(state);
    }
  }

  predict(index, name, parent) {
    const column = this.table[index];
    const rules = this.byName.get(name) || [];

    for (let rule of rules) {
      const state = this.state(
        rule,
        0,
        index,
        parent ? [parent] : [],
        undefined,
        undefined,
        [emptyFamily()]
      );
      if (!state) {
        continue;
      }
      column.add(state);
    }
  }

  complete(index, completed) {
    const column = this.table[index];
    const origin = this.table[completed.reference];

    for (let parent of origin.states) {
      if (parent.isComplete) {
        continue;
      }

      const symbol = parent.rule.symbols[parent.dot];
      if (symbol !== completed.rule.name) {
        continue;
      }

      const families = advanceFamilies(parent.families, childAlternatives(completed));
      if (families.length == 0) {
        continue;
      }

      const state = this.state(
        parent.rule,
        parent.dot + 1,
        parent.reference,
        [...parent.wantedBy],
        parent,
        completed,
        families
      );

      if (!state) {
        continue;
      }

      column.add(state);
    }
  }

  scan(token) {
    const column = this.table[this.table.length - 1];
    const next = new Column(this.table.length);

    for (let state of column.states) {
      if (state.isComplete) {
        continue;
      }

      const symbol = state.rule.symbols[state.dot];
      if (typeof symbol == "string") {
        continue;
      }

      const value = terminalValue(symbol, token);
      if (value === false) {
        continue;
      }

      const families = advanceFamilies(state.families, tokenAlternative(token, value));
      if (families.length == 0) {
        continue;
      }

      const advanced = this.state(
        state.rule,
        state.dot + 1,
        state.reference,
        [...state.wantedBy],
        state,
        tokenLeaf(value),
        families
      );

      if (!advanced) {
        continue;
      }

      next.add(advanced);
    }

    this.table.push(next);

    if (next.states.length == 0) {
      const offset = token.loc !== undefined ? token.loc :
            token.offset !== undefined ? token.offset :
            this.tokens.length;

      throw {
        "token": token,
        "offset": offset,
      };
    }

    this.tokens.push(token);
    this.close(this.table.length - 1);
  }

  finish() {
    const column = this.table[this.table.length - 1];
    let families = [];

    for (let state of column.states) {
      if (!state.isComplete) {
        continue;
      }
      if (state.reference != 0) {
        continue;
      }
      if (state.rule.name != this.start) {
        continue;
      }

      families.push(...state.families);
    }

    if (families.length == 0) {
      return [];
    }

    return [families[0].data];
  }

  feed(chunk) {
    const info = this.lexer.save ? this.lexer.save() : undefined;
    this.lexer.reset(chunk, info);

    while (true) {
      const token = this.lexer.next();
      if (token === undefined) {
        break;
      }

      this.scan(token);
      this.current = this.table.length - 1;
    }

    this.results = this.finish();

    return this.results;
  }
}

module.exports = {
  "EarleyParser": EarleyParser,
  "REJECT": REJECT,
};
