const {match} = require("./parser.js");

function print(state) {
  let {rule} = state;
  let meta = {};
  if (rule.postprocess && rule.postprocess.meta) {
    meta = rule.postprocess.meta;
  }
  let features = (types) => Object
      .entries(types)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
  
  let head = {
    "@type": rule.name,
    types: meta.types,
  };
  
  let tail = rule.symbols.map((symbol, i) => {
    if (symbol.type) {
      return {
        "@type": `%${symbol.type}`
      };
    }
    // console.log(meta.conditions);
    // console.log(symbol);
    return {
      "@type": `${symbol}`,
      "types": meta.conditions ? meta.conditions[i].types : undefined
    }
  });
  
  let dot = state.dot;
  
  // console.log(meta);
  let result = [];
  result.push(`${head["@type"]}`);
  if (head["types"]) {
    result.push(`[${features(head["types"])}]`);
  }
  result.push(" →");
  for (let i = 0; i < tail.length; i++) {
    let symbol = tail[i];
    result.push(" ");
    if (dot == i) {
      result.push("● ");
    };
    result.push(`${symbol["@type"]}`);
    if (symbol["types"]) {
      result.push(`[${features(symbol["types"])}]`);
    }
  }
  return result.join("");
}

function ancestors(state, path = []) {
  if (state.wantedBy.length == 0) {
    return [[state]];
  }
  
  if (path.includes(state)) {
    return [];
  }
  
  let result = [];
  path.push(state);
  
  if (!valid(path) || !continuous(path)) {
    return [];
  }
  
  for (let parent of state.wantedBy) {
    for (line of ancestors(parent, path)) {
      line.unshift(state);
      result.push(line);
    }
  }
  path.pop();
  
  return result;
}

function walk({isComplete, data, left, right}) {
  let result = [];
  if (data) {
    result.push(data);
  }
  if (isComplete) {
    return result.flat();
  }
  if (left) {
    result.push(...walk(left));
  }
  if (right) {
    result.push(...walk(right));
  }
  return result.flat();
}

function valid(path) {
  for (let line of path) {
    if (!line.rule.postprocess ||
        !line.rule.postprocess.meta) {
      return true;
    }
    const meta = line.rule.postprocess.meta; 
    let right = walk(line);
    let result = match(meta.type, meta.types, meta.conditions,
                       right, undefined, false, true);
    if (!result) {
      return false;
    }
  }
  return true;
}

function continuous(path) {
  let j = 0;
  do  {
    let rule = path[j].rule;
    if (rule.postprocess && rule.postprocess.meta) {
      break;
    }
    j++;
    
    if (j >= path.length) {
      // If we got to the end of the array
      // with no types, this is a static path.
      return true;
    }
  } while (true);
  
  //console.log(j);
  //console.log(path);
  let last = {
    "@type": path[j].rule.name,
    "types" : path[j].rule.postprocess.meta.types,
  };
  
  for (let i = (j + 1); i < path.length; i++) {
    // let current = path[i];
    let next = path[i];
    //console.log(j);
    let meta = next.rule.postprocess.meta;
    let right = walk(next);
    right.push(last);
    let result = match(next.rule.name, meta.types, meta.conditions,
                       right, undefined, false, true);
    if (!result) {
      //console.log(meta.conditions);
      //console.log(walk(next));
      //console.log(`${next.rule.name} cant take ${last["@type"]}`);
      return false;
    }
    last = result;
  }
  return true;
}

function autocomplete(parser) {
  let tokens = {};
  for (let track of parser.parser.tracks()) {
    for (let path of ancestors(track.stack[0])) {
      // Saves the first valid path.
      if (!tokens[track.symbol]) {
        tokens[track.symbol] = path;
      }
    }
  }

  return tokens;
    
  let completions = Object.entries(tokens);
    
  completions.print = () => {
    let result = [];
    for (let [symbol, path] of Object.entries(tokens)) {
      result.push(`A ${symbol} token based on:`);
      for (let line of path) {
        result.push(`    ${print(line)}`);
      }
    }
    return result.join("\n");
  }
    
  return completions;
}

module.exports = {
  ancestors: ancestors,
  valid: valid,
  continuous: continuous,
  autocomplete: autocomplete,
};
