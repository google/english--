const Assert = require("assert");
const {Parser} = require("logic/src/parser.js");

function arrayEquals(a, b) {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function equalsTo(a, b) {
  return a[0] == b[0] &&
    arrayEquals(a[1], b[1]);
}

describe.only("REPL", function() {
  class Engine {
    constructor() {
      this.kb = [];
    }
    read(code) {
      const [program] = new Parser().parse(code);
      let result;
      for (const statement of program) {
        const [head, body] = statement;
        if (head == "?") {
          result = this.query(typeof body[0] == "string" ? [body] : body);
        } else {
          this.kb.push(statement);
        }
      }
      return result;
    }
    entails(q) {
      for (const s of this.kb) {
        if (equalsTo(s, q)) {
          return true;
        }
      }
    }
    query(list) {
      for (const q of list) {
        let result = this.entails(q);
        if (!result) {
          return result;
        }
      }
      return true;
    }
  }
  
  it("P(). P()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P().")).equalsTo(undefined);
    assertThat(engine.read("P()?")).equalsTo(true);
  });
    
  it("P()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P()?")).equalsTo(undefined);
  });
    
  it("P(). Q()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P().")).equalsTo(undefined);
    assertThat(engine.read("Q()?")).equalsTo(undefined);
  });
    
  it("P(). Q(). P()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(). Q().")).equalsTo(undefined);
    assertThat(engine.read("P()?")).equalsTo(true);
  });
    
  it("P(). Q(). Q()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(). Q().")).equalsTo(undefined);
    assertThat(engine.read("Q()?")).equalsTo(true);
  });
  
  it("P(A). P(A)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(A)?")).equalsTo(true);
  });
  
  it("P(A). P(B)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(B)?")).equalsTo(undefined);
  });
    
  it("P(A, B). P(A, B)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A, B).")).equalsTo(undefined);
    assertThat(engine.read("P(A, B)?")).equalsTo(true);
  });
  
  it("P(). question() { P(). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P().")).equalsTo(undefined);
    assertThat(engine.read("question() {P().}?")).equalsTo(true);
  });
  
  it("P(). Q(). question() { P(). Q(). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(). Q().")).equalsTo(undefined);
    assertThat(engine.read("question() {P(). Q().}?")).equalsTo(true);
  });
  
  it("P(A). Q(B). question() { P(A). Q(B). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(engine.read("question() {P(A). Q(B).}?")).equalsTo(true);
  });
  
  it("P(A). Q(B). question() { P(A). R(B). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(engine.read("question() {P(A). R(B).}?")).equalsTo(undefined);
  });
  
  it.skip("P(A). P(a)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(a)?")).equalsTo(true);
  });
  
  function assertThat(x) {
    return {
      equalsTo(y) {
        Assert.deepEqual(x, y);
      }
    }
  }
});

