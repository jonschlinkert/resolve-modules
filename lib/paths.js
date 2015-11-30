'use strict';

var path = require('path');
var utils = require('./utils');

/**
 * Create a new `Paths` with the given `options`
 *
 * ```js
 * var paths = new Paths(options);
 * ```
 * @param {Object} `options`
 */

function Paths(options) {
  this.options = options || {};
  this.cache = {};
}

/**
 * Set property `key` on `paths.cache` with the given `value`.
 *
 * ```js
 * paths.set('cwd', process.cwd());
 * ```
 * @param {String} `key`
 * @param {String} `value`
 * @returns {String} Returns the given `value`
 * @api public
 */

Paths.prototype.set = function(key, val) {
  utils.set(this.cache, key, val);
  return val;
};

/**
 * Return true if `key` has a value on `paths.cache` that is not
 * null or undefined.
 *
 * ```js
 * paths.has('cwd');
 * //=> true
 * ```
 * @param {String} `key`
 * @param {String} `value`
 * @api public
 */

Paths.prototype.has = function(key) {
  return utils.has(this.cache, key) || utils.has(this.options, key);
};

/**
 * Get the value of `key` from `paths.cache` or `paths.options`.
 *
 * ```js
 * paths.get('cwd');
 * //=> /Users/jonschlinkert/dev/paths-cache
 * ```
 * @param {String} `key`
 * @api public
 */

Paths.prototype.get = function(key) {
  return utils.get(this.cache, key) || utils.get(this.options, key);
};

/**
 * Resolve the given `filepath` using [resolve-dir][] and
 * `path.resolve()`.
 *
 * ```js
 * paths.resolveDir('~/foo');
 * //=> /Users/jonschlinkert/dev/paths-cache/foo
 * ```
 * @param {String} `filepath`
 * @api public
 */

Paths.prototype.resolveDir = function(filepath) {
  return utils.resolveDir(filepath || '');
};

/**
 * Resolve the root directory of a module by searching up
 * from the given filepath.
 *
 * ```js
 * paths.resolveRoot('~/foo/bar/baz');
 * //=> /Users/jonschlinkert/dev/paths-cache
 * ```
 * @param {String} `filepath`
 * @api public
 */

Paths.prototype.resolveRoot = function(dir) {
  return path.dirname(utils.findPkg.sync(this.resolveDir(dir)));
};

/**
 * Expose `Paths`
 */

module.exports = Paths;
