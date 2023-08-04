`english--` is a logic-oriented programming language based on a controlled subset of english.

The compiler takes a controlled subset of the english language and compiles to a lower level logic language. The interpretation of the language are largely inspired by [Discourse Representation Theory](https://en.wikipedia.org/wiki/Discourse_representation_theory).

For example:

```
Every person who is brazilian is happy about Brazil.
Sam is brazilian. Sam is a person. Sam is an engineer.
He works at Google on the Web Platform.
He is interested in Compilers.
He likes every area of Computer Science.
Is Sam happy about Brazil?
```

Compiles to:

```
Brazil(a).
for (let every b: person(b) brazilian(b)) {
  happy(b).
  happy-about(b, a).
}
Sam(c).
brazilian(c).
person(c).
engineer(c).
Web-Platform(d).
Google(e).
work-on(s0, d).
work-at(s0, e).
work(s0, c).
Compilers(f).
interest-in(s1, f).
interest(s1, g, e).
Computer-Science(h).
for (let every i: area(i) area-of(i, h)) {
  like(s2, h, i).
}
happy(c) happy-about(c, a)?
```

Which gets interpreted by a logic reasoner as `Yes`.
