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

const {verbs, nouns, adjs} = require("./wordlist.js");
const {N, V, ADJ} = require("./dict.js");

const dict = [  
  // Singular Nouns
  N("porsche", "sing", "-hum"),
  N("brazilian", "sing", 1),

  // Plural Nouns
  N("brazilians", "plur", 1, "brazilian"),
  N("porsches", "plur", "-hum", "porsche"),

  // Adjectives
  ADJ("brazilian"),
  
  // Verbs
];

for (let {inf, trans, pp} of verbs) {
  dict.push(...V(inf, trans, pp));
}

for (let {name, num, gen, prop} of nouns) {
  dict.push(N(name, num, gen, prop));
}

for (let {name} of adjs) {
  dict.push(ADJ(name));
}

module.exports = {
  dict: dict,
};
