const Assert = require("assert");
const logic = require("../src/grammar.js");
const {Forward, normalize, stringify, equals, explain, toString} = require("../src/forward.js");
const {Parser, Rule} = require("../src/parser.js");
const {Reasoner} = require("../src/fol.js");
const {rewrite} = require("../src/unify.js");

const {
  program, 
  forall, 
  exists, 
  implies, 
  predicate, 
  func,
  binary, 
  literal, 
  constant, 
  and, 
  or, 
  negation,
  argument} = Parser;

describe("First Order Logic", function() {
  it("forall (x) P(x). P(a)?", function() {
    // universal introduction.
    assertThat("forall (x) P(x).")
      .proving("P(a)?")
      .equalsTo(`
       forall (x) P(x).
       P(a).
     `)
      .done();
  });
  
  it("forall (x) P(x) && Q(x). P(a)?", function() {
    // universal introduction.
    assertThat("forall (x) P(x) && Q(x).")
      .proving("P(a)?")
      .equalsTo(`
       forall (x = a) P(x) && Q(x).
       P(a).
     `)
      .done();
  });
  
  it("forall (x) P(x). P(a)?", function() {
    assertThat("forall (x) P(x).")
      .proving("P(a)?")
      .equalsTo("forall (x) P(x). P(a).")
      .done();
  });
  
  it("forall (x) p(x) => q(x). p(a). q(a)?", function() {
    assertThat("forall (x) p(x) => q(x). p(a).")
      .proving("q(a)?")
      .equalsTo(`
       p(a).
       forall (x = a) p(x) => q(x).
       q(a).
     `)
      .done();
  });
  
  it("forall (x) p(x) => q(x). p(a). exists (y) q(y)?", function() {
    assertThat("forall (x) p(x) => q(x). p(a).")
      .proving("exists (y) q(y)?")
      .equalsTo(`
       p(a).
       exists (x = a) p(x).
       forall (x = a) p(x) => q(x).
       exists (y = a) q(y).
     `)
      .done();
  });

  it("forall (x) P(x, b). P(a, b)?", function() {
    assertThat("forall (x) P(x, b).")
      .proving("P(a, b)?")
      .equalsTo("forall (x) P(x, b). P(a, b).")
      .done();
  });
  
  it("forall (x) P(x) && Q(x). P(a)?", function() {
    // universal conjunction elimination.
    assertThat("forall (x) P(x) && Q(x).")
      .proving("P(a)?")
      .equalsTo("forall (x = a) P(x) && Q(x). P(a).")
      .done();
    assertThat("forall (x) P(x) && Q(x).")
      .proving("Q(a)?")
      .equalsTo("forall (x = a) P(x) && Q(x). Q(a).")
      .done();
  });
  
  it("forall (x) P(x) || Q(x). ~Q(a). P(a)?", function() {
    // universal disjunctive syllogistm.
    assertThat("forall (x) P(x) || Q(x). ~Q(a).")
      .proving("P(a)?")
      .equalsTo(`
         ~Q(a). 
         forall (x = a) P(x) || Q(x) => P(a).
     `).
      done();
    
    assertThat("forall (x) P(x) || Q(x). ~P(a).")
      .proving("Q(a)?")
      .equalsTo(`
         ~P(a). 
         forall (x = a) P(x) || Q(x) => Q(a).
     `)
      .done();
  });
  
  it("forall (x) forall (y) p(x, y) && q(y) => r(y, x). p(a, b). q(b). |= r(b, a)?", function() {
    assertThat("forall (x) forall (y) ((p(x, y) && q(y)) => r(y, x)). p(a, b). q(b).")
      .proving("r(b, a)?")
      .equalsTo(`
        p(a, b). 
        q(b). 
        p(a, b) && q(b) => p(a, b) && q(b).
        forall (x = a) forall (y = b) p(x, y) && q(y) => r(y, x).
        r(b, a).
     `);
    // TODO(goto): there is another production here which doesn't look right.
  });
  
  it("p(a). p(b). |= p(x)?", function() {
    assertThat("p(a). p(b).").proving("exists (x) p(x)?")
      .equalsTo("p(a). exists (x = a) p(x).")
      .equalsTo("p(b). exists (x = b) p(x).")
      .done();
  });
  
  it("P(a). Q(a). exists (x) P(x) && Q(x)?", function() {
    assertThat("P(a). Q(a). ")
      .proving("exists (x) P(x) && Q(x)?")
      .equalsTo(`
       P(a).
       exists (x = a) P(x).
       Q(a).
       exists (x = a) P(x) && Q(x).
     `);
  });
  
  it("P(a). exists (x) P(x)?", function() {
    // existential conjunction introduction.
    assertThat("P(a).")
      .proving("exists (x) P(x)?")
      .equalsTo(`
       P(a).
       exists (x = a) P(x).
     `)
      .done();
  });
  
  it("P(a). Q(a). exists (x) P(x) && Q(x)?", function() {
    // existential conjunction introduction.
    // TODO(goto): it is probably hard to do conjunction
    // introduction with the universal quantifier.
    assertThat("P(a). Q(a).")
      .proving("exists (x) P(x) && Q(x)?")
      .equalsTo(`
       P(a).
       exists (x = a) P(x).
       Q(a).
       exists (x = a) P(x) && Q(x).
     `)
      .done();
  });
  
  it("a(x) => b(x), a(x) |= b(x)", function() {
    // modus ponens.
    let {Backward} = require("../src/backward.js");
    let {explain} = require("../src/forward.js");
    let kb = Parser.parse("a(x) => b(x). a(x).");
    let result = new Backward(kb)
	.backward(Rule.of("b(x)?"));
  });
  
  it("a(x) => b(x). a(x). |= b(x)", function() {
    // modus ponens.
    assertThat("a(x) => b(x). a(x).")
      .proving("b(x)?")
      .equalsTo("a(x). if (a(x) => b(x) and a(x)) then b(x).");
  });
  
  it("a(x), b(x) |= a(x) && b(x)", function() {
    // conjunction introduction.
    assertThat("a(x). b(x).")
      .proving("a(x) && b(x)?")
      .equalsTo("a(x). b(x). if (a(x) and b(x)) then a(x) && b(x).");
  });
  
  it("a(x) |= a(x) || b(x)", function() {
    // disjunction introduction.
    assertThat("a(x).")
      .proving("a(x) || b(x)?")
      .equalsTo("a(x). if (a(x)) then a(x) || b(x).");
  });
  
  it("a(x) => b(x), ~b(x) |= ~a(x)?", function() {
    assertThat(`
      a(x) => b(x).
      ~b(x).
    `)
      .proving("~a(x)?")
      .equalsTo(`
      ~b(x).
      a(x) => b(x) && ~b(x) => ~a(x).
    `);
  });
  
  it("a(x) || b(x), ~a(x) |= b(x)?", function() {
    assertThat(`
       a(x) || b(x).
       ~a(x).
    `)
      .proving("b(x)?")
      .equalsTo(`
       ~a(x).
       a(x) || b(x) && ~a(x) => b(x).
    `);
  });
  
  it("a(x) || b(x), ~b(x) |= a(x)?", function() {
    assertThat("a(x) || b(x). ~b(x).")
      .proving("a(x)?")
      .equalsTo("~b(x). a(x) || b(x) && ~b(x) => a(x).");
  });
  
  it("a(x) |= a(x) || b(x)?", function() {
    assertThat("a(x).")
      .proving("a(x) || b(x)?")
      .equalsTo("a(x). a(x) => a(x) || b(x).");
  });
  
  it("a(x) |= b(x) || a(x)?", function() {
    assertThat("a(x).")
      .proving("b(x) || a(x)?")
      .equalsTo("a(x). a(x) => b(x) || a(x).");
  });
  
  it("a(x) && b(x) |= a(x)?", function() {
    assertThat("a(x) && b(x).")
      .proving("a(x).")
      .equalsTo("a(x) && b(x) => a(x).");
  });
  
  it("b(x) && a(x) |= a(x)?", function() {
    assertThat("b(x) && a(x).")
      .proving("a(x).")
      .equalsTo("b(x) && a(x) => a(x).");
  });
  
  it("a(x), b(x) |= a(x) && b(x)?", function() {
    assertThat("a(x). b(x).")
      .proving("a(x) && b(x)?")
      .equalsTo("a(x). b(x). a(x) && b(x) => a(x) && b(x).");
  });
  
  it("a(x) => b(x), b(x) => c(x) |= a(x) => c(x)?", function() {
    assertThat("a(x) => b(x). b(x) => c(x).")
      .proving("a(x) => c(x)?")
      .equalsTo("((a(x) => b(x)) && (b(x) => c(x))) => (a(x) => c(x)).");
  });
  
  it("(a(x) => c(x)) && (b(x) => d(x)), a(x) || b(x) |= c(x) || d(x)", function() {
    assertThat("a(x) => c(x). b(x) => d(x). a(x) || b(x).")
      .proving("c(x) || d(x)?")
      .equalsTo("if ((a(x) => c(x)) and (b(x) => d(x)) and (a(x) || b(x))) then c(x) || d(x).");
  });
  
  it("a(x) => b(x) |= a(x) => (a(x) && b(x))", function() {
    assertThat("a(x) => b(x).")
      .proving("a(x) => (a(x) && b(x))?")
      .equalsTo("if (a(x) => b(x)) then a(x) => a(x) && b(x).");
  });
  
  it("p(x) |~ p(y)?", function() {
    assertThat("p(x).")
      .proving("p(y)?")
      .equalsTo("false.");
  });
  
  it("p(a) |= exists (x) p(x).", function() {
    assertThat("p(a).")
      .proving("exists (x) p(x)?")
      .equalsTo("p(a). exists (x = a) p(x).")
      .done();
  });
  
  it("p(a) |= p(x?).", function() {
    assertThat("p(a).")
      .proving("exists (x) p(x)?")
      .equalsTo("p(a). exists (x = a) p(x).")
      .done();
  });
  
  it("p(a). forall (x) p(x) => q(x). |= q(y?).", function() {
    assertThat("p(a). forall (x) p(x) => q(x).")
      .proving("exists (y) q(y)?")
      .equalsTo(`
       p(a). 
       exists (x = a) p(x). 
       forall (x = a) p(x) => q(x).
       exists (y = a) q(y).
     `)
      .done();
  });
  
  it("p(a). q(b). forall (x) p(x) && q(x) => r(x). |= r(c).", function() {
    assertThat(`
       p(a). 
       q(b). 
       p(c). q(c). 
       forall (x) (p(x) && q(x)) => r(x).
     `)
      .proving("r(c)?")
      .equalsTo(`
       p(c).
       q(c).
       p(c) && q(c) => p(c) && q(c).
       forall (x = c) p(x) && q(x) => r(x).
       r(c).
     `);
  });
  
  it("p(a). q(a). p(b). q(b). p(c). q(c). |= exists (x) p(x) && q(x). ", function() {
    assertThat(`
      p(a). q(a). 
      p(b). q(b). 
      p(c).
      q(d). 
      p(e). q(e).
    `)
      .proving("exists (x) p(x) && q(x)?")
      .equalsTo(`
       p(a).
       exists (x = a) p(x).
       q(a).
       exists (x = a) p(x) && q(x).
     `)
      .equalsTo(`
       p(b).
       exists (x = b) p(x).
       q(b).
       exists (x = b) p(x) && q(x).
     `)
      .equalsTo(`
       p(e).
       exists (x = e) p(x).
       q(e).
       exists (x = e) p(x) && q(x).
     `)
    .done();
  });
  
  it("p(a). q(b). p(c). q(c). forall (x) p(x) && q(x) => r(x). |= r(x?).", function() {
    // TODO(goto): deal with re-writing variables.
    assertThat(`
       p(a). 
       q(b). 
       p(c). q(c). 
       p(d). q(d). 
       forall (x) (p(x) && q(x)) => r(x).
     `)
      .proving("exists (z) r(z)?")
      .equalsTo(`
       p(c).
       exists (x = c) p(x).
       q(c).
       exists (x = c) p(x) && q(x).
       forall (x = c) p(x) && q(x) => r(x).
       exists (z = c) r(z).
     `)
      .equalsTo(`
       p(d).
       exists (x = d) p(x).
       q(d).
       exists (x = d) p(x) && q(x).
       forall (x = d) p(x) && q(x) => r(x).
       exists (z = d) r(z).
     `)
      .done();
  });
  
  it("forall (x) p(x, a). p(b, a)?", () => {
    // universal introduction
    assertThat("forall (x) p(x, a).")
      .proving("p(b, a)?")
      .equalsTo("forall (x) p(x, a). p(b, a).");
  });
  
  it("forall (x) p(x, b). exists (x) p(a, x)?", () => {
    assertThat("forall (x) p(x, b).")
      .proving("exists (x) p(a, x)?")
      .equalsTo("forall (x) p(x, b). exists (x = b) p(a, x).");
  });
  
  it("forall (x) p(x). exists (x) p(x)?", () => {
    // You have to be able to find x to something
    // concrete to say exists (x).
    assertThat("forall (x) p(x).")
      .proving("exists (x) p(x)?")
      .equalsTo("false.");
  });
  
  it("forall (x) p(x, a). forall (y) p(b, y) => q(y). exists (x) q(x)?", () => {
    assertThat("forall (x) p(x, a). forall (y) p(b, y) => q(y).")
      .proving("q(a)?")
      .equalsTo(`
      forall (x) p(x, a).
      p(b, a).
      forall (y = a) p(b, y) => q(y).
      q(a).
    `);
  });
  
  it("forall (x) p(x, a). forall (y) p(b, y) => q(y). exists (x) q(x)?", () => {
    assertThat("forall (x) p(x, a). forall (y) p(b, y) => q(y).")
      .proving("exists (z) q(z)?")
      .equalsTo(`
      forall (x) p(x, a).
      exists (y = a) p(b, y).
      forall (y = a) p(b, y) => q(y).
      exists (z = a) q(z).
    `);
  });
  
  it("q(a, b)", () => {
    assertThat(`
      forall (x) forall (y) exists(z) (p(z, x) && p(z, y)) => q(x, y).
      p(c, a).
      p(c, b).
    `)
      .proving("q(a, b).")
      .equalsTo(`
      p(c, a).
      exists (z = c) p(z, a).
      p(c, b).
      exists (z = c) p(z, a) && p(z, b).
      forall (x = a) forall (y = b) exists (z = c) p(z, x) && p(z, y) => q(x, y).
      q(a, b).
    `);
    
  });
  
  it.skip("q(a, b)", () => {
    // This fails because the () parenthesis creates a new
    // scope and that messes with the generalized modus ponens
    // reasoner.
    assertThat(`
      forall (x) forall (y) (exists(z) (p(z, x) && p(z, y))) => q(x, y).
      p(c, a).
      p(c, b).
    `)
      .proving("q(a, b).")
      .equalsTo("false.");
  });
  
  it("g(a, c)", () => {
    assertThat(`
      forall (x) forall (y) exists (z) g(x, y) => (p(x, z) && p(z, y)).
      forall (x) forall (y) exists (z) (p(x, z) && p(z, y)) => g(x, y).
      p(a, b).
      p(b, c).
    `)
      .proving("g(a, c).")
      .equalsTo(`
      p(a, b).
      exists (z = b) p(a, z).
      p(b, c).
      exists (z = b) p(a, z) && p(z, c).
      forall (x = a) forall (y = c) exists (z = b) p(x, z) && p(z, y) => g(x, y).
      g(a, c).
    `);
  });
  
  it("p(a, b). exists (x) exists (y) p(x, y)?", () => {
    // chained existential introduction.
    assertThat("p(a, b).")
      .proving("exists (x) exists (y) p(x, y)?")
      .equalsTo("p(a, b). exists (x = a) exists (y = b) p(x, y).");
  });
  
  it("p(a, b). exists (x) exists (y) p(x, y) && q(y, x)?", () => {
    // chained existential conjunction introduction.
    assertThat("p(a, b). q(b, a).")
      .proving("exists (x) exists (y) p(x, y) && q(y, x)?")
      .equalsTo(`
            p(a, b).
            exists (x = a) exists (y = b) p(x, y).
            q(b, a).
            exists (x = a) exists (y = b) p(x, y) && q(y, x).
        `);
  });
  
  it("r(a, b)?", () => {
    // existential conjunction introduction with no indirection.
    assertThat(`
      forall (x) forall (y) forall (z) (p(x, z) && q(z, y)) => r(x, y).
      p(a, c).
      q(c, b).
    `)
      .proving("r(a, b).")
      .equalsTo(`
      p(a, c).
      exists (z = c) p(a, z).
      q(c, b).
      exists (z = c) p(a, z) && q(z, b).
      forall (x = a) forall (y = b) forall (z = c) p(x, z) && q(z, y) => r(x, y).
      r(a, b).
    `)
      .done();
  });
  
  it("r(a, b)?", () => {
    // existential conjunction introduction with one level of indirection.
    assertThat(`
      forall (x) forall (y) forall (z) (p(x, z) && q(z, y)) => r(x, y).
      forall (i) forall (j) k(i, j) => q(i, j).
      p(a, c).
      k(c, b).
    `)
      .proving("r(a, b).")
      .equalsTo(`
      p(a, c).
      exists (z = c) p(a, z).
      k(c, b).
      forall (i = c) forall (j = b) k(i, j) => q(i, j).
      exists (z = c) q(c, b).
      exists (z = c) p(a, z) && q(z, b).
      forall (x = a) forall (y = b) forall (z = c) p(x, z) && q(z, y) => r(x, y).
      r(a, b).
    `)
      .done();
  });

  it("forall (x) p(x) => q(x) && r(x). p(a). |= q(a)?", () => {
    assertThat(`
      forall (x) p(x) => q(x) && r(x).
      p(a).
    `)
      .proving("q(a)?")
      .equalsTo(`
         p(a).
         forall (x = a) p(x) => q(x) && r(x).
         q(a).
    `)
      .done();
  });

  it("exists (x) p(x) |= p(a)? nope.", () => {
    assertThat("exists (x) p(x).")
      .proving("p(a)?")
      .done();
  });

  it("exists (x) exists (y) p(x, y) |= p(a, b)? nope.", () => {
    assertThat("exists (x) exists (y) p(x, y).")
      .proving("p(a, b)?")
      .done();
  });

  it("exists (x) exists (y) p(x, y) && q(y, x) |= p(a, b)? nope.", () => {
    assertThat("exists (x) exists (y) p(x, y) && q(y, x).")
      .proving("p(a, b)?")
      .done();
  });
  
  it("generators", () => {
    function* a() {
      yield 1;
      yield 2;
    };
    
    let it = a();
    
    assertThat(it.next().value).equalsTo(1);
    assertThat(it.next().value).equalsTo(2);
    assertThat(it.next().done).equalsTo(true);
    
    let foo = new class {
      hello() { return 1; }
      *world() { yield 2; }
    }();
    
    assertThat(foo.hello()).equalsTo(1);
    assertThat(foo.world().next().value).equalsTo(2);
    
    function* loop() {
      yield 1;
      yield 2;
      yield 3;
    }
    
    let sum = 0;
    for (let i of loop()) {
      sum += i;
    }
    
    assertThat(sum).equalsTo(6);
    
  });
  
  function assertThat(x) {
    return {
      proving(z) {
	let result = new Reasoner(rewrite(Parser.parse(x))).go(rewrite(Rule.of(z)));
	return {
	  done() {
	    this.equalsTo("false.")
	    return this;
	  },
	  equalsTo(y) {
	    // console.log(result.toString());
	    // console.log(JSON.stringify(Parser.parse(result.toString()), undefined, 2));
	    assertThat(toString(Parser.parse(result.next().value.toString())))
              .equalsTo(toString(Parser.parse(y)));
	    return this;
	  }
	};
      },
      equalsTo(y) {
	Assert.deepEqual(x, y);
      }
    }
  }
});

