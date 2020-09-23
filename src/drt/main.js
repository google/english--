const parser = require("./parser.js")
const drs = require("./drs.js");
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
  drs: drs,
  parser: parser,
}
