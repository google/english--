/**
 * Copyright 2023 Google LLC
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

const {Parser: LogicParser} = require("logic/src/parser.js");

const SPECIAL_FORMS = new Set(["for", "if", "not", "either", "?", "!"]);
const COMPARISONS = new Set(["<", ">", "<=", ">="]);
const PREPOSITIONS = new Set([
  "about",
  "as",
  "at",
  "behind",
  "by",
  "for",
  "from",
  "in",
  "near",
  "of",
  "on",
  "to",
  "with",
]);

class UnionFind {
  constructor(parent) {
    this.parent = new Map(parent || []);
  }

  find(value) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value);
      return value;
    }
    const parent = this.parent.get(value);
    if (parent == value) {
      return value;
    }
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(left, right) {
    const l = this.find(left);
    const r = this.find(right);
    if (l != r) {
      this.parent.set(r, l);
    }
  }

  clone() {
    return new UnionFind(this.parent);
  }
}

class Scope {
  constructor(lexicon, union, names, facts) {
    this.lexicon = lexicon;
    this.union = union || new UnionFind();
    this.names = new Map(names || []);
    this.facts = new Map();
    for (const [name, values] of facts || []) {
      this.facts.set(name, new Set(values));
    }
  }

  clone() {
    return new Scope(this.lexicon, this.union.clone(), this.names, this.facts);
  }

  canonical(value) {
    return this.union.find(value);
  }

  addAtoms(atoms) {
    for (const atom of atoms) {
      if (atom.name == "=") {
        this.union.union(atom.args[0], atom.args[1]);
      }
    }

    for (const atom of atoms) {
      if (atom.name == "=") {
        continue;
      }
      const args = atom.args.map((arg) => this.canonical(arg));
      if (args.length == 1 && isProperName(atom.name)) {
        this.names.set(args[0], displayProperName(atom.name));
        continue;
      }
      if (args.length == 1) {
        addToMapSet(this.facts, args[0], atom.name);
      }
    }
    return this;
  }

  withAtoms(atoms) {
    return this.clone().addAtoms(atoms);
  }

  nameFor(value) {
    return this.names.get(this.canonical(value));
  }

  factsFor(value) {
    return this.facts.get(this.canonical(value)) || new Set();
  }
}

class LogicRenderer {
  constructor(dict) {
    this.lexicon = buildLexicon(dict || []);
  }

  render(logicText) {
    const parser = new LogicParser();
    const results = parser.parse(logicText);
    if (results.length != 1) {
      throw new Error("Ambiguous logic input: " + logicText);
    }
    return this.renderStatements(results[0], new Scope(this.lexicon)).join("\n");
  }

  renderStatements(statements, parentScope) {
    const atoms = collectAtoms(statements);
    const scope = parentScope.withAtoms(atoms);
    const tenses = this.collectTenses(atoms, scope);
    const rendered = [];
    const consumed = new Set();

    for (const statement of statements) {
      const special = asSpecial(statement);
      if (!special) {
        continue;
      }
      if (special[0] == "for") {
        rendered.push(...this.renderFor(special, scope));
      } else if (special[0] == "if") {
        const result = this.renderConditional(special, scope);
        if (result) {
          rendered.push(result.text);
          for (const arg of result.consumed) {
            consumed.add(scope.canonical(arg));
          }
        }
      } else if (special[0] == "either") {
        const result = this.renderEither(special, scope);
        if (result) {
          rendered.push(result.text);
          for (const arg of result.consumed) {
            consumed.add(scope.canonical(arg));
          }
        }
      } else if (special[0] == "not") {
        const result = this.renderNegation(special, scope, tenses);
        if (result) {
          rendered.push(result.text);
          for (const arg of result.consumed) {
            consumed.add(scope.canonical(arg));
          }
        }
      }
    }

    for (const atom of atoms) {
      const result = this.renderAtom(atom, scope, {
        consumed,
        negative: false,
        tenses,
      });
      if (result) {
        rendered.push(result.text);
        for (const arg of result.consumed) {
          consumed.add(scope.canonical(arg));
        }
      }
    }

    for (const result of this.renderUnaryFacts(atoms, scope, consumed)) {
      if (result) {
        rendered.push(result.text);
        for (const arg of result.consumed) {
          consumed.add(scope.canonical(arg));
        }
      }
    }

    return rendered;
  }

  renderFor(form, parentScope) {
    const [, ref, vars, head, body] = form;
    const refName = ref[0];
    const quantifier = ref[1] || "every";
    const headAtoms = collectAtoms(head);
    const bodyAtoms = collectAtoms(body);
    const headScope = parentScope.withAtoms(headAtoms);
    const scope = headScope.withAtoms(bodyAtoms);
    const tenses = this.collectTenses([...headAtoms, ...bodyAtoms], scope);
    const subject = this.describeQuantifiedNP(refName, quantifier, headScope);
    const overrides = new Map([[scope.canonical(refName), subject]]);
    for (const variable of vars || []) {
      overrides.set(scope.canonical(variable), this.describeQuantifiedNP(variable, quantifier, headScope));
    }

    const rendered = [];
    const consumed = new Set();
    for (const statement of body) {
      const special = asSpecial(statement);
      if (special && special[0] == "for") {
        rendered.push(...this.renderFor(special, scope));
      }
      if (special && special[0] == "not") {
        const result = this.renderNegation(special, scope, tenses, overrides);
        if (result) {
          rendered.push(result.text);
          for (const arg of result.consumed) {
            consumed.add(scope.canonical(arg));
          }
        }
      }
    }

    for (const atom of bodyAtoms) {
      const result = this.renderAtom(atom, scope, {
        consumed,
        negative: false,
        overrides,
        tenses,
      });
      if (result) {
        rendered.push(result.text);
        for (const arg of result.consumed) {
          consumed.add(scope.canonical(arg));
        }
      }
    }

    for (const result of this.renderUnaryFacts(bodyAtoms, scope, consumed, overrides)) {
      if (result) {
        rendered.push(result.text);
        for (const arg of result.consumed) {
          consumed.add(scope.canonical(arg));
        }
      }
    }

    return rendered;
  }

  renderConditional(form, parentScope) {
    const [, , , head, body] = form;
    const headAtoms = collectAtoms(head);
    const bodyAtoms = collectAtoms(body);
    const antecedentScope = parentScope.withAtoms(headAtoms);
    const consequentScope = parentScope.withAtoms([...headAtoms, ...bodyAtoms]);
    const antecedent = this.renderClause(head, antecedentScope);
    const consequent = this.renderClause(body, consequentScope);
    if (!antecedent || !consequent) {
      return undefined;
    }
    return {
      text: sentence(`if ${antecedent} then ${consequent}`),
      consumed: [...headAtoms, ...bodyAtoms].flatMap((atom) => atom.args),
    };
  }

  renderEither(form, parentScope) {
    const [, , left, right] = form;
    const leftAtoms = collectAtoms(left);
    const rightAtoms = collectAtoms(right);
    const leftText = this.renderClause(left, parentScope.withAtoms(leftAtoms));
    const rightText = this.renderClause(right, parentScope.withAtoms(rightAtoms));
    if (!leftText || !rightText) {
      return undefined;
    }
    return {
      text: sentence(`either ${leftText} or ${rightText}`),
      consumed: [...leftAtoms, ...rightAtoms].flatMap((atom) => atom.args),
    };
  }

  renderNegation(form, parentScope, tenses, overrides) {
    const [, expression] = form;
    const atoms = collectAtoms(expression);
    const scope = parentScope.withAtoms(atoms);
    const localTenses = new Map(tenses || []);
    for (const [key, value] of this.collectTenses(atoms, scope)) {
      localTenses.set(key, value);
    }
    const consumed = new Set();
    for (const atom of atoms) {
      const result = this.renderAtom(atom, scope, {
        consumed,
        negative: true,
        overrides,
        tenses: localTenses,
      });
      if (result) {
        return result;
      }
    }
    const [result] = this.renderUnaryFacts(atoms, scope, consumed, overrides, true);
    if (result) {
      return result;
    }
    return undefined;
  }

  renderAtom(atom, scope, options) {
    if (atom.name == "=" || COMPARISONS.has(atom.name) || isProperName(atom.name) || atom.args.length < 2) {
      return undefined;
    }
    const args = atom.args.map((arg) => scope.canonical(arg));
    const eventArgs = isEventVariable(args[0]) ? args.slice(1) : args;
    if (eventArgs.length == 0) {
      return undefined;
    }

    if (isEventVariable(args[0])) {
      const subject = this.describeNP(eventArgs[0], scope, options);
      const object = eventArgs[1] ? this.describeNP(eventArgs[1], scope, options) : undefined;
      const future = options?.tenses?.get(args[0]) == "future";
      const text = options.negative
        ? [subject.text, future ? "will not" : "does not", atom.name, object && object.text].filter(Boolean).join(" ")
        : [subject.text, future ? "will" : this.verbForm(atom.name, subject), future ? atom.name : undefined, object && object.text].filter(Boolean).join(" ");
      return {
        text: sentence(text),
        consumed: eventArgs,
      };
    }

    const relation = this.renderRelation(atom.name, eventArgs, scope, options);
    if (!relation) {
      return undefined;
    }
    return relation;
  }

  collectTenses(atoms, scope) {
    const tenses = new Map();
    for (const atom of atoms) {
      if (!COMPARISONS.has(atom.name) || atom.args.length != 2) {
        continue;
      }
      const left = scope.canonical(atom.args[0]);
      const right = scope.canonical(atom.args[1]);
      if (atom.name == ">" && right == "__now__") {
        tenses.set(left, "future");
      }
    }
    return tenses;
  }

  renderClause(statements, scope) {
    const rendered = this.renderStatements(statements, scope)
      .map((text) => text.endsWith(".") ? text.slice(0, -1) : text)
      .filter(Boolean);
    if (rendered.length == 0) {
      return undefined;
    }
    return rendered.join(" and ");
  }

  renderRelation(name, args, scope, options) {
    const subject = this.describeNP(args[0], scope, options);
    const object = args[1] ? this.describeNP(args[1], scope, options) : undefined;
    const negative = options.negative ? "not " : "";

    if (object && PREPOSITIONS.has(name)) {
      return {
        text: sentence(`${subject.text} is ${negative}${name} ${object.text}`),
        consumed: args,
      };
    }

    const parts = name.split("-");
    const preposition = parts[parts.length - 1];
    if (object && PREPOSITIONS.has(preposition)) {
      const base = parts.slice(0, -1).join("-");
      const phrase = displayPredicate(base);
      const verb = this.lexicon.adjectives.has(base) ? "is" : "is";
      const article = this.lexicon.nouns.has(base) ? `${articleFor(phrase)} ` : "";
      const determiner = preposition == "of" && this.lexicon.nouns.has(base) ? "the " : article;
      return {
        text: sentence(`${subject.text} ${verb} ${negative}${determiner}${phrase} ${preposition} ${object.text}`),
        consumed: args,
      };
    }

    if (object) {
      return {
        text: sentence(`${subject.text} is ${negative}${displayPredicate(name)} ${object.text}`),
        consumed: args,
      };
    }

    return undefined;
  }

  renderUnaryFacts(atoms, scope, consumed, overrides, negative) {
    const groups = new Map();
    for (const atom of atoms) {
      if (!isUnaryFact(atom)) {
        continue;
      }
      addToMapSet(groups, scope.canonical(atom.args[0]), atom.name);
    }

    const rendered = [];
    for (const [variable, facts] of groups) {
      const result = this.renderFactSet(variable, [...facts], scope, consumed, overrides, negative);
      if (result) {
        rendered.push(result);
      }
    }
    return rendered;
  }

  renderFactSet(variable, facts, scope, consumed, overrides, negative) {
    const canonical = scope.canonical(variable);
    if (consumed && consumed.has(canonical) && !overrides?.has(canonical)) {
      return undefined;
    }

    const override = overrides?.get(canonical);
    const name = scope.nameFor(canonical);
    const noun = chooseNoun(facts, this.lexicon);
    const adjectives = adjectivesFor(facts, noun, this.lexicon);
    const subject = override || (name ? {text: name, proper: true} : this.describeExistentialSubject(noun));
    const complement = this.describeComplement(noun, adjectives, Boolean(override || name));
    if (!subject || !complement) {
      return undefined;
    }

    const negation = negative ? "not " : "";
    return {
      text: sentence(`${subject.text} is ${negation}${complement}`),
      consumed: [canonical],
    };
  }

  describeQuantifiedNP(variable, quantifier, scope) {
    const facts = [...scope.factsFor(variable)];
    const noun = chooseNoun(facts, this.lexicon) || "thing";
    const adjectives = facts
      .filter((fact) => fact != noun && this.lexicon.adjectives.has(fact))
      .map(displayPredicate);
    const relative = adjectives.length
      ? ` who is ${adjectives.join(" and ")}`
      : "";
    return {
      text: `${quantifierWord(quantifier)} ${displayPredicate(noun)}${relative}`,
      quantified: true,
    };
  }

  describeNP(variable, scope, options) {
    const canonical = scope.canonical(variable);
    const override = options?.overrides?.get(canonical);
    if (override) {
      return override;
    }

    const name = scope.nameFor(canonical);
    if (name) {
      return {text: name, proper: true};
    }

    const facts = [...scope.factsFor(canonical)];
    const noun = chooseNoun(facts, this.lexicon);
    const adjectives = facts
      .filter((fact) => fact != noun && this.lexicon.adjectives.has(fact))
      .map(displayPredicate);
    if (noun) {
      const words = [...adjectives, displayPredicate(noun)].join(" ");
      return {text: `${articleFor(words)} ${words}`};
    }
    if (adjectives.length) {
      return {text: `something ${adjectives.map((adj) => `that is ${adj}`).join(" and ")}`};
    }
    return {text: displayConstant(canonical)};
  }

  describeExistentialSubject(noun) {
    if (!noun) {
      return undefined;
    }
    const phrase = displayPredicate(noun);
    return {text: `${articleFor(phrase)} ${phrase}`};
  }

  describeComplement(noun, adjectives, namedSubject) {
    if (noun) {
      if (!namedSubject) {
        return adjectives.length ? adjectives.join(" and ") : undefined;
      }
      const phrase = [...adjectives, displayPredicate(noun)].join(" ");
      return `${articleFor(phrase)} ${phrase}`;
    }
    return adjectives.length ? adjectives.join(" and ") : undefined;
  }

  verbForm(name, subject) {
    if (subject.quantified && subject.text.startsWith("all ")) {
      return this.lexicon.verbs.get(name)?.plural || name;
    }
    return this.lexicon.verbs.get(name)?.singular || presentSingular(name);
  }
}

function buildLexicon(dict) {
  const nouns = new Map();
  const adjectives = new Map();
  const verbs = new Map();
  for (const [surface, , entries] of dict) {
    for (const entry of entries || []) {
      const prop = entry.prop || surface;
      if (entry["@type"] == "N") {
        if (entry.types?.num == "sing" && !nouns.has(prop)) {
          nouns.set(prop, surface);
        }
      } else if (entry["@type"] == "ADJ") {
        adjectives.set(prop, surface);
      } else if (entry["@type"] == "V" && entry.types?.fin == "+" && entry.types?.tense == "pres") {
        const forms = verbs.get(prop) || {};
        if (entry.types?.num == "sing") {
          forms.singular = surface;
        } else if (entry.types?.num == "plur") {
          forms.plural = surface;
        }
        verbs.set(prop, forms);
      }
    }
  }
  return {nouns, adjectives, verbs};
}

function collectAtoms(statements) {
  const atoms = [];
  collect(statements, atoms);
  return atoms;
}

function collect(node, atoms) {
  const atom = asAtom(node);
  if (atom) {
    atoms.push(atom);
    return;
  }
  const special = asSpecial(node);
  if (special) {
    return;
  }
  if (!Array.isArray(node)) {
    return;
  }
  for (const child of node) {
    collect(child, atoms);
  }
}

function asAtom(node) {
  if (!Array.isArray(node) || node.length != 2) {
    return undefined;
  }
  const [name, args] = node;
  if (typeof name != "string" || !Array.isArray(args) || SPECIAL_FORMS.has(name)) {
    return undefined;
  }
  return {name, args};
}

function asSpecial(node) {
  if (!Array.isArray(node) || typeof node[0] != "string" || !SPECIAL_FORMS.has(node[0])) {
    return undefined;
  }
  return node;
}

function addToMapSet(map, key, value) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key).add(value);
}

function chooseNoun(facts, lexicon) {
  const nouns = facts.filter((fact) => lexicon.nouns.has(fact));
  return nouns.find((noun) => !lexicon.adjectives.has(noun)) || nouns[0];
}

function adjectivesFor(facts, noun, lexicon) {
  const adjectives = new Set();
  for (const fact of facts) {
    if (fact != noun && lexicon.adjectives.has(fact)) {
      adjectives.add(fact);
    }
    if (!noun || !fact.endsWith("-" + noun)) {
      continue;
    }
    for (const part of fact.slice(0, -noun.length - 1).split("-")) {
      if (lexicon.adjectives.has(part)) {
        adjectives.add(part);
      }
    }
  }
  return [...adjectives].map(displayPredicate);
}

function isUnaryFact(atom) {
  return atom.name != "="
    && !COMPARISONS.has(atom.name)
    && !isProperName(atom.name)
    && atom.args.length == 1;
}

function isProperName(name) {
  return /^[A-Z]/.test(name);
}

function isEventVariable(name) {
  return /^s\d+$/.test(name);
}

function displayProperName(name) {
  return name.split("-").join(" ");
}

function displayPredicate(name) {
  return name.split("-").join(" ");
}

function displayConstant(name) {
  if (/^'.*'$/.test(name)) {
    return name.slice(1, -1);
  }
  return displayPredicate(name);
}

function articleFor(phrase) {
  return /^[aeiou]/i.test(phrase) ? "an" : "a";
}

function presentSingular(verb) {
  if (/[^aeiou]y$/.test(verb)) {
    return verb.slice(0, -1) + "ies";
  }
  if (/(s|x|z|ch|sh|o)$/.test(verb)) {
    return verb + "es";
  }
  return verb + "s";
}

function quantifierWord(quantifier) {
  return quantifier == "all" ? "all" : quantifier;
}

function sentence(text) {
  return text.slice(0, 1).toUpperCase() + text.slice(1) + ".";
}

module.exports = {
  LogicRenderer,
};
