const files = {};

require("fs").readFileSync = function(path) {
    let file = path.split("/");
    let content = files[file[file.length - 1]];
    return content;
};

async function load(path, name) {
    let file = await fetch(path + name);
    files[name] = await file.text();
}

async function compile(path = "") {
    await load(path, "string.ne");
    await load(path, "number.ne");
    await load(path, "whitespace.ne");

    let result = {};

    result = Object.assign(result, require("./../src/drt/nearley.js"));
    result = Object.assign(result, require("./../src/drt/rules.js"));

    return result;
}

module.exports = {
  compile: compile
}
