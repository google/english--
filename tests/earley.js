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
  it("Terms", function() {
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

  });

  class Parser {
    constructor(rules = []) {
      this.rules = rules;
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
	  result.push([i, 0, step]);
	  const [type, next] = body[0];
	  if (type == "term") {
	    terms.push(next);
	  }
	}
      };
      
      return result;
    }

    scan(set, token) {
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

    const token = (t) => ["token", t];
    const term = (t) => ["term", t];
    
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

    const S = [];

    const parser = new Parser(rules);
    
    const S0 = parser.predict([[0, 0, 0]], 0);
    S.push(S0);

    function print([index, dot, state]) {
      const name = rules[index][0];
      const body = rules[index][1]
	    .map(([type, name], i) => `${i == dot ? "• " : ""}${name}`)
	    .join(" ");

      const completed = dot == rules[index][1].length ? " •" : "";
      
      return name + " -> " + body + completed + " (" + state + ")"
    }
    
    assertThat(S0.map(print)).equalsTo([
      "S -> • NP VP (0)",
      "S -> • NP VP (0)",
      "S -> • VP (0)",
      "NP -> • Det Nominal (0)",
      "NP -> • Det Nominal (0)",
      "VP -> • Verb (0)",
      "VP -> • Verb NP (0)",
    ]);

    const S1 = parser.scan(S[0], "Verb");
    S.push(S1);

    assertThat(S1.map(print)).equalsTo([
      "VP -> Verb • (0)",
      "VP -> Verb • NP (0)",
    ]);

    assertThat(parser.predict(S1, 1).map(print)).equalsTo([
      "NP -> • Det Nominal (1)",
    ]);
    
    S1.push(...parser.predict(S1, 1));
    assertThat(S1.map(print)).equalsTo([
      "VP -> Verb • (0)",
      "VP -> Verb • NP (0)",
      "NP -> • Det Nominal (1)",
    ]);

    const S2 = parser.scan(S[1], "Det");
    S.push(S2);
    
    assertThat(S2.map(print)).equalsTo([
      "NP -> Det • Nominal (1)"
    ]);

    S2.push(...parser.predict(S2, 2));

    assertThat(S2.map(print)).equalsTo([
      "NP -> Det • Nominal (1)",
      "Nominal -> • Noun (2)"
    ]);

    const S3 = parser.scan(S[2], "Noun");
    S.push(S3);
    
    assertThat(S3.map(print)).equalsTo([
      "Nominal -> Noun • (2)",
    ]);
    
    assertThat(parser.complete(S, S3).map(print)).equalsTo([
      "NP -> Det Nominal • (1)",
      "VP -> Verb NP • (0)",
      "S -> VP • (0)",
    ]);
  });

  
  
  it("", () => {
    // Sum     -> Sum [+-] Product
    // Sum     -> Product
    // Product -> Product [*/] Factor
    // Product -> Factor
    // Factor  -> '(' Sum ')'
    // Factor  -> Number
    // Number  -> [0-9] Number
    // Number  -> [0-9]

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
    
  });
  
});

function assertThat(x) {
 return {
  equalsTo(y) {
   Assert.deepEqual(x, y);
  }
 }
}
