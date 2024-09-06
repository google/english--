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

  it("Completion", () => {
    const {start, next, eat, S, rules, trace, from, stack, table, predict, complete, scan} = parse([
      ["@", [term("A")]],
      ["A", [term("B"), term("C")]],
      ["B", [token("foo")]],
      ["C", [token("bar")]],
    ]);

    start();
    assertThat(S[0].print()).equalsTo([
      "A -> • B C (0)",
      "B -> • foo (0)"
    ]);
    eat("foo");
    assertThat(S[1].print()).equalsTo([
      "B -> foo • (0)",
      "A -> B • C (0)",
      "C -> • bar (1)"
    ]);
    assertThat(next()).equalsTo([
      ["bar", 3, 0, 1]
    ]);
    eat("bar");
  });

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

  function parse(rules) {
    const S = [];
    const tokens = [];

    const nullables = new Set();

    function start() {
      const nulls = [];

      for (const rule of rules) {
	const [head, body] = rule;
	if (body.length == 0) {
	  nulls.push(head);
	}
      }

      // this.nullables = new Set();
      
      while (nulls.length > 0) {
	const nullable = nulls.pop();

	nullables.add(nullable);
	
	for (const rule of rules) {
	  const [head, body] = rule;
	  let nullable = true;
	  for (const [type, name] of body) {
	    if (!nullables.has(name)) {
	      // This rule references a non-nullable rule
	      nullable = false;
	      break;
	    }
	  }
	  if (nullable && !nullables.has(head)) {
	    nulls.push(head);
	  }
	}
      }

      // Expand the first node.
      const S0 = predict([[0, 0, 0]], 0);
      S0.print = () => print2(S0);
      S.push(S0);

      return S0;
    }

    function eat(token, value) {
      const set = scan(token);

      if (set.length == 0) {
	throw new Error("Unexpected token");
      }

      // set.push(...predict(set, S.length));	

      const diff = (a, b) => {
	return a.filter((p) => !b.some((q) =>
	  p[0] == q[0] &&
	  p[1] == q[1] &&
	  p[2] == q[2]
	));
      }

      const expand = [];
      
      do {
	set.push(...predict(set, S.length));
	const more = diff(complete(S, set), expand);
	if (more.length == 0) {
	  break;
	}
	expand.push(...more);
	set.push(...more);
      } while (true);
      

      tokens.push([token, value]);
      S.push(set);

      set.print = () => print2(set);

      return set;
    }

    function print2(set) {
      if (!set) {
	return S[S.length - 1].print();
      }

      //console.log("hello");
      //console.log(set);
      
      // const rules = this.rules;
      return [...set].map(([index, dot, state]) => {
	return print([index, dot, state], rules);
      });
    }

    function predict(set, step) {
      const result = [];

      const terms = [];
      
      for (const [index, dot] of set) {
	const [head, body] = rules[index];
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
	for (let i = 0; i < rules.length; i++) {
	  const [name, body] = rules[i];
	  if (name != term) {
	    continue;
	  }
	  // The same rule doesn't need to be added twice
	  // NOTE(goto): maybe the same rule can be
	  // added twice with two different dots.
	  if ([...set, ...result].some(
	    (p) => p[0] == i && p[1] == 0 && p[2] == step)) {
	    continue;
	  }
	  //if (result.find(([j]) => i == j)) {
	  //  continue;
	  //}
	  
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
	const [head, body] = rules[index];
	if (dot >= body.length) {
	  continue;
	}
	const [type, next] = body[dot];
	if (nullables.has(next)) {
	  // The next item is nullable, so advance it
	  result.push([index, dot + 1, step]);
	}
      }

      return result;
    }

    function next() {
      const set = S[S.length - 1];
      const result = [];
      for (const [index, dot, step] of set) {
	const rule = rules[index];
	const [head, body] = rule;
	if (dot >= body.length) {
	  continue;
	}
	const [type, name] = body[dot];
	if (type != "token") {
	  continue;
	}
	result.push([name, index, dot, step]);
      }

      //console.log(result);
      //throw new Error("hi");
      return result;
    }
    
    function scan(token) {
      const result = [];
      for (const [name, index, dot, step] of next()) {
	if (name == token) {
	  result.push([index, dot + 1, step]);
	}
      }
      return result;
    }

    function complete(S, set) {
      const result = [];

      const completed = [];
      
      for (const [index, dot, step] of set) {
	const [head, body] = rules[index];
	if (dot == body.length) {
	  completed.push([index, dot, step]);
	}
      }

      while (completed.length > 0) {
	const [index, dot, step] = completed.shift();
	const [head, body] = rules[index];
	for (const [i, d, s] of S[step]) {
	  const [, body] = rules[i];
	  if (d >= body.length) {
	    // already completed
	    continue;
	  }
	  // console.log(print([i, d, s]));
	  const [, name] = body[d];
	  if (name == head) {
	    const r = [i, d + 1, s];
	    result.push(r);
	    if (rules[i][1].length == (d + 1)) {
	      completed.push(r);
	    }
	  }
	}
      };
      
      return result;
    }
  
    function from(node) {
      // [head, step]
      const [rule, dot, step] = node;
      const [head] = rules[rule];

      const set = S[step];

      //console.log("hello");
      //console.log(node);
      //console.log("world");
      
      for (const option of set) {
	// console.log(option);
	const [rule, dot] = option;

	//console.log(rules[rule]);
	//console.log();
	// console.log(option);
	
	const [, body] = rules[rule];

	if (dot >= body.length) {
	  // throw new Error("dot is beyond body");
	  continue;
	}
	
	const [type, name] = body[dot];
	if (type == "token") {
	  continue;
	}
	if (head == name) {
	  return option;
	}
      }
      throw new Error(`Predecessor of ${head} not found at step ${step}.`);
    }

    function trace(node) {
      const result = [];
      let next = node;
      const [, [[, root]]] = rules[0];
      // console.log(root);
      do {
	const [rule, dot, step] = next;
	// console.log("hi");
	const [head] = rules[rule];
	// console.log(head);
	// console.log(root);
	result.push(next);
	if (head == root) {
	  return result;
	}
	// console.log(next);
	//if (step == 0) {
	//  return result;
	//}
	next = from(next);
      } while (true);
    }
    
    function stack() {
      return next()
	.map(([token, rule, dot, step]) => [
	  token,
	  trace([rule, dot, step])
	    .map((node) => print(node, rules))
	]);
    }

    return {
      rules: rules,
      start: start,
      eat: eat,
      print2: print2,
      predict: predict,
      complete: complete,
      scan: scan,
      next: next,
      S: S,
      tokens: tokens,
      nullables: nullables,
      from: from,
      trace: trace,
      stack: stack,
      predict: predict,
      scan: scan,
      complete: complete,
    };
  }
    
  class Parser {
    constructor(rules = []) {
      const {
	start,
	eat,
	print2,
	predict,
	complete,
	scan,
	S,
	tokens,
	nullables,
	stack} = parse(rules);
      start();
      this.eat = eat.bind(this);
      this.stack = () => stack();
      this.print = () => print2();
      this.__S__ = S;
      this.__tokens__ = tokens;
      this.__nullables__ = nullables;
      this.rules = rules;
    }

    get S() {
      return this.__S__;
    }

    get tokens() {
      return this.__tokens__;
    }
    
    get nullables() {
      return this.__nullables__;
    }
    
  }

  describe("stack", () => {
    it("A -> • %token (0)", () => {
      const {start, next} = parse([
	["@", [term("A")]],
	["A", [token("%token")]],
      ]);
      assertThat(start().print())
	.equalsTo(['A -> • %token (0)']);
      assertThat(next())
	.equalsTo([
	  ["%token", 1, 0, 0]
	]);
    });

    it("A -> • %token (0), A -> • %other (0)", () => {
      const {start, next, stack} = parse([
	["@", [term("A")]],
	["A", [token("%token")]],
	["A", [token("%other")]],
      ]);
      assertThat(start().print())
	.equalsTo([
	  'A -> • %token (0)',
	  'A -> • %other (0)'
	]);
      assertThat(next())
	.equalsTo([
	  ["%token", 1, 0, 0],
	  ["%other", 2, 0, 0]
	]);

      assertThat(stack()).equalsTo([[
	"%token", [
	  "A -> • %token (0)"
	]
      ], [
	"%other", [
	  "A -> • %other (0)"
	]
      ]]);
    });

    it("A -> %token • %other(0)", () => {
      const {start, next, eat, S, rules} = parse([
	["@", [term("A")]],
	["A", [token("%token"), token("%other")]],
      ]);
      assertThat(start().print())
	.equalsTo([
	  'A -> • %token %other (0)',
	]);
      const result = eat("%token", "");
      assertThat(result.print())
	.equalsTo(['A -> %token • %other (0)']);
      const last = next();
      assertThat(last)
	.equalsTo([
	  ["%other", 1, 1, 0],
	]);
    });

    it("A -> %token • B (0)", () => {
      const {start, next, eat, S, rules, trace, from, stack} = parse([
	["@", [term("A")]],
	["A", [token("%token"), term("B")]],
	["B", [token("%other")]],
      ]);

      start();

      assertThat(stack())
	.equalsTo([
	  ["%token", [
	    "A -> • %token B (0)"
	  ]]
	]);

      eat("%token", "");

      assertThat(stack())
	.equalsTo([
	  ["%other", [
	    "B -> • %other (1)",
	    "A -> %token • B (0)"
	  ]]
	]);

      eat("%other", "");
      
      assertThat(stack())
	.equalsTo([]);
    });
    
    it("C -> %third • C (0)", () => {
      const {start, next, eat, S, rules, trace, from, stack} = parse([
	["@", [term("A")]],
	["A", [token("%first"), term("B")]],
	["B", [token("%second"), term("C")]],
	["C", [token("%third")]],
      ]);

      start();

      assertThat(stack())
	.equalsTo([
	  ["%first", [
	    "A -> • %first B (0)"
	  ]]
	]);

      eat("%first", "");

      assertThat(stack())
	.equalsTo([
	  ["%second", [
	    "B -> • %second C (1)",
	    "A -> %first • B (0)"
	  ]]
	]);

      eat("%second", "");

      assertThat(stack())
	.equalsTo([
	  ["%third", [
	    "C -> • %third (2)",
	    "B -> %second • C (1)",
	    "A -> %first • B (0)"
	  ]]
	]);

      eat("%third", "");

      assertThat(stack())
	.equalsTo([]);
    });

    it("Sentences", () => {
      const {start, next, eat, S, rules, trace, from, stack} = parse([
	["@", [term("S")]],
	["S", [term("NP"), term("VP")]],
	["S", [term("VP")]],
	["NP", [token("Det"), term("Nominal")]],
	["Nominal", [token("Noun")]],
	["VP", [token("Verb")]],
	["VP", [token("Verb"), term("NP")]],
      ]);

      start();

      assertThat(next())
	.equalsTo([
	  ["Det", 3, 0, 0],
	  ["Verb", 5, 0, 0],
	  ["Verb", 6, 0, 0],
	]);

      assertThat(trace([3, 0, 0]))
	.equalsTo([[3, 0, 0], [1, 0, 0]]);

      assertThat(stack())
	.equalsTo([
	  ["Det", [
	    "NP -> • Det Nominal (0)",
	    "S -> • NP VP (0)"
	  ]],
	  ["Verb", [
	    "VP -> • Verb (0)",
	    "S -> • VP (0)"
	  ]],
	  ["Verb", [
	    "VP -> • Verb NP (0)",
	    "S -> • VP (0)"
	  ]]
	]);

      eat("Det", "the");

      assertThat(stack())
	.equalsTo([
	  ["Noun", [
	    "Nominal -> • Noun (1)",
	    "NP -> Det • Nominal (0)",
	    "S -> • NP VP (0)"
	  ]],
	]);

      eat("Noun", "flight");

      assertThat(next())
	.equalsTo([
	  ["Verb", 5, 0, 2],
	  ["Verb", 6, 0, 2],	  
	]);

      assertThat(S[2].print()).equalsTo([
	'Nominal -> Noun • (1)',
	'NP -> Det Nominal • (0)',
	'S -> NP • VP (0)',
	'VP -> • Verb (2)',
	'VP -> • Verb NP (2)'
      ]);

      assertThat(stack())
	.equalsTo([
	  ["Verb", [
	    "VP -> • Verb (2)",
	    "S -> NP • VP (0)"
	  ]],
	  ["Verb", [
            "VP -> • Verb NP (2)",
            "S -> NP • VP (0)"
          ]]
	]);

    });
    
  });
    
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

    // return;
    
    assertThat(parser.eat("Verb", "book").print()).equalsTo([
      "VP -> Verb • (0)",
      "VP -> Verb • NP (0)",
      "NP -> • Det Nominal (1)",
      "S -> VP • (0)",
    ]);

    return;
    

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
      if (steps.length == 0) {
	return undefined;
      }
      for (let i = 0; i < steps[0].length; i++) {
	// console.log(steps[0][i]);
	const [index, dot, step] = steps[0][i];
	if (step == (parser.S.length - 1)) {
	  return [0, i, 0, 0];
	}
      }
      // The parse is incomplete.
      return undefined;
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

      // console.log(`${dot} < ${body.length} && ${offset} <= ${end}`);
      if (dot <= body.length && offset <= end) {
	// if we aren't yet at the end of the rule
	// but have no characters left, this node
	// has failed.
	return false;
      }
	
      return true;
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

      return false;

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
  
  describe("Sum", () => {
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

    const Sum = (...children) => ["Sum", ...children];
    const Product = (...children) => ["Product", ...children];
    const Factor = (...children) => ["Factor", ...children];
    const Number = (...children) => ["Number", ...children];
    const t = (name, value) => [name, value || name];

    it("1+1", () => {
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
	    assertThat(failed(next)).equalsTo(false);
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

    it("Unexpected token", () => {
      const parser = new Parser(rules);
      try {
	parser.eat("foo", "bar");
	assertThat(true).equalsTo(false);
      } catch (e) {
	assertThat(e.message).equalsTo("Unexpected token");
      }
    });

    it("1+2*4", () => {

      const parser = new Parser(rules);

      parser.eat("[0-9]", "1");
      parser.eat("+-", "+");
      parser.eat("[0-9]", "2");
      parser.eat("*/", "*");
      parser.eat("[0-9]", "4");
    
      const {
	root,
	table,
	parse,
	edges,
	move,
	failed,
	done,
	dump, 
	toString} = recognizer(parser);
      
      {
	const node = [0, 1, 0, 0];
	const e = edges(node);
	assertThat(e.map(({print}) => print())).equalsTo([
	  "0: Sum -> Sum +- Product • (5)",
	  "0: Sum -> Sum +- Product • (3)",
	  "0: Sum -> Product • (1)"
	]);
    
	assertThat(toString(move(node, e[0])))
	  .equalsTo("5: Sum -> Sum • +- Product (3)");
	assertThat(failed(move(node, e[0])))
	  .equalsTo(true);
	assertThat(toString(move(node, e[1])))
	  .equalsTo("3: Sum -> Sum • +- Product (3)");
	assertThat(failed(move(node, e[1])))
	  .equalsTo(false);
	assertThat(toString(move(node, e[2])))
	  .equalsTo("1: Sum -> Sum • +- Product (3)");
	assertThat(failed(move(node, e[2])))
	  .equalsTo(false);
	assertThat(done(move(node, e[2])))
	  .equalsTo(false);
      }
      {
	const node = [0, 1, 2, 2];
	assertThat(toString(node))
	  .equalsTo("2: Sum -> Sum +- • Product (3)");
	const e = edges(node);
	assertThat(e.map(({print}) => print()))
	  .equalsTo([
	    "2: Product -> Product */ Factor • (5)",
	    "2: Product -> Factor • (3)"
	  ]);
	assertThat(toString(move(node, e[0])))
	  .equalsTo("5: Sum -> Sum +- Product • (3)");
	assertThat(failed(move(node, e[0])))
	  .equalsTo(true);
	assertThat(toString(move(node, e[1])))
	  .equalsTo("3: Sum -> Sum +- Product • (3)");
	assertThat(failed(move(node, e[1])))
	  .equalsTo(false);
	assertThat(done(move(node, e[1])))
	  .equalsTo(true);
      }
    
      // console.log(table());
      
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
      // console.log(JSON.stringify(dump(parse(root())), undefined, 2));
      assertThat(dump(parse(root())))
	.equalsTo([
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
		  "4"
		]
	      ]
	    ]
	  ]
	]);
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
    
    it("1*2", () => {

      const parser = new Parser(rules);

      parser.eat("[0-9]", "1");
      parser.eat("*/", "*");
      parser.eat("[0-9]", "2");
      
      const {root, table, parse, dump, toString} = recognizer(parser);

      assertThat(dump(parse(root())))
	.equalsTo([
	  "Sum", [
	    "Product", [
	      "Product", [
		"Factor", [
		  "Number", [
		    "[0-9]",
		    "1"
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
		  "2"
		]
	      ]
	    ]
	  ]
	]);
    });
    
    it("(1)", () => {
      const parser = new Parser(rules);
      parser.eat("(", "(");
      parser.eat("[0-9]", "1");
      parser.eat(")", ")");
      const {parse, dump, root} = recognizer(parser);
      assertThat(dump(parse(root())))
	.equalsTo(
	  Sum(
	    Product(
	      Factor(
		t("("),
		Sum(Product(Factor(Number(t("[0-9]", "1"))))),
		t(")")
	      ))
	  ));
    });

    it("(1+2)", () => {
      const parser = new Parser(rules);
      parser.eat("(", "(");
      parser.eat("[0-9]", "1");
      parser.eat("+-", "+");
      parser.eat("[0-9]", "2");
      parser.eat(")", ")");
      const {parse, dump, root} = recognizer(parser);
      assertThat(dump(parse(root())))
	.equalsTo(
	  Sum(
	    Product(
	      Factor(
		t("("),
		Sum(
		  Sum(
		    Product(Factor(Number(t("[0-9]", "1"))))
		  ),
		  t("+-", "+"),
		  Product(Factor(Number(t("[0-9]", "2"))))
		),
		t(")")
	      ))
	  ));
    });

    it("*", () => {
      const parser = new Parser(rules);
      try {
	parser.eat("*/", "*");
	assertThat(true).equalsTo(false);
      } catch ({message}) {
	assertThat(message).equalsTo("Unexpected token");
      }
    });
  });

  describe("english", () => {

    const rules = [
      ["@", [term("S")]],
      ["S", [term("NP"), term("VP")]],
      // ["S", [term("NP"), term("VP")]],
      ["S", [term("VP")]],
      ["NP", [token("Det"), term("Nominal")]],
      ["Nominal", [token("Noun")]],
      ["VP", [token("Verb")]],
      ["VP", [token("Verb"), term("NP")]],
    ];
    
    const S = (...children) => ["S", ...children];
    const VP = (...children) => ["VP", ...children];
    const NP = (...children) => ["NP", ...children];
    const Nominal = (...children) => ["Nominal", ...children];

    const Verb = (value) => ["Verb", value];
    const Det = (value) => ["Det", value];
    const Noun = (value) => ["Noun", value];
    
    it("empty", () => {
      const parser = new Parser(rules);
      const {root} = recognizer(parser);
      assertThat(root()).equalsTo(undefined);
    });

    it("book", () => {
      const parser = new Parser(rules);
      parser.eat("Verb", "book");
      const {dump, parse, root} = recognizer(parser);
      assertThat(dump(parse(root())))
	.equalsTo(S(VP(
	  Verb("book"),
	)));
    });

    it("book that", () => {
      const parser = new Parser(rules);
      parser.eat("Verb", "book");
      parser.eat("Det", "that");
      const {root} = recognizer(parser);
      assertThat(root()).equalsTo(undefined);
    });

    it("book that flight", () => {
      const parser = new Parser(rules);
      parser.eat("Verb", "book");
      parser.eat("Det", "that");
      parser.eat("Noun", "flight");
      const {dump, parse, root} = recognizer(parser);
      assertThat(dump(parse(root())))
	.equalsTo(S(VP(
	  Verb("book"),
	  NP(
	    Det("that"),
	    Nominal(Noun("flight"))
	  )
	)));
    });

    it.skip("the flight is a mess", () => {
      const parser = new Parser(rules);
      assertThat(parser.stack()).equalsTo([]);
      parser.eat("Det", "the");
      parser.eat("Noun", "flight");
      return;
      
      parser.eat("Verb", "is");
      parser.eat("Det", "a");
      parser.eat("Noun", "mess");
      const {dump, parse, root} = recognizer(parser);
      assertThat(dump(parse(root())))
	.equalsTo(S(VP(
	  Verb("is"),
	  NP(
	    Det("a"),
	    Nominal(Noun("mess"))
	  )
	)));
    });
  });
  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
