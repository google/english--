(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.module = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory) /* global define */
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.moo = factory()
  }
}(this, function() {
  'use strict';

  var hasOwnProperty = Object.prototype.hasOwnProperty
  var toString = Object.prototype.toString
  var hasSticky = typeof new RegExp().sticky === 'boolean'

  /***************************************************************************/

  function isRegExp(o) { return o && toString.call(o) === '[object RegExp]' }
  function isObject(o) { return o && typeof o === 'object' && !isRegExp(o) && !Array.isArray(o) }

  function reEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
  function reGroups(s) {
    var re = new RegExp('|' + s)
    return re.exec('').length - 1
  }
  function reCapture(s) {
    return '(' + s + ')'
  }
  function reUnion(regexps) {
    if (!regexps.length) return '(?!)'
    var source =  regexps.map(function(s) {
      return "(?:" + s + ")"
    }).join('|')
    return "(?:" + source + ")"
  }

  function regexpOrLiteral(obj) {
    if (typeof obj === 'string') {
      return '(?:' + reEscape(obj) + ')'

    } else if (isRegExp(obj)) {
      // TODO: consider /u support
      if (obj.ignoreCase) throw new Error('RegExp /i flag not allowed')
      if (obj.global) throw new Error('RegExp /g flag is implied')
      if (obj.sticky) throw new Error('RegExp /y flag is implied')
      if (obj.multiline) throw new Error('RegExp /m flag is implied')
      return obj.source

    } else {
      throw new Error('Not a pattern: ' + obj)
    }
  }

  function objectToRules(object) {
    var keys = Object.getOwnPropertyNames(object)
    var result = []
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var thing = object[key]
      var rules = [].concat(thing)
      if (key === 'include') {
        for (var j = 0; j < rules.length; j++) {
          result.push({include: rules[j]})
        }
        continue
      }
      var match = []
      rules.forEach(function(rule) {
        if (isObject(rule)) {
          if (match.length) result.push(ruleOptions(key, match))
          result.push(ruleOptions(key, rule))
          match = []
        } else {
          match.push(rule)
        }
      })
      if (match.length) result.push(ruleOptions(key, match))
    }
    return result
  }

  function arrayToRules(array) {
    var result = []
    for (var i = 0; i < array.length; i++) {
      var obj = array[i]
      if (obj.include) {
        var include = [].concat(obj.include)
        for (var j = 0; j < include.length; j++) {
          result.push({include: include[j]})
        }
        continue
      }
      if (!obj.type) {
        throw new Error('Rule has no type: ' + JSON.stringify(obj))
      }
      result.push(ruleOptions(obj.type, obj))
    }
    return result
  }

  function ruleOptions(type, obj) {
    if (!isObject(obj)) {
      obj = { match: obj }
    }
    if (obj.include) {
      throw new Error('Matching rules cannot also include states')
    }

    // nb. error and fallback imply lineBreaks
    var options = {
      defaultType: type,
      lineBreaks: !!obj.error || !!obj.fallback,
      pop: false,
      next: null,
      push: null,
      error: false,
      fallback: false,
      value: null,
      type: null,
      shouldThrow: false,
    }

    // Avoid Object.assign(), so we support IE9+
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        options[key] = obj[key]
      }
    }

    // type transform cannot be a string
    if (typeof options.type === 'string' && type !== options.type) {
      throw new Error("Type transform cannot be a string (type '" + options.type + "' for token '" + type + "')")
    }

    // convert to array
    var match = options.match
    options.match = Array.isArray(match) ? match : match ? [match] : []
    options.match.sort(function(a, b) {
      return isRegExp(a) && isRegExp(b) ? 0
           : isRegExp(b) ? -1 : isRegExp(a) ? +1 : b.length - a.length
    })
    return options
  }

  function toRules(spec) {
    return Array.isArray(spec) ? arrayToRules(spec) : objectToRules(spec)
  }

  var defaultErrorRule = ruleOptions('error', {lineBreaks: true, shouldThrow: true})
  function compileRules(rules, hasStates) {
    var errorRule = null
    var fast = Object.create(null)
    var fastAllowed = true
    var unicodeFlag = null
    var groups = []
    var parts = []

    // If there is a fallback rule, then disable fast matching
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].fallback) {
        fastAllowed = false
      }
    }

    for (var i = 0; i < rules.length; i++) {
      var options = rules[i]

      if (options.include) {
        // all valid inclusions are removed by states() preprocessor
        throw new Error('Inheritance is not allowed in stateless lexers')
      }

      if (options.error || options.fallback) {
        // errorRule can only be set once
        if (errorRule) {
          if (!options.fallback === !errorRule.fallback) {
            throw new Error("Multiple " + (options.fallback ? "fallback" : "error") + " rules not allowed (for token '" + options.defaultType + "')")
          } else {
            throw new Error("fallback and error are mutually exclusive (for token '" + options.defaultType + "')")
          }
        }
        errorRule = options
      }

      var match = options.match.slice()
      if (fastAllowed) {
        while (match.length && typeof match[0] === 'string' && match[0].length === 1) {
          var word = match.shift()
          fast[word.charCodeAt(0)] = options
        }
      }

      // Warn about inappropriate state-switching options
      if (options.pop || options.push || options.next) {
        if (!hasStates) {
          throw new Error("State-switching options are not allowed in stateless lexers (for token '" + options.defaultType + "')")
        }
        if (options.fallback) {
          throw new Error("State-switching options are not allowed on fallback tokens (for token '" + options.defaultType + "')")
        }
      }

      // Only rules with a .match are included in the RegExp
      if (match.length === 0) {
        continue
      }
      fastAllowed = false

      groups.push(options)

      // Check unicode flag is used everywhere or nowhere
      for (var j = 0; j < match.length; j++) {
        var obj = match[j]
        if (!isRegExp(obj)) {
          continue
        }

        if (unicodeFlag === null) {
          unicodeFlag = obj.unicode
        } else if (unicodeFlag !== obj.unicode && options.fallback === false) {
          throw new Error('If one rule is /u then all must be')
        }
      }

      // convert to RegExp
      var pat = reUnion(match.map(regexpOrLiteral))

      // validate
      var regexp = new RegExp(pat)
      if (regexp.test("")) {
        throw new Error("RegExp matches empty string: " + regexp)
      }
      var groupCount = reGroups(pat)
      if (groupCount > 0) {
        throw new Error("RegExp has capture groups: " + regexp + "\nUse (?: … ) instead")
      }

      // try and detect rules matching newlines
      if (!options.lineBreaks && regexp.test('\n')) {
        throw new Error('Rule should declare lineBreaks: ' + regexp)
      }

      // store regex
      parts.push(reCapture(pat))
    }


    // If there's no fallback rule, use the sticky flag so we only look for
    // matches at the current index.
    //
    // If we don't support the sticky flag, then fake it using an irrefutable
    // match (i.e. an empty pattern).
    var fallbackRule = errorRule && errorRule.fallback
    var flags = hasSticky && !fallbackRule ? 'ym' : 'gm'
    var suffix = hasSticky || fallbackRule ? '' : '|'

    if (unicodeFlag === true) flags += "u"
    var combined = new RegExp(reUnion(parts) + suffix, flags)
    return {regexp: combined, groups: groups, fast: fast, error: errorRule || defaultErrorRule}
  }

  function compile(rules) {
    var result = compileRules(toRules(rules))
    return new Lexer({start: result}, 'start')
  }

  function checkStateGroup(g, name, map) {
    var state = g && (g.push || g.next)
    if (state && !map[state]) {
      throw new Error("Missing state '" + state + "' (in token '" + g.defaultType + "' of state '" + name + "')")
    }
    if (g && g.pop && +g.pop !== 1) {
      throw new Error("pop must be 1 (in token '" + g.defaultType + "' of state '" + name + "')")
    }
  }
  function compileStates(states, start) {
    var all = states.$all ? toRules(states.$all) : []
    delete states.$all

    var keys = Object.getOwnPropertyNames(states)
    if (!start) start = keys[0]

    var ruleMap = Object.create(null)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      ruleMap[key] = toRules(states[key]).concat(all)
    }
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var rules = ruleMap[key]
      var included = Object.create(null)
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j]
        if (!rule.include) continue
        var splice = [j, 1]
        if (rule.include !== key && !included[rule.include]) {
          included[rule.include] = true
          var newRules = ruleMap[rule.include]
          if (!newRules) {
            throw new Error("Cannot include nonexistent state '" + rule.include + "' (in state '" + key + "')")
          }
          for (var k = 0; k < newRules.length; k++) {
            var newRule = newRules[k]
            if (rules.indexOf(newRule) !== -1) continue
            splice.push(newRule)
          }
        }
        rules.splice.apply(rules, splice)
        j--
      }
    }

    var map = Object.create(null)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      map[key] = compileRules(ruleMap[key], true)
    }

    for (var i = 0; i < keys.length; i++) {
      var name = keys[i]
      var state = map[name]
      var groups = state.groups
      for (var j = 0; j < groups.length; j++) {
        checkStateGroup(groups[j], name, map)
      }
      var fastKeys = Object.getOwnPropertyNames(state.fast)
      for (var j = 0; j < fastKeys.length; j++) {
        checkStateGroup(state.fast[fastKeys[j]], name, map)
      }
    }

    return new Lexer(map, start)
  }

  function keywordTransform(map) {
    var reverseMap = Object.create(null)
    var byLength = Object.create(null)
    var types = Object.getOwnPropertyNames(map)
    for (var i = 0; i < types.length; i++) {
      var tokenType = types[i]
      var item = map[tokenType]
      var keywordList = Array.isArray(item) ? item : [item]
      keywordList.forEach(function(keyword) {
        (byLength[keyword.length] = byLength[keyword.length] || []).push(keyword)
        if (typeof keyword !== 'string') {
          throw new Error("keyword must be string (in keyword '" + tokenType + "')")
        }
        reverseMap[keyword] = tokenType
      })
    }

    // fast string lookup
    // https://jsperf.com/string-lookups
    function str(x) { return JSON.stringify(x) }
    var source = ''
    source += 'switch (value.length) {\n'
    for (var length in byLength) {
      var keywords = byLength[length]
      source += 'case ' + length + ':\n'
      source += 'switch (value) {\n'
      keywords.forEach(function(keyword) {
        var tokenType = reverseMap[keyword]
        source += 'case ' + str(keyword) + ': return ' + str(tokenType) + '\n'
      })
      source += '}\n'
    }
    source += '}\n'
    return Function('value', source) // type
  }

  /***************************************************************************/

  var Lexer = function(states, state) {
    this.startState = state
    this.states = states
    this.buffer = ''
    this.stack = []
    this.reset()
  }

  Lexer.prototype.reset = function(data, info) {
    this.buffer = data || ''
    this.index = 0
    this.line = info ? info.line : 1
    this.col = info ? info.col : 1
    this.queuedToken = info ? info.queuedToken : null
    this.queuedThrow = info ? info.queuedThrow : null
    this.setState(info ? info.state : this.startState)
    this.stack = info && info.stack ? info.stack.slice() : []
    return this
  }

  Lexer.prototype.save = function() {
    return {
      line: this.line,
      col: this.col,
      state: this.state,
      stack: this.stack.slice(),
      queuedToken: this.queuedToken,
      queuedThrow: this.queuedThrow,
    }
  }

  Lexer.prototype.setState = function(state) {
    if (!state || this.state === state) return
    this.state = state
    var info = this.states[state]
    this.groups = info.groups
    this.error = info.error
    this.re = info.regexp
    this.fast = info.fast
  }

  Lexer.prototype.popState = function() {
    this.setState(this.stack.pop())
  }

  Lexer.prototype.pushState = function(state) {
    this.stack.push(this.state)
    this.setState(state)
  }

  var eat = hasSticky ? function(re, buffer) { // assume re is /y
    return re.exec(buffer)
  } : function(re, buffer) { // assume re is /g
    var match = re.exec(buffer)
    // will always match, since we used the |(?:) trick
    if (match[0].length === 0) {
      return null
    }
    return match
  }

  Lexer.prototype._getGroup = function(match) {
    var groupCount = this.groups.length
    for (var i = 0; i < groupCount; i++) {
      if (match[i + 1] !== undefined) {
        return this.groups[i]
      }
    }
    throw new Error('Cannot find token type for matched text')
  }

  function tokenToString() {
    return this.value
  }

  Lexer.prototype.next = function() {
    var index = this.index

    // If a fallback token matched, we don't need to re-run the RegExp
    if (this.queuedGroup) {
      var token = this._token(this.queuedGroup, this.queuedText, index)
      this.queuedGroup = null
      this.queuedText = ""
      return token
    }

    var buffer = this.buffer
    if (index === buffer.length) {
      return // EOF
    }

    // Fast matching for single characters
    var group = this.fast[buffer.charCodeAt(index)]
    if (group) {
      return this._token(group, buffer.charAt(index), index)
    }

    // Execute RegExp
    var re = this.re
    re.lastIndex = index
    var match = eat(re, buffer)

    // Error tokens match the remaining buffer
    var error = this.error
    if (match == null) {
      return this._token(error, buffer.slice(index, buffer.length), index)
    }

    var group = this._getGroup(match)
    var text = match[0]

    if (error.fallback && match.index !== index) {
      this.queuedGroup = group
      this.queuedText = text

      // Fallback tokens contain the unmatched portion of the buffer
      return this._token(error, buffer.slice(index, match.index), index)
    }

    return this._token(group, text, index)
  }

  Lexer.prototype._token = function(group, text, offset) {
    // count line breaks
    var lineBreaks = 0
    if (group.lineBreaks) {
      var matchNL = /\n/g
      var nl = 1
      if (text === '\n') {
        lineBreaks = 1
      } else {
        while (matchNL.exec(text)) { lineBreaks++; nl = matchNL.lastIndex }
      }
    }

    var token = {
      type: (typeof group.type === 'function' && group.type(text)) || group.defaultType,
      value: typeof group.value === 'function' ? group.value(text) : text,
      text: text,
      toString: tokenToString,
      offset: offset,
      lineBreaks: lineBreaks,
      line: this.line,
      col: this.col,
    }
    // nb. adding more props to token object will make V8 sad!

    var size = text.length
    this.index += size
    this.line += lineBreaks
    if (lineBreaks !== 0) {
      this.col = size - nl + 1
    } else {
      this.col += size
    }

    // throw, if no rule with {error: true}
    if (group.shouldThrow) {
      throw new Error(this.formatError(token, "invalid syntax"))
    }

    if (group.pop) this.popState()
    else if (group.push) this.pushState(group.push)
    else if (group.next) this.setState(group.next)

    return token
  }

  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    var LexerIterator = function(lexer) {
      this.lexer = lexer
    }

    LexerIterator.prototype.next = function() {
      var token = this.lexer.next()
      return {value: token, done: !token}
    }

    LexerIterator.prototype[Symbol.iterator] = function() {
      return this
    }

    Lexer.prototype[Symbol.iterator] = function() {
      return new LexerIterator(this)
    }
  }

  Lexer.prototype.formatError = function(token, message) {
    if (token == null) {
      // An undefined token indicates EOF
      var text = this.buffer.slice(this.index)
      var token = {
        text: text,
        offset: this.index,
        lineBreaks: text.indexOf('\n') === -1 ? 0 : 1,
        line: this.line,
        col: this.col,
      }
    }
    var start = Math.max(0, token.offset - token.col + 1)
    var eol = token.lineBreaks ? token.text.indexOf('\n') : token.text.length
    var firstLine = this.buffer.substring(start, token.offset + eol)
    message += " at line " + token.line + " col " + token.col + ":\n\n"
    message += "  " + firstLine + "\n"
    message += "  " + Array(token.col).join(" ") + "^"
    return message
  }

  Lexer.prototype.clone = function() {
    return new Lexer(this.states, this.state)
  }

  Lexer.prototype.has = function(tokenType) {
    return true
  }


  return {
    compile: compile,
    states: compileStates,
    error: Object.freeze({error: true}),
    fallback: Object.freeze({fallback: true}),
    keywords: keywordTransform,
  }

}));

},{}],2:[function(require,module,exports){
(function (process,__dirname){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./nearley'));
    } else {
        root.Compile = factory(root.nearley);
    }
}(this, function(nearley) {

    function Compile(structure, opts) {
        var unique = uniquer();
        if (!opts.alreadycompiled) {
            opts.alreadycompiled = [];
        }

        var result = {
            rules: [],
            body: [], // @directives list
            customTokens: [], // %tokens
            config: {}, // @config value
            macros: {},
            start: '',
            version: opts.version || 'unknown'
        };

        for (var i = 0; i < structure.length; i++) {
            var productionRule = structure[i];
            if (productionRule.body) {
                // This isn't a rule, it's an @directive.
                if (!opts.nojs) {
                    result.body.push(productionRule.body);
                }
            } else if (productionRule.include) {
                // Include file
                var path;
                if (!productionRule.builtin) {
                    path = require('path').resolve(
                        opts.args[0] ? require('path').dirname(opts.args[0]) : process.cwd(),
                        productionRule.include
                    );
                } else {
                    path = require('path').resolve(
                        __dirname,
                        '../builtin/',
                        productionRule.include
                    );
                }
                if (opts.alreadycompiled.indexOf(path) === -1) {
                    opts.alreadycompiled.push(path);
                    var f = require('fs').readFileSync(path).toString();
                    var parserGrammar = nearley.Grammar.fromCompiled(require('./nearley-language-bootstrapped.js'));
                    var parser = new nearley.Parser(parserGrammar);
                    parser.feed(f);
                    var c = Compile(parser.results[0], {args: [path], __proto__:opts});
                    result.rules = result.rules.concat(c.rules);
                    result.body  = result.body.concat(c.body);
                    result.customTokens = result.customTokens.concat(c.customTokens);
                    Object.keys(c.config).forEach(function(k) {
                        result.config[k] = c.config[k];
                    });
                    Object.keys(c.macros).forEach(function(k) {
                        result.macros[k] = c.macros[k];
                    });
                }
            } else if (productionRule.macro) {
                result.macros[productionRule.macro] = {
                    'args': productionRule.args,
                    'exprs': productionRule.exprs
                };
            } else if (productionRule.config) {
                // This isn't a rule, it's an @config.
                result.config[productionRule.config] = productionRule.value
            } else {
                produceRules(productionRule.name, productionRule.rules, {});
                if (!result.start) {
                    result.start = productionRule.name;
                }
            }
        }

        return result;

        function produceRules(name, rules, env) {
            for (var i = 0; i < rules.length; i++) {
                var rule = buildRule(name, rules[i], env);
                if (opts.nojs) {
                    rule.postprocess = null;
                }
                result.rules.push(rule);
            }
        }

        function buildRule(ruleName, rule, env) {
            var tokens = [];
            for (var i = 0; i < rule.tokens.length; i++) {
                var token = buildToken(ruleName, rule.tokens[i], env);
                if (token !== null) {
                    tokens.push(token);
                }
            }
            return new nearley.Rule(
                ruleName,
                tokens,
                rule.postprocess
            );
        }

        function buildToken(ruleName, token, env) {
            if (typeof token === 'string') {
                if (token === 'null') {
                    return null;
                }
                return token;
            }

            if (token instanceof RegExp) {
                return token;
            }

            if (token.literal) {
                if (!token.literal.length) {
                    return null;
                }
                if (token.literal.length === 1 || result.config.lexer) {
                    return token;
                }
                return buildStringToken(ruleName, token, env);
            }
            if (token.token) {
                if (result.config.lexer) {
                    var name = token.token;
                    if (result.customTokens.indexOf(name) === -1) {
                        result.customTokens.push(name);
                    }
                    var expr = result.config.lexer + ".has(" + JSON.stringify(name) + ") ? {type: " + JSON.stringify(name) + "} : " + name;
                    return {token: "(" + expr + ")"};
                }
                return token;
            }

            if (token.subexpression) {
                return buildSubExpressionToken(ruleName, token, env);
            }

            if (token.ebnf) {
                return buildEBNFToken(ruleName, token, env);
            }

            if (token.macrocall) {
                return buildMacroCallToken(ruleName, token, env);
            }

            if (token.mixin) {
                if (env[token.mixin]) {
                    return buildToken(ruleName, env[token.mixin], env);
                } else {
                    throw new Error("Unbound variable: " + token.mixin);
                }
            }

            throw new Error("unrecognized token: " + JSON.stringify(token));
        }

        function buildStringToken(ruleName, token, env) {
            var newname = unique(ruleName + "$string");
            produceRules(newname, [
                {
                    tokens: token.literal.split("").map(function charLiteral(d) {
                        return {
                            literal: d
                        };
                    }),
                    postprocess: {builtin: "joiner"}
                }
            ], env);
            return newname;
        }

        function buildSubExpressionToken(ruleName, token, env) {
            var data = token.subexpression;
            var name = unique(ruleName + "$subexpression");
            //structure.push({"name": name, "rules": data});
            produceRules(name, data, env);
            return name;
        }

        function buildEBNFToken(ruleName, token, env) {
            switch (token.modifier) {
                case ":+":
                    return buildEBNFPlus(ruleName, token, env);
                case ":*":
                    return buildEBNFStar(ruleName, token, env);
                case ":?":
                    return buildEBNFOpt(ruleName, token, env);
            }
        }

        function buildEBNFPlus(ruleName, token, env) {
            var name = unique(ruleName + "$ebnf");
            /*
            structure.push({
                name: name,
                rules: [{
                    tokens: [token.ebnf],
                }, {
                    tokens: [token.ebnf, name],
                    postprocess: {builtin: "arrconcat"}
                }]
            });
            */
            produceRules(name,
                [{
                    tokens: [token.ebnf],
                }, {
                    tokens: [name, token.ebnf],
                    postprocess: {builtin: "arrpush"}
                }],
                env
            );
            return name;
        }

        function buildEBNFStar(ruleName, token, env) {
            var name = unique(ruleName + "$ebnf");
            /*
            structure.push({
                name: name,
                rules: [{
                    tokens: [],
                }, {
                    tokens: [token.ebnf, name],
                    postprocess: {builtin: "arrconcat"}
                }]
            });
            */
            produceRules(name,
                [{
                    tokens: [],
                }, {
                    tokens: [name, token.ebnf],
                    postprocess: {builtin: "arrpush"}
                }],
                env
            );
            return name;
        }

        function buildEBNFOpt(ruleName, token, env) {
            var name = unique(ruleName + "$ebnf");
            /*
            structure.push({
                name: name,
                rules: [{
                    tokens: [token.ebnf],
                    postprocess: {builtin: "id"}
                }, {
                    tokens: [],
                    postprocess: {builtin: "nuller"}
                }]
            });
            */
            produceRules(name,
                [{
                    tokens: [token.ebnf],
                    postprocess: {builtin: "id"}
                }, {
                    tokens: [],
                    postprocess: {builtin: "nuller"}
                }],
                env
            );
            return name;
        }

        function buildMacroCallToken(ruleName, token, env) {
            var name = unique(ruleName + "$macrocall");
            var macro = result.macros[token.macrocall];
            if (!macro) {
                throw new Error("Unkown macro: "+token.macrocall);
            }
            if (macro.args.length !== token.args.length) {
                throw new Error("Argument count mismatch.");
            }
            var newenv = {__proto__: env};
            for (var i=0; i<macro.args.length; i++) {
                var argrulename = unique(ruleName + "$macrocall");
                newenv[macro.args[i]] = argrulename;
                produceRules(argrulename, [token.args[i]], env);
                //structure.push({"name": argrulename, "rules":[token.args[i]]});
                //buildRule(name, token.args[i], env);
            }
            produceRules(name, macro.exprs, newenv);
            return name;
        }
    }

    function uniquer() {
        var uns = {};
        return unique;
        function unique(name) {
            var un = uns[name] = (uns[name] || 0) + 1;
            return name + '$' + un;
        }
    }

    return Compile;

}));

}).call(this,require('_process'),"/node_modules/nearley/lib")
},{"./nearley":5,"./nearley-language-bootstrapped.js":4,"_process":13,"fs":11,"path":12}],3:[function(require,module,exports){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./nearley'));
    } else {
        root.generate = factory(root.nearley);
    }
}(this, function(nearley) {

    function serializeRules(rules, builtinPostprocessors, extraIndent) {
        if (extraIndent == null) {
            extraIndent = ''
        }

        return '[\n    ' + rules.map(function(rule) {
            return serializeRule(rule, builtinPostprocessors);
        }).join(',\n    ') + '\n' + extraIndent + ']';
    }

    function dedentFunc(func) {
        var lines = func.toString().split(/\n/);

        if (lines.length === 1) {
            return [lines[0].replace(/^\s+|\s+$/g, '')];
        }

        var indent = null;
        var tail = lines.slice(1);
        for (var i = 0; i < tail.length; i++) {
            var match = /^\s*/.exec(tail[i]);
            if (match && match[0].length !== tail[i].length) {
                if (indent === null ||
                    match[0].length < indent.length) {
                    indent = match[0];
                }
            }
        }

        if (indent === null) {
            return lines;
        }

        return lines.map(function dedent(line) {
            if (line.slice(0, indent.length) === indent) {
                return line.slice(indent.length);
            }
            return line;
        });
    }

    function tabulateString(string, indent, options) {
        var lines;
        if(Array.isArray(string)) {
          lines = string;
        } else {
          lines = string.toString().split('\n');
        }

        options = options || {};
        tabulated = lines.map(function addIndent(line, i) {
            var shouldIndent = true;

            if(i == 0 && !options.indentFirst) {
              shouldIndent = false;
            }

            if(shouldIndent) {
                return indent + line;
            } else {
                return line;
            }
        }).join('\n');

        return tabulated;
    }

    function serializeSymbol(s) {
        if (s instanceof RegExp) {
            return s.toString();
        } else if (s.token) {
            return s.token;
        } else {
            return JSON.stringify(s);
        }
    }

    function serializeRule(rule, builtinPostprocessors) {
        var ret = '{';
        ret += '"name": ' + JSON.stringify(rule.name);
        ret += ', "symbols": [' + rule.symbols.map(serializeSymbol).join(', ') + ']';
        if (rule.postprocess) {
            if(rule.postprocess.builtin) {
                rule.postprocess = builtinPostprocessors[rule.postprocess.builtin];
            }
            ret += ', "postprocess": ' + tabulateString(dedentFunc(rule.postprocess), '        ', {indentFirst: false});
        }
        ret += '}';
        return ret;
    }

    var generate = function (parser, exportName) {
        if(!parser.config.preprocessor) {
            parser.config.preprocessor = "_default";
        }

        if(!generate[parser.config.preprocessor]) {
            throw new Error("No such preprocessor: " + parser.config.preprocessor)
        }

        return generate[parser.config.preprocessor](parser, exportName);
    };

    generate.js = generate._default = generate.javascript = function (parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output +=  "// http://github.com/Hardmath123/nearley\n";
        output += "(function () {\n";
        output += "function id(x) { return x[0]; }\n";
        output += parser.body.join('\n');
        output += "var grammar = {\n";
        output += "    Lexer: " + parser.config.lexer + ",\n";
        output += "    ParserRules: " +
            serializeRules(parser.rules, generate.javascript.builtinPostprocessors)
            + "\n";
        output += "  , ParserStart: " + JSON.stringify(parser.start) + "\n";
        output += "}\n";
        output += "if (typeof module !== 'undefined'"
            + "&& typeof module.exports !== 'undefined') {\n";
        output += "   module.exports = grammar;\n";
        output += "} else {\n";
        output += "   window." + exportName + " = grammar;\n";
        output += "}\n";
        output += "})();\n";
        return output;
    };

    generate.javascript.builtinPostprocessors = {
        "joiner": "function joiner(d) {return d.join('');}",
        "arrconcat": "function arrconcat(d) {return [d[0]].concat(d[1]);}",
        "arrpush": "function arrpush(d) {return d[0].concat([d[1]]);}",
        "nuller": "function(d) {return null;}",
        "id": "id"
    }

    generate.module = generate.esmodule = function (parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output +=  "// http://github.com/Hardmath123/nearley\n";
        output += "function id(x) { return x[0]; }\n";
        output += parser.body.join('\n');
        output += "let Lexer = " + parser.config.lexer + ";\n";
        output += "let ParserRules = " + serializeRules(parser.rules, generate.javascript.builtinPostprocessors) + ";\n";
        output += "let ParserStart = " + JSON.stringify(parser.start) + ";\n";
        output += "export default { Lexer, ParserRules, ParserStart };\n";
        return output;
    };

    generate.cs = generate.coffee = generate.coffeescript = function (parser, exportName) {
        var output = "# Generated automatically by nearley, version " + parser.version + "\n";
        output +=  "# http://github.com/Hardmath123/nearley\n";
        output += "do ->\n";
        output += "  id = (d) -> d[0]\n";
        output += tabulateString(dedentFunc(parser.body.join('\n')), '  ') + '\n';
        output += "  grammar = {\n";
        output += "    Lexer: " + parser.config.lexer + ",\n";
        output += "    ParserRules: " +
            tabulateString(
                    serializeRules(parser.rules, generate.coffeescript.builtinPostprocessors),
                    '      ',
                    {indentFirst: false})
        + ",\n";
        output += "    ParserStart: " + JSON.stringify(parser.start) + "\n";
        output += "  }\n";
        output += "  if typeof module != 'undefined' "
            + "&& typeof module.exports != 'undefined'\n";
        output += "    module.exports = grammar;\n";
        output += "  else\n";
        output += "    window." + exportName + " = grammar;\n";
        return output;
    };

    generate.coffeescript.builtinPostprocessors = {
        "joiner": "(d) -> d.join('')",
        "arrconcat": "(d) -> [d[0]].concat(d[1])",
        "arrpush": "(d) -> d[0].concat([d[1]])",
        "nuller": "() -> null",
        "id": "id"
    };

    generate.ts = generate.typescript = function (parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output +=  "// http://github.com/Hardmath123/nearley\n";
        output +=  "// Bypasses TS6133. Allow declared but unused functions.\n";
        output +=  "// @ts-ignore\n";
        output += "function id(d: any[]): any { return d[0]; }\n";
        output += parser.customTokens.map(function (token) { return "declare var " + token + ": any;\n" }).join("")
        output += parser.body.join('\n');
        output += "\n";
        output += "interface NearleyToken {";
        output += "  value: any;\n";
        output += "  [key: string]: any;\n";
        output += "};\n";
        output += "\n";
        output += "interface NearleyLexer {\n";
        output += "  reset: (chunk: string, info: any) => void;\n";
        output += "  next: () => NearleyToken | undefined;\n";
        output += "  save: () => any;\n";
        output += "  formatError: (token: NearleyToken) => string;\n";
        output += "  has: (tokenType: string) => boolean;\n";
        output += "};\n";
        output += "\n";
        output += "interface NearleyRule {\n";
        output += "  name: string;\n";
        output += "  symbols: NearleySymbol[];\n";
        output += "  postprocess?: (d: any[], loc?: number, reject?: {}) => any;\n";
        output += "};\n";
        output += "\n";
        output += "type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };\n";
        output += "\n";
        output += "interface Grammar {\n";
        output += "  Lexer: NearleyLexer | undefined;\n";
        output += "  ParserRules: NearleyRule[];\n";
        output += "  ParserStart: string;\n";
        output += "};\n";
        output += "\n";
        output += "const grammar: Grammar = {\n";
        output += "  Lexer: " + parser.config.lexer + ",\n";
        output += "  ParserRules: " + serializeRules(parser.rules, generate.typescript.builtinPostprocessors, "  ") + ",\n";
        output += "  ParserStart: " + JSON.stringify(parser.start) + ",\n";
        output += "};\n";
        output += "\n";
        output += "export default grammar;\n";

        return output;
    };

    generate.typescript.builtinPostprocessors = {
        "joiner": "(d) => d.join('')",
        "arrconcat": "(d) => [d[0]].concat(d[1])",
        "arrpush": "(d) => d[0].concat([d[1]])",
        "nuller": "() => null",
        "id": "id"
    };

    return generate;

}));

},{"./nearley":5}],4:[function(require,module,exports){
// Generated automatically by nearley, version 2.17.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

function getValue(d) {
    return d[0].value
}

function literals(list) {
    var rules = {}
    for (var lit of list) {
        rules[lit] = {match: lit, next: 'main'}
    }
    return rules
}

var moo = require('moo')
var rules = Object.assign({
    ws: {match: /\s+/, lineBreaks: true, next: 'main'},
    comment: /\#.*/,
    arrow: {match: /[=-]+\>/, next: 'main'},
    js: {
        match: /\{\%(?:[^%]|\%[^}])*\%\}/,
        value: x => x.slice(2, -2),
    },
    word: {match: /[\w\?\+]+/, next: 'afterWord'},
    string: {
        match: /"(?:[^\\"\n]|\\["\\/bfnrt]|\\u[a-fA-F0-9]{4})*"/,
        value: x => JSON.parse(x),
        next: 'main',
    },
    btstring: {
        match: /`[^`]*`/,
        value: x => x.slice(1, -1),
        next: 'main',
    },
}, literals([
    ",", "|", "$", "%", "(", ")",
    ":?", ":*", ":+",
    "@include", "@builtin", "@",
    "]",
]))

var lexer = moo.states({
    main: Object.assign({}, rules, {
        charclass: {
            match: /\.|\[(?:\\.|[^\\\n])+?\]/,
            value: x => new RegExp(x),
        },
    }),
    // Both macro arguments and charclasses are both enclosed in [ ].
    // We disambiguate based on whether the previous token was a `word`.
    afterWord: Object.assign({}, rules, {
        "[": {match: "[", next: 'main'},
    }),
})

function insensitive(sl) {
    var s = sl.literal;
    var result = [];
    for (var i=0; i<s.length; i++) {
        var c = s.charAt(i);
        if (c.toUpperCase() !== c || c.toLowerCase() !== c) {
            result.push(new RegExp("[" + c.toLowerCase() + c.toUpperCase() + "]"));
            } else {
            result.push({literal: c});
        }
    }
    return {subexpression: [{tokens: result, postprocess: function(d) {return d.join(""); }}]};
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "final$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "final$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "final", "symbols": ["_", "prog", "_", "final$ebnf$1"], "postprocess": function(d) { return d[1]; }},
    {"name": "prog", "symbols": ["prod"], "postprocess": function(d) { return [d[0]]; }},
    {"name": "prog", "symbols": ["prod", "ws", "prog"], "postprocess": function(d) { return [d[0]].concat(d[2]); }},
    {"name": "prod", "symbols": ["word", "_", (lexer.has("arrow") ? {type: "arrow"} : arrow), "_", "expression+"], "postprocess": function(d) { return {name: d[0], rules: d[4]}; }},
    {"name": "prod", "symbols": ["word", {"literal":"["}, "wordlist", {"literal":"]"}, "_", (lexer.has("arrow") ? {type: "arrow"} : arrow), "_", "expression+"], "postprocess": function(d) {return {macro: d[0], args: d[2], exprs: d[7]}}},
    {"name": "prod", "symbols": [{"literal":"@"}, "_", "js"], "postprocess": function(d) { return {body: d[2]}; }},
    {"name": "prod", "symbols": [{"literal":"@"}, "word", "ws", "word"], "postprocess": function(d) { return {config: d[1], value: d[3]}; }},
    {"name": "prod", "symbols": [{"literal":"@include"}, "_", "string"], "postprocess": function(d) {return {include: d[2].literal, builtin: false}}},
    {"name": "prod", "symbols": [{"literal":"@builtin"}, "_", "string"], "postprocess": function(d) {return {include: d[2].literal, builtin: true }}},
    {"name": "expression+", "symbols": ["completeexpression"]},
    {"name": "expression+", "symbols": ["expression+", "_", {"literal":"|"}, "_", "completeexpression"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "expressionlist", "symbols": ["completeexpression"]},
    {"name": "expressionlist", "symbols": ["expressionlist", "_", {"literal":","}, "_", "completeexpression"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "wordlist", "symbols": ["word"]},
    {"name": "wordlist", "symbols": ["wordlist", "_", {"literal":","}, "_", "word"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "completeexpression", "symbols": ["expr"], "postprocess": function(d) { return {tokens: d[0]}; }},
    {"name": "completeexpression", "symbols": ["expr", "_", "js"], "postprocess": function(d) { return {tokens: d[0], postprocess: d[2]}; }},
    {"name": "expr_member", "symbols": ["word"], "postprocess": id},
    {"name": "expr_member", "symbols": [{"literal":"$"}, "word"], "postprocess": function(d) {return {mixin: d[1]}}},
    {"name": "expr_member", "symbols": ["word", {"literal":"["}, "expressionlist", {"literal":"]"}], "postprocess": function(d) {return {macrocall: d[0], args: d[2]}}},
    {"name": "expr_member$ebnf$1", "symbols": [{"literal":"i"}], "postprocess": id},
    {"name": "expr_member$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_member", "symbols": ["string", "expr_member$ebnf$1"], "postprocess": function(d) { if (d[1]) {return insensitive(d[0]); } else {return d[0]; } }},
    {"name": "expr_member", "symbols": [{"literal":"%"}, "word"], "postprocess": function(d) {return {token: d[1]}}},
    {"name": "expr_member", "symbols": ["charclass"], "postprocess": id},
    {"name": "expr_member", "symbols": [{"literal":"("}, "_", "expression+", "_", {"literal":")"}], "postprocess": function(d) {return {'subexpression': d[2]} ;}},
    {"name": "expr_member", "symbols": ["expr_member", "_", "ebnf_modifier"], "postprocess": function(d) {return {'ebnf': d[0], 'modifier': d[2]}; }},
    {"name": "ebnf_modifier", "symbols": [{"literal":":+"}], "postprocess": getValue},
    {"name": "ebnf_modifier", "symbols": [{"literal":":*"}], "postprocess": getValue},
    {"name": "ebnf_modifier", "symbols": [{"literal":":?"}], "postprocess": getValue},
    {"name": "expr", "symbols": ["expr_member"]},
    {"name": "expr", "symbols": ["expr", "ws", "expr_member"], "postprocess": function(d){ return d[0].concat([d[2]]); }},
    {"name": "word", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": getValue},
    {"name": "string", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({literal: d[0].value})},
    {"name": "string", "symbols": [(lexer.has("btstring") ? {type: "btstring"} : btstring)], "postprocess": d => ({literal: d[0].value})},
    {"name": "charclass", "symbols": [(lexer.has("charclass") ? {type: "charclass"} : charclass)], "postprocess": getValue},
    {"name": "js", "symbols": [(lexer.has("js") ? {type: "js"} : js)], "postprocess": getValue},
    {"name": "_$ebnf$1", "symbols": ["ws"], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "ws", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "ws$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "ws$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ws", "symbols": ["ws$ebnf$1", (lexer.has("comment") ? {type: "comment"} : comment), "_"]}
]
  , ParserStart: "final"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();

},{"moo":1}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
function clone(obj) {
 return JSON.parse(JSON.stringify(obj));
}

function time({types}) {
    // let {types} = node;
    let {tense} = types || {};
    if (tense == "fut") {
        return "> ";
    } else if (tense == "past") {
        return "< ";
    }
    return "";  
};

function print(node, refs) {
 if (typeof node == "string") {
   return node;
 } else if (node["@type"] == "Predicate") {
   return time(node) + node.print();
 } else  if (node["@type"] == "Referent") {
  if (refs) {
   // de-reference referents
   return refs.find(ref => ref.name == node.name).value;
  }
  return node.name;
 }

 let result = (node.children || []).map(child => print(child, refs));
 //for (let child of node.children || []) {
 // result.push(print(child, refs));
 //}

 let prefix = node["@type"] == "S" ? time(node) : "";
 let suffix = node.ref ? `(${node.ref.name})` : "";
 return prefix + result.join(" ").trim() + suffix;
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

module.exports = {
  clone: clone,
  print: print,
  child: child,
};

},{}],7:[function(require,module,exports){
const {parse} = require("./parser.js")
const {DRS} = require("./drs.js");
const {Rules} = require("./rules.js");
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
}

},{"./drs.js":8,"./parser.js":9,"./rules.js":10,"fs":11}],8:[function(require,module,exports){
const {clone, print} = require("./base.js");
const {parse} = require("./parser.js");

class DRS {
 constructor([names, rules]) {
  this.head = [];
  this.body = [];
  this.names = names;
  this.rules = rules;
 }

 feed(source) {
  let [[lines]] = parse(source, "Discourse");
  for (let s of lines) {
   this.push(s);
  }
  return this;
 }

 bind(node) {
  let queue = [node];
  while (queue.length > 0) {
   let p = queue.shift();
   // console.log(`${p["@type"]}`);
   // console.log(p);
   let [refs, names] = this.names.match(p, this.head);
   this.head.push(...refs);
   this.body.push(...names);
   // ... and recurse.
   let next = (p.children || [])
    .filter(c => typeof c != "string");
   queue.push(...next);
  }
 }

 push(node) {
  for (let ref of this.head) {
   // Reset all of the locations of previous
   // referents before new phrases are processed.
   ref.loc = 0;
  }

  // Resolve all proper names first.
  this.bind(node);

  let queue = [node];
  this.body.push(node);

  while (queue.length > 0) {
   let p = queue.shift();
   // breadth first search: iterate over
   // this level first ...
   let skip = false;
   for (let rule of this.rules) {
    let [head, body, drs, [remove]] = rule.match(p, this.head);
    this.head.push(...head);
    this.body.push(...body);

    if (remove) {
     skip = true;
     let i = this.body.indexOf(remove);
     if (i == -1) {
      throw new Error("Ooops, deleting an invalid node.");
     }
     this.body.splice(i, 1);
    }

    queue.push(...body.filter(c => !(c instanceof DRS)));

    if (skip) {
     break;
    }
   }

   if (skip) {
    continue;
   }

   // ... and recurse.
   let next = (p && p.children || [])
    .filter(c => typeof c != "string");
   queue.push(...next);
  }

  return this;
 }

 print() {
  let result = [];
  let refs = [];
  let individuals = this.head
   .filter(ref => !ref.closure);
  for (let ref of individuals) {
   refs.push(`${ref.print()}`);
  }
  
  let args = refs.join(", ");
  let neg = this.neg ? "~" : "";
  result.push(`${neg}drs(${args}) \{`);

  for (let cond of this.body) {
    if (cond instanceof DRS ||
        cond["@type"] == "Implication" ||
        cond["@type"] == "Negation" ||
        cond["@type"] == "Query" ||
        cond["@type"] == "Conjunction" ||
        cond["@type"] == "Disjunction") {
     result.push(cond.print());
   } else {
     result.push(print(cond));
   }
  }
  
  result.push("}");
  
  return result.join("\n");
 }
}


module.exports = {
 DRS: DRS,
};

},{"./base.js":6,"./parser.js":9}],9:[function(require,module,exports){
const nearley = require("nearley");
const compile = require("nearley/lib/compile");
const generate = require("nearley/lib/generate");
const grammar = require("nearley/lib/nearley-language-bootstrapped");

class Nearley {
 constructor({ParserRules, ParserStart}, start) {
  const rule = start ? start : ParserStart;

  this.parser = new nearley.Parser(ParserRules, rule, {
    keepHistory: true
  });   
 }

 feed(code) {
  try {
   this.parser.feed(code);
   return this.parser.results;
  } catch (e) {
   throw this.reportError(e);
  }
 }

 static compile(source, raw = false) {       
  const parser = new nearley.Parser(grammar);
  parser.feed(source);
  const ast = parser.results[0];
  const info = compile(ast, {});
  // Generate JavaScript code from the rules
  const code = generate(info, "grammar");

  if (raw) {
    return code;
  }
     
  const module = { exports: {} };

  eval(code);

  return module.exports;
 }

 static from(code, start) {
  return new Nearley(Nearley.compile(code), start);
 }

 /*
    Generates a user friendly error report given the caught error 
    object and the Nearley parser instance.
  */
  reportError(e) {
   // console.log(e.message);
   let {parser} = this;
   const lastColumnIndex = parser.table.length - 2;
   const lastColumn = parser.table[lastColumnIndex];
   const token = parser.lexer.buffer[parser.current];
   let result = {
    token: token, 
    expected: [],
    message: e.message,
   };
   // result.token = token;
   // Display each state that is expecting a terminal symbol next.
   for (let i = 0; i < lastColumn.states.length; i++) {
    const state = lastColumn.states[i];
    const nextSymbol = state.rule.symbols[state.dot];
    if (nextSymbol && this.isTerminalSymbol(nextSymbol)) {
     const symbolDisplay = this.getSymbolDisplay(nextSymbol);
     // console.log(`    A ${symbolDisplay} based on:`);
     let expected = {symbol: symbolDisplay, based: []};
     result.expected.push(expected);
     // Display the "state stack" - which shows you how this state
     // came to be, step by step.
     const stateStack = this.buildStateStack(lastColumnIndex, i, parser);
     for (let j = 0; j < stateStack.length; j++) {
      const state = stateStack[j];
      expected.based.push(state.rule.toString(state.dot));
     }
    }
   }
   return result;
  }

  getSymbolDisplay(symbol) {
   const type = typeof symbol;
   if (type === "string") {
    return symbol;
   } else if (type === "object" && symbol.literal) {
    return JSON.stringify(symbol.literal);
   } else if (type === "object" && symbol instanceof RegExp) {
    return `character matching ${symbol}`;
   } else {
    throw new Error(`Unknown symbol type: ${symbol}`);
   }
  }

  /*
    Builds the "state stack" - which you can think of as the call stack of the
    recursive-descent parser, which the Nearley parse algorithm simulates.
    The state stack is represented as an array of state objects. This function
    needs to be given a starting state identified by:

    * columnIndex - the column index of the state
    * stateIndex - the state index of the state within the column
    
    and it needs:

    * parser - the Nearley parser instance that generated the parse.
    
    It returns an array of state objects. The first item of the array
    will bet the starting state, with each successive item in the array
    going further back into history.
  */
  buildStateStack(columnIndex, stateIndex, parser) {
   const state = parser.table[columnIndex].states[stateIndex];
   if (state.dot === 0) { // state not started
    // Find the previous state entry in the table that predicted this state
    const match = this.findPreviousStateWhere(
                                              (thatState) => {
                                               const nextSymbol = thatState.rule.symbols[thatState.dot];
                                               return nextSymbol && 
                                          this.isNonTerminalSymbol(nextSymbol) && 
                                          state.rule.name === nextSymbol;
                                         },
                                         columnIndex,
                                         stateIndex,
                                         parser);
    if (match) {
     return [state, ...this.buildStateStack(match[0], match[1], parser)]
      } else {
     return [state];
    }
   } else {
    // Find the previous state entry in the table that generated this state
    // entry after consuming a token
    const previousColumn = parser.table[state.reference];
        const match = previousColumn.states
         .map((state, i) => [state, i])
         .filter(([thatState, i]) =>
                 thatState.rule.toString() === state.rule.toString()
                 )[0];
        return [
                state,
                ...this.buildStateStack(state.reference, match[1], parser)
                ];
   }
  }

  /*
    Finds the previous state within the parser table that matches a given
    condition, given a "current" state based on:

    * predicate - a function which given a state object, returns true or false
    * columnIndex - the column index of the current state
    * stateIndex - the state index of the current state within the column
    * parser - the Nearley parser instance, which contains the parse table
    
    This returns a 3-tuple: [columnIndex, stateIndex, stateObject] of the matching
    state, or null.
  */
  findPreviousStateWhere(predicate, columnIndex, stateIndex, parser) {
   let i = columnIndex;
   let j = stateIndex;
   let column = parser.table[i];
   let state;
   while (true) {
    j--;
    if (j < 0) {
     i--;
     if (i < 0) {
      return null;
     }
     column = parser.table[i];
     j = column.states.length - 1;
    }

    state = column.states[j];
    if (predicate(state)) {
     return [i, j, state];
    }
   }
  }

  isTerminalSymbol(symbol) {
   return typeof symbol !== "string";
  }

  isNonTerminalSymbol(symbol) {
   return !this.isTerminalSymbol(symbol);
  }
}

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

const RuntimeSyntax = `
      @builtin "whitespace.ne"
      @builtin "number.ne"
      @builtin "string.ne"

      rules -> (_ rule _ "."):+ _ {% ([rules]) => {
        return rules.map(([ws, rule]) => rule);
      } %}

      rule -> head __ "->" __ tail {%
        ([head, ws0, arrow, ws1, tail]) => {
         return {
          "head": head,
          "tail": tail
         }
        }
      %}

      head -> name {% id %}
      tail -> (term __ {% id %}):* term {%
        ([beginning, end]) => {
         return [...beginning, end];
        }
      %}

      term -> name {% id %}
      term -> string {% id %}

      name -> word features:? {% 
        ([word, features]) => {
         return {
          name: word,
          types: Object.fromEntries(features || [])
         }
        }
      %}
      string -> dqstring {% ([str]) => '"' + str + '"' %}

      features -> "[" props "]" {% ([p0, props, p1]) => {
        // console.log(props);
        return props;
      }%}

      props -> (keyvalue _ "," _ {% id %}):* keyvalue:? {%
        ([beginning, end]) => {
         if (!end) {
          return beginning;
         }
         return [...beginning, end];
        }
      %}

      keyvalue -> word _ "=" _ word {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      keyvalue -> word _ "=" _ int {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      keyvalue -> word _ "=" _ array {% 
        ([key, ws0, eq, ws1, value]) => {
         return [key, value];
        }
      %}

      array -> "[" values "]" {% ([p0, values, p1]) => values %}

      values -> (word _ "," _ {% id %}):* word:? {%
        ([beginning, end]) => {
         if (!end) {
          return beginning;
         }
         return [...beginning, end];
        }
      %}

      word -> [a-zA-Z_\+\-]:+ {% ([char]) => {
        return char.join("");
      }%}
`;

let RuntimeGrammar;

function runtimeGrammar() {
  if (!RuntimeGrammar) {
    RuntimeGrammar = Nearley.compile(RuntimeSyntax);
  }

  return RuntimeGrammar;
}


class FeaturedNearley {
 constructor() {
  this.parser = new Nearley(runtimeGrammar());
 }

 feed(code) {
  return this.parser.feed(code);
 }

 static compile(source, header, raw) {
  let parser = new FeaturedNearley();
  let grammar = parser.feed(source);

  let result = [];

  function feed(code) {
   result.push(code);
  }

  feed(`@builtin "whitespace.ne"`);
  feed(``);
  feed(`@{%`);
  feed(`${bind.toString()}`);
  feed(`%}`);
  feed(``);

  if (header) {
   feed(header);
  }

  // console.log(grammar[0].length);
  
  for (let {head, tail} of grammar[0]) {
   // console.log("hi");
   let term = (x) => typeof x == "string" ? `${x}i` : x.name;
   feed(`${head.name} -> ${tail.map(term).join(" ")} {%`);
        feed(`  bind("${head.name}", ${JSON.stringify(head.types)}, [`);
                     for (let term of tail) {
                      if (term.name == "_" || term.name == "__" || typeof term == "string") {
                       continue;
                      }
                      feed(`    {"@type": "${term.name}", "types": ${JSON.stringify(term.types)}}, `);
                     }
                     feed(`  ])`);
        feed(`%}`);

  }
 
  return Nearley.compile(result.join("\n"), raw);
 }
}

const DrtSyntax = `
      Sentence -> _ Statement _.
      Sentence -> _ Question _.      

      Statement -> S_ _ ".".

      Question ->
          "Who" __
          VP_[num=1, fin=+, gap=-, tp=3, tense=4] _
          "?"
          .

      Question ->
          "Who" __ 
          AUX[num=1, fin=+, tp=2, tense=3] __
          NP[num=1, gen=4, case=+nom, gap=-] __
          V[num=1, fin=-, trans=+] _
          "?"
          .

      Question ->
          BE[num=1, fin=+, tp=2, tense=3] __
          NP[num=1, gen=4, case=+nom, gap=-] __
          ADJ _
          "?"
          .

      S_[num=1, gap=-, tp=2, tense=3] -> S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          "if" __ 
          S[num=1, gap=-, tp=2, tense=3] __ 
          "then" __ 
          S[num=1, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          S[num=4, gap=-, tp=2, tense=3] __ 
          "and" __ 
          S[num=5, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=2, tense=3] -> 
          S[num=4, gap=-, tp=2, tense=3] __ 
          "or" __ 
          S[num=5, gap=-, tp=2, tense=3].

      S[num=1, gap=-, tp=3, tense=4] -> 
          NP[num=1, gen=2, case=+nom, gap=-] __ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4] ->
          NP[num=1, gen=2, case=+nom, gap=np] _ 
          VP_[num=1, fin=+, gap=-, tp=3, tense=4].

      S[num=1, gap=np, tp=3, tense=4] ->
          NP[num=1, gen=2, case=+nom, gap=-] __ 
          VP_[num=1, fin=+, gap=np, tp=3, tense=4].

      VP_[num=1, fin=+, gap=2, stat=3, tp=4, tense=fut] ->
        AUX[num=1, fin=+, tp=4, tense=fut] __ 
        VP[num=5, fin=-, gap=2, stat=3, tp=4, tense=pres].

      VP_[num=1, fin=+, gap=2, stat=4, tp=5, tense=6] ->
        AUX[num=1, fin=+, tp=5, tense=6] __ 
        "not" __ 
        VP[num=3, fin=-, gap=2, stat=4, tp=5, tense=6].

      VP_[num=1, fin=+, gap=2, state=3, tp=4, tense=5] -> 
          VP[num=1, fin=+, gap=2, state=3, tp=4, tense=5].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] ->
          V[num=1, fin=2, trans=+, stat=3, tp=4, tense=5] __ 
          NP[num=6, gen=7, case=-nom, gap=-].

      VP[num=1, fin=2, gap=np, tp=6, tense=7] ->
          V[num=1, fin=2, trans=+, tp=6, tense=7] _ 
          NP[num=4, gen=5, case=-nom, gap=np].

      VP[num=1, fin=2, gap=-, stat=3, tp=4, tense=5] -> 
        V[num=1, fin=2, trans=-, stat=3, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      VP[num=1, fin=+, gap=2, stat=+, tp=4, tense=5] -> 
          HAVE[num=1, fin=+, tp=4, tense=5] __
          "not" __
          VP[num=1, fin=part, gap=2, stat=6, tp=4, tense=5].

      NP[num=1, gen=2, case=3, gap=np] -> GAP.

      GAP -> null.

      NP[num=1, gen=2, case=3, gap=-] -> DET[num=1] __ N[num=1, gen=2].

      NP[num=1, gen=2, case=3, gap=-] -> DET[num=1] __ RN[num=1, gen=2].

      NP[num=1, gen=2, case=3, gap=-] -> PN[num=1, gen=2].
 
      NP[num=1, gen=2, case=3, gap=-] -> PRO[num=1, gen=2, case=3].

      NP[num=plur, gen=1, case=2, gap=-] -> 
        NP[num=3, gen=4, case=2, gap=-] __ 
        "and" __ 
        NP[num=5, gen=6, case=2, gap=-].

      NP[num=3, gen=1, case=2, gap=-] -> 
        NP[num=3, gen=4, case=2, gap=-] __ 
        "or" __ 
        NP[num=3, gen=6, case=2, gap=-].

      N[num=1, gen=2] -> N[num=1, gen=2] __ RC[num=1, gen=2].

      RC[num=1, gen=2] -> RPRO[num=1, gen=2] __ S[num=1, gap=np].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ ADJ.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ "not" __ ADJ.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ PP.
      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=4] -> 
          BE[num=1, fin=2, tp=-past, tense=4] __ "not" __ PP.

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          NP[num=3, gen=4, case=5, gap=-].

      VP[num=1, fin=2, gap=-, stat=+, tp=-past, tense=7] -> 
          BE[num=1, fin=2, tp=-past, tense=7] __ 
          "not" __ 
          NP[num=3, gen=4, case=5, gap=-].

      DET[num=sing] -> "a".
      DET[num=sing] -> "an".
      DET[num=sing] -> "every".
      DET[num=sing] -> "the".
      DET[num=sing] -> "some".

      DET[num=1] -> NP[num=2, gen=3, case=+nom, gap=-] _ "'s".

      N[num=1, gen=2] -> ADJ __ N[num=1, gen=2].

      PRO[num=sing, gen=male, case=+nom] -> "he".
      PRO[num=sing, gen=male, case=-nom] -> "him".

      PRO[num=sing, gen=fem, case=+nom] -> "she".
      PRO[num=sing, gen=fem, case=-nom] -> "her".

      PRO[num=sing, gen=-hum, case=[-nom, +nom]] -> "it".

      PRO[num=plur, gen=[male, fem, -hum], case=+nom] -> "they".
      PRO[num=plur, gen=[male, fem, -hum], case=-nom] -> "them".

      PRO[num=sing, gen=male, case=-nom, refl=+] -> "himself".
      PRO[num=sing, gen=fem, case=-nom, refl=+] -> "herself".
      PRO[num=sing, gen=-hum, case=-nom, refl=+] -> "itself".

      N[num=1, gen=2] -> N[num=1, gen=2] __ PP.

      PP -> PREP __ NP[num=1, gen=2, case=3, gap=-].

      PREP -> "behind".
      PREP -> "in".
      PREP -> "over".
      PREP -> "under".
      PREP -> "near".

      PREP -> "before".
      PREP -> "after".
      PREP -> "during".

      PREP -> "from".
      PREP -> "to".
      PREP -> "of".
      PREP -> "about".
      PREP -> "by".
      PREP -> "for".
      PREP -> "with".

      AUX[num=sing, fin=+, tp=-past, tense=pres] -> "does".
      AUX[num=plur, fin=+, tp=-past, tense=pres] -> "do".

      AUX[num=1, fin=+, tp=-past, tense=past] -> "did".
      AUX[num=1, fin=+, tp=+past, tense=pres] -> "did".

      AUX[num=1, fin=+, tp=-past, tense=fut] -> "will".
      AUX[num=1, fin=+, tp=+past, tense=fut] -> "would".

      RPRO[num=[sing, plur], gen=[male, fem]] -> "who".
      RPRO[num=[sing, plur], gen=-hum] -> "which".

      BE[num=sing, fin=+, tp=-past, tense=pres] -> "is".
      BE[num=plur, fin=+, tp=-past, tense=pres] -> "are".

      BE[num=sing, fin=+, tp=-past, tense=past] -> "was".
      BE[num=plur, fin=+, tp=-past, tense=past] -> "were".

      BE[num=sing, fin=+, tp=+past, tense=pres] -> "was".
      BE[num=plur, fin=+, tp=+past, tense=pres] -> "were".

      BE[fin=-] -> "be".
      BE[fin=part] -> "been".

      HAVE[fin=-1] -> "have".

      HAVE[num=sing, fin=+, tp=-past, tense=pres] -> "has".
      HAVE[num=plur, fin=+, tp=-past, tense=pres] -> "have".

      HAVE[num=1, fin=+, tp=-past, tense=past] -> "had".
      HAVE[num=1, fin=+, tp=+past, tense=[pres, past]] -> "had".

      V[num=1, fin=-, stat=-, trans=2] -> 
          VERB[trans=2, stat=-].

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+s] "s".

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+es] "es".

      V[num=sing, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1, pres=+ies] "ies".

      V[num=plur, fin=+, stat=1, tp=-past, tense=pres, trans=2] -> 
          VERB[trans=2, stat=1].

      V[num=1, fin=part, stat=2, tp=-past, tense=[pres, past], trans=3] 
          -> VERB[trans=3, stat=2, past=+ed] "ed".

      V[num=1, fin=+, stat=2, tp=+past, tense=past, trans=3] 
          -> VERB[trans=3, stat=2, past=+ed] "ed".

      V[num=1, fin=part, stat=2, tp=-past, tense=[pres, past], trans=3] 
          -> VERB[trans=3, stat=2, past=+d] "d".

      V[num=1, fin=+, stat=2, tp=+past, tense=past, trans=3] 
          -> VERB[trans=3, stat=2, past=+d] "d".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+ied] "ied".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+led] "led".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=+red] "red".

      V[num=1, fin=[+, part], stat=2, tp=-past, tense=[pres, past], trans=3] 
         -> VERB[trans=3, stat=2, past=-reg].


      ADJ -> "happy".
      ADJ -> "unhappy".
      ADJ -> "foolish".
      ADJ -> "fast".
      ADJ -> "beautiful".
      ADJ -> "mortal".
      ADJ -> "brazilian".

      PN[num=sing, gen=male] -> "Socrates".
      PN[num=sing, gen=male] -> "Jones".
      PN[num=sing, gen=male] -> "John".
      PN[num=sing, gen=male] -> "Smith".
      PN[num=sing, gen=fem] -> "Mary".
      PN[num=sing, gen=-hum] -> "Brazil".
      PN[num=sing, gen=-hum] -> "Ulysses".

      N[num=sing, gen=male] -> "man".
      N[num=sing, gen=fem] -> "woman".
      N[num=sing, gen=fem] -> "girl".
      N[num=sing, gen=-hum] -> "book".
      N[num=sing, gen=-hum] -> "telescope".
      N[num=sing, gen=-hum] -> "donkey".
      N[num=sing, gen=-hum] -> "horse".
      N[num=sing, gen=-hum] -> "porsche".
      N[num=sing, gen=[male, fem]] -> "engineer".
      N[num=sing, gen=1] -> "brazilian".

      RN[num=sing, gen=male] -> "brother".
      RN[num=sing, gen=male] -> "father".
      RN[num=sing, gen=male] -> "husband".
      RN[num=sing, gen=fem] -> "sister".
      RN[num=sing, gen=fem] -> "mother".
      RN[num=sing, gen=fem] -> "wife".

      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "beat".
      VERB[trans=1, stat=-, pres=+s, past=+ed] -> "listen".
      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "own".

      VERB[trans=1, stat=-, pres=+s, past=+ed] -> "listen".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "walk".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "sleep".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "stink".

      VERB[trans=1, stat=-, pres=+s] -> "leave".
      VERB[trans=1, stat=-, past=-reg] -> "left".

      VERB[trans=-, stat=-, pres=+s] -> "come".
      VERB[trans=-, stat=-, past=-reg] -> "came".

      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "kiss".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "box".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "watch".
      VERB[trans=+, stat=-, pres=+es, past=+ed] -> "crash".

      VERB[trans=+, stat=-, pres=+s, past=+d] -> "like".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "seize".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "tie".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "free".
      VERB[trans=1, stat=-, pres=+s, past=+d] -> "love".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "surprise".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "fascinate".
      VERB[trans=+, stat=-, pres=+s, past=+d] -> "admire".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "ski".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "echo".

      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "play".
      VERB[trans=-, stat=-, pres=+s, past=+ed] -> "decay".
      VERB[trans=+, stat=-, pres=+s, past=+ed] -> "enjoy".

      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "cr".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "appl".
      VERB[trans=+, stat=-, pres=+ies, past=+ied] -> "cop".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "repl".
      VERB[trans=-, stat=-, pres=+ies, past=+ied] -> "tr".

      VERB[trans=-, stat=-, pres=+s, past=+led] -> "compel".
      VERB[trans=-, stat=-, pres=+s, past=+red] -> "defer".
