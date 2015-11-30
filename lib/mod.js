'use strict';

var path = require('path');
var util = require('util');
var utils = require('./utils');
var Paths = require('./paths');

/**
 * Create a new `Mod` with the given `options`
 *
 * ```js
 * var mod = new Mod(options);
 * ```
 * @param {Object} `options`
 */

function Mod(name, options) {
  Paths.call(this, options);
  this.options = options || {};
  this.name = name;
  this.cwd = options.cwd;
  this.cache = {};
}

/**
 * Inherit `Paths`
 */

util.inherits(Mod, Paths);

/**
 * Custom inspect method
 */

Mod.prototype.inspect = function() {
  return {
    cwd: this.cwd,
    path: this.path,
    name: this.name,
    pkg: this.pkg
  };
};

/**
 * Add getter/setter methods to the prototype.
 */

function mixin(key, val) {
  utils.define(Mod.prototype, key, val);
}

/**
 * Get the `path` for the module
 */

mixin('path', {
  get: function() {
    if (!this.has('name')) {
      throw new TypeError('expected name to be a string');
    }
    if (this.cache.path) {
      return this.cache.path;
    }
    var filepath = utils.resolveModule(this.name, this.cwd);
    return (this.cache.path = filepath);
  }
});

/**
 * Get the `package.json` relative to the module.
 */

mixin('pkg', {
  get: function() {
    return path.join(path.dirname(this.path), 'package.json');
  }
});

/**
 * Expose `Mod`
 */

module.exports = Mod;
