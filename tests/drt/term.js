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
              | "only" {% () => ["only"] %}
              | "at" _ "most" _ unsigned_int {% 
               ([at, ws1, most, ws2, num]) => ["at-most", num] %}
              | "at" _ "least" _ unsigned_int {% 
               ([at, ws1, most, ws2, num]) => ["at-least", num] %}
              | "fewer" _ "than" _ unsigned_int {% 
               ([fewer, ws1, than, ws2, num]) => ["fewer-than", num] %}
              | "more" _ "than" _ unsigned_int {% 
               ([more, ws1, than, ws2, num]) => ["more-than", num] %}
              | unsigned_int {% 
               ([num]) => ["exactly", num] %}
 
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
      at most 1 men are philosophers.
      at least 2 men are philosophers.
      fewer than 3 men are philosophers.
      more than 4 men are philosophers.
      5 men are philosophers.
      only citizens are voters.
      are all men mortal?
    `)).equalsTo([[
      [["all"], "men", "mortal"],
      [["some"], "men", "philosophers"],
      [["no"], "philosophers", "rich"],
      [["not-all"], "men", "philosophers"],
      [["at-most", 1], "men", "philosophers"],
      [["at-least", 2], "men", "philosophers"],
      [["fewer-than", 3], "men", "philosophers"],
      [["more-than", 4], "men", "philosophers"],
      [["exactly", 5], "men", "philosophers"],
      [["only"], "citizens", "voters"],
      ["question", ["all"], "men", "mortal"],
    ]]);
  });

  const profiles = {
    "all": {left: "downward", right: "upward", symmetric: false},
    "some": {left: "upward", right: "upward", symmetric: true},
    "no": {left: "downward", right: "downward", symmetric: true},
    "not-all": {left: "upward", right: "downward", symmetric: false},
    "only": {left: "upward", right: "downward", symmetric: false},
    "at-most": {left: "downward", right: "downward", symmetric: false},
    "at-least": {left: "upward", right: "upward", symmetric: true},
    "fewer-than": {left: "downward", right: "downward", symmetric: false},
    "more-than": {left: "upward", right: "upward", symmetric: true},
    "exactly": {left: false, right: false, symmetric: true},
  };
  
  function *reason(kb, [[op, num], major, minor], path = []) {
    // console.log(`${op} ${major} ${minor}? from: ${path}`);
    
    function same([[r, s], p, q]) {
      return r == op &&
        p == major &&
        q === minor; 
    }

    if (path.find(same)) {
      return false;
    }

    if (kb.find(same)) {
      return true;
    }
    
    function query(q) {
      path.push([[op], major, minor]);
      let {done, value} = reason(kb, q, path).next();
      path.pop();
      return value;
    }

    if (profiles[op].right == "upward") {
      for (let s of kb) {
        if (s[0][0] == op && s[0][1] == num & major == s[1]) {
          if (query([["all"], s[2], minor])) {
            // right-side upward monotone
            yield "right-up";
          }
        }
      }
    } else if (profiles[op].right == "downward") {
      for (let s of kb) {
        if (s[0][0] == op && s[0][1] == num && major == s[1]) {
          if (query([["all"], minor, s[2]])) {
            // right-side downward monotone
            yield "right-down";
          }
        }
      }
    }

    if (profiles[op].left == "upward") {
      for (let s of kb) {
        if (s[0][0] == op && s[0][1] == num && minor == s[2]) {
          if (query([["all"], s[1], major])) {
            // right-side downward monotone
            yield "left-up";
          }
        }
      }
    } else if (profiles[op].left == "downward") {
      for (let s of kb) {
        // console.log(num);
        if (s[0][0] == op && s[0][1] == num && minor == s[2]) {
          if (query([["all"], major, s[1]])) {
            // left-side downward monotone
            yield "left-down";
          }
        }
      }
    }
    
    // Symmetry
    if (profiles[op].symmetric) {
      if (query([[op], minor, major])) {
        yield "symmetry";
      }
    }

    // Existential Import
    if (op == "some") {
      if (query([["all"], major, minor])) {
        yield "existential import";
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

  it("all engineers are employees. at most 3 employees are promoted. are at most 3 engineers promoted?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all engineers are employees. 
        at most 3 employees are promoted. 
        are at most 3 engineers promoted?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("at least 3 employees are millionaires. all employees are engineers. are at least 3 engineers millionaires?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all employees are engineers. 
        at least 3 employees are millionaires. 
        are at least 3 engineers millionaires?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("all engineers are employees. fewer than 3 employees are promoted. are fewer than 3 engineers promoted?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all engineers are employees. 
        fewer than 3 employees are promoted. 
        are fewer than 3 engineers promoted?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-down"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("more than 3 employees are millionaires. all employees are engineers. are more than 3 engineers millionaires?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
        all employees are engineers. 
        more than 3 employees are millionaires. 
        are more than 3 engineers millionaires?
    `);

    question.shift();
    let result = reason([first, second], question);

    assertThat(result.next()).equalsTo({done: false, value: "left-up"});
    assertThat(result.next()).equalsTo({done: true, value: undefined});
  });

  it("2 players are brazilians. are 2 brazilians players?", function() {
    let parser = Nearley.from(grammar);

    let [[first, question]] = parser.feed(`
        2 players are brazilians. 
        are 2 brazilians players?
    `);

    question.shift();
    let result = reason([first], question);

    assertThat(result.next()).equalsTo({done: false, value: "symmetry"});
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

  it("only philosophers are wise. all philosophers are greeks. are only greeks wise?", function() {
    let parser = Nearley.from(grammar);

    let [[first, second, question]] = parser.feed(`
      only philosophers are wise.
      all philosophers are greeks.
      are only greeks wise?
    `);

    question.shift();
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

