'use strict';

var path = require('path');
var Emitter = require('component-emitter');
var Config = require('./lib/config');
var utils = require('./lib/utils');
var Mod = require('./lib/mod');

/**
 * Expose `Resolver`
 */

module.exports = Resolver;

/**
 * Create an instance of `Resolver` with the given `options`. This
 * function is the main export of `resolve-modules`.
 *
 * ```js
 * var resolver = new Resolver(options);
 * ```
 * @param {Object} `options`
 * @api public
 */

function Resolver(options) {
  this.options = options || {};
  this.cache = {};
  this.configs = {};
  this.paths = [];
}

/**
 * Inherit Emitter and Paths
 */

Emitter(Resolver.prototype);

/**
 * @param {Object} `options`
 * @api public
 */

Resolver.prototype.resolve = function(options) {
  options = utils.extend({}, this.options, options);
  var opts = utils.normalizeOptions(options);
  var files = utils.glob.sync(opts.pattern, opts);
  var len = files.length;

  while (len--) {
    var fp = files[len];
    opts.cwd = path.dirname(fp);
    this.paths.push(fp);

    var config = new Config({path: fp, options: opts});
    config.module = new Mod(opts.module, config);
    this.configs[config.alias] = config;
    this.emit('config', config);
  }
  return this;
};

/**
 * Expose `Resolver`
 */

module.exports = Resolver;
