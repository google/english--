const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Term Logic", function() {
  const grammar = `
      @builtin "whitespace.ne"
      @builtin "number.ne"

      main -> _ (sentence _):+ {%
                ([ws1, sentences, ws2]) => {
                   return sentences.flat().filter(x => x != null);
                } 
      %}

      sentence -> proposition _ "." {% id %}
      sentence -> question _ "?" {% id %}

      question -> "are" _ copula _ term _ term {%
        ([are, ws1, copula, ws2, term1, ws3, term2]) => {
            return ["question", copula, term1, term2];
        } 
      %}

      proposition -> copula _ term _ "are" _ term {%
        ([copula, ws1, term1, ws2, are, ws3, term2]) => {
            return [copula, term1, term2];
        } 
      %}

      copula -> "all" {% id %} 
              | "some" {% id %}
              | "no" {% id %}
              | "not" _ "all" {% () => "not-all" %}
 
      term -> word {% id %}

      word -> [a-zA-Z]:+ {% ([args]) => args.join("") %}
      `;

  it("Parser", function() {
     let parser = Nearley.from(grammar);
    
    assertThat(parser.feed(`
      all men are mortal.
      some men are philosophers.
      no philosophers are rich.
      not all men are philosophers.
      are all men mortal?
    `)).equalsTo([[
      ["all", "men", "mortal"],
      ["some", "men", "philosophers"],
      ["no", "philosophers", "rich"],
      ["not-all", "men", "philosophers"],
      ["question", "all", "men", "mortal"],
    ]]);
  });

  const profiles = {
    "all": {left: "downward", right: "upward"},
    "some": {left: "upward", right: "upward"},
    "no": {left: "downward", right: "downward"},
    "not-all": {left: "upward", right: "downward"},
  };
  
  function *reason(kb, question) {
    let [type, quantifier, a, c] = question;
    if (profiles[quantifier].right == "upward") {
      for (let major of kb) {
        if (major[0] == quantifier && a == major[1]) {
          for (let minor of kb) {
            if (minor[0] == "all" &&
                minor[1] == major[2] &&
                minor[2] == c) {
              // right-side upward monotone
              yield "right-up";
            }
          }
        }
      }
    } else if (profiles[quantifier].right == "downward") {
      for (let major of kb) {
        if (major[0] == quantifier && a == major[1]) {
          for (let minor of kb) {
            if (minor[0] == "all" &&
                minor[1] == c &&
                minor[2] == major[2]) {
              // right-side downward monotone
              yield "right-down";
            }
          }
        }
      }
    }

    // console.log(quantifier);
    // cosole.log("hi");
    if (profiles[quantifier].left == "upward") {
      // console.log("hi");
      for (let major of kb) {
        if (major[0] == quantifier && question[3] == major[2]) {
          for (let minor of kb) {
            // console.log(minor[2]);
            if (minor[0] == "all" &&
                minor[1] == major[1] &&
                minor[2] == question[2]) {
              // left-side upward monotone
              yield "left-up";
            }
          }
        }
      }
    }
  }

  it("all humans are mortal. all greeks are humans. are all greeks mortal?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      all humans are mortal.
      all greeks are humans.
      are all greeks mortal?
    `);

    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "right-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("no penguins are fliers. all seaguls are fliers. are no penguins seaguls?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      no penguins are fliers.
      all seaguls are fliers.
      are no penguins seaguls?
    `);

    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "right-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("not all birds are fliers. all seaguls are fliers. are not all birds seaguls?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      not all birds are fliers.
      all seaguls are fliers.
      are not all birds seaguls?
    `);

    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "right-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("some philosophers are rich. all philosophers are greeks. are some greeks rich?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      some philosophers are rich.
      all philosophers are greeks.
      are some greeks rich?
    `);

    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      },
    }
  }
});

