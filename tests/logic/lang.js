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
    if (a[i] == b[i]) {
      continue;
    } else if (isVar(a[i])) {
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

function bind([name, args], bindings) {
  let result = [];
  for (let arg of args) {
    result.push(bindings[arg] || arg);
  }
  return [name, result];
}

describe("REPL", function() {
  class KB {
    constructor(kb = []) {
      this.kb = kb;
    }
    read(code) {
      const [program] = new Parser().parse(code);
      let result;
      for (const statement of program) {
        const [head, body] = statement;
        if (head == "?") {
          result = this.query(body);
        } else {
          this.push(statement);
        }
      }
      return result;
    }
    push(s) {
      this.kb.push(s);
    }
    entails(q) {
      for (const s of this.kb) {
        const binding = unify(q, s);
        if (binding) {
          // console.log(binding);
          return binding;
        }
        const [op, vars, head, body] = s;
        if (op == "every") {
          const match = new KB(body).entails(q);
          if (!match) {
            continue;
          }
          let result = this.query(head.map((s) => bind(s, match)));
          if (result) {
            //console.log(q);
            //console.log(match);
            //console.log(result);
            return Object.fromEntries(
              Object.entries(match)
                .map(([key, value]) => [key, result[value]])
                .filter(([key, value]) => key != value)
            );
          }
        }
      }
    }
    query(list) {
      // console.log(list);
      const result = {};
      for (const q of list) {
        let binding = this.entails(bind(q, result));
        if (!binding) {
          return binding;
        }
        Object.assign(result, binding);
      }
      return result;
    }
  }
  
  it("P(). P()?", function() {
    const kb = new KB();
    assertThat(kb.read("P().")).equalsTo(undefined);
    assertThat(kb.read("P()?")).equalsTo({});
  });
    
  it("P()?", function() {
    const kb = new KB();
    assertThat(kb.read("P()?")).equalsTo(undefined);
  });
    
  it("P(). Q()?", function() {
    const kb = new KB();
    assertThat(kb.read("P().")).equalsTo(undefined);
    assertThat(kb.read("Q()?")).equalsTo(undefined);
  });
    
  it("P(). Q(). P()?", function() {
    const kb = new KB();
    assertThat(kb.read("P(). Q().")).equalsTo(undefined);
    assertThat(kb.read("P()?")).equalsTo({});
  });
    
  it("P(). Q(). Q()?", function() {
    const kb = new KB();
    assertThat(kb.read("P(). Q().")).equalsTo(undefined);
    assertThat(kb.read("Q()?")).equalsTo({});
  });
  
  it("P(A). P(A)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A).")).equalsTo(undefined);
    assertThat(kb.read("P(A)?")).equalsTo({});
  });
  
  it("P(A). P(B)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A).")).equalsTo(undefined);
    assertThat(kb.read("P(B)?")).equalsTo(undefined);
  });
    
  it("P(A, B). P(A, B)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A, B).")).equalsTo(undefined);
    assertThat(kb.read("P(A, B)?")).equalsTo({});
  });
  
  it("P(). P()?", function() {
    const kb = new KB();
    assertThat(kb.read("P().")).equalsTo(undefined);
    assertThat(kb.read("P()?")).equalsTo({});
  });
  
  it("P(). Q(). P() Q()?", function() {
    const kb = new KB();
    assertThat(kb.read("P(). Q().")).equalsTo(undefined);
    assertThat(kb.read("P() Q()?")).equalsTo({});
  });
  
  it("P(A). Q(B). P(A) Q(B)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(kb.read("P(A) Q(B)?")).equalsTo({});
  });
  
  it("P(A). Q(B). P(A) R(B)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(kb.read("P(A) R(B)?")).equalsTo(undefined);
  });

  it("P(u). P(x)?", function() {
    assertThat(new KB().read(`
      P(u).
      P(x)?
    `)).equalsTo({"x": "u"});
  });
  
  it("P() + P() = P()", () => {
    assertThat(unify(["P", []], ["P", []])).equalsTo({});
    assertThat(bind(["P", []], {})).equalsTo(["P", []]);
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
    assertThat(bind(["P", ["A"]], {})).equalsTo(["P", ["A"]]);
  });
  
  it("P(A, B) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["A", "B"]], ["P", ["A", "B"]])).equalsTo({});
    assertThat(bind(["P", ["A", "B"]], {})).equalsTo(["P", ["A", "B"]]);
  });
  
  it("P(a) + P(A) = {}", () => {
    assertThat(unify(["P", ["a"]], ["P", ["A"]])).equalsTo({"a": "A"});
    assertThat(bind(["P", ["a"]], {"a": "A"})).equalsTo(["P", ["A"]], {"a": "A"});
  });
  
  it("P(A) + P(a) = {}", () => {
    assertThat(unify(["P", ["A"]], ["P", ["a"]])).equalsTo({"a": "A"});
    assertThat(bind(["P", ["A"]], {"a": "A"})).equalsTo(bind(["P", ["a"]], {"a": "A"}));
  });
  
  it("P(A, b) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["A", "b"]], ["P", ["A", "B"]])).equalsTo({"b": "B"});
    assertThat(bind(["P", ["A", "b"]], {"b": "B"})).equalsTo(bind(["P", ["A", "B"]], {"b": "B"}));
  });
  
  it("P(A, B) + P(A, b) = {}", () => {
    assertThat(unify(["P", ["A", "B"]], ["P", ["A", "b"]])).equalsTo({"b": "B"});
    assertThat(bind(["P", ["A", "B"]], {"b": "B"})).equalsTo(bind(["P", ["A", "b"]], {"b": "B"}));
  });
  
  it("P(a, b) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["a", "b"]], ["P", ["A", "B"]])).equalsTo({"a": "A", "b": "B"});
    assertThat(bind(["P", ["a", "b"]], {"a": "A", "b": "B"}))
      .equalsTo(bind(["P", ["A", "B"]], {"a": "A", "b": "B"}));
  });
  
  it("P(a, a) + P(A, A) = {}", () => {
    assertThat(unify(["P", ["a", "a"]], ["P", ["A", "A"]])).equalsTo({"a": "A"});
    assertThat(bind(["P", ["a", "a"]], {"a": "A"}))
      .equalsTo(bind(["P", ["A", "A"]], {"a": "A"}));
  });
  
  it("P(a, a) + P(A, B) = {}", () => {
    assertThat(unify(["P", ["a", "a"]], ["P", ["A", "B"]])).equalsTo(false);
  });

  it("P(A). P(a)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A).")).equalsTo(undefined);
    assertThat(kb.read("P(a)?")).equalsTo({"a": "A"});
  });

  it("P(A, B). P(a, b)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A, B).")).equalsTo(undefined);
    assertThat(kb.read("P(a, b)?")).equalsTo({"a": "A", "b": "B"});
  });

  it("P(A, B). P(A, b)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A, B).")).equalsTo(undefined);
    assertThat(kb.read("P(A, b)?")).equalsTo({"b": "B"});
  });

  it("P(A). Q(A). P(a) Q(a)?", function() {
    assertThat(new KB().read(`
      P(A). Q(A).
      P(a) Q(a)?
    `)).equalsTo({"a": "A"});
  });

  it("P(a). Q(a). P(b) Q(b)?", function() {
    assertThat(new KB().read(`
      P(a). Q(a).
      P(b) Q(b)?
    `)).equalsTo({"b": "a"});
  });

  it("P(A). P(a) Q(a)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A).")).equalsTo(undefined);
    assertThat(kb.read("P(a) Q(a)?")).equalsTo(undefined);
  });

  it("P(A). Q(B). P(a) Q(a)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(kb.read("P(a) Q(a)?")).equalsTo(undefined);
  });

  it("P(A). Q(B). P(a) Q(b)?", function() {
    const kb = new KB();
    assertThat(kb.read("P(A). Q(B).")).equalsTo(undefined);
    assertThat(kb.read("P(a) Q(b)?")).equalsTo({"a": "A", "b": "B"});
  });

  it("Sam(u). Dani(v). loves(u, v). Sam(a) Dani(b) loves(a, b)?", function() {
    const kb = new KB();
    assertThat(kb.read("Sam(u). Dani(v). loves(u, v).")).equalsTo(undefined);
    // Does Sam love Dani?
    assertThat(kb.read("Sam(a) Dani(b) loves(a, b)?"))
      .equalsTo({"a": "u", "b": "v"});
  });

  it("Sam(u). Dani(v). loves(u, v). Sam(a) loves(a, b) ?", function() {
    const kb = new KB();
    assertThat(kb.read("Sam(u). Dani(v). loves(u, v).")).equalsTo(undefined);
    // Who does Sam love?
    assertThat(kb.read("Sam(a) loves(a, b)?"))
      .equalsTo({"a": "u", "b": "v"});
  });

  it("Sam(u). Dani(v). loves(u, v). Sam(a) loves(a, b) ?", function() {
    const kb = new KB();
    assertThat(kb.read("Sam(u). Dani(v). loves(u, v).")).equalsTo(undefined);
    // Who loves Dani?
    assertThat(kb.read("Dani(b) loves(a, b)?"))
      .equalsTo({"a": "u", "b": "v"});
  });

  it("P(u). for (every a: P(a)) Q(a). Q(v)?", function() {
    assertThat(new KB().read(`
      for (every a: P(a)) Q(a).
      P(u).
      Q(v)?
    `)).equalsTo({"v": "u"});
  });

  it("for (every a: P(a)) Q(a). P(u). U(u). U(x) Q(x)?", function() {
    assertThat(new KB().read(`
      for (every a: P(a)) Q(a).
      P(u). U(u).
      U(x) Q(x)?
    `)).equalsTo({"x": "u"});
  });

  it("for (every a: man(a)) mortal(a). Socrates(u). man(u). Socrates(v) mortal(v)?", function() {
    assertThat(new KB().read(`
      // Every man is mortal.
      for (every a: man(a)) mortal(a).

      // There is a man u, whose name is Socrates.
      Socrates(u). man(u).

      // Is there a man v, whose name is Socrates and who is mortal?
      Socrates(v) mortal(v)?
    `)).equalsTo({"v": "u"});
  });

  it.skip("for (every a: P(a)) Q(a). for (every a: Q(a)) R(a). P(u). R(v)?", function() {
    assertThat(new KB().read(`
      for (every a: P(a)) Q(a).
      for (every a: Q(a)) R(a).
      P(u).
      R(v)?
    `)).equalsTo({"v": "v"});
  });

  it("for (every a: P(a)) { Q(a). R(a).} P(u). R(v)?", function() {
    assertThat(new KB().read(`
      for (every a: P(a)) { Q(a). R(a). }
      P(u).
      R(v)?
    `)).equalsTo({"v": "u"});
  });

  it.skip("for (every a: {P(a). Q(a).}) R(a). P(u). Q(u). R(v)?", function() {
    assertThat(new KB().read(`
      for (every a: {P(a). Q(a).}) R(a).
      P(x). R(y).
      R(v)?
    `)).equalsTo({"u": "v"});
  });

  function assertThat(x) {
    return {
      equalsTo(y) {
        Assert.deepEqual(x, y);
      }
    }
  }
});

