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

      sentence -> copula _ term _ "are" _ term _ "." {%
        ([copula, ws1, term1, ws2, are, ws3, term2]) => {
            return [copula, term1, term2];
        } 
      %}

      sentence -> "some" _ term _ "are" _ "not" _ term _ "." {%
        ([some, ws1, term1, ws2, are, ws3, not, ws4, term2]) => {
            return ["some-arent", term1, term2];
        } 
      %}

      copula -> "all" {% id %} 
              | "some" {% id %}
              | "no" {% id %}
 
      term -> word {% id %}

      word -> [a-zA-Z]:+ {% ([args]) => args.join("") %}
      `;
  it("Basic", function() {
     let parser = Nearley.from(grammar);
    
    assertThat(parser.feed(`
      all men are mortal.
      some men are philosophers.
      no philosophers are rich.
      some men are not philosophers.
    `)).equalsTo([[
      ["all", "men", "mortal"],
      ["some", "men", "philosophers"],
      ["no", "philosophers", "rich"],
      ["some-arent", "men", "philosophers"],
    ]]);
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      },
    }
  }
});

