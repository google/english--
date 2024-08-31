/**
 * Copyright 2024 Google LLC
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

describe.only("Earley", function() {
  const token = (t) => ["token", t];
  const term = (t) => ["term", t];
    
  it("Terms", function() {
    // Example from:
    // https://www.youtube.com/watch?v=WNKw1tiskSM

    // term -> number "+" term
    // term -> number
    // number -> [0-9]

    // 1+2+3

    // S0
    // term -> * number "+" term (0)
    // term -> * number (0)
    // number -> * [0-9] (0)

    // S1: "1"
    // number -> [0-9] * (0)
    // term -> number * (0)
    // term -> number * "+" term (0)

    // S2: "+"
    // term -> number "+" * term (0)
    // term -> * number "+" term (2)
    // term -> * number (2)
    // number -> * [0-9] (2)

    // S3: "2"
    // number -> [0-9] * (2)
    // term -> number * (2)
    // term -> number * "+" term (2)
    // term -> number "+" term * (0)

    // S4: "+"
    // term -> number "+" * term (2)
    // term -> * number "+" term (4)
    // term -> * number (4)
    // number -> * [0-9] (4)

    // S5: "3"
    // number -> [0-9] * (4)
    // term -> number * (4)
    // term -> number * "+" term (4)
    // term -> number "+" term * (2)
    // term -> number "+" term * (0)

    // term -> number "+" term
    // term -> number
    // number -> [0-9]

    const rules = [
      ["@", [term("term")]],
      ["term", [term("number"), token("+"), term("term")]],
      ["term", [term("number")]],
      ["number", [token("[0-9]")]],
    ];
    // 1+2+3
    const parser = new Parser(rules);
    assertThat(parser.print()).equalsTo([
      "term -> • number + term (0)",
      "term -> • number (0)",
      "number -> • [0-9] (0)",
    ]);

    assertThat(parser.eat("[0-9]", "1").print()).equalsTo([
      "number -> [0-9] • (0)",
      "term -> number • + term (0)",
      "term -> number • (0)",
    ]);

    assertThat(parser.eat("+", "+").print()).equalsTo([
      "term -> number + • term (0)",
      "term -> • number + term (2)",
      "term -> • number (2)",
      "number -> • [0-9] (2)",
    ]);

    assertThat(parser.eat("[0-9]", "2").print()).equalsTo([
      "number -> [0-9] • (2)",
      "term -> number • + term (2)",
      "term -> number • (2)",
      "term -> number + term • (0)",
    ]);

    const recognizer = new Recognizer(parser);
    assertThat(recognizer.parse()).equalsTo([
      "term",
      ["number", ["[0-9]", "1"]],
      ["+", "+"],
      ["term",
       ["number", ["[0-9]", "2"]]
      ]
    ]);
  });

  function print([index, dot, state], rules) {
    const name = rules[index][0];
    const body = rules[index][1]
	  .map(([type, name], i) => `${i == dot ? "• " : ""}${name}`)
	  .join(" ");
	
    const completed = dot == rules[index][1].length ? " •" : "";
    
    return name + " -> " + body + completed + " (" + state + ")"
  }

  class Recognizer {
    constructor(parser) {
      this.parser = parser;
      this.recognizer = recognizer(parser);
    }
    parse() {
      const {parse, dump, root, table} = this.recognizer;
      const result = parse(root());
      // result.print = () => dump(result);
      return dump(result);
    }
  }
  
  class Parser {
    constructor(rules = []) {
      this.rules = rules;
      this.S = [];
      this.tokens = [];
      this.start();
    }

    start() {
      const nullables = [];

      for (const rule of this.rules) {
	const [head, body] = rule;
	if (body.length == 0) {
	  nullables.push(head);
	}
      }

      this.nullables = new Set();
      
      while (nullables.length > 0) {
	const nullable = nullables.pop();

	this.nullables.add(nullable);
	
	for (const rule of this.rules) {
	  const [head, body] = rule;
	  let nullable = true;
	  for (const [type, name] of body) {
	    if (!this.nullables.has(name)) {
	      // This rule references a non-nullable rule
	      nullable = false;
	      break;
	    }
	  }
	  if (nullable && !this.nullables.has(head)) {
	    nullables.push(head);
	  }
	}
      }

      // Expand the first node.
      const S0 = this.predict([[0, 0, 0]], 0);
      S0.print = this.print.bind(this, S0);
      this.S.push(S0);

      return S0;
    }

    eat(token, value) {
      const set = this.scan(token);

      if (set.length == 0) {
	throw new Error("Unexpected token");
      }

      set.push(...this.predict(set, this.S.length));

      const expand = this.complete(this.S, set);

      set.push(...expand);

      this.tokens.push([token, value]);
      this.S.push(set);

      set.print = this.print.bind(this, set);

      return set;
    }

    print(set) {
      if (!set) {
	return this.S[this.S.length - 1].print();
      }
      
      const rules = this.rules;
      return [...set].map(([index, dot, state]) => {
	return print([index, dot, state], rules);
      });
    }
    
    predict(set, step) {
      const result = [];

      const terms = [];
      
      for (const [index, dot] of set) {
	const [head, body] = this.rules[index];
	if (dot >= body.length) {
	  continue;
	}
	const [type, name] = body[dot];
	if (type == "term") {
	  terms.push(name);
	}
      }
      
      while (terms.length > 0) {
	const term = terms.shift();
	for (let i = 0; i < this.rules.length; i++) {
	  const [name, body] = this.rules[i];
	  if (name != term) {
	    continue;
	  }
	  // The same rule doesn't need to be added twice
	  // NOTE(goto): maybe the same rule can be
	  // added twice with two different dots.
	  if (result.find(([j]) => i == j)) {
	    continue;
	  }
	  
	  result.push([i, 0, step]);

	  if (body.length == 0) {
	    continue;
	  }
	  
	  const [type, next] = body[0];
	  if (type == "term") {
	    terms.push(next);
	  }
	}
      };

      for (const rule of result) {
	const [index, dot, step] = rule;
	const [head, body] = this.rules[index];
	if (dot >= body.length) {
	  continue;
	}
	const [type, next] = body[dot];
	if (this.nullables.has(next)) {
	  // The next item is nullable, so advance it
	  result.push([index, dot + 1, step]);
	}
      }

      return result;
    }

    scan(token) {
      const set = this.S[this.S.length - 1];
      const result = [];
      for (const [index, dot, step] of set) {
	const rule = this.rules[index];
	const [head, body] = rule;
	if (dot >= body.length) {
	  continue;
	}
	const [type, name] = body[dot];
	if (type == "token" && name == token) {
	  result.push([index, dot + 1, step]);
	}
      }
      return result;
    }

    complete(S, set) {
      const result = [];

      const completed = [];
      
      for (const [index, dot, step] of set) {
	const [head, body] = this.rules[index];
	if (dot == body.length) {
	  completed.push([index, dot, step]);
	}
      }

      while (completed.length > 0) {
	const [index, dot, step] = completed.shift();
	const [head, body] = this.rules[index];
	for (const [i, d, s] of S[step]) {
	  const [, body] = this.rules[i];
	  if (d >= body.length) {
	    // already completed
	    continue;
	  }
	  // console.log(print([i, d, s]));
	  const [, name] = body[d];
	  if (name == head) {
	    const r = [i, d + 1, s];
	    result.push(r);
	    if (this.rules[i][1].length == (d + 1)) {
	      completed.push(r);
	    }
	  }
	}
      };
      
      return result;
    }
  }

  it("book that flight", () => {
    // Example from:
    // https://www.youtube.com/watch?v=1j6hB3O4hAM
    
    // Det -> that | this | a | the
    // Noun -> book | flight | meal | money
    // Verb -> book | include | prefer

    // S -> NP VP
    // S -> VP
    // NP -> Det Nominal
    // Nominal -> Noun
    // VP -> Verb
    // VP -> Verb NP

    // book that flight.

    // S0
    // S -> * NP VP (0)
    // S -> * VP (0)
    // NP -> * Det Nominal (0)
    // VP -> * Verb (0)
    // VP -> * Verb NP (0)

    // S1: book
    // VP -> Verb * (0)
    // VP -> Verb * NP (0)
    // S -> VP * (0)
    // NP -> * Det Nominal (1)

    // S2: that
    // NP -> Det * Nominal (1)
    // Nominal -> * Noun (1)

    // S3: flight
    // Nominal -> Noun * (1)
    // NP -> Det Nominal * (1)
    // VP -> Verb NP * (0)
    // S -> VP * (0)

    // tokens and terms
    // Rules composed of tokens and terms
    //
    const rules = [
      ["@", [term("S")]],
      ["S", [term("NP"), term("VP")]],
      ["S", [term("NP"), term("VP")]],
      ["S", [term("VP")]],
      ["NP", [token("Det"), term("Nominal")]],
      ["Nominal", [token("Noun")]],
      ["VP", [token("Verb")]],
      ["VP", [token("Verb"), term("NP")]],
    ];
    
    // Det -> that | this | a | the
    // Noun -> book | flight | meal | money
    // Verb -> book | include | prefer

    // Book that flight
    const tokens = [["Verb", "book"], ["Det", "that"], ["Noun", "flight"]];

    const parser = new Parser(rules);

    assertThat(parser.print()).equalsTo([
      "S -> • NP VP (0)",
      "S -> • NP VP (0)",
      "S -> • VP (0)",
      "NP -> • Det Nominal (0)",
      "VP -> • Verb (0)",
      "VP -> • Verb NP (0)",
    ]);

    assertThat(parser.eat("Verb", "book").print()).equalsTo([
      "VP -> Verb • (0)",
      "VP -> Verb • NP (0)",
      "NP -> • Det Nominal (1)",
      "S -> VP • (0)",
    ]);

    assertThat(parser.eat("Det", "that").print()).equalsTo([
      "NP -> Det • Nominal (1)",
      "Nominal -> • Noun (2)"
    ]);

    assertThat(parser.eat("Noun", "flight").print()).equalsTo([
      "Nominal -> Noun • (2)",
      "NP -> Det Nominal • (1)",
      "VP -> Verb NP • (0)",
      "S -> VP • (0)",
    ]);
    const {parse, dump, root, table} = recognizer(parser);

    assertThat(table().trim()).equalsTo(`
=== 0 ===
S -> VP • (3)
VP -> Verb NP • (3)
S -> VP • (1)
VP -> Verb • (1)

=== 1 ===
NP -> Det Nominal • (3)

=== 2 ===
Nominal -> Noun • (3)
`.trim());

    assertThat(dump(parse(root()))).equalsTo([
      "S",  [
	"VP", ["Verb", "book"], [
	  "NP", ["Det", "that"], [
	    "Nominal", ["Noun", "flight"]
	  ]
	]
      ]
    ]);
  });

  function recognizer(parser) {
    const rules = parser.rules;

    // function generate() {
    const steps = [];
    for (let i = 0; i < parser.S.length; i++) {
      const state = parser.S[i];
      for (const [index, dot, step] of state) {
	const [head, body] = parser.rules[index];
	if (dot == body.length) {
	  steps[step] = steps[step] || [];
	  steps[step].unshift([index, dot, i]);
	}
      }
    }
    
    function table() {
      const tree = [];
      // const steps = generate();
      for (let i = 0; i < steps.length; i++) {
	tree.push(`=== ${i} ===`);
	for (let j = 0; j < (steps[i] || []).length; j++) {
	  tree.push(print(steps[i][j], parser.rules));
	}
	tree.push("");
      }
      
      return tree.join("\n");
    }
    
    function root() {
      for (let i = 0; steps[0].length; i++) {
	const [index, dot, step] = steps[0][i];
	if (step == (parser.S.length - 1)) {
	  return [0, i, 0, 0];
	}
      }
      throw new Error("Oops, couldn't find the root :(");
    }
    
    function leaf(node) {
      const [step, i, dot] = node;
      const [rule, , end] = steps[step][i];
      const [head, body] = rules[rule];
      
      if (body.length > 1) {
	return false;
      }
      const [type] = body[0];
      return type == "token";
    }
      
    function edges(node) {
      const [step, i, dot, offset] = node;
      const [rule, , end] = steps[step][i];
      const [head, body] = rules[rule];

      const [type,  name] = body[dot];

      if (type == "token") {
	const edge = [type, offset];
	edge.print = () => `token: ${name}`;
	return [edge];
      }
      
      const edges = [];
      for (let j = 0; j < steps[offset].length; j++) {
	const [rule, , end] = steps[offset][j];
	const [head, body] = rules[rule];
	if (head == name) {
	  const edge = [type, offset, j];
	  edge.print = () => `${offset}: ` + print(steps[offset][j], rules);
	  edges.push(edge);
	}
      }
      
      return edges;
    }
      
    function toString(node) {
      const [step, i, dot, offset] = node;
      
      const [rule, , end] = steps[step][i];
      return offset + ": " + print([rule, dot, end], rules);
    }
    
    function failed(node) {
      const [step, i, dot, offset] = node;
      const [rule, , end] = steps[step][i];
      const [head, body] = rules[rule];
	
      if (body.length > dot && offset >= end) {
	// if we aren't yet at the end of the rule
	// but have no characters left, this node
	// has failed.
	return true;
      }
	
      return false;
    }
    
    function move(node, edge) {
      const [step, i, dot, begin] = node;
      const [rule, , ] = steps[step][i];
      const [head, body] = rules[rule];
      const [type, next, j] = edge;

      if (type == "token") {
	return [step, i, dot + 1, begin + 1];
      }
      
      const [, , end] = steps[next][j]; 
      
      return [
	step,
	i,
	dot + 1 /** moves forward, skipping tokens */,
	end /** eats the last term */
      ];
    }
    
    function done(node) {
      // console.log(node);
      const [step, i, dot] = node;
      const [rule, , end] = steps[step][i];
      const [head, body] = rules[rule];

      if (body.length == dot) {
	return true;
      }
      
      return false;
    }
    
    function parse(node) {
      
      if (done(node)) {
	return [];
      }
      
      if (failed(node)) {
	return false;
      }

      
      for (const e of edges(node)) {
	const next = move(node, e);
	const tail = parse(next);
	if (!tail) {
	  continue;
	}
	const [type, step, i] = e;
	let body = [[type, step]]; 
	if (type == "term") {
	  const child = [step, i, 0, step];
	  body = parse(child);
	}
	const result = [body, ...tail];
	const [, , dot] = node;
	if (dot == 0) {
	  // If this is the beginning of the matching
	  const edge = ([step, i]) => ["term", step, i];
	  result.unshift(edge(node));
	}
	return result;
      }

      //console.log(node);
      throw new Error("oops");
      //return [edge(node)];
    }

    function dump(parent) {
      const [edge] = parent;
      const [type, step, i] = edge;

      if (type == "token") {
	// console.log(parser.tokens);
	const [name, value] = parser.tokens[step];
	return [name, value];
      }

      // console.log(edge);
      // throw new Error("hi");;
      const [rule] = steps[step][i];
      const [head] = parser.rules[rule];
      // const result = print(steps[step][i], parser.rules);

      if (parent.length == 1) {
	return [head];
      }

      const [, ...children] = parent;
      // console.log(children);

      return [head, ...children.map((child) => dump(child))];
    }

    return {
      toString: toString,
      root: root,
      leaf: leaf,
      edges: edges,
      move: move,
      parse: parse,
      done: done,
      failed: failed,
      dump: dump,
      table: table,
    }
  }
  
  it("Products and factors", () => {
    // Example from:
    // https://loup-vaillant.fr/tutorials/earley-parsing/recogniser
    
    // 1 + ( 2 * 3 - 4 )

    // S0
    // Sum -> * Sum [+-] Product (0)
    // Sum -> * Product (0)
    // Product -> * Product [*/] Factor (0)
    // Product -> * Factor (0)
    // Factor -> * ( Sum ) (0)
    // Factor -> * Number (0)
    // Number -> * [0-9] Number (0)
    // Number -> * [0-9] (0)

    // S1: 1
    // Number -> [0-9] * Number (0)
    // Number -> [0-9] * (0)
    // Factor -> Number * (0)
    // Product -> Factor * (0)
    // Sum -> Product * (0)
    // Sum -> Sum * [+-] Product (0)

    // S2: +
    // Sum -> Sum [+-] * Product (0)
    // Product -> * Product [*/] Factor (2)
    // Product -> * Factor (2)
    // Factor -> * ( Sum  ) (2)
    // Factor -> * Number (2)
    // Number -> * [0-9] Number (2)
    // Number -> * [0-9] (2)

    // S3: (
    // Factor -> ( * Sum ) (3)
    // Sum -> * Sum [+-] Product (3)
    // Sum -> * Product (3)
    // ...

    const rules = [
      ["@", [term("Sum")]],
      ["Sum", [term("Sum"), token("+-"), term("Product")]],
      ["Sum", [term("Product")]],
      ["Product", [term("Product"), token("*/"), term("Factor")]],
      ["Product" , [term("Factor")]],
      ["Factor",  [token("("), term("Sum"), token(")")]],
      ["Factor", [term("Number")]],
      ["Number", [token("[0-9]"), term("Number")]],
      ["Number", [token("[0-9]")]],
    ];
    
    const parser = new Parser(rules);

    assertThat(parser.print()).equalsTo([
      "Sum -> • Sum +- Product (0)",
      "Sum -> • Product (0)",
      "Product -> • Product */ Factor (0)",
      "Product -> • Factor (0)",
      "Factor -> • ( Sum ) (0)",
      "Factor -> • Number (0)",
      "Number -> • [0-9] Number (0)",
      "Number -> • [0-9] (0)",
    ]);

    assertThat(parser.eat("[0-9]", "1").print()).equalsTo([
      "Number -> [0-9] • Number (0)",
      "Number -> [0-9] • (0)",
      "Number -> • [0-9] Number (1)",
      "Number -> • [0-9] (1)",
      "Factor -> Number • (0)",
      "Product -> Factor • (0)",
      "Sum -> Product • (0)",
      "Product -> Product • */ Factor (0)",
      "Sum -> Sum • +- Product (0)",
    ]);
    
    assertThat(parser.eat("+-", "+").print()).equalsTo([
      "Sum -> Sum +- • Product (0)",
      "Product -> • Product */ Factor (2)",
      "Product -> • Factor (2)",
      "Factor -> • ( Sum ) (2)",
      "Factor -> • Number (2)",
      "Number -> • [0-9] Number (2)",
      "Number -> • [0-9] (2)",
    ]);

    assertThat(parser.eat("[0-9]", "2").print()).equalsTo([
      "Number -> [0-9] • Number (2)",
      "Number -> [0-9] • (2)",
      "Number -> • [0-9] Number (3)",
      "Number -> • [0-9] (3)",
      "Factor -> Number • (2)",
      "Product -> Factor • (2)",
      "Sum -> Sum +- Product • (0)",
      "Product -> Product • */ Factor (2)",
      "Sum -> Sum • +- Product (0)",
    ]);

    const {
      toString,
      leaf,
      edges,
      failed,
      move,
      parse,
      dump} = recognizer(parser);
    
    {

      
      {
	const node = [0, 0, 1, 1];
	assertThat(toString(node))
	  .equalsTo("1: Sum -> Sum • +- Product (3)");
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["token: +-"]);
      }
      
      {
	// Each node is the step and where we are at
	const node = [0, 4, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Number -> • [0-9] (1)");
	assertThat(leaf(node)).equalsTo(true);
	assertThat(edges(node).length).equalsTo(1);
	assertThat(edges(node)[0].print())
	  .equalsTo("token: [0-9]");
	assertThat(failed(node)).equalsTo(false);
      }

      {
	const node = [0, 3, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Factor -> • Number (1)");
	assertThat(leaf(node)).equalsTo(false);
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["0: Number -> [0-9] • (1)"]);
	assertThat(failed(node)).equalsTo(false);
      }

      {
	const node = [0, 2, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Product -> • Factor (1)");
	assertThat(leaf(node)).equalsTo(false);
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["0: Factor -> Number • (1)"]);
	assertThat(failed(node)).equalsTo(false);
      }

      {
	const node = [0, 1, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Sum -> • Product (1)");
	assertThat(leaf(node)).equalsTo(false);
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["0: Product -> Factor • (1)"]);
	assertThat(failed(node)).equalsTo(false);
      }

      {
	const node = [0, 0, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Sum -> • Sum +- Product (3)");
	assertThat(leaf(node)).equalsTo(false);
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo([
	    "0: Sum -> Sum +- Product • (3)",
	    "0: Sum -> Product • (1)",
	  ]);
	assertThat(failed(node)).equalsTo(false);

	{
	  const next = move(node, edges(node)[0]);
	  assertThat(toString(next))
	    .equalsTo("3: Sum -> Sum • +- Product (3)");
	  assertThat(failed(next)).equalsTo(true);
	}
	
	{
	  // Do not skip the token
	  const next = move(node, edges(node)[1]);
	  assertThat(toString(next))
	    .equalsTo("1: Sum -> Sum • +- Product (3)");
	  assertThat(failed(next)).equalsTo(false);
	  
	  assertThat(edges(next).map(({print}) => print()))
	    .equalsTo(["token: +-"]);
	  // "2: Product -> Factor • (3)"
	  // return;
	  
	  assertThat(toString(move(next, edges(next)[0])))
	    .equalsTo("2: Sum -> Sum +- • Product (3)");
	}
	
      }


      {
	const node = [0, 4, 0, 0];
	assertThat(toString(node)).equalsTo("0: Number -> • [0-9] (1)");
	assertThat(edges(node).map(({print}) => print())).equalsTo(["token: [0-9]"]);
	assertThat(parse(node)).equalsTo([["term", 0, 4], [["token", 0]]]);
	// return;
	// console.log("hi");
	// throw new Error("hi");
	// return;
      }
      
      {
	const node = [0, 3, 0, 0];
	assertThat(toString(node)).equalsTo("0: Factor -> • Number (1)");
	assertThat(parse(node)).equalsTo([["term", 0, 3], [["term", 0, 4], [["token", 0]]]]);
	// return;
      }

      {
	const node = [0, 2, 0, 0];
	assertThat(toString(node)).equalsTo("0: Product -> • Factor (1)");
	assertThat(parse(node)).equalsTo([["term", 0, 2], [["term", 0, 3], [["term", 0, 4], [["token", 0]]]]]);
	// return;
      }

      {
	const node = [0, 1, 0, 0];
	assertThat(toString(node)).equalsTo("0: Sum -> • Product (1)");
	assertThat(parse(node)).equalsTo([["term", 0, 1], [["term", 0, 2], [["term", 0, 3], [["term", 0, 4], [["token", 0]]]]]]);
	// return;
      }

      {
	const node = [2, 2, 0, 2];
	assertThat(toString(node)).equalsTo("2: Number -> • [0-9] (3)");
	assertThat(edges(node).map(({print}) => print())).equalsTo(["token: [0-9]"]);
	assertThat(parse(node)).equalsTo([["term", 2, 2], [["token", 2]]]);
	// return;
      }

      {
	const node = [2, 1, 0, 2];
	assertThat(toString(node)).equalsTo("2: Factor -> • Number (3)");
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["2: Number -> [0-9] • (3)"]);
	assertThat(parse(node)).equalsTo([["term", 2, 1], [["term", 2, 2], [["token", 2]]]]);
      }

      {
	const node = [2, 0, 0, 2];
	assertThat(toString(node)).equalsTo("2: Product -> • Factor (3)");
	assertThat(edges(node).map(({print}) => print()))
	  .equalsTo(["2: Factor -> Number • (3)"]);
	assertThat(parse(node)).equalsTo([["term", 2, 0], [["term", 2, 1], [["term", 2, 2], [["token", 2]]]]]);
      }

      {
	const node = [0, 0, 0, 0];
	assertThat(toString(node)).equalsTo("0: Sum -> • Sum +- Product (3)");
	assertThat(parse(node)).equalsTo([
	  ["term", 0, 0],
	  [["term", 0, 1], [["term", 0, 2], [["term", 0, 3], [["term", 0, 4], [["token", 0]]]]]],
	  [["token", 1]],
	  [["term", 2, 0], [["term", 2, 1], [["term", 2, 2], [["token", 2]]]]]
	]);

	// https://loup-vaillant.fr/tutorials/earley-parsing/parser
	assertThat(dump(parse(node))).equalsTo([
	  "Sum", [
	    "Sum", [
	      "Product", [
		"Factor", [
		  "Number", [
		    "[0-9]", "1"
		  ]
		]
	      ]
	    ]
	  ],
	  ["+-", "+"],
	  [
	    "Product", [
	      "Factor", [
		"Number", [
		  "[0-9]", "2"
		]
	      ]
	    ]
	  ]
	]);

      }
    }
    
  });

  it("Null", () => {
    // Example from:
    // https://loup-vaillant.fr/tutorials/earley-parsing/recogniser

    const parser = new Parser([
      ["$", [term("A")]],
      ["A", []],
      ["A", [term("B")]],
      ["B", [term("A")]],
      ["C", [term("A"), token("[0-9]")]],
    ]);

    assertThat(parser.nullables).equalsTo(new Set(["$", "A", "B"]));
    
    assertThat(parser.print()).equalsTo([
      "A ->  • (0)",
      "A -> • B (0)",
      "B -> • A (0)",
      "A -> B • (0)",
      "B -> A • (0)",
    ]);
  });


  it("Unexpected token", () => {
    const rules = [
      ["@", [term("Sum")]],
      ["Sum", [term("Sum"), token("+-"), term("Product")]],
      ["Sum", [term("Product")]],
      ["Product", [term("Product"), token("*/"), term("Factor")]],
      ["Product" , [term("Factor")]],
      ["Factor",  [token("("), term("Sum"), token(")")]],
      ["Factor", [term("Number")]],
      ["Number", [token("[0-9]"), term("Number")]],
      ["Number", [token("[0-9]")]],
    ];

    const parser = new Parser(rules);
    try {
      parser.eat("foo", "bar");
      assertThat(true).equalsTo(false);
    } catch (e) {
      assertThat(e.message).equalsTo("Unexpected token");
    }
    

  });
  
  it.skip("1+2*4", () => {
    const rules = [
      ["@", [term("Sum")]],
      ["Sum", [term("Sum"), token("+-"), term("Product")]],
      ["Sum", [term("Product")]],
      ["Product", [term("Product"), token("*/"), term("Factor")]],
      ["Product" , [term("Factor")]],
      ["Factor",  [token("("), term("Sum"), token(")")]],
      ["Factor", [term("Number")]],
      ["Number", [token("[0-9]"), term("Number")]],
      ["Number", [token("[0-9]")]],
    ];

    const parser = new Parser(rules);

    parser.eat("[0-9]", "1");
    parser.eat("+-", "+");
    parser.eat("[0-9]", "2");
    parser.eat("*/", "*");
    parser.eat("[0-9]", "4");
    
    const {root, table, parse, toString} = recognizer(parser);
    console.log(table());
    // 0: Number -> [0-9]
    assertThat(parse([0, 5, 0, 0]))
      .equalsTo([["term", 0, 5], [["token", 0]]]);
    // 0: Factor -> Number
    assertThat(parse([0, 4, 0, 0]))
      .equalsTo([["term", 0, 4], [["term", 0, 5], [["token", 0]]]]);
    // 0: Product -> Factor
    assertThat(parse([0, 3, 0, 0]))
      .equalsTo([["term", 0, 3], [["term", 0, 4], [["term", 0, 5], [["token", 0]]]]]);
    // 0: Sum -> Product
    assertThat(parse([0, 2, 0, 0]))
      .equalsTo([["term", 0, 2], [["term", 0, 3], [["term", 0, 4], [["term", 0, 5], [["token", 0]]]]]]);

    // 2: Number -> [0-9]
    assertThat(parse([2, 3, 0, 2]))
      .equalsTo([["term", 2, 3], [["token", 2]]]);
    // 2: Factor -> Number
    assertThat(parse([2, 2, 0, 2]))
      .equalsTo([["term", 2, 2], [["term", 2, 3], [["token", 2]]]]);
    // 2: Product -> Factor
    assertThat(parse([2, 1, 0, 2]))
      .equalsTo([["term", 2, 1], [["term", 2, 2], [["term", 2, 3], [["token", 2]]]]]);

    // 4: Number -> [0-9]
    assertThat(parse([4, 1, 0, 4]))
      .equalsTo([["term", 4, 1], [["token", 4]]]);
    // 4: Factor -> Number
    assertThat(parse([4, 0, 0, 4]))
      .equalsTo([["term", 4, 0], [["term", 4, 1], [["token", 4]]]]);

    // 2: Product -> Product */ Factor • (5)
    assertThat(parse([2, 0, 0, 2]))
      .equalsTo([["term", 2, 0],
		 [["term", 2, 1], [["term", 2, 2], [["term", 2, 3], [["token", 2]]]]],
		 [["token", 3]], /** This is the * token */
		 [["term", 4, 0], [["term", 4, 1], [["token", 4]]]]
		]);

    // 0: Sum -> Sum +- Product
    assertThat(parse([0, 1, 0, 0]))
      .equalsTo([["term", 0, 1],
		 [["term", 0, 2], [["term", 0, 3], [["term", 0, 4], [["term", 0, 5], [["token", 0]]]]]],
		 [["token", 1]],
		 [["term", 2, 0],
		  [["term", 2, 1], [["term", 2, 2], [["term", 2, 3], [["token", 2]]]]],
		  [["token", 3]],
		  [["term", 4, 0], [["term", 4, 1], [["token", 4]]]]
		 ]
		]);

    // return;
    
    // assertThat(root()).equalsTo([0, 0, 0, 0]);
    //assertThat(parse(root()));
    //assertThat(recognizer.parse()).equalsTo();
    
  });

  it("1+(2*3-4)", () => {
    const rules = [
      ["@", [term("Sum")]],
      ["Sum", [term("Sum"), token("+-"), term("Product")]],
      ["Sum", [term("Product")]],
      ["Product", [term("Product"), token("*/"), term("Factor")]],
      ["Product" , [term("Factor")]],
      ["Factor",  [token("("), term("Sum"), token(")")]],
      ["Factor", [term("Number")]],
      ["Number", [token("[0-9]"), term("Number")]],
      ["Number", [token("[0-9]")]],
    ];

    const parser = new Parser(rules);

    parser.eat("[0-9]", "1");
    parser.eat("+-", "+");
    parser.eat("(", "(");
    parser.eat("[0-9]", "2");
    parser.eat("*/", "*");
    parser.eat("[0-9]", "3");
    parser.eat("+-", "-");
    parser.eat("[0-9]", "4");
    parser.eat(")", ")");

    const {root, table, parse, dump, toString} = recognizer(parser);
    assertThat(dump(parse(root()))).equalsTo([
      "Sum", [
	"Sum", [
	  "Product", [
            "Factor", [
              "Number", [
		"[0-9]",
		"1"
              ]
            ]
	  ]
	]
      ],
      [
	"+-",
	"+"
      ],
      [
	"Product", [
	  "Factor", [
            "(",
            "("
	  ], [
            "Sum", [
              "Sum", [
		"Product", [
		  "Product", [
                    "Factor", [
                      "Number", [
			"[0-9]",
			"2"
                      ]
                    ]
		  ]
		],
		[
		  "*/",
		  "*"
		],
		[
		  "Factor", [
                    "Number", [
                      "[0-9]",
                      "3"
                    ]
		  ]
		]
              ]
            ],
            [
              "+-",
              "-"
            ],
            [
              "Product", [
		"Factor", [
		  "Number", [
                    "[0-9]",
                    "4"
		  ]
		]
              ]
            ]
	  ],
	  [
            ")",
            ")"
	  ]
	]
      ]
    ]);    
  });

});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
