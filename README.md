> This is not an officially supported Google product

`english--` is an **experimental** [logic](https://en.wikipedia.org/wiki/Logic_programming)-oriented **programming language** based on a [controlled](https://en.wikipedia.org/wiki/Controlled_natural_language) subset of english. 

The investigation started as an exploration on what it would take to make [https://schema.org/](https://schema.org/Action)'s Action more expressive and then took a life of its own.

The compiler takes a controlled subset of the english language and compiles to a lower level logic language. The interpretation of the language is largely inspired by what's described in Hans Kamp's [DRT](https://en.wikipedia.org/wiki/Discourse_representation_theory).

You can see a live demo running in the browser [here](https://code.sgo.to/2021/07/02/english--.html), a larger example [here](https://code.sgo.to/2021/01/06/brazil.html) and small examples [here](https://code.sgo.to/2020/09/16/semantics.html). You can see the parser running live [here](https://code.sgo.to/2020/08/31/syntactic-theory.html). There is a demo of the low-level language [here](https://code.sgo.to/2021/05/14/natural-deduction.html) and [here](https://code.sgo.to/2021/07/01/kinship.html).

There are still many open areas of investigations, most notably [generalized quantifiers](https://code.sgo.to/2020/09/09/the-relational-theory-of-determiners.html) and propositional attitudes (e.g. beliefs).

`english--` is a **programming language**, which makes it strict but formally precise, rather than flexible and ambiguous. If you are looking for latter, you'll likely be extremely disappointed, and are better off using an [LLM](https://en.wikipedia.org/wiki/Large_language_model) instead. 

By far, the most notable investigation dates all the way back to Aristotelian [Sillogisms](https://en.wikipedia.org/wiki/Syllogism), which was followed by Boole's [Laws of Thought](https://en.wikipedia.org/wiki/The_Laws_of_Thought) as well as the more recent branch of Analytical Philosophy explored by Frege, Russel and Whitehead. In Computer Science, Fuchs's [Attempto](https://en.wikipedia.org/wiki/Attempto_Controlled_English) and Knuth's [Literate Programming](https://www-cs-faculty.stanford.edu/~knuth/lp.html) can be thought of working on a related space. Other notable attempts are Peter Norvig's [A Grammar of English](https://github.com/norvig/paip-lisp/blob/main/docs/chapter21.md) and the [ERG](https://github.com/delph-in/erg), although it wasn't clear if their intent was to create a programming language (rather than a user-facing dialog system).

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

```javascript
// Every person who is brazilian is happy about Brazil.
Brazil(a).
for (let every b: person(b) brazilian(b)) {
  happy(b).
  happy-about(b, a).
}

// Sam is brazilian.
Sam(c).
brazilian(c).

// Sam is a person.
person(c).

// Sam is an engineer.
engineer(c).

// He works at Google on the Web Platform.
Web-Platform(d).
Google(e).
work-on(s0, d).
work-at(s0, e).
work(s0, c).

// He is interested in Compilers.
Compilers(f).
interest-in(s1, f).
interest(s1, g, e).

// He likes every area of Computer Science.
Computer-Science(h).
for (let every i: area(i) area-of(i, h)) {
  like(s2, h, i).
}

// Is Sam happy about Brazil?
happy(c) happy-about(c, a)?
```

Which gets interpreted by a logic reasoner as `Yes`.
