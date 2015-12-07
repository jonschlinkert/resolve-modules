'use strict';

var path = require('path');
var utils = require('./utils');

/**
 * Create a new `Mod` with the given `options`
 *
 * ```js
 * var mod = new Mod(options);
 * ```
 * @param {Object} `options`
 * @api public
 */

function Mod(name, config, options) {
  if (typeof name !== 'string') {
    throw new TypeError('expected name to be a string');
  }

  this.name = name;
  var opts = (this.options = options || {});
  this.configCwd = opts.configCwd || opts.cwd;
  utils.define(this, 'options', this.options);
  utils.define(this, 'cache', {});

  /**
   * Get the `path` for the module
   */

  this.path = utils.resolveModule(this.name, this.configCwd);

  /**
   * Custom inspect functions
   */

  if (opts.inspectFn === true) {
    this.inspect = function() {
      return '<' + opts.key + ' "' + this.name + '" <' + this.realpath + '>>';
    };
  }

  if (typeof opts.inspectFn === 'function') {
    this.inspect = opts.inspectFn;
  }

  /**
   * Get the `path` for the module
   */

  utils.define(this, 'realpath', {
    enumerable: true,
    configurable: true,
    get: function() {
      if (!this.name) {
        throw new TypeError('expected name to be a string');
      }
      if (this.cache.realpath) {
        return this.cache.realpath;
      }
      var fp = this.path ? utils.tryRealpath(this.path) : null;
      return (this.cache.realpath = fp);
    }
  });

  /**
   * Get the `package.json` relative to the module.
   */

  utils.define(this, 'cwd', {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.path ? path.dirname(this.path) : null;
    }
  });

  /**
   * Get the `package.json` relative to the module.
   */

  utils.define(this, 'pkg', {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.cwd ? path.join(this.cwd, 'package.json') : null;
    }
  });

  /**
   * Get the main export of the module. Although the property name is `fn`
   * to serve the (seemingly) most common use case, this could be anything.
   */

  utils.define(this, 'fn', {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.path ? utils.tryRequire(this.path) : null;
    }
  });
}

/**
 * Expose `Mod`
 */

module.exports = Mod;