`;

let DRTGrammar;

function drtGrammar() {
  if (!DRTGrammar) {
    DRTGrammar = FeaturedNearley.compile(DrtSyntax, `Discourse -> Sentence:+`);
  }
  return DRTGrammar;  
}

// console.log("hi");
// console.log(DRTGrammar);

class Parser {
 constructor (start){
   this.parser = new Nearley(drtGrammar(), start);
 }

 feed(code) {
  return this.parser.feed(code);
 }
}

let node = (type) => { 
 return (...children) => {
  return {"@type": type, "children": children};
 }
};

function parse(s, start = "Statement") {
 let parser = new Parser(start);
 let result = parser.feed(s);
 return result;
}

function child(node, ...path) {
 let result = node;
 for (let i of path) {
  result = result.children[i];
 }
 return result;
}

function first(result) {
 return preprocess(child(result[0], 0, 0));
}

function preprocess(node) {
 if (node["@type"] == "V") {
  // console.log(node);                                                       
  let root = node.children[0].children[0];
  let suffix = node.children[1] || "";
  node.children = [root + suffix];
  return node;
 }

 for (let child of node.children || []) {
  preprocess(child);
 }
 return node;
}

module.exports = {
 parse: parse,
 first: first,
 preprocess: preprocess,
 Nearley: Nearley,
 bind: bind,
 FeaturedNearley: FeaturedNearley,
 Parser: Parser,
 nodes: {
  "Statement": node("Statement"),
  "Sentence": node("Sentence"),
  "Question": node("Question"),
  "S": node("S"),
  "S_": node("S_"),
  "NP": node("NP"),
  "PN": node("PN"),
  "VP_": node("VP_"),
  "VP": node("VP"),
  "V": node("V"),
  "AUX": node("AUX"),
  "PRO": node("PRO"),
  "DET": node("DET"),
  "N": node("N"),
  "RC": node("RC"),
  "RPRO": node("RPRO"),
  "GAP": node("GAP"),
  "BE": node("BE"),
  "ADJ": node("ADJ"),
  "PREP": node("PREP"),
  "PP": node("PP"),
  "VERB": node("VERB"),
  "HAVE": node("HAVE"),
  "RN": node("RN"),
 }
}

},{"nearley":5,"nearley/lib/compile":2,"nearley/lib/generate":3,"nearley/lib/nearley-language-bootstrapped":4}],10:[function(require,module,exports){
const {clone, print, child} = require("./base.js");
const {parse, first, nodes} = require("./parser.js");
const {DRS} = require("./drs.js");

const {
 S, S_, NP, NP_, PN, VP_, VP, V, BE, DET, N, RN, PRO, AUX, RC, RPRO, GAP, ADJ, PP, PREP, HAVE, VERB,
  Discourse, Sentence, Statement, Question
} = nodes;


let capture = (name) => { return {"@type": "Match", "name": name} };
  
function match(a, b) {
 if (!a || !b) {
  return false;
 }

 if (a["@type"] != b["@type"]) {
  return false;
 }
 
 let result = {};
 
 for (let i = 0; i < a.children.length; i++) {
  if (typeof a.children[i] == "string") {
   if (a.children[i].toLowerCase() != String(b.children[i]).toLowerCase()) {
    return false;
   }
  } else if (a.children[i]["@type"] == "Match") {
   result[a.children[i].name] = b;
   continue;
  } else {
   let capture = match(a.children[i], b.children[i]);
   if (!capture) {
    return false;
   }

   result = Object.assign(result, capture);
  }
 }

 return result;
}

class Ids {
 constructor() {
  this.gen = (function*() {
    let i = 0;
    while (true) {
     let char = i % 26;
     let round = Math.floor(i / 26);
     yield `${String.fromCharCode(97 + char)}${round > 0 ? round : ""}`;
     i++;
    }
   })();
 }
 get(prefix) {
  if (prefix) {
   this.id = this.id == undefined ? 0 : (this.id + 1);
   return `${prefix}${this.id}`;
  }
  return this.gen.next().value;
 }
}

class Rule {
 constructor(ids, trigger) {
  this.ids = ids || new Ids();
  this.trigger = trigger;
 }
 
 match(node, refs) {
  let result = match(this.trigger, node);

  if (!result) {
   return [[], [], [], []];
  }

  return this.apply(result, node, refs);
 }

 id(prefix) {
  return this.ids.get(prefix);
 }
}

class CompositeRule extends Rule {
 constructor(rules) {
  super();
  this.rules = rules;
 }
 match(node, refs) {
  let result = [[], [], [], []];
  for (let rule of this.rules) {
   let [head, body, drs, remove] = rule.match(node, refs);
   result[0].push(...head);
   result[1].push(...body);
   result[2].push(...drs);
   result[3].push(...remove);
  }
  return result;
 }
}

function find({gen, num}, refs, name, loc, exclude = []) {
 let match = (ref) => {
  let byName = name ? ref.value == name : true;
  let types = ref.types || {};
  if (!byName || types.num != num || ref.loc > loc) {
   return false;
  } else if (exclude.map(x => x.name).includes(ref.name)) {
   return false;
  } else if (types.gen == "?") {
   types.gen = gen;
   return true;
  }
  return types.gen == gen;
 };

 for (let i = refs.length - 1; i >= 0; i--) {
  if (match(refs[i])) {
   return refs[i];
  }
 }

 return undefined;
}

function referent(name, types, value, loc) {
  return {
   "@type": "Referent",
    types: types,
    name: name,
    value: value,
    loc: loc,
    print() {
    return `${this.name}`;
   }
  }
}

function predicate(name, args, types) {
  return {
   "@type": "Predicate",
    name: name,
    args: args,
    types: types,
    print() {
      let args = this.args.map(arg => print(arg));
      return `${this.name}(${args.join(", ")})`;
   }
  }
}

class CRSPN extends Rule {
 constructor(ids) {
  super(ids, S(NP(PN(capture("name"))), VP_()));
 }

 apply({name}, node, refs = []) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, print(name.children[0]), name.loc);

  if (!ref) {
   ref = referent(this.id(), name.types, print(name, refs), name.loc);
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }

  node.children[0] = ref;

  return [head, body, [], []];
 }
}

class CRVPPN extends Rule {
 constructor(ids) {
  super(ids, VP(capture("v"), NP(PN(capture("name")))));
 }
 apply({name}, node, refs = []) {
  // console.log(name);

  let head = [];
  let body = [];
  let ref = find(name.types, refs, name.children[0], name.loc);

  if (!ref) {
   ref = referent(this.id(), name.types, name.children[0], name.loc);
   // console.log(ref);
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }

  node.children[1].children[0] = ref;

  return [head, body, [], []];
 }
}

class CRDETPN extends Rule {
 constructor(ids) {
  super(ids, DET(NP(PN(capture("name"))), "'s"));
 }
 apply({name}, node, refs) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, name.children[0]);

  if (!ref) {
   ref = referent(this.id(), name.types, print(name));
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }
  
  node.children[0] = ref;

  // console.log(node);

  return [head, body, [], []];
 }
}

class CRPPPN extends Rule {
 constructor(ids) {
  super(ids, PP(PREP(), NP(PN(capture("name")))));
 }
 apply({name}, node, refs) {
  let head = [];
  let body = [];

  let ref = find(name.types, refs, name.children[0]);

  if (!ref) {
   ref = referent(this.id(), name.types, print(name));
   head.push(ref);
   let pn = name;
   pn.ref = ref;
   body.push(pn);
  }
  
  node.children[1] = ref;

  return [head, body, [], []];
 }
}

class CRPN extends CompositeRule {
 constructor(ids) {
  super([new CRSPN(ids), new CRVPPN(ids), new CRDETPN(ids), new CRPPPN(ids)]);
 }
}

class CRSPRO extends Rule {
 constructor(ids) {
  super(ids, S(NP(PRO(capture("pronoun"))), VP_(capture("?"))));
 }

 apply({pronoun}, node, refs) {
  let u = find(pronoun.types, refs, undefined, pronoun.loc);

  // console.log(pronoun.loc);
  // console.log(refs);

  if (!u) {
   throw new Error("Invalid reference: " + pronoun.children[0]);
  }

  node.children[0] = u;

  return [[], [], [], []];
 }
}

class CRVPPRO extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"),
               VP_(VP(V(), NP(PRO(capture("pro")))))
               ));
 }

 apply({sub, pro}, node, refs) {
  // Exclude the subject if the pronoun is non-reflexive.
  let exclude = pro.types.refl == "-" ? [child(sub, 0)] : [];
  let ref = find(pro.types, refs, undefined, undefined, exclude);

  if (!ref) {
   throw new Error("Invalid Reference: " + pro.children[0]);
  }

  child(node, 1, 0).children[1] = ref;
  
  return [[], [], [], []];
 }
}

class CRPRO extends CompositeRule {
 constructor(ids) {
  super([new CRSPRO(ids), new CRVPPRO(ids)]);
 }
}

class CRSID extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("det")), N(capture("noun"))), VP_()));
 }

 apply({det, noun}, node, refs) {
  if (typeof det.children[0] != "string" ||
      det.children[0].toLowerCase() != "a") {
   return [[], [], [], []];
  }

  // console.log("hi");

  let ref = referent(this.id(), noun.types, print(child(node, 0), refs));
  noun.ref = ref;
  node.children[0] = ref;

  return [[ref], [noun], [], []];
 }
}

class CRVPID extends Rule {
 constructor(ids) {
  super(ids, VP(V(), NP(DET(capture("det")), N(capture("noun")))));
 }

 apply({det, noun}, node, refs) {
  if (!(det.children[0] == "a" || det.children[0] == "an")) {
   return [[], [], [], []];
  }

  let types = clone(noun.types);
  Object.assign(types, child(noun, 0).types);

  let ref = referent(this.id(), types, print(child(node, 1), refs));
  noun.ref = ref;
  node.children[1] = ref;

  return [[ref], [noun], [], []];
 }
}

class CRID extends CompositeRule {
 constructor(ids) {
  super([new CRSID(ids), new CRVPID(ids)]);
 }
}

class CRNLIN extends Rule {
 constructor(ids) {
  super(ids, N(capture("noun")));
 }

 apply({noun}, node) {
  if (!node.ref ||
      node.children.length != 1) {
   return [[], [], [], []];
  }
     
  let pred = predicate(child(noun, 0), [node.ref], node.types);
  
  return [[], [pred], [], [node]];
 }
}

class CRPPLIN extends Rule {
 constructor(ids) {
  super(ids, N(N(capture("noun")), PP(PREP(capture("prep")), capture("np"))));
 }
 apply({noun, prep, np}, node) {
  if (!node.ref) {
   return [[], [], [], []];
  }

  // console.log(node);

  noun.ref = node.ref;
  let cond = S(node.ref, VP_(VP(V(prep), child(np, 1))));

  // noun.neg = node.neg;

  return [[], [noun, cond], [], [node]];
 }
}

class CRLIN extends CompositeRule {
 constructor(ids) {
  super([new CRNLIN(ids), new CRPPLIN(ids)]);
 }
}

class CRNRC extends Rule {
 constructor(ids) {
  super(ids, N(N(), RC(capture("rc"))));
 }

 apply(m, node) {
  let head = [];
  let body = [];
  let remove = [];
  
  let rc = node.children.pop();
    
  let s = rc.children[1];
  
  const g1 = S(NP(), VP_(AUX(), "not", VP(V(), NP(GAP(capture("gap"))))));

  if (match(g1, s)) {
   child(s, 1, 2, 1).children[0] = node.ref;
  }

  // Binds gap to the referent.
  let object = child(s, 1, 0, 1);
  if (object && object.children[0]["@type"] == "GAP") {
   object.children[0] = node.ref;
  }
  
  let subject = s.children[0];
  if (subject && subject.children && subject.children[0]["@type"] == "GAP") {
   s.children[0] = node.ref;
  }
  
  let noun = node.children.pop();
  noun.ref = node.ref;
  body.push(noun);
  remove.push(node);
  
  body.push(s);
    
  return [head, body, [], remove];
 }
}

class CRNEG extends Rule {
 constructor(ids) {
  super(ids, S(capture("np"), VP_(AUX(), "not", VP(capture("vp")))));
 }

 apply({np, vp}, node, refs) {
  let sub = drs(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  sub.neg = true;

  let s = clone(node);
  // console.log(s);
  child(s, 1).children.splice(0, 2);
  // console.log(child(node, 1));

  sub.push(s);
  //console.log(sub.print());
  //console.log(sub instanceof DRS);
 
  return [[], [sub], [], [node]];
 }
}

class CRPOSBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  let s = S(adj);
  adj.ref = ref.children[0];
  s.types = node.types;   
  return [[], [s], [], [node]];
 }
}

class CRPREPBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE("is"), PP(PREP(capture("prep")), capture("np"))))));
 }
 apply({ref, prep, np}, node, refs) {
  // console.log("hi");
  //console.log(print(node));
  let s = S(child(ref, 0), VP_(VP(V(child(prep, 0)), child(np, 1))));
  // console.log(print(child(np, 1)));
  // console.log(child(s, 1, 0, 1, 1));
  return [[], [s], [], [node]];
 }
}

class CRNEGBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", ADJ(capture("adj"))))));
 }
 apply({ref, adj}, node, refs) {
  let sub = drs(this.ids);
  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  let s = S(ref.children[0], VP_(VP(BE(), adj)));
  s.types = node.types;   
  sub.push(s);
  
  return [[], [negation(sub)], [], [node]];
 }
}

class CRNBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), NP(DET(capture("det")), N(capture("noun")))))));
 }
 apply({ref, det, noun}, node, refs) {
  let np = clone(noun);
  np.ref = child(ref, 0);

  // Matches the DRS found in (3.57) on page 269.
  if (node.types && node.types.tense) {
      np.types.tense = node.types.tense;
      // console.log(np);
  }

  return [[], [np], [], [node]];
 }
}

class CRNEGNBE extends Rule {
 constructor(ids) {
  super(ids, S(capture("ref"), VP_(VP(BE(), "not", NP(DET(capture("det")), N(capture("noun")))))));
 }
 apply({ref, det, noun}, node, refs) {
  let sub = drs(this.ids);

  sub.head = clone(refs);
  sub.head.forEach(ref => ref.closure = true);
  
  let np = clone(noun);
  np.ref = child(ref, 0);

  // Matches the DRS found in (3.57) on page 269.
  if (node.types && node.types.tense) {
   np.types.tense = node.types.tense;
  }

  sub.push(np);

  return [[], [negation(sub)], [], [node]];
 }
}

class CRBE extends CompositeRule {
 constructor(ids) {
  super([new CRPOSBE(ids), new CRNEGBE(ids), new CRNBE(ids), new CRNEGNBE(ids), new CRPREPBE(ids)]);
 }
}

class CRCOND extends Rule {
 constructor(ids) {
  super(ids, S("if", capture("head"), "then", capture("tail")));
 }
 apply({head, tail}, node, refs) {
  let antecedent = drs(this.ids);
  antecedent.head.push(...clone(refs));
  antecedent.head.forEach(ref => ref.closure = true);
  antecedent.push(head.children[1]);
   
  let consequent = drs(this.ids);
  consequent.head.push(...clone(antecedent.head));
  consequent.head.forEach(ref => ref.closure = true);
  consequent.push(tail.children[3]);
   
  return [[], [implication(antecedent, consequent)], [], [node]];
 }
}

class CREVERY extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET("every"), N(capture("noun"))), VP_(capture("verb"))));
 }
 apply({noun, verb}, node, refs) {
  let ref = referent(this.id(), noun.types);
  let n = drs(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  // console.log(noun);
  n.push(noun);

  let v = drs(this.ids);
  v.head.push(...clone(n.head));
  v.head.forEach(ref => ref.closure = true);

  let s = clone(node);

  // console.log(child(s, 0, 0, 0).children[0]);

  s.children[0] = ref;
  // console.log(print(s));
  v.push(s);

  let result = implication(n, v);
   
  return [[], [result], [], [node]];
 }
}

class CRVPEVERY extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(), NP(DET("every"), N(capture("noun")))))));
 }
 apply({subject, noun}, node, refs) {
  let ref = referent(this.id(), noun.types);
  let n = drs(this.ids);
  n.head.push(...clone(refs));
  n.head.forEach(ref => ref.closure = true);
  n.head.push(ref);
  noun.ref = ref;
  n.push(noun);
   
  let verb = drs(this.ids);
  verb.head.push(...clone(n.head));
  verb.head.forEach(ref => ref.closure = true);

  let s = clone(node);

  child(s, 1, 0).children[1] = ref;
  verb.push(s);
  
  return [[], [implication(n, verb)], [], [node]];
 }
}

class CROR extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "or", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  return [[], [disjunction(first, second)], [], [node]];
 }
}

class CRVPOR extends Rule {
 constructor(ids) {
  super(ids, S(capture("n"), VP_(VP(VP(capture("a")), "or", VP(capture("b"))))));
 }
 apply({a, b, n}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(n.children[0]), VP_(a)));

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(n.children[0]), VP_(b)));
  
  return [[], [disjunction(first, second)], [], [node]];
 }
}

class CRNPOR extends Rule {
 constructor(ids) {
  super(ids, S(NP(NP(capture("first")), "or", NP(capture("second"))), 
               VP_(capture("vp"))));
 }
 apply({first, second, vp}, node, refs) {
  let a = drs(this.ids);
  a.head.push(...clone(refs));
  a.head.forEach(ref => ref.closure = true);
  a.push(S(first, VP_(clone(vp))));

  let b = drs(this.ids);
  b.head.push(...clone(a.head));
  b.head.forEach(ref => ref.closure = true);
  b.push(S(second, VP_(clone(vp))));
  
  return [[], [disjunction(a, b)], [], [node]];
 }
}

class CRSAND extends Rule {
 constructor(ids) {
  super(ids, S(S(capture("a")), "and", S(capture("b"))));
 }
 apply({a, b}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(a);

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(b);
  
  return [[], [conjunction(first, second)], [], [node]];
 }
}

class CRVPAND extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), VP_(VP(V(V(capture("a")), "and", V(capture("b"))), NP(capture("object"))))));
 }
 apply({subject, a, b, object}, node, refs) {
  let first = drs(this.ids);
  first.head.push(...clone(refs));
  first.head.forEach(ref => ref.closure = true);
  first.push(S(clone(subject.children[0]), VP_(VP(a, clone(object)))));

  let second = drs(this.ids);
  second.head.push(...clone(first.head));
  second.head.forEach(ref => ref.closure = true);
  second.push(S(clone(subject.children[0]), VP_(VP(b, clone(object)))));
  
  return [[], [conjunction(first, second)], [], [node]];
 }
}

class CRAND extends CompositeRule {
 constructor(ids) {
  super([new CRSAND(ids), new CRVPAND(ids)]);
 }
}

// Possessive Phrases
class CRSPOSS extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node, refs) {
  let u = referent(this.id(), noun.types, print(child(node, 0), refs));
  node.children[0] = u;
  node.ref = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRVPPOSS extends Rule {
 constructor(ids) {
  super(ids, VP(capture("verb"), NP(DET(capture("name"), "'s"), RN(capture("noun")))));
 }

 apply({name, noun, verb}, node, refs) {
  // console.log("hi");
  
  let u = referent(this.id(), noun.types, print(child(node, 1), refs));
  node.children[1] = u;

  let s = S(u, VP_(VP(V(noun), name.children[0])));

  return [[u], [s], [], []];
 }
}

class CRPOSS extends CompositeRule {
 constructor(ids) {
  super([new CRSPOSS(ids), new CRVPPOSS(ids)]);
 }
}

class CRADJ extends Rule {
 constructor(ids) {
  super(ids, N(ADJ(capture("adj")), N(capture("noun"))));
 }
 apply({adj, noun}, node, refs) {
  adj = clone(adj);
  noun = clone(noun);
  adj.ref = node.ref;
  noun.ref = node.ref;
  return [[], [noun, adj], [], [node]];
 }
}

class CRSPP extends Rule {
 constructor(ids) {
  super(ids, S(NP(DET(), N(N(capture("noun")), PP(PREP(capture("prep")), capture("np")))), VP_()));
 }
 apply({noun, prep, np}, node, refs) {
  let u = referent(this.id(), noun.types);
  u.value = print(child(node, 0), refs);

  if (child(node, 0, 0)["@type"] == "DET" &&
      child(node, 0, 0, 0) == "Every") {
   child(node, 0).children[1] = u;
  } else {
   node.children[0] = u;
  }

  noun.ref = u;
  let cond = S(u, VP_(VP(V(prep), child(np, 1))));

  return [[u], [noun, cond], [], []];
 }
}

class CRVPPP extends Rule {
 constructor(ids) {
  super(ids, S(capture("subject"), 
               VP_(VP(V(), 
                      NP(DET(), 
                         N(N(capture("noun")), 
                           PP(PREP(capture("prep")), 
                              NP(capture("np")))))))));
 }
 apply({noun, prep, np}, node, refs) {
  let u = referent(this.id(), noun.types);
  child(node, 1, 0).children[1] = u;

  noun.ref = u;
  
  let cond = S(u, VP_(VP(V(prep), np)));

  return [[u], [noun, cond], [], []];
 }
}

class CRPP extends CompositeRule {
 constructor(ids) {
  super([new CRSPP(ids), new CRVPPP(ids)]);
 }
}

class CRWILL extends Rule {
 constructor(ids) {
  super(ids, VP_(AUX("will"), VP(capture("verb"))));
 }
 apply({verb, aux}, node, refs) {
  let {types} = node;
  let {tense} = types || {};

  if (tense != "fut") {
   return [[], [], [], []];
  }

  // page 541: 
  //
  // We face a minor technical complication in this case, 
  // which has to do with the auxiliary will. Will makes its 
  // semantic contribution via the feature value "fut". 
  //
  // Once it has made this contribution it can be discarded. 
  // We account for this by pruning the auxiliary from the 
  // sentence structure that remains after the first construction
  // step, in the course of which the contribution of will is 
  // explicitly represented, has been performed.
  node.children.shift();

  return [[], [], [], []];
 }
}

// Construction Rule described in page 543
class CRTENSE extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"), VP_(capture("verb"))));
 }
 apply({verb}, node, refs) {
 }
}

// Construction Rule described in page 589
class CRASPECT extends Rule {
 constructor(ids) {
  super(ids, S(capture("sub"), VP_(VP(HAVE(), VP(capture("verb"))))));
 }
 apply({sub, verb}, node) {
  let stat = (verb.types || {}).stat;

  if (!stat) {
   return [[], [], [], []];
  }

  child(node, 1).children[0] = child(node, 1, 0, 1);

  if (stat == "-") {
   return [[], [], [], []];
  } else if (stat == "+") {
   return [[], [], [], []];
  }
 }
}

class CRQUESTIONIS extends Rule {
 constructor(ids) {
  super(ids, Question(BE(capture("be")), NP(capture("sub")), ADJ(capture("adj")), "?"));
 }
 apply({be, sub, adj}, node) {
  let q = drs(this.ids);

  q.push(S(sub, VP_(VP(be, adj))));

  return [[], [query(q)], [], [node]];
 }
}

class CRQUESTIONWHO extends Rule {
 constructor(ids) {
  super(ids, Question("Who", VP_(capture("vp_")), "?"));
 }
 apply({vp_}, node, refs = []) {
  let q = drs(this.ids);

  let u = referent(this.id(), {}, "", refs);

  q.head.push(u);

  q.push(S(u, vp_));

  return [[u], [query(q, u)], [], [node]];
 }
}

class CRQUESTIONWHOM extends Rule {
 constructor(ids) {
  super(ids, Question("Who", AUX(), NP(capture("sub")), V(capture("verb")), "?"));
 }
 apply({sub, verb}, node, refs = []) {
  let q = drs(this.ids);

  let u = referent(this.id(), {}, "", refs);

  q.head.push(u);

  q.push(S(sub, VP_(VP(verb, u))));

  return [[u], [query(q, u)], [], [node]];
 }
}

class CRQUESTION extends CompositeRule {
 constructor(ids) {
  super([new CRQUESTIONIS(ids), 
         new CRQUESTIONWHO(ids), 
         new CRQUESTIONWHOM(ids)]);
 }
}

class CRSTEM extends Rule {
 constructor(ids) {
  super(ids, V(VERB(capture("stem"))));
 }
 apply({stem}, node, refs) {
  let root = stem.children[0];
  
  if (node.children.length > 1) {
   root += node.children[1];
  }

  node.children = [root];

  return [[], [], [], []];
 }
}

class CRPUNCT1 extends Rule {
 constructor(ids) {
  super(ids, Sentence(Statement(S_(S(capture("s"))))));
 }
 apply({s}, node) {
  return [[], [s], [], [node]];
 }
}

class CRPUNCT2 extends Rule {
 constructor(ids) {
  super(ids, Sentence(Question(capture("q"))));
 }
 apply({q}, node) {
  return [[], [q], [], [node]];
 }
}

class CRPUNCT extends CompositeRule {
 constructor(ids) {
  super([new CRPUNCT1(ids), 
         new CRPUNCT2(ids)]);
 }
}

function drs(ids) {
    return new DRS(Rules.from(ids));
}

function disjunction(a, b) {
 return {
  "@type": "Disjunction",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " or " + this.b.print();
  }
 };
}

function implication(a, b) {
 return {
   "@type": "Implication",
   "a": a,
   "b": b,
   print() {
   return this.a.print() + " => " + this.b.print();
  }
 };
}

function negation(a) {
 return {
   "@type": "Negation",
   "a": a,
   print() {
   return "~" + this.a.print();
  }
 };
}

function conjunction(a, b) {
 return {
  "@type": "Conjunction",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " and " + this.b.print();
  }
 };
}

function before(a, b) {
 return {
  "@type": "Before",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " < " + this.b.print();
  }
 };
}

function included(a, b) {
 return {
  "@type": "Included",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " <> " + this.b.print();
  }
 };
}

function equals(a, b) {
 return {
  "@type": "Equals",
  "a": a,
  "b": b,
  print() {
   return this.a.print() + " == " + this.b.print();
  }
 };
}

function query(drs, x) {
 return {
   "@type": "Query",
   "drs": drs,
   print() {
    return "exists(" + `${x ? x.print() : ""}` + ") " + this.drs.print() + " ?";
   }
 };
}

class Rules {
    static from(ids = new Ids()) {
        let rules = [
            new CRASPECT(ids),
            new CREVERY(ids),
            new CRVPEVERY(ids),
            new CRPP(ids),
            new CRID(ids),
            new CRLIN(ids),
            new CRNRC(ids), 
            new CRPRO(ids),
            new CRNEG(ids),
            new CRPOSS(ids),
            new CRBE(ids),
            new CRCOND(ids),
            new CROR(ids),
            new CRVPOR(ids),
            new CRNPOR(ids),
            new CRAND(ids),
            new CRADJ(ids),
            // new CRTENSE(ids),
            new CRWILL(ids),
            new CRQUESTION(ids),
            new CRSTEM(ids),
            new CRPUNCT(ids),
        ];
        return [new CRPN(ids), rules];
    }
}

module.exports = {
 match: match,
 capture: capture,
 referent: referent,
 Ids: Ids,
 Rules: Rules,
 CRPN: CRPN,
 CRPRO: CRPRO,
 CRID: CRID,
 CRLIN: CRLIN,
 CRNRC: CRNRC,
 CRNEG: CRNEG,
 CRBE: CRBE,
 CRCOND: CRCOND,
 CREVERY: CREVERY,
 CRVPEVERY: CRVPEVERY,
 CROR: CROR,
 CRVPOR: CRVPOR,
 CRNPOR: CRNPOR,
 CRAND: CRAND,
 CRPOSS: CRPOSS,
 CRADJ: CRADJ,
 CRPP: CRPP,
 CRTENSE: CRTENSE,
 CRASPECT: CRASPECT,
 CRWILL: CRWILL,
 CRQUESTION: CRQUESTION,
};

},{"./base.js":6,"./drs.js":8,"./parser.js":9}],11:[function(require,module,exports){

},{}],12:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":13}],13:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[7])(7)
});
