(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.module = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
const nearley = require("nearley");
const {ParserRules, ParserStart} = require("./grammar.js");

// console.log(grammar);

function parse(code) {
  let parser = new nearley.Parser(ParserRules, ParserStart, {
    keepHistory: true
  });   
  
  // console.log(grammar);
  parser.feed(code);
  return parser.results;
}

module.exports = {
  parse: parse,
}

},{"./grammar.js":1,"nearley":3}],3:[function(require,module,exports){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.nearley = factory();
    }
}(this, function() {

    function Rule(name, symbols, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols;        // a list of literal | regex class | nonterminal
        this.postprocess = postprocess;
        return this;
    }
    Rule.highestId = 0;

    Rule.prototype.toString = function(withCursorAt) {
        var symbolSequence = (typeof withCursorAt === "undefined")
                             ? this.symbols.map(getSymbolShortDisplay).join(' ')
                             : (   this.symbols.slice(0, withCursorAt).map(getSymbolShortDisplay).join(' ')
                                 + " ● "
                                 + this.symbols.slice(withCursorAt).map(getSymbolShortDisplay).join(' ')     );
        return this.name + " → " + symbolSequence;
    }


    // a State is a rule at a position from a given starting point in the input stream (reference)
    function State(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
    }

    State.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    State.prototype.nextState = function(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
            // Having right set here will prevent the right state and its children
            // form being garbage collected
            state.right = undefined;
        }
        return state;
    };

    State.prototype.build = function() {
        var children = [];
        var node = this;
        do {
            children.push(node.right.data);
            node = node.left;
        } while (node.left);
        children.reverse();
        return children;
    };

    State.prototype.finish = function() {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    };


    function Column(grammar, index) {
        this.grammar = grammar;
        this.index = index;
        this.states = [];
        this.wants = {}; // states indexed by the non-terminal they expect
        this.scannable = []; // list of states that expect a token
        this.completed = {}; // states that are nullable
    }


    Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;

        for (var w = 0; w < states.length; w++) { // nb. we push() during iteration
            var state = states[w];

            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    // complete
                    var wantedBy = state.wantedBy;
                    for (var i = wantedBy.length; i--; ) { // this line is hot
                        var left = wantedBy[i];
                        this.complete(left, state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        // make sure future predictors of this rule get completed.
                        var exp = state.rule.name;
                        (this.completed[exp] = this.completed[exp] || []).push(state);
                    }
                }

            } else {
                // queue scannable states
                var exp = state.rule.symbols[state.dot];
                if (typeof exp !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (wants[exp]) {
                    wants[exp].push(state);

                    if (completed.hasOwnProperty(exp)) {
                        var nulls = completed[exp];
                        for (var i = 0; i < nulls.length; i++) {
                            var right = nulls[i];
                            this.complete(state, right);
                        }
                    }
                } else {
                    wants[exp] = [state];
                    this.predict(exp);
                }
            }
        }
    }

    Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];

        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            var wantedBy = this.wants[exp];
            var s = new State(r, 0, this.index, wantedBy);
            this.states.push(s);
        }
    }

    Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
    }


    function Grammar(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
            if (!byName.hasOwnProperty(rule.name)) {
                byName[rule.name] = [];
            }
            byName[rule.name].push(rule);
        });
    }

    // So we can allow passing (rules, start) directly to Parser for backwards compatibility
    Grammar.fromCompiled = function(rules, start) {
        var lexer = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
        var g = new Grammar(rules, start);
        g.lexer = lexer; // nb. storing lexer on Grammar is iffy, but unavoidable
        return g;
    }


    function StreamLexer() {
      this.reset("");
    }

    StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
    }

    StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
            var ch = this.buffer[this.index++];
            if (ch === '\n') {
              this.line += 1;
              this.lastLineBreak = this.index;
            }
            return {value: ch};
        }
    }

    StreamLexer.prototype.save = function() {
      return {
        line: this.line,
        col: this.index - this.lastLineBreak,
      }
    }

    StreamLexer.prototype.formatError = function(token, message) {
        // nb. this gets called after consuming the offending token,
        // so the culprit is index-1
        var buffer = this.buffer;
        if (typeof buffer === 'string') {
            var lines = buffer
                .split("\n")
                .slice(
                    Math.max(0, this.line - 5), 
                    this.line
                );

            var nextLineBreak = buffer.indexOf('\n', this.index);
            if (nextLineBreak === -1) nextLineBreak = buffer.length;
            var col = this.index - this.lastLineBreak;
            var lastLineDigits = String(this.line).length;
            message += " at line " + this.line + " col " + col + ":\n\n";
            message += lines
                .map(function(line, i) {
                    return pad(this.line - lines.length + i + 1, lastLineDigits) + " " + line;
                }, this)
                .join("\n");
            message += "\n" + pad("", lastLineDigits + col) + "^\n";
            return message;
        } else {
            return message + " at index " + (this.index - 1);
        }

        function pad(n, length) {
            var s = String(n);
            return Array(length - s.length + 1).join(" ") + s;
        }
    }

    function Parser(rules, start, options) {
        if (rules instanceof Grammar) {
            var grammar = rules;
            var options = start;
        } else {
            var grammar = Grammar.fromCompiled(rules, start);
        }
        this.grammar = grammar;

        // Read options
        this.options = {
            keepHistory: false,
            lexer: grammar.lexer || new StreamLexer,
        };
        for (var key in (options || {})) {
            this.options[key] = options[key];
        }

        // Setup lexer
        this.lexer = this.options.lexer;
        this.lexerState = undefined;

        // Setup a table
        var column = new Column(grammar, 0);
        var table = this.table = [column];

        // I could be expecting anything.
        column.wants[grammar.start] = [];
        column.predict(grammar.start);
        // TODO what if start rule is nullable?
        column.process();
        this.current = 0; // token index
    }

    // create a reserved token for indicating a parse fail
    Parser.fail = {};

    Parser.prototype.feed = function(chunk) {
        var lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);

        var token;
        while (true) {
            try {
                token = lexer.next();
                if (!token) {
                    break;
                }
            } catch (e) {
                // Create the next column so that the error reporter
                // can display the correctly predicted states.
                var nextColumn = new Column(this.grammar, this.current + 1);
                this.table.push(nextColumn);
                var err = new Error(this.reportLexerError(e));
                err.offset = this.current;
                err.token = e.token;
                throw err;
            }
            // We add new states to table[current+1]
            var column = this.table[this.current];

            // GC unused states
            if (!this.options.keepHistory) {
                delete this.table[this.current - 1];
            }

            var n = this.current + 1;
            var nextColumn = new Column(this.grammar, n);
            this.table.push(nextColumn);

            // Advance all tokens that expect the symbol
            var literal = token.text !== undefined ? token.text : token.value;
            var value = lexer.constructor === StreamLexer ? token.value : token;
            var scannable = column.scannable;
            for (var w = scannable.length; w--; ) {
                var state = scannable[w];
                var expect = state.rule.symbols[state.dot];
                // Try to consume the token
                // either regex or literal
                if (expect.test ? expect.test(value) :
                    expect.type ? expect.type === token.type
                                : expect.literal === literal) {
                    // Add it
                    var next = state.nextState({data: value, token: token, isToken: true, reference: n - 1});
                    nextColumn.states.push(next);
                }
            }

            // Next, for each of the rules, we either
            // (a) complete it, and try to see if the reference row expected that
            //     rule
            // (b) predict the next nonterminal it expects by adding that
            //     nonterminal's start state
            // To prevent duplication, we also keep track of rules we have already
            // added

            nextColumn.process();

            // If needed, throw an error:
            if (nextColumn.states.length === 0) {
                // No states at all! This is not good.
                var err = new Error(this.reportError(token));
                err.offset = this.current;
                err.token = token;
                throw err;
            }

            // maybe save lexer state
            if (this.options.keepHistory) {
              column.lexerState = lexer.save()
            }

            this.current++;
        }
        if (column) {
          this.lexerState = lexer.save()
        }

        // Incrementally keep track of results
        this.results = this.finish();

        // Allow chaining, for whatever it's worth
        return this;
    };

    Parser.prototype.reportLexerError = function(lexerError) {
        var tokenDisplay, lexerMessage;
        // Planning to add a token property to moo's thrown error
        // even on erroring tokens to be used in error display below
        var token = lexerError.token;
        if (token) {
            tokenDisplay = "input " + JSON.stringify(token.text[0]) + " (lexer error)";
            lexerMessage = this.lexer.formatError(token, "Syntax error");
        } else {
            tokenDisplay = "input (lexer error)";
            lexerMessage = lexerError.message;
        }
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    };

    Parser.prototype.reportError = function(token) {
        var tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== undefined ? token.value : token);
        var lexerMessage = this.lexer.formatError(token, "Syntax error");
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    };

    Parser.prototype.reportErrorCommon = function(lexerMessage, tokenDisplay) {
        var lines = [];
        lines.push(lexerMessage);
        var lastColumnIndex = this.table.length - 2;
        var lastColumn = this.table[lastColumnIndex];
        var expectantStates = lastColumn.states
            .filter(function(state) {
                var nextSymbol = state.rule.symbols[state.dot];
                return nextSymbol && typeof nextSymbol !== "string";
            });

        if (expectantStates.length === 0) {
            lines.push('Unexpected ' + tokenDisplay + '. I did not expect any more input. Here is the state of my parse table:\n');
            this.displayStateStack(lastColumn.states, lines);
        } else {
            lines.push('Unexpected ' + tokenDisplay + '. Instead, I was expecting to see one of the following:\n');
            // Display a "state stack" for each expectant state
            // - which shows you how this state came to be, step by step.
            // If there is more than one derivation, we only display the first one.
            var stateStacks = expectantStates
                .map(function(state) {
                    return this.buildFirstStateStack(state, []) || [state];
                }, this);
            // Display each state that is expecting a terminal symbol next.
            stateStacks.forEach(function(stateStack) {
                var state = stateStack[0];
                var nextSymbol = state.rule.symbols[state.dot];
                var symbolDisplay = this.getSymbolDisplay(nextSymbol);
                lines.push('A ' + symbolDisplay + ' based on:');
                this.displayStateStack(stateStack, lines);
            }, this);
        }
        lines.push("");
        return lines.join("\n");
    }
    
    Parser.prototype.displayStateStack = function(stateStack, lines) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (var j = 0; j < stateStack.length; j++) {
            var state = stateStack[j];
            var display = state.rule.toString(state.dot);
            if (display === lastDisplay) {
                sameDisplayCount++;
            } else {
                if (sameDisplayCount > 0) {
                    lines.push('    ^ ' + sameDisplayCount + ' more lines identical to this');
                }
                sameDisplayCount = 0;
                lines.push('    ' + display);
            }
            lastDisplay = display;
        }
    };

    Parser.prototype.getSymbolDisplay = function(symbol) {
        return getSymbolLongDisplay(symbol);
    };

    /*
    Builds a the first state stack. You can think of a state stack as the call stack
    of the recursive-descent parser which the Nearley parse algorithm simulates.
    A state stack is represented as an array of state objects. Within a
    state stack, the first item of the array will be the starting
    state, with each successive item in the array going further back into history.

    This function needs to be given a starting state and an empty array representing
    the visited states, and it returns an single state stack.

    */
    Parser.prototype.buildFirstStateStack = function(state, visited) {
        if (visited.indexOf(state) !== -1) {
            // Found cycle, return null
            // to eliminate this path from the results, because
            // we don't know how to display it meaningfully
            return null;
        }
        if (state.wantedBy.length === 0) {
            return [state];
        }
        var prevState = state.wantedBy[0];
        var childVisited = [state].concat(visited);
        var childResult = this.buildFirstStateStack(prevState, childVisited);
        if (childResult === null) {
            return null;
        }
        return [state].concat(childResult);
    };

    Parser.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    };

    Parser.prototype.restore = function(column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;

        // Incrementally keep track of results
        this.results = this.finish();
    };

    // nb. deprecated: use save/restore instead!
    Parser.prototype.rewind = function(index) {
        if (!this.options.keepHistory) {
            throw new Error('set option `keepHistory` to enable rewinding')
        }
        // nb. recall column (table) indicies fall between token indicies.
        //        col 0   --   token 0   --   col 1
        this.restore(this.table[index]);
    };

    Parser.prototype.finish = function() {
        // Return the possible parsings
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1]
        column.states.forEach(function (t) {
            if (t.rule.name === start
                    && t.dot === t.rule.symbols.length
                    && t.reference === 0
                    && t.data !== Parser.fail) {
                considerations.push(t);
            }
        });
        return considerations.map(function(c) {return c.data; });
    };

    function getSymbolLongDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object") {
            if (symbol.literal) {
                return JSON.stringify(symbol.literal);
            } else if (symbol instanceof RegExp) {
                return 'character matching ' + symbol;
            } else if (symbol.type) {
                return symbol.type + ' token';
            } else if (symbol.test) {
                return 'token matching ' + String(symbol.test);
            } else {
                throw new Error('Unknown symbol type: ' + symbol);
            }
        }
    }

    function getSymbolShortDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object") {
            if (symbol.literal) {
                return JSON.stringify(symbol.literal);
            } else if (symbol instanceof RegExp) {
                return symbol.toString();
            } else if (symbol.type) {
                return '%' + symbol.type;
            } else if (symbol.test) {
                return '<' + String(symbol.test) + '>';
            } else {
                throw new Error('Unknown symbol type: ' + symbol);
            }
        }
    }

    return {
        Parser: Parser,
        Grammar: Grammar,
        Rule: Rule,
    };

}));

},{}]},{},[2])(2)
});
