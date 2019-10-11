# hello

FULLNAME -> (NAME _):+ {% ([args]) => args.map(name => name[0]).join(" ") %}
NAME -> [A-Z]:+ [a-z]:+ {% ([a, b]) => a.join("") + b.join("") %}
