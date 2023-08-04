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

const {Inflectors} = require("en-inflectors");

const N = (str, num, gen, prop) => [str, "word", [{
  "@type": "N",
  "prop": prop || str,
  "types": {
    "num": num,
    "gen": gen,
  }
}]];

const ADJ = (str, prop) => [str, "word", [{
  "@type": "ADJ",
  "prop": prop || str,
  "types": {
  }
}]];

const INF = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "-",
    "stat": "-",
    "tense": "pres",
  }}]];

const PRES = (str, num, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": num,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "pres"
  }}]];

const PAST = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "+",
    "stat": "-",
    "tense": "past",
    "tp": "-past",
  }}]];

const PART = (str, trans, prop) => [str, "word", [{
  "@type": "V",
  "prop": prop || str,
  "types": {
    "num": 1,
    "trans": trans,
    "fin": "part",
    "stat": "-",
    "tense": ["pres", "past"],
    "tp": "-past"
  }}]];

const V = (str, trans, pp, prop) => [
  // Infinitive
  INF(str, trans),
  // Plural Present Tense
  PRES(new Inflectors(str).toPresent(), "plur", trans, str),
  // Singular Present Tense
  PRES(new Inflectors(str).toPresentS(), "sing", trans, str),
  // Past
  PAST(pp ? pp : new Inflectors(str).toPast(), trans, str),
  // Past Participle
  PART(pp ? pp : new Inflectors(str).toPastParticiple(), trans, str),
];

module.exports = {
  ADJ: ADJ,
  N: N,
  V: V,
};
