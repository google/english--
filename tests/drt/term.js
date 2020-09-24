const Assert = require("assert");
const {Nearley} = require("../../src/drt/parser.js");

describe("Term Logic", function() {
  const grammar = `
      @builtin "whitespace.ne"

      main -> _ (statement _):+ {%
                ([ws1, statements, ws2]) => {
                   return statements.flat().filter(x => x != null);
                } 
      %}
      statement -> term __ "->" __ term _ "." {% 
                   ([s, ws1, op, ws2, p]) => {
                     return [s, "->", p];
                   } 
      %}
      term -> [a-z]:+ {% 
              ([args]) => {
                return args.join("");
              }  
      %}
    `;

  it("Basic", function() {
     let parser = Nearley.from(grammar);
     assertThat(parser.feed("foo -> bar.")).equalsTo([[["foo", "->", "bar"]]]);
  });

  it("Two", function() {
     let parser = Nearley.from(grammar);
     assertThat(parser.feed("foo -> bar. hello -> world."))
          .equalsTo([[
              ["foo", "->", "bar"],
              ["hello", "->", "world"],
          ]]);
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
       Assert.deepEqual(x, y);
      }
    }
  }
});

