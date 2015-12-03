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
 * @api public
 */

function Mod(name, options) {
  if (typeof name !== 'string') {
    throw new TypeError('expected name to be a string');
  }
  this.name = name;
  Paths.call(this, options);
  utils.define(this, 'cache', {});
  utils.define(this, 'options', options || {});
  this.configCwd = this.options.configCwd || this.options.cwd;

  /**
   * Get the `path` for the module
   */

  this.path = utils.resolveModule(this.name, this.configCwd);

  /**
   * Get the `path` for the module
   */

  utils.define(this, 'realpath', {
    enumerable: true,
    configurable: true,
    get: function() {
      if (!this.has('name')) {
        throw new TypeError('expected name to be a string');
      }
      if (this.cache.realpath) {
        return this.cache.realpath;
      }
      return (this.cache.realpath = utils.tryRealpath(this.path));
    }
  });

  /**
   * Get the `package.json` relative to the module.
   */

  utils.define(this, 'pkg', {
    enumerable: true,
    configurable: true,
    get: function() {
      return path.join(path.dirname(this.path), 'package.json');
    }
  });

  /**
   * Get the main export of the module. Although the property name is `fn`
   * to serve the most common use case, this could be anything.
   */

  utils.define(this, 'fn', {
    enumerable: true,
    configurable: true,
    get: function() {
      return utils.tryRequire(this.path);
    }
  });
}

/**
 * Inherit `Paths`
 */

util.inherits(Mod, Paths);

/**
 * Expose `Mod`
 */

module.exports = Mod;
