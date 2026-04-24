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

const Assert = require("assert");
const {Console} = require("../src/console.js");
const {Parser} = require("../src/parser.js");
const {LogicRenderer} = require("../src/renderer.js");
const {dict} = require("./dict.js");

describe("LogicRenderer", () => {
  it("renders named unary facts", () => {
    assertRenders("Sam is happy.", "Sam is happy.");
  });

  it("groups unary facts for named referents", () => {
    assertRenders("Jones is a man. He is happy.", "Jones is a happy man.");
  });

  it("groups unary facts for existential referents", () => {
    assertRenders("A man is happy.", "A man is happy.");
  });

  it("renders event predicates", () => {
    assertRenders("Jones loves Mary.", "Jones loves Mary.");
  });

  it("renders noun relations", () => {
    assertRenders("Brasilia is the capital of Brazil.", "Brasilia is the capital of Brazil.");
  });

  it("renders prepositional relations", () => {
    assertRenders("Jones is from Brazil.", "Jones is from Brazil.");
  });

  it("renders simple universal rules", () => {
    assertRenders(
      "Every person who is brazilian is happy about Brazil.",
      [
        "Every person who is brazilian is happy about Brazil.",
        "Every person who is brazilian is happy.",
      ].join("\n")
    );
  });

  it("uses existential body facts as noun phrases", () => {
    assertRenders("Every man owns a book.", "Every man owns a book.");
  });

  it("renders negated transitive events", () => {
    assertRenders("Jones does not own a porsche.", "Jones does not own a porsche.");
  });

  it("renders negated intransitive events", () => {
    assertRenders("A porsche does not stink.", "A porsche does not stink.");
  });

  it("renders future tense events", () => {
    assertRenders("Smith will kiss Mary.", "Smith will kiss Mary.");
  });

  it("renders negated future tense events", () => {
    assertRenders("Smith will not kiss Mary.", "Smith will not kiss Mary.");
  });
});

function assertRenders(english, expected) {
  const logic = new Console(dict).transpile(english);
  const actual = new LogicRenderer(dict).render(logic);
  Assert.equal(actual, expected);
  assertParses(actual);
}

function assertParses(english) {
  const parser = new Parser("Discourse", dict);
  const results = parser.feed(english);
  Assert.equal(results.length, 1);
}
