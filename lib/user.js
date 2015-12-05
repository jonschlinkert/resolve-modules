'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var cache = {};

/**
 * Create a new `User` instance with the given `options`
 *
 * ```js
 * var mod = new User(options);
 * ```
 * @param {Object} `options`
 * @api public
 */

function User(options) {
  var opts = this.options = options || {};

  // get the starting `cwd`
  var cwd = process.cwd();

  var pkgPath = path.join(cwd, 'package.json');
  var isEmpty = utils.isEmpty(cwd);
  var findup = opts.findup !== false || opts.forceFindup === true;

  // if the directory is empty, don't do `findup`.
  // this probably means the user is trying to initialize
  // a generator or similiar command from this directory
  if (!isEmpty && findup) {
    this.pkgPath = utils.findPkg.sync(cwd);
    this.cwd = path.dirname(this.pkgPath);
  } else {
    if (!fs.existsSync(this.pkgPath)) {
      this.pkgPath = null;
    }
    this.cwd = cwd;
  }

  /**
   * Get the `package.json` relative to the cwd.
   */

  utils.define(this, 'pkg', {
    enumerable: true,
    configurable: true,
    get: function() {
      if (cache[this.cwd]) return cache[this.cwd];
      if (!this.pkgPath) {
        cache[this.cwd] = {};
        return {};
      }
      var pkg = utils.tryRequire(this.pkgPath) || {};
      return (cache[this.cwd] = pkg);
    }
  });


  /**
   * Custom inspect functions
   */

  if (opts.inspectFn === true) {
    this.inspect = function() {
      return '<' + opts.key + ' <' + this.cwd + '>>'
    };
  }

  if (typeof opts.inspectFn === 'function') {
    this.inspect = opts.inspectFn;
  }
}

/**
 * Expose `User`
 */

module.exports = User;
