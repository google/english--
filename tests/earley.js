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

describe("Earley", function() {
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

    assertThat(parser.eat("[0-9]").print()).equalsTo([
      "number -> [0-9] • (0)",
      "term -> number • + term (0)",
      "term -> number • (0)",
    ]);

    assertThat(parser.eat("+").print()).equalsTo([
      "term -> number + • term (0)",
      "term -> • number + term (2)",
      "term -> • number (2)",
      "number -> • [0-9] (2)",
    ]);

    assertThat(parser.eat("[0-9]").print()).equalsTo([
      "number -> [0-9] • (2)",
      "term -> number • + term (2)",
      "term -> number • (2)",
      "term -> number + term • (0)",
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
  
  class Parser {
    constructor(rules = []) {
      this.rules = rules;
      this.S = [];
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

    eat(token) {
      const set = this.scan(token);

      set.push(...this.predict(set, this.S.length));

      const expand = this.complete(this.S, set);

      set.push(...expand);
      
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
	if (type == "token" &&
	    name == token) {
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

    assertThat(parser.eat("Verb").print()).equalsTo([
      "VP -> Verb • (0)",
      "VP -> Verb • NP (0)",
      "NP -> • Det Nominal (1)",
      "S -> VP • (0)",
    ]);

    return;
    
    assertThat(parser.eat("Det").print()).equalsTo([
      "NP -> Det • Nominal (1)",
      "Nominal -> • Noun (2)"
    ]);

    assertThat(parser.eat("Noun").print()).equalsTo([
      "Nominal -> Noun • (2)",
      "NP -> Det Nominal • (1)",
      "VP -> Verb NP • (0)",
      "S -> VP • (0)",
    ]);
  });

  it.only("Products and factors", () => {
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

    assertThat(parser.eat("[0-9]").print()).equalsTo([
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
    
    assertThat(parser.eat("+-").print()).equalsTo([
      "Sum -> Sum +- • Product (0)",
      "Product -> • Product */ Factor (2)",
      "Product -> • Factor (2)",
      "Factor -> • ( Sum ) (2)",
      "Factor -> • Number (2)",
      "Number -> • [0-9] Number (2)",
      "Number -> • [0-9] (2)",
    ]);

    assertThat(parser.eat("[0-9]").print()).equalsTo([
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

    // console.log(parser.S);

    const steps = [];
    for (let i = 0; i < parser.S.length; i++) {
      //console.log(`=== ${i} ===`);
      const state = parser.S[i];
      for (const [index, dot, step] of state) {
	const [head, body] = parser.rules[index];
	if (dot == body.length) {
	  //console.log(print([index, dot, step], parser.rules));
	  steps[step] = steps[step] || [];
	  steps[step].unshift([index, dot, i]);
	}
      }
      //console.log("");
    }

    const tree = [];
    for (let i = 0; i < steps.length; i++) {
      tree.push(`=== ${i} ===`);
      for (let j = 0; j < (steps[i] || []).length; j++) {
	tree.push(print(steps[i][j], parser.rules));
      }
      tree.push("");
    }

    assertThat(tree.join("\n").trim())
      .equalsTo(`

=== 0 ===
Sum -> Sum +- Product • (3)
Sum -> Product • (1)
Product -> Factor • (1)
Factor -> Number • (1)
Number -> [0-9] • (1)

=== 1 ===

=== 2 ===
Product -> Factor • (3)
Factor -> Number • (3)
Number -> [0-9] • (3)

`.trim());

    // return;
    
    // TODO(goto): handle multiple roots.
    const root = steps[0].find(([index, dot, step]) => step == 3);

    {
      function leaf(node) {
	const [step, i, dot] = node;
	const [rule, , end] = steps[step][i];
	const [head, body] = parser.rules[rule];

	if (body.length > 1) {
	  return false;
	}
	const [type] = body[0];
	return type == "token";
      };

      function edges(node) {
	if (leaf(node)) {
	  return [];
	}
	
	const [step, i, dot, offset] = node;
	const [rule, , end] = steps[step][i];
	const [head, body] = parser.rules[rule];

	let name;
	let next = dot;
	while (next < body.length) {
	  const [type,  head] = body[next];
	  if (type == "term") {
	    name = head;
	    break;
	  }
	  next++;
	};

	const edges = [];
	for (let j = 0; j < steps[next].length; j++) {
	  const [rule, , end] = steps[next][j];
	  const [head, body] = parser.rules[rule];
	  if (head == name) {
	    const edge = [next, j];
	    edge.print = () => `${next}: ` + print(steps[next][j], parser.rules);
	    edges.push(edge);
	  }
	}

	return edges;
      }

      function toString(node) {
	const [step, i, dot, offset] = node;
	const [rule, , end] = steps[step][i];
	return offset + ": " + print([rule, dot, end], parser.rules)
      }

      function failed(node) {
	const [step, i, dot, offset] = node;
	const [rule, , end] = steps[step][i];
	const [head, body] = parser.rules[rule];

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
	const [head, body] = parser.rules[rule];
	const [next, j] = edge;
	const [, , end] = steps[next][j]; 

	let p = dot;
	while (p < body.length) {
	  const [type] = body[p];
	  if (type == "term") {
	    break;
	  }
	  p++;
	};

	// console.log(p);
	return [
	  step, i,
	  p + 1 /** moves forward, skipping tokens */,
	  end /** eats the last term */
	];
      }
      
      {
	// Each node is the step and where we are at
	const node = [0, 4, 0, 0];
	assertThat(toString(node))
	  .equalsTo("0: Number -> • [0-9] (1)");
	assertThat(leaf(node)).equalsTo(true);
	// assertThat(parse(node))
	//  .equalsTo([node, []]);
	assertThat(edges(node))
	  .equalsTo([]);
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
	  const next = move(node, edges(node)[1]);
	  assertThat(toString(next))
	    .equalsTo("1: Sum -> Sum • +- Product (3)");
	  assertThat(failed(next)).equalsTo(false);

	  assertThat(edges(next).map(({print}) => print()))
	    .equalsTo(["2: Product -> Factor • (3)"]);

	  assertThat(toString(move(next, edges(next)[0])))
	    .equalsTo("3: Sum -> Sum +- Product • (3)");
	}
      }

      {
	const node = [0, 0, 0, 0];

	function done(node) {
	  const [step, i, dot, offset] = node;
	  const [rule, , end] = steps[step][i];
	  const [head, body] = parser.rules[rule];

	  // console.log(toString(node));
	  //console.log(`body=${body.length} dot=${dot}: ${toString(node)}`);
	  if (body.length == dot) {
	    return true;
	  }

	  return false;
	}
	
	function parse(node) {
	  if (leaf(node)) {
	    return [node];
	  }

	  if (done(node)) {
	    return [];
	  }

	  if (failed(node)) {
	    return false;
	  }

	  for (const edge of edges(node)) {
	    const next = move(node, edge);
	    const tail = parse(next);
	    if (!tail) {
	      continue;
	    }
	    const [step, i] = edge;
	    const child = [step, i, 0, step];
	    return [[edge, parse(child)], tail];
	  }
	}

	assertThat(parse(node)).equalsTo();
	
	assertThat(parse(node).map(([edge, tree]) => edge.print()))
	  .equalsTo([
	    "0: Sum -> Product • (1)",
	    "2: Product -> Factor • (3)"
	  ]);
	//assertThat(parse(node).map(([edge, tree]) => tree.map(([edge, tree]) => tree)))
	//  .equalsTo([
	//    //"0: Sum -> Product • (1)",
	//    //"2: Product -> Factor • (3)"
	//  ]);
      }
    }

    return;
    
    assertThat(print(root, parser.rules))
      .equalsTo("Sum -> Sum +- Product • (3)");

    function parse(rule, dot) {
      const [index, , step] = rule;
      const [head, body] = parser.rules[index];
      // console.log(body);
      console.log(body[0]);

      
      
      console.log(print([index, dot, step], parser.rules));
    }
    
    assertThat(parse(steps[0][4], 0)).equalsTo();
    
    return;
    
    function search(parent, offset, begin) {
      const [index, dot, end] = parent;
      console.log(`Searching for the ${offset}th child of step #${begin} ${print(parent, parser.rules)} starting from ${begin}`);
      const [head, body] = parser.rules[index];

      if (begin < end && offset < body.length) {
	const [type, name] = body[offset];
	if (type == "token") {
	  if ((begin + 1) >= end) {
	    return [["token", name]];
	  }
	  const next = search(parent, offset + 1, begin + 1);
	  //  if (next) {
	  return [["token", name], next];
	  //}
	  //return ["token", name];
	  // return name;
	}

	// console.log("hi");
      }
      
      // for (const child of body) {
      // console.log(body[offset]);
      if (begin >= end) {
	// throw new Error(`Can't find a child: reached the end of the symbols: ${begin} >= ${end}`);
	// throw new Error("hi");
	// console.log(`${begin} ${end}`);
	return false;
      }
            
      const [type, name] = body[offset];
      // Completions starting at this index:
      const completions = steps[begin]
	    .filter(([index]) => parser.rules[index][0] == name);
      for (const completion of completions) {
	// console.log(print(completion, parser.rules));
	const [, , e] = completion;
	// console.log(e);
	console.log(`Step #${begin}: ` + print(completion, parser.rules));
	// This is the last symbol to search
	//if ((offset + 1) == body.length &&
	//   ) {
	//}
	// console.log(`${(offset + 1) == body.length} `);
	// console.log(`${e} ${end} `);
	// We are at the end, and the endings match
	// console.log(`${offset} ${body.length} ${e} ${end}`);
	// console.log(head);
	// console.log();
	// console.log("hi");
	if ((offset + 1) == body.length && end == e) {
	  console.log("hello: " + head);
	  // console.log(completion);
	  // console.log(begin);
	  // throw new Error("hi");
	  // const children = ;
	  // console.log(children);
	  //
	  return ["term", head, search(completion, 0, begin)];
	}

	console.log("hello");
	const next = search(parent, offset + 1, e);
	if (next) {
	  return [["term", head, search(completion, 0, begin)], ...next];
	}
      }
    }

    console.log(search([4, 3, 1], 0, 2));

    return;
    
    const result = search(root, 0, 0);
    // console.log(JSON.stringify(result, undefined, 2));
    return;
    assertThat(result).equalsTo([
      ["term", "Sum", [
	"term", "Sum", [
	  "term", "Product", [
	    "term", "Factor", [
	      "token", "[0-9]"
	    ]
	  ]
	]
      ]],
      ["token", "+-"],
      ["term", "Sum", [
	"term", "Product", [
	  "term", "Factor", [
	    "token", "[0-9]"
	  ]
	]
      ]]
    ]);
    //assertThat(print(result[0][1], parser.rules))
    // .equalsTo("Sum -> Product • (1)");
    // return;
    // assertThat(print(result[2], parser.rules))
    //  .equalsTo("Product -> Factor • (3)");

    // const level2 = search(result[0], 0, 0);
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
  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
