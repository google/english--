
module.exports = {
 S: (np, vp) => { return {"@type": "Sentence", np: np, vp: vp} },
 NP: (...args) => { return {"@type": "NounPhrase", children: args} },
 VP: (vb, np) => { return {"@type": "VerbPhrase", verb: vb, np: np} },
 PN: (name) => { return {"@type": "ProperName", name: name} },
 V: (name) => { return {"@type": "Verb", name: name} },
 PRO: (name) => { return {"@type": "Pronoun", name: name} },
 DET: (name) => { return {"@type": "Determiner", name: name} },
 N: (name) => { return {"@type": "Noun", name: name} },
}