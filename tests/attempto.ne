@builtin "whitespace.ne"
@builtin "string.ne"

main -> _ (comment | statement):* _ {%
  ([ws1, body, ws2]) => body.map(([a]) => a)
  %}

comment -> "%" [^\n]:* "\n":+ {% ([per, words, nl]) => ["%", words.join("")] %}

statement -> word "(" arg (_ "," _ arg):* ")" "." "\n" {%
    ([name, paren1, first, args]) => [
        name,
        [first, ...args.map(([ws1, comma, ws2, arg]) => arg)]
      ]
  %}

arg -> dqstring {% id %}
    | sqstring {% id %}
    | word {% id %}

word -> [a-z_]:+ {% ([chars]) => chars.join("") %}
