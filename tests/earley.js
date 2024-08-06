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
	const name = rules[index][0];
	const body = rules[index][1]
	      .map(([type, name], i) => `${i == dot ? "• " : ""}${name}`)
	      .join(" ");
	
	const completed = dot == rules[index][1].length ? " •" : "";
      
	return name + " -> " + body + completed + " (" + state + ")"
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

  });

  it("Null", () => {
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
