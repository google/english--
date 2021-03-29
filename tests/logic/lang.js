const Assert = require("assert");
const {Parser} = require("logic/src/parser.js");

function isVar(arg) {
  return arg.match(/[a-z]+/);
}

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

  const result = {};
  
  for (var i = 0; i < a.length; ++i) {
    if (isVar(a[i])) {
      if (result[a[i]] && result[a[i]] != b[i]) {
        // conflict
        return false;
      }
      result[a[i]] = b[i];
    } else if (isVar(b[i])) {
      if (result[b[i]] && result[b[i]] != a[i]) {
        // conflict
        return false;
      }
      result[b[i]] = a[i];
    } else if (a[i] !== b[i]) {
      // constant conflict
      return false;
    }
  }

  return result;
}

function unify(a, b) {
  if (a[0] != b[0]) {
    return false;
  }
  return arrayEquals(a[1], b[1]);
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
        const match = unify(s, q);
        if (match) {
          return match;
        }
      }
    }
    query(list) {
      const result = {};
      for (const q of list) {
        let match = this.entails(q);
        if (!match) {
          return match;
        }
        Object.assign(result, match);
      }
      return result;
    }
  }
  
  it("P(). P()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P().")).equalsTo(undefined);
    assertThat(engine.read("P()?")).equalsTo({});
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
    assertThat(engine.read("P()?")).equalsTo({});
  });
    
  it("P(). Q(). Q()?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(). Q().")).equalsTo(undefined);
    assertThat(engine.read("Q()?")).equalsTo({});
  });
  
  it("P(A). P(A)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(A)?")).equalsTo({});
  });
  
  it("P(A). P(B)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(B)?")).equalsTo(undefined);
  });
    
  it("P(A, B). P(A, B)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A, B).")).equalsTo(undefined);
    assertThat(engine.read("P(A, B)?")).equalsTo({});
  });
  
  it("P(). question() { P(). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P().")).equalsTo(undefined);
    assertThat(engine.read("question() {P().}?")).equalsTo({});
  });
  
  it("P(). Q(). question() { P(). Q(). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(). Q().")).equalsTo(undefined);
    assertThat(engine.read("question() {P(). Q().}?")).equalsTo({});
  });
  
  it("P(A). Q(B). question() { P(A). Q(B). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(engine.read("question() {P(A). Q(B).}?")).equalsTo({});
  });
  
  it("P(A). Q(B). question() { P(A). R(B). }?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(engine.read("question() {P(A). R(B).}?")).equalsTo(undefined);
  });

  it("P() + P() = P()", () => {
    assertThat(unify(["P", []], ["P", []])).equalsTo({});
  });

  it("P() + Q() = false", () => {
    assertThat(unify(["P", []], ["Q", []])).equalsTo(false);
  });

  it("P(A) + P() = false", () => {
    assertThat(unify(["P", ["A"]], ["P", []])).equalsTo(false);
  });

  it("P() + P(A) = false", () => {
    assertThat(unify(["P", []], ["P", ["A"]])).equalsTo(false);
  });

  it("P(A) + P(A) = {}", () => {
    assertThat(unify(["P", ["A"]], ["P", ["A"]])).equalsTo({});
  });
  
  it("P(A, B) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["A", "B"]], ["P", ["A", "B"]])).equalsTo({});
  });
  
  it("P(a) + P(A) = {}", () => {
    assertThat(unify(["P", ["a"]], ["P", ["A"]])).equalsTo({"a": "A"});
  });
  
  it("P(A) + P(a) = {}", () => {
    assertThat(unify(["P", ["A"]], ["P", ["a"]])).equalsTo({"a": "A"});
  });
  
  it("P(A, b) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["A", "b"]], ["P", ["A", "B"]])).equalsTo({"b": "B"});
  });
  
  it("P(A, B) + P(A, b) = {}", () => {
    assertThat(unify(["P", ["A", "B"]], ["P", ["A", "b"]])).equalsTo({"b": "B"});
  });
  
  it("P(a, b) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["a", "b"]], ["P", ["A", "B"]])).equalsTo({"a": "A", "b": "B"});
  });
  
  it("P(a, a) + P(A, A) = {}", () => {
    assertThat(unify(["P", ["a", "a"]], ["P", ["A", "A"]])).equalsTo({"a": "A"});
  });
  
  it("P(a, a) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["a", "a"]], ["P", ["A", "B"]])).equalsTo(false);
  });
  
  it("P(A). P(a)?", function() {
    const engine = new Engine();
    assertThat(engine.read("P(A).")).equalsTo(undefined);
    assertThat(engine.read("P(a)?")).equalsTo({"a": "A"});
  });
  
  function assertThat(x) {
    return {
      equalsTo(y) {
        Assert.deepEqual(x, y);
      }
    }
  }
});

