const {parse, Parser} = require("./parser.js")
const {DRS} = require("./drs.js");
const {Rules} = require("./rules.js");
const dict = require("./dict.js");
const fs = require("fs");

const files = {};

if (!fs.readFileSync) {
  fs.readFileSync = function(path) {
      let file = path.split("/");
      let content = files[file[file.length - 1]];
      return content;
  };
}

async function get(path, name, loader) {
    let file = await loader(path + name);
    files[name] = await file.text();
}

async function load(path = "", loader = fetch) {
    await get(path, "string.ne", loader);
    await get(path, "number.ne", loader);
    await get(path, "whitespace.ne", loader);
}

module.exports = {
  load: load,
  DRS: DRS,
  Rules: Rules,
  parse: parse,
  Parser: Parser,
  dict: dict,
}
