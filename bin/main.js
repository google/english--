const files = {};

require("fs").readFileSync = function(path) {
    let file = path.split("/");
    let content = files[file[file.length - 1]];
    return content;
};

async function load(path) {
    let file = await fetch(path);
    files[path] = await file.text();
}

async function compile() {
    await load("string.ne");
    await load("number.ne");
    await load("whitespace.ne");
    return require("./../src/drt/nearley.js");
}

module.exports = {
  compile: compile
}
