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

function namespace(type, bindings, conditions) {
  let signature = `${type}${JSON.stringify(bindings)} -> `;
  for (let child of conditions) {
    signature += `${child["@type"] || JSON.stringify(child)}${JSON.stringify(child.types || {})} `;
  }

  let hash = (str) => {
    return str.split("")
      .reduce((prevHash, currVal) =>
              (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
  };

  return hash(signature);
}

function match(type, types = {}, conditions = [], data, location, reject,
               partial = false) {
  let bindings = JSON.parse(JSON.stringify(types));
  let result = JSON.parse(JSON.stringify(data || []));
  let expects = conditions.filter((x) => x["@type"] != "null");

  if (!partial && expects.length != data.length) {
    throw new Error("Unexpected data length");
  }

  let variables = {};

  let intersection = (a, b) => a.filter(value => b.includes(value));

  for (let i = 0; i < result.length; i++) {
    let expected = expects[i];
    let child = result[i];
    if (expected["@type"] != child["@type"]) {
      return reject;
    }
    for (let [key, value] of Object.entries(expected.types || {})) {
      if (typeof value == "number") {
        if (variables[value]) {
          if (Array.isArray(variables[value])) {
            if (Array.isArray(child.types[key])) {
              if (intersection(child.types[key], variables[value]).length == 0) {
                return reject;
              }
            } else if (!variables[value].includes(child.types[key])) {
              return reject;
            }
          } else if (typeof variables[value] == "number") {
            variables[value] = child.types[key];
          } else if (Array.isArray(child.types[key])) {
            if (!child.types[key].includes(variables[value])) {
              return reject;
            }
            continue;
          } else if (typeof child.types[key] == "number") {
            variables[child.types[key]] = variables[value];
            continue;
          } else if (variables[value] != child.types[key]) {
            return reject;
          }
        }
        variables[value] = child.types[key];
      } else if (typeof child.types[key] == "number") {
        child.types[key] = value;
      } else if (Array.isArray(child.types[key])) {
        if (!child.types[key].includes(expected.types[key])) {
          return reject;
        }
        child.types[key] = expected.types[key];
      } else if (typeof child.types[key] == "string" &&
                 expected.types[key] != child.types[key]) {
        if (Array.isArray(expected.types[key]) &&
            expected.types[key].includes(child.types[key])) {
          continue;
        }
        return reject;
      } else if (!child.types[key]) {
        return reject;
      }
    }
  }

  const scope = namespace(type, bindings, conditions);
  for (let [key, value] of Object.entries(bindings)) {
    if (typeof value == "number") {
      if (!variables[value]) {
        bindings[key] = scope + value;
      } else {
        bindings[key] = variables[value];
      }
    }
  }

  return {
    "@type": type,
    "types": bindings,
    "children": result.filter(
      (child) => (child["@type"] != "_" && child["@type"] != "__")),
  };
}

function bind(type, types = {}, conditions = []) {
  let matcher = (data, location, reject) => {
    return match(type, types, conditions, data, location, reject);
  };

  matcher.meta = {
    type: type,
    types: types,
    conditions: conditions
  };

  return matcher;
}

function ruleMeta(rule) {
  if (rule.action && rule.action.meta) {
    return rule.action.meta;
  }

  if (rule.postprocess && rule.postprocess.meta) {
    return rule.postprocess.meta;
  }

  return undefined;
}

function clone(node) {
  return JSON.parse(JSON.stringify(node));
}

function evaluateAction(action, values, location, reject) {
  switch (action.kind) {
    case "bind":
      return match(action.type, action.types, action.conditions, values,
                   location, reject);
    case "lexicon":
      for (let token of values) {
        for (let candidate of token.tokens || []) {
          let result = match(action.type,
                             action.types,
                             [{
                               "@type": action.type,
                               "types": action.types
                             }],
                             [candidate],
                             location,
                             reject);
          if (result == reject) {
            continue;
          }

          let node = clone(result.children[0]);
          node.children = [{"value": token.value}];
          return node;
        }
      }
      return reject;
    case "node":
      return {
        "@type": action.type,
        "types": action.types || {},
      };
    case "take":
      return values[action.index];
    case "list_one":
      return [values[action.index]];
    case "list_cons":
      return [values[action.head]].concat(values[action.tail]);
    default:
      throw new Error(`Unknown action kind: ${action.kind}`);
  }
}

module.exports = {
  namespace: namespace,
  match: match,
  bind: bind,
  ruleMeta: ruleMeta,
  evaluateAction: evaluateAction,
};
