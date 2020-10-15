const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe.only("Term Logic", function() {
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

      copula -> "all" {% () => ["all"] %} 
              | "some" {% () => ["some"] %}
              | "no" {% () => ["no"] %}
              | "not" _ "all" {% () => ["not-all"] %}
              | "at" _ "most" _ unsigned_int {% () => ["at-most"] %}
 
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
      at most 3 men are philosophers.
      are all men mortal?
    `)).equalsTo([[
      [["all"], "men", "mortal"],
      [["some"], "men", "philosophers"],
      [["no"], "philosophers", "rich"],
      [["not-all"], "men", "philosophers"],
      [["at-most"], "men", "philosophers"],
      ["question", ["all"], "men", "mortal"],
    ]]);
  });

  const profiles = {
    "all": {left: "downward", right: "upward", symmetric: false},
    "some": {left: "upward", right: "upward", symmetric: true},
    "no": {left: "downward", right: "downward", symmetric: true},
    "not-all": {left: "upward", right: "downward", symmetric: false},
  };
  
  function *reason(kb, question, path = []) {
    let [[quantifier], a, c] = question;
    // console.log(question);
    // console.log(`${question}? from: ${path}`);
    
    if (path.find(([[op], p, q]) =>
                  question[0][0] == op &&
                  question[1] == p &&
                  question[2] == q)) {
      return false;
    }
    
    for (let sentence of kb) {
      if (sentence[0][0] == question[0][0] &&
          sentence[1] == question[1] &&
          sentence[2] === question[2]) {
        return true;
      }
    }

    function query(q) {
      path.push(question);
      let {done, value} = reason(kb, q, path).next();
      path.pop();
      return value;
    }

    if (profiles[quantifier].right == "upward") {
      for (let major of kb) {
        if (major[0] == quantifier && a == major[1]) {
          if (query([["all"], major[2], c])) {
            // right-side upward monotone
            yield "right-up";
          }
        }
      }
    } else if (profiles[quantifier].right == "downward") {
      for (let major of kb) {
        if (major[0] == quantifier && a == major[1]) {
          if (query([["all"], c, major[2]])) {
            // right-side downward monotone
            yield "right-down";
          }
        }
      }
    }

    if (profiles[quantifier].left == "upward") {
      for (let major of kb) {
        if (major[0] == quantifier && question[2] == major[2]) {
          if (query([["all"], major[1], question[1]])) {
            // right-side downward monotone
            yield "left-up";
          }
        }
      }
    } else if (profiles[quantifier].left == "downward") {
      for (let major of kb) {
        if (major[0] == quantifier && question[2] == major[2]) {
          if (query([["all"], question[1], major[1]])) {
            // left-side downward monotone
            yield "left-down";
          }
        }
      }
    }
    
    // Symmetry
    if (profiles[quantifier].symmetric) {
      if (query([question[0], question[2], question[1]])) {
        yield "symmetry";
      }
    }

    // Existential Import
    if (question[0][0] == "some") {
      for (let [op, major, minor] of kb) {
        if (query([["all"], question[1], question[2]])) {
          yield "existential import";
        }
      }
    }
  }

  it("Trivial: all As are Bs. are all As Bs?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
      all As are Bs.
      are all As Bs?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: true, value: true});
  });

  it("Symmetry: no As are Bs. are no Bs As?", function() {
    // Symmetry
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
      no As are Bs.
      are no Bs As?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "symmetry"});    
    assertThat(result.next()).equalsTo({done: true, value: undefined});    
  });

  it("Existential Import: all As are Bs. are some As Bs?", function() {
    // Existential Import
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
      all As are Bs.
      are some As Bs?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "existential import"});    
    assertThat(result.next()).equalsTo({done: true, value: undefined});    
  });
  
  it("all humans are mortals. all greeks are humans. are all greeks mortals?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      all humans are mortals.
      all greeks are humans.
      are all greeks mortals?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "right-up"});
    assertThat(result.next()).equalsTo({done: false, value: "left-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("no penguins are fliers. all seaguls are fliers. are no penguins seaguls?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      no penguins are fliers.
      all seaguls are fliers.
      are no penguins seaguls?
    `);

    question.shift();
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

    question.shift();
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

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("no reptiles are mammals. all snakes are reptiles. are no snakes mammals?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        no reptiles are mammals. 
        all snakes are reptiles. 
        are no snakes mammals?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("all mammals are animals. no plants are animals. are no plants mammals?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all mammals are animals. 
        no plants are animals. 
        are no plants mammals?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "right-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("all humans are mortals. some humans are rich. are some mortals rich?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all humans are mortals. 
        some humans are rich. 
        are some mortals rich?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });
  
  it("no animals are plants. are no plants animals?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        no animals are plants.
        are no plants animals?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "symmetry"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("some birds are fliers. are some fliers birds?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        some birds are fliers.
        are some fliers birds?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "symmetry"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });
  
  it("not all birds are fliers. are not all fliers birds?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        not all birds are fliers.
        are not all fliers birds?
    `);

    question.shift();
    let result = reason([first], question);

    // TODO: not-all doesn't seem to be symmetric. sanity check?
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });
  
  it("all men are mortals. are all mortals men?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        all men are mortals.
        are all mortals men?
    `);

    question.shift();
    let result = reason([first], question);

    // TODO: all doesn't seem to be symmetric. sanity check?
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("cycle", function() {
    let result = reason([],
                        ["all", "men", "mortals"],
                        [["all", "men", "mortals"]]);
    assertThat(result.next()).equalsTo({done: true, value: false});
  });
  
  it("all men are mortals. are some men mortals?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        all men are mortals.
        are some men mortals?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "existential import"});
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

