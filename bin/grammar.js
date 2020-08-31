// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

function bind(type, types = {}, conditions = []) {   
 return (data, location, reject) => {
  // Creates a copy of the types because it is reused
  // across multiple calls and we assign values to it.
  let bindings = JSON.parse(JSON.stringify(types));

  // Creates a copy of the input data, because it is
  // reused across multiple calls.
  let result = JSON.parse(JSON.stringify(data))
  .filter((ws) => ws != null);
  
  // Ignores the null type.
  let expects = conditions.filter((x) => x["@type"] != "null");

  let signature = `${type}${JSON.stringify(bindings)} -> `;
  for (let child of expects) {
   signature += `${child["@type"] || child}${JSON.stringify(child.types || {})} `;
  }

  let hash = (str) => {
   return str.split("")
   .reduce((prevHash, currVal) =>
           (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
  }
       
  // console.log(hash(signature));
  let namespace = hash(signature);

  let children = result.filter((node) => node["@type"]);

  //console.log(`Trying to bind ${signature}`);
  //let foo = children.map((x) => {
  //  return `${x["@type"]}${JSON.stringify(x.types)}`;
  //}).join(" ");
  //console.log(`To ${foo}`);

  if (expects.length != children.length) {
   // console.log("not the same length");
   return reject;
  }

  let variables = {};

  for (let i = 0; i < expects.length; i++) {
   let expected = expects[i];
   let child = children[i];
   if (expected["@type"] != child["@type"]) {
    // console.log("Children of different types");
    return reject;
   }
   for (let [key, value] of Object.entries(expected.types || {})) {
    if (typeof value == "number") {
     if (variables[value]) {
      if (Array.isArray(variables[value])) {
       if (!variables[value].includes(child.types[key])) {
        return reject;
       }
      } else if (typeof variables[value] == "number") {
       // console.log("hi");
       variables[value] = child.types[key];
      } else if (Array.isArray(child.types[key])) {
       if (!child.types[key].includes(variables[value])) {
        return reject;
       }
       continue;
      } else if (typeof child.types[key] == "number") {
       // console.log("hi");
       variables[child.types[key]] = variables[value];
       continue;
      } else if (variables[value] != child.types[key]) {
       // console.log(`Expected ${key}="${variables[value]}", got ${key}="${child.types[key]}"`);
       return reject;
      }
     }
     // collects variables
     variables[value] = child.types[key];
    } else if (typeof child.types[key] == "number") {
     child.types[key] = value;
    } else if (Array.isArray(child.types[key])) {
     if (!child.types[key].includes(expected.types[key])) {
      return reject;
     }
     child.types[key] = expected.types[key];
    } else if (typeof child.types[key] == "string" &&
               expected.types[key] != child.types[key]) {
     if (Array.isArray(expected.types[key]) &&
         expected.types[key].includes(child.types[key])) {
      // variables[key] = child.types[key];
      // console.log(key);
      continue;
     }
     // console.log(`Expected ${key}="${expected.types[key]}", got ${key}="${child.types[key]}"`);
     return reject;
    } else if (!child.types[key]) {
     return reject;
    }
   }
  }
    
  // Sets variables
  for (let [key, value] of Object.entries(bindings)) {
   if (typeof value == "number") {
    // console.log(key);
    // console.log("hello");
    if (!variables[value]) {
     // console.log(variables);
     // console.log(types);
     // console.log(variables);
     // console.log("hi");
     // return reject;
     bindings[key] = namespace + value;
    } else {
     // console.log(`${key} = ${variables[value]}`);
     bindings[key] = variables[value];
    }
   }
  }

  // console.log(JSON.stringify(types));

  let n = {
   "@type": type,
   "types": bindings,
   "children": result,
  };

  if (location != undefined) {
   n["loc"] = location;
  }

  return n;
 };
}
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "Sentence", "symbols": ["_", "Statement", "_"], "postprocess": 
        bind("Sentence", {}, [
          {"@type": "Statement", "types": {}}, 
        ])
        },
    {"name": "Sentence", "symbols": ["_", "Question", "_"], "postprocess": 
        bind("Sentence", {}, [
          {"@type": "Question", "types": {}}, 
        ])
        },
    {"name": "Statement$subexpression$1", "symbols": [{"literal":"."}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Statement", "symbols": ["S_", "_", "Statement$subexpression$1"], "postprocess": 
        bind("Statement", {}, [
          {"@type": "S_", "types": {}}, 
        ])
        },
    {"name": "Question$subexpression$1", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "Question$subexpression$2", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Question", "symbols": ["Question$subexpression$1", "__", "VP_", "_", "Question$subexpression$2"], "postprocess": 
        bind("Question", {}, [
          {"@type": "VP_", "types": {"num":1,"fin":"+","gap":"-","tp":3,"tense":4}}, 
        ])
        },
    {"name": "Question$subexpression$3", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "Question$subexpression$4", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Question", "symbols": ["Question$subexpression$3", "__", "AUX", "__", "NP", "__", "V", "_", "Question$subexpression$4"], "postprocess": 
        bind("Question", {}, [
          {"@type": "AUX", "types": {"num":1,"fin":"+","tp":2,"tense":3}}, 
          {"@type": "NP", "types": {"num":1,"gen":4,"case":"+nom","gap":"-"}}, 
          {"@type": "V", "types": {"num":1,"fin":"-","trans":"+"}}, 
        ])
        },
    {"name": "Question$subexpression$5", "symbols": [{"literal":"?"}], "postprocess": function(d) {return d.join(""); }},
    {"name": "Question", "symbols": ["BE", "__", "NP", "__", "ADJ", "_", "Question$subexpression$5"], "postprocess": 
        bind("Question", {}, [
          {"@type": "BE", "types": {"num":1,"fin":"+","tp":2,"tense":3}}, 
          {"@type": "NP", "types": {"num":1,"gen":4,"case":"+nom","gap":"-"}}, 
          {"@type": "ADJ", "types": {}}, 
        ])
        },
    {"name": "S_", "symbols": ["S"], "postprocess": 
        bind("S_", {"num":1,"gap":"-","tp":2,"tense":3}, [
          {"@type": "S", "types": {"num":1,"gap":"-","tp":2,"tense":3}}, 
        ])
        },
    {"name": "S$subexpression$1", "symbols": [/[iI]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S$subexpression$1", "__", "S", "__", "S$subexpression$2", "__", "S"], "postprocess": 
        bind("S", {"num":1,"gap":"-","tp":2,"tense":3}, [
          {"@type": "S", "types": {"num":1,"gap":"-","tp":2,"tense":3}}, 
          {"@type": "S", "types": {"num":1,"gap":"-","tp":2,"tense":3}}, 
        ])
        },
    {"name": "S$subexpression$3", "symbols": [/[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S", "__", "S$subexpression$3", "__", "S"], "postprocess": 
        bind("S", {"num":1,"gap":"-","tp":2,"tense":3}, [
          {"@type": "S", "types": {"num":4,"gap":"-","tp":2,"tense":3}}, 
          {"@type": "S", "types": {"num":5,"gap":"-","tp":2,"tense":3}}, 
        ])
        },
    {"name": "S$subexpression$4", "symbols": [/[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "S", "symbols": ["S", "__", "S$subexpression$4", "__", "S"], "postprocess": 
        bind("S", {"num":1,"gap":"-","tp":2,"tense":3}, [
          {"@type": "S", "types": {"num":4,"gap":"-","tp":2,"tense":3}}, 
          {"@type": "S", "types": {"num":5,"gap":"-","tp":2,"tense":3}}, 
        ])
        },
    {"name": "S", "symbols": ["NP", "__", "VP_"], "postprocess": 
        bind("S", {"num":1,"gap":"-","tp":3,"tense":4}, [
          {"@type": "NP", "types": {"num":1,"gen":2,"case":"+nom","gap":"-"}}, 
          {"@type": "VP_", "types": {"num":1,"fin":"+","gap":"-","tp":3,"tense":4}}, 
        ])
        },
    {"name": "S", "symbols": ["NP", "_", "VP_"], "postprocess": 
        bind("S", {"num":1,"gap":"np","tp":3,"tense":4}, [
          {"@type": "NP", "types": {"num":1,"gen":2,"case":"+nom","gap":"np"}}, 
          {"@type": "VP_", "types": {"num":1,"fin":"+","gap":"-","tp":3,"tense":4}}, 
        ])
        },
    {"name": "S", "symbols": ["NP", "__", "VP_"], "postprocess": 
        bind("S", {"num":1,"gap":"np","tp":3,"tense":4}, [
          {"@type": "NP", "types": {"num":1,"gen":2,"case":"+nom","gap":"-"}}, 
          {"@type": "VP_", "types": {"num":1,"fin":"+","gap":"np","tp":3,"tense":4}}, 
        ])
        },
    {"name": "VP_", "symbols": ["AUX", "__", "VP"], "postprocess": 
        bind("VP_", {"num":1,"fin":"+","gap":2,"stat":3,"tp":4,"tense":"fut"}, [
          {"@type": "AUX", "types": {"num":1,"fin":"+","tp":4,"tense":"fut"}}, 
          {"@type": "VP", "types": {"num":5,"fin":"-","gap":2,"stat":3,"tp":4,"tense":"pres"}}, 
        ])
        },
    {"name": "VP_$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP_", "symbols": ["AUX", "__", "VP_$subexpression$1", "__", "VP"], "postprocess": 
        bind("VP_", {"num":1,"fin":"+","gap":2,"stat":4,"tp":5,"tense":6}, [
          {"@type": "AUX", "types": {"num":1,"fin":"+","tp":5,"tense":6}}, 
          {"@type": "VP", "types": {"num":3,"fin":"-","gap":2,"stat":4,"tp":5,"tense":6}}, 
        ])
        },
    {"name": "VP_", "symbols": ["VP"], "postprocess": 
        bind("VP_", {"num":1,"fin":"+","gap":2,"state":3,"tp":4,"tense":5}, [
          {"@type": "VP", "types": {"num":1,"fin":"+","gap":2,"state":3,"tp":4,"tense":5}}, 
        ])
        },
    {"name": "VP", "symbols": ["V", "__", "NP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":3,"tp":4,"tense":5}, [
          {"@type": "V", "types": {"num":1,"fin":2,"trans":"+","stat":3,"tp":4,"tense":5}}, 
          {"@type": "NP", "types": {"num":6,"gen":7,"case":"-nom","gap":"-"}}, 
        ])
        },
    {"name": "VP", "symbols": ["V", "_", "NP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"np","tp":6,"tense":7}, [
          {"@type": "V", "types": {"num":1,"fin":2,"trans":"+","tp":6,"tense":7}}, 
          {"@type": "NP", "types": {"num":4,"gen":5,"case":"-nom","gap":"np"}}, 
        ])
        },
    {"name": "VP", "symbols": ["V"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":3,"tp":4,"tense":5}, [
          {"@type": "V", "types": {"num":1,"fin":2,"trans":"-","stat":3,"tp":4,"tense":5}}, 
        ])
        },
    {"name": "VP", "symbols": ["HAVE", "__", "VP"], "postprocess": 
        bind("VP", {"num":1,"fin":"+","gap":2,"stat":"+","tp":4,"tense":5}, [
          {"@type": "HAVE", "types": {"num":1,"fin":"+","tp":4,"tense":5}}, 
          {"@type": "VP", "types": {"num":1,"fin":"part","gap":2,"stat":6,"tp":4,"tense":5}}, 
        ])
        },
    {"name": "VP$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["HAVE", "__", "VP$subexpression$1", "__", "VP"], "postprocess": 
        bind("VP", {"num":1,"fin":"+","gap":2,"stat":"+","tp":4,"tense":5}, [
          {"@type": "HAVE", "types": {"num":1,"fin":"+","tp":4,"tense":5}}, 
          {"@type": "VP", "types": {"num":1,"fin":"part","gap":2,"stat":6,"tp":4,"tense":5}}, 
        ])
        },
    {"name": "NP", "symbols": ["GAP"], "postprocess": 
        bind("NP", {"num":1,"gen":2,"case":3,"gap":"np"}, [
          {"@type": "GAP", "types": {}}, 
        ])
        },
    {"name": "GAP", "symbols": [], "postprocess": 
        bind("GAP", {}, [
          {"@type": "null", "types": {}}, 
        ])
        },
    {"name": "NP", "symbols": ["DET", "__", "N"], "postprocess": 
        bind("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, [
          {"@type": "DET", "types": {"num":1}}, 
          {"@type": "N", "types": {"num":1,"gen":2}}, 
        ])
        },
    {"name": "NP", "symbols": ["DET", "__", "RN"], "postprocess": 
        bind("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, [
          {"@type": "DET", "types": {"num":1}}, 
          {"@type": "RN", "types": {"num":1,"gen":2}}, 
        ])
        },
    {"name": "NP", "symbols": ["PN"], "postprocess": 
        bind("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, [
          {"@type": "PN", "types": {"num":1,"gen":2}}, 
        ])
        },
    {"name": "NP", "symbols": ["PRO"], "postprocess": 
        bind("NP", {"num":1,"gen":2,"case":3,"gap":"-"}, [
          {"@type": "PRO", "types": {"num":1,"gen":2,"case":3}}, 
        ])
        },
    {"name": "NP$subexpression$1", "symbols": [/[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "NP", "symbols": ["NP", "__", "NP$subexpression$1", "__", "NP"], "postprocess": 
        bind("NP", {"num":"plur","gen":1,"case":2,"gap":"-"}, [
          {"@type": "NP", "types": {"num":3,"gen":4,"case":2,"gap":"-"}}, 
          {"@type": "NP", "types": {"num":5,"gen":6,"case":2,"gap":"-"}}, 
        ])
        },
    {"name": "NP$subexpression$2", "symbols": [/[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "NP", "symbols": ["NP", "__", "NP$subexpression$2", "__", "NP"], "postprocess": 
        bind("NP", {"num":3,"gen":1,"case":2,"gap":"-"}, [
          {"@type": "NP", "types": {"num":3,"gen":4,"case":2,"gap":"-"}}, 
          {"@type": "NP", "types": {"num":3,"gen":6,"case":2,"gap":"-"}}, 
        ])
        },
    {"name": "N", "symbols": ["N", "__", "RC"], "postprocess": 
        bind("N", {"num":1,"gen":2}, [
          {"@type": "N", "types": {"num":1,"gen":2}}, 
          {"@type": "RC", "types": {"num":1,"gen":2}}, 
        ])
        },
    {"name": "RC", "symbols": ["RPRO", "__", "S"], "postprocess": 
        bind("RC", {"num":1,"gen":2}, [
          {"@type": "RPRO", "types": {"num":1,"gen":2}}, 
          {"@type": "S", "types": {"num":1,"gap":"np"}}, 
        ])
        },
    {"name": "VP", "symbols": ["BE", "__", "ADJ"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":4}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":4}}, 
          {"@type": "ADJ", "types": {}}, 
        ])
        },
    {"name": "VP$subexpression$2", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["BE", "__", "VP$subexpression$2", "__", "ADJ"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":4}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":4}}, 
          {"@type": "ADJ", "types": {}}, 
        ])
        },
    {"name": "VP", "symbols": ["BE", "__", "PP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":4}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":4}}, 
          {"@type": "PP", "types": {}}, 
        ])
        },
    {"name": "VP$subexpression$3", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["BE", "__", "VP$subexpression$3", "__", "PP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":4}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":4}}, 
          {"@type": "PP", "types": {}}, 
        ])
        },
    {"name": "VP", "symbols": ["BE", "__", "NP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":7}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":7}}, 
          {"@type": "NP", "types": {"num":3,"gen":4,"case":5,"gap":"-"}}, 
        ])
        },
    {"name": "VP$subexpression$4", "symbols": [/[nN]/, /[oO]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VP", "symbols": ["BE", "__", "VP$subexpression$4", "__", "NP"], "postprocess": 
        bind("VP", {"num":1,"fin":2,"gap":"-","stat":"+","tp":"-past","tense":7}, [
          {"@type": "BE", "types": {"num":1,"fin":2,"tp":"-past","tense":7}}, 
          {"@type": "NP", "types": {"num":3,"gen":4,"case":5,"gap":"-"}}, 
        ])
        },
    {"name": "DET$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$1"], "postprocess": 
        bind("DET", {"num":"sing"}, [
        ])
        },
    {"name": "DET$subexpression$2", "symbols": [/[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$2"], "postprocess": 
        bind("DET", {"num":"sing"}, [
        ])
        },
    {"name": "DET$subexpression$3", "symbols": [/[eE]/, /[vV]/, /[eE]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$3"], "postprocess": 
        bind("DET", {"num":"sing"}, [
        ])
        },
    {"name": "DET$subexpression$4", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$4"], "postprocess": 
        bind("DET", {"num":"sing"}, [
        ])
        },
    {"name": "DET$subexpression$5", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["DET$subexpression$5"], "postprocess": 
        bind("DET", {"num":"sing"}, [
        ])
        },
    {"name": "DET$subexpression$6", "symbols": [{"literal":"'"}, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "DET", "symbols": ["NP", "_", "DET$subexpression$6"], "postprocess": 
        bind("DET", {"num":1}, [
          {"@type": "NP", "types": {"num":2,"gen":3,"case":"+nom","gap":"-"}}, 
        ])
        },
    {"name": "N", "symbols": ["ADJ", "__", "N"], "postprocess": 
        bind("N", {"num":1,"gen":2}, [
          {"@type": "ADJ", "types": {}}, 
          {"@type": "N", "types": {"num":1,"gen":2}}, 
        ])
        },
    {"name": "PRO$subexpression$1", "symbols": [/[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$1"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"male","case":"+nom"}, [
        ])
        },
    {"name": "PRO$subexpression$2", "symbols": [/[hH]/, /[iI]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$2"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"male","case":"-nom"}, [
        ])
        },
    {"name": "PRO$subexpression$3", "symbols": [/[sS]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$3"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"fem","case":"+nom"}, [
        ])
        },
    {"name": "PRO$subexpression$4", "symbols": [/[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$4"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"fem","case":"-nom"}, [
        ])
        },
    {"name": "PRO$subexpression$5", "symbols": [/[iI]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$5"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"-hum","case":["-nom","+nom"]}, [
        ])
        },
    {"name": "PRO$subexpression$6", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$6"], "postprocess": 
        bind("PRO", {"num":"plur","gen":["male","fem","-hum"],"case":"+nom"}, [
        ])
        },
    {"name": "PRO$subexpression$7", "symbols": [/[tT]/, /[hH]/, /[eE]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$7"], "postprocess": 
        bind("PRO", {"num":"plur","gen":["male","fem","-hum"],"case":"-nom"}, [
        ])
        },
    {"name": "PRO$subexpression$8", "symbols": [/[hH]/, /[iI]/, /[mM]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$8"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"male","case":"-nom","refl":"+"}, [
        ])
        },
    {"name": "PRO$subexpression$9", "symbols": [/[hH]/, /[eE]/, /[rR]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$9"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"fem","case":"-nom","refl":"+"}, [
        ])
        },
    {"name": "PRO$subexpression$10", "symbols": [/[iI]/, /[tT]/, /[sS]/, /[eE]/, /[lL]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PRO", "symbols": ["PRO$subexpression$10"], "postprocess": 
        bind("PRO", {"num":"sing","gen":"-hum","case":"-nom","refl":"+"}, [
        ])
        },
    {"name": "N", "symbols": ["N", "__", "PP"], "postprocess": 
        bind("N", {"num":1,"gen":2}, [
          {"@type": "N", "types": {"num":1,"gen":2}}, 
          {"@type": "PP", "types": {}}, 
        ])
        },
    {"name": "PP", "symbols": ["PREP", "__", "NP"], "postprocess": 
        bind("PP", {}, [
          {"@type": "PREP", "types": {}}, 
          {"@type": "NP", "types": {"num":1,"gen":2,"case":3,"gap":"-"}}, 
        ])
        },
    {"name": "PREP$subexpression$1", "symbols": [/[bB]/, /[eE]/, /[hH]/, /[iI]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$1"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$2", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$2"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$3", "symbols": [/[oO]/, /[vV]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$3"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$4", "symbols": [/[uU]/, /[nN]/, /[dD]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$4"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$5", "symbols": [/[nN]/, /[eE]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$5"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$6", "symbols": [/[bB]/, /[eE]/, /[fF]/, /[oO]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$6"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$7", "symbols": [/[aA]/, /[fF]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$7"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$8", "symbols": [/[dD]/, /[uU]/, /[rR]/, /[iI]/, /[nN]/, /[gG]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$8"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$9", "symbols": [/[fF]/, /[rR]/, /[oO]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$9"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$10", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$10"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$11", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$11"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$12", "symbols": [/[aA]/, /[bB]/, /[oO]/, /[uU]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$12"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$13", "symbols": [/[bB]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$13"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$14", "symbols": [/[fF]/, /[oO]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$14"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "PREP$subexpression$15", "symbols": [/[wW]/, /[iI]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PREP", "symbols": ["PREP$subexpression$15"], "postprocess": 
        bind("PREP", {}, [
        ])
        },
    {"name": "AUX$subexpression$1", "symbols": [/[dD]/, /[oO]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$1"], "postprocess": 
        bind("AUX", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "AUX$subexpression$2", "symbols": [/[dD]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$2"], "postprocess": 
        bind("AUX", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "AUX$subexpression$3", "symbols": [/[dD]/, /[iI]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$3"], "postprocess": 
        bind("AUX", {"num":1,"fin":"+","tp":"-past","tense":"past"}, [
        ])
        },
    {"name": "AUX$subexpression$4", "symbols": [/[dD]/, /[iI]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$4"], "postprocess": 
        bind("AUX", {"num":1,"fin":"+","tp":"+past","tense":"pres"}, [
        ])
        },
    {"name": "AUX$subexpression$5", "symbols": [/[wW]/, /[iI]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$5"], "postprocess": 
        bind("AUX", {"num":1,"fin":"+","tp":"-past","tense":"fut"}, [
        ])
        },
    {"name": "AUX$subexpression$6", "symbols": [/[wW]/, /[oO]/, /[uU]/, /[lL]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "AUX", "symbols": ["AUX$subexpression$6"], "postprocess": 
        bind("AUX", {"num":1,"fin":"+","tp":"+past","tense":"fut"}, [
        ])
        },
    {"name": "RPRO$subexpression$1", "symbols": [/[wW]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RPRO", "symbols": ["RPRO$subexpression$1"], "postprocess": 
        bind("RPRO", {"num":["sing","plur"],"gen":["male","fem"]}, [
        ])
        },
    {"name": "RPRO$subexpression$2", "symbols": [/[wW]/, /[hH]/, /[iI]/, /[cC]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RPRO", "symbols": ["RPRO$subexpression$2"], "postprocess": 
        bind("RPRO", {"num":["sing","plur"],"gen":"-hum"}, [
        ])
        },
    {"name": "BE$subexpression$1", "symbols": [/[iI]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$1"], "postprocess": 
        bind("BE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "BE$subexpression$2", "symbols": [/[aA]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$2"], "postprocess": 
        bind("BE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "BE$subexpression$3", "symbols": [/[wW]/, /[aA]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$3"], "postprocess": 
        bind("BE", {"num":"sing","fin":"+","tp":"-past","tense":"past"}, [
        ])
        },
    {"name": "BE$subexpression$4", "symbols": [/[wW]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$4"], "postprocess": 
        bind("BE", {"num":"plur","fin":"+","tp":"-past","tense":"past"}, [
        ])
        },
    {"name": "BE$subexpression$5", "symbols": [/[wW]/, /[aA]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$5"], "postprocess": 
        bind("BE", {"num":"sing","fin":"+","tp":"+past","tense":"pres"}, [
        ])
        },
    {"name": "BE$subexpression$6", "symbols": [/[wW]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$6"], "postprocess": 
        bind("BE", {"num":"plur","fin":"+","tp":"+past","tense":"pres"}, [
        ])
        },
    {"name": "BE$subexpression$7", "symbols": [/[bB]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$7"], "postprocess": 
        bind("BE", {"fin":"-"}, [
        ])
        },
    {"name": "BE$subexpression$8", "symbols": [/[bB]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "BE", "symbols": ["BE$subexpression$8"], "postprocess": 
        bind("BE", {"fin":"part"}, [
        ])
        },
    {"name": "HAVE$subexpression$1", "symbols": [/[hH]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$1"], "postprocess": 
        bind("HAVE", {"fin":-1}, [
        ])
        },
    {"name": "HAVE$subexpression$2", "symbols": [/[hH]/, /[aA]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$2"], "postprocess": 
        bind("HAVE", {"num":"sing","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "HAVE$subexpression$3", "symbols": [/[hH]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$3"], "postprocess": 
        bind("HAVE", {"num":"plur","fin":"+","tp":"-past","tense":"pres"}, [
        ])
        },
    {"name": "HAVE$subexpression$4", "symbols": [/[hH]/, /[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$4"], "postprocess": 
        bind("HAVE", {"num":1,"fin":"+","tp":"-past","tense":"past"}, [
        ])
        },
    {"name": "HAVE$subexpression$5", "symbols": [/[hH]/, /[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "HAVE", "symbols": ["HAVE$subexpression$5"], "postprocess": 
        bind("HAVE", {"num":1,"fin":"+","tp":"+past","tense":["pres","past"]}, [
        ])
        },
    {"name": "V", "symbols": ["VERB"], "postprocess": 
        bind("V", {"num":1,"fin":"-","stat":"-","trans":2}, [
          {"@type": "VERB", "types": {"trans":2,"stat":"-"}}, 
        ])
        },
    {"name": "V$subexpression$1", "symbols": [/[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$1"], "postprocess": 
        bind("V", {"num":"sing","fin":"+","stat":1,"tp":"-past","tense":"pres","trans":2}, [
          {"@type": "VERB", "types": {"trans":2,"stat":1,"pres":"+s"}}, 
        ])
        },
    {"name": "V$subexpression$2", "symbols": [/[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$2"], "postprocess": 
        bind("V", {"num":"sing","fin":"+","stat":1,"tp":"-past","tense":"pres","trans":2}, [
          {"@type": "VERB", "types": {"trans":2,"stat":1,"pres":"+es"}}, 
        ])
        },
    {"name": "V$subexpression$3", "symbols": [/[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$3"], "postprocess": 
        bind("V", {"num":"sing","fin":"+","stat":1,"tp":"-past","tense":"pres","trans":2}, [
          {"@type": "VERB", "types": {"trans":2,"stat":1,"pres":"+ies"}}, 
        ])
        },
    {"name": "V", "symbols": ["VERB"], "postprocess": 
        bind("V", {"num":"plur","fin":"+","stat":1,"tp":"-past","tense":"pres","trans":2}, [
          {"@type": "VERB", "types": {"trans":2,"stat":1}}, 
        ])
        },
    {"name": "V$subexpression$4", "symbols": [/[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$4"], "postprocess": 
        bind("V", {"num":1,"fin":"part","stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+ed"}}, 
        ])
        },
    {"name": "V$subexpression$5", "symbols": [/[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$5"], "postprocess": 
        bind("V", {"num":1,"fin":"+","stat":2,"tp":"+past","tense":"past","trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+ed"}}, 
        ])
        },
    {"name": "V$subexpression$6", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$6"], "postprocess": 
        bind("V", {"num":1,"fin":"part","stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+d"}}, 
        ])
        },
    {"name": "V$subexpression$7", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$7"], "postprocess": 
        bind("V", {"num":1,"fin":"+","stat":2,"tp":"+past","tense":"past","trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+d"}}, 
        ])
        },
    {"name": "V$subexpression$8", "symbols": [/[iI]/, /[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$8"], "postprocess": 
        bind("V", {"num":1,"fin":["+","part"],"stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+ied"}}, 
        ])
        },
    {"name": "V$subexpression$9", "symbols": [/[lL]/, /[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$9"], "postprocess": 
        bind("V", {"num":1,"fin":["+","part"],"stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+led"}}, 
        ])
        },
    {"name": "V$subexpression$10", "symbols": [/[rR]/, /[eE]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "V", "symbols": ["VERB", "V$subexpression$10"], "postprocess": 
        bind("V", {"num":1,"fin":["+","part"],"stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"+red"}}, 
        ])
        },
    {"name": "V", "symbols": ["VERB"], "postprocess": 
        bind("V", {"num":1,"fin":["+","part"],"stat":2,"tp":"-past","tense":["pres","past"],"trans":3}, [
          {"@type": "VERB", "types": {"trans":3,"stat":2,"past":"-reg"}}, 
        ])
        },
    {"name": "ADJ$subexpression$1", "symbols": [/[hH]/, /[aA]/, /[pP]/, /[pP]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$1"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$2", "symbols": [/[uU]/, /[nN]/, /[hH]/, /[aA]/, /[pP]/, /[pP]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$2"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$3", "symbols": [/[fF]/, /[oO]/, /[oO]/, /[lL]/, /[iI]/, /[sS]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$3"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$4", "symbols": [/[fF]/, /[aA]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$4"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$5", "symbols": [/[bB]/, /[eE]/, /[aA]/, /[uU]/, /[tT]/, /[iI]/, /[fF]/, /[uU]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$5"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$6", "symbols": [/[mM]/, /[oO]/, /[rR]/, /[tT]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$6"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "ADJ$subexpression$7", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/, /[iI]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ADJ", "symbols": ["ADJ$subexpression$7"], "postprocess": 
        bind("ADJ", {}, [
        ])
        },
    {"name": "PN$subexpression$1", "symbols": [/[sS]/, /[oO]/, /[cC]/, /[rR]/, /[aA]/, /[tT]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$1"], "postprocess": 
        bind("PN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "PN$subexpression$2", "symbols": [/[jJ]/, /[oO]/, /[nN]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$2"], "postprocess": 
        bind("PN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "PN$subexpression$3", "symbols": [/[jJ]/, /[oO]/, /[hH]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$3"], "postprocess": 
        bind("PN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "PN$subexpression$4", "symbols": [/[sS]/, /[mM]/, /[iI]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$4"], "postprocess": 
        bind("PN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "PN$subexpression$5", "symbols": [/[mM]/, /[aA]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$5"], "postprocess": 
        bind("PN", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "PN$subexpression$6", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$6"], "postprocess": 
        bind("PN", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "PN$subexpression$7", "symbols": [/[uU]/, /[lL]/, /[yY]/, /[sS]/, /[sS]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "PN", "symbols": ["PN$subexpression$7"], "postprocess": 
        bind("PN", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$1", "symbols": [/[mM]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$1"], "postprocess": 
        bind("N", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "N$subexpression$2", "symbols": [/[wW]/, /[oO]/, /[mM]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$2"], "postprocess": 
        bind("N", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "N$subexpression$3", "symbols": [/[gG]/, /[iI]/, /[rR]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$3"], "postprocess": 
        bind("N", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "N$subexpression$4", "symbols": [/[bB]/, /[oO]/, /[oO]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$4"], "postprocess": 
        bind("N", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$5", "symbols": [/[tT]/, /[eE]/, /[lL]/, /[eE]/, /[sS]/, /[cC]/, /[oO]/, /[pP]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$5"], "postprocess": 
        bind("N", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$6", "symbols": [/[dD]/, /[oO]/, /[nN]/, /[kK]/, /[eE]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$6"], "postprocess": 
        bind("N", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$7", "symbols": [/[hH]/, /[oO]/, /[rR]/, /[sS]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$7"], "postprocess": 
        bind("N", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$8", "symbols": [/[pP]/, /[oO]/, /[rR]/, /[sS]/, /[cC]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$8"], "postprocess": 
        bind("N", {"num":"sing","gen":"-hum"}, [
        ])
        },
    {"name": "N$subexpression$9", "symbols": [/[eE]/, /[nN]/, /[gG]/, /[iI]/, /[nN]/, /[eE]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$9"], "postprocess": 
        bind("N", {"num":"sing","gen":["male","fem"]}, [
        ])
        },
    {"name": "N$subexpression$10", "symbols": [/[bB]/, /[rR]/, /[aA]/, /[zZ]/, /[iI]/, /[lL]/, /[iI]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "N", "symbols": ["N$subexpression$10"], "postprocess": 
        bind("N", {"num":"sing","gen":1}, [
        ])
        },
    {"name": "RN$subexpression$1", "symbols": [/[bB]/, /[rR]/, /[oO]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$1"], "postprocess": 
        bind("RN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "RN$subexpression$2", "symbols": [/[fF]/, /[aA]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$2"], "postprocess": 
        bind("RN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "RN$subexpression$3", "symbols": [/[hH]/, /[uU]/, /[sS]/, /[bB]/, /[aA]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$3"], "postprocess": 
        bind("RN", {"num":"sing","gen":"male"}, [
        ])
        },
    {"name": "RN$subexpression$4", "symbols": [/[sS]/, /[iI]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$4"], "postprocess": 
        bind("RN", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "RN$subexpression$5", "symbols": [/[mM]/, /[oO]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$5"], "postprocess": 
        bind("RN", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "RN$subexpression$6", "symbols": [/[wW]/, /[iI]/, /[fF]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "RN", "symbols": ["RN$subexpression$6"], "postprocess": 
        bind("RN", {"num":"sing","gen":"fem"}, [
        ])
        },
    {"name": "VERB$subexpression$1", "symbols": [/[bB]/, /[eE]/, /[aA]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$1"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$2", "symbols": [/[lL]/, /[iI]/, /[sS]/, /[tT]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$2"], "postprocess": 
        bind("VERB", {"trans":1,"stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$3", "symbols": [/[oO]/, /[wW]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$3"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$4", "symbols": [/[lL]/, /[iI]/, /[sS]/, /[tT]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$4"], "postprocess": 
        bind("VERB", {"trans":1,"stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$5", "symbols": [/[wW]/, /[aA]/, /[lL]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$5"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$6", "symbols": [/[sS]/, /[lL]/, /[eE]/, /[eE]/, /[pP]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$6"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$7", "symbols": [/[sS]/, /[tT]/, /[iI]/, /[nN]/, /[kK]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$7"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$8", "symbols": [/[lL]/, /[eE]/, /[aA]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$8"], "postprocess": 
        bind("VERB", {"trans":1,"stat":"-","pres":"+s"}, [
        ])
        },
    {"name": "VERB$subexpression$9", "symbols": [/[lL]/, /[eE]/, /[fF]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$9"], "postprocess": 
        bind("VERB", {"trans":1,"stat":"-","past":"-reg"}, [
        ])
        },
    {"name": "VERB$subexpression$10", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$10"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s"}, [
        ])
        },
    {"name": "VERB$subexpression$11", "symbols": [/[cC]/, /[aA]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$11"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","past":"-reg"}, [
        ])
        },
    {"name": "VERB$subexpression$12", "symbols": [/[kK]/, /[iI]/, /[sS]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$12"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+es","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$13", "symbols": [/[bB]/, /[oO]/, /[xX]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$13"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+es","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$14", "symbols": [/[wW]/, /[aA]/, /[tT]/, /[cC]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$14"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+es","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$15", "symbols": [/[cC]/, /[rR]/, /[aA]/, /[sS]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$15"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+es","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$16", "symbols": [/[lL]/, /[iI]/, /[kK]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$16"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$17", "symbols": [/[sS]/, /[eE]/, /[iI]/, /[zZ]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$17"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$18", "symbols": [/[tT]/, /[iI]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$18"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$19", "symbols": [/[fF]/, /[rR]/, /[eE]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$19"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$20", "symbols": [/[lL]/, /[oO]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$20"], "postprocess": 
        bind("VERB", {"trans":1,"stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$21", "symbols": [/[sS]/, /[uU]/, /[rR]/, /[pP]/, /[rR]/, /[iI]/, /[sS]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$21"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$22", "symbols": [/[fF]/, /[aA]/, /[sS]/, /[cC]/, /[iI]/, /[nN]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$22"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$23", "symbols": [/[aA]/, /[dD]/, /[mM]/, /[iI]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$23"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+d"}, [
        ])
        },
    {"name": "VERB$subexpression$24", "symbols": [/[sS]/, /[kK]/, /[iI]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$24"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$25", "symbols": [/[eE]/, /[cC]/, /[hH]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$25"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$26", "symbols": [/[pP]/, /[lL]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$26"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$27", "symbols": [/[dD]/, /[eE]/, /[cC]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$27"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$28", "symbols": [/[eE]/, /[nN]/, /[jJ]/, /[oO]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$28"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+s","past":"+ed"}, [
        ])
        },
    {"name": "VERB$subexpression$29", "symbols": [/[cC]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$29"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+ies","past":"+ied"}, [
        ])
        },
    {"name": "VERB$subexpression$30", "symbols": [/[aA]/, /[pP]/, /[pP]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$30"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+ies","past":"+ied"}, [
        ])
        },
    {"name": "VERB$subexpression$31", "symbols": [/[cC]/, /[oO]/, /[pP]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$31"], "postprocess": 
        bind("VERB", {"trans":"+","stat":"-","pres":"+ies","past":"+ied"}, [
        ])
        },
    {"name": "VERB$subexpression$32", "symbols": [/[rR]/, /[eE]/, /[pP]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$32"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+ies","past":"+ied"}, [
        ])
        },
    {"name": "VERB$subexpression$33", "symbols": [/[tT]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$33"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+ies","past":"+ied"}, [
        ])
        },
    {"name": "VERB$subexpression$34", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[pP]/, /[eE]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$34"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+led"}, [
        ])
        },
    {"name": "VERB$subexpression$35", "symbols": [/[dD]/, /[eE]/, /[fF]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "VERB", "symbols": ["VERB$subexpression$35"], "postprocess": 
        bind("VERB", {"trans":"-","stat":"-","pres":"+s","past":"+red"}, [
        ])
        }
]
  , ParserStart: "Sentence"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
