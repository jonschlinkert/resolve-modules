'use strict';

var path = require('path');
var Emitter = require('component-emitter');
var Config = require('./lib/config');
var utils = require('./lib/utils');
var User = require('./lib/user');
var Mod = require('./lib/mod');

/**
 * Expose `Resolver`
 */

module.exports = Resolver;

/**
 * Create an instance of `Resolver` with `options`. The only required option
 * is `module`, which is the name of the module that will be used for
 * creating instances for config files by the [resolve](#resolve) method.
 *
 * For example, [generate][], the project generator, would be the "module",
 * and individual generators (`generator.js` files) would be the "config" files.
 *
 * ```js
 * var resolver = new Resolver({
 *   module: 'generate'
 * });
 * ```
 * @param {Object} `options`
 * @api public
 */

function Resolver(options) {
  this.options = options || {};
  utils.define(this, 'cache', {});
  utils.define(this, 'files', {});
  utils.define(this, 'paths', []);
  this.configs = {};
}

/**
 * Inherit Emitter and Paths
 */

Emitter(Resolver.prototype);

/**
 * Searches for config files that match the given glob `patterns` and,
 * when found, emits `config` with details about the module and environment,
 * such as absolute path, `cwd`, path to parent module, etc.
 *
 * ```js
 * var resolver = new Resolver({
 *   module: 'generate'
 * });
 *
 * resolver.on('config', function(config, mod) {
 *   // `config` is an object with fully resolved file paths.
 *   // Config also has a `fn` getter that returns the contents of
 *   // the config file. Using the "generate" analogy above, this would
 *   // be a "generator.js" config file
 *
 *   // `mod` (module) is a similar object, but for the "parent"
 *   // module. Using the generate analogy above, this would be an installation
 *   // "generate", either installed locally to the generator, or as a global
 *   // npm module
 * });
 *
 * resolver
 *   .resolve('generator.js', {cwd: 'foo'})
 *   .resolve('generator.js', {cwd: 'bar'})
 *   .resolve('generator.js', {cwd: 'baz'});
 * ```
 *
 * @param {String|Array|Object} `patterns` Glob pattern(s) or options object. If options, the `pattern` property must be defined with a glob pattern.
 * @param {Object} `options`
 * @return {Object} Returns the resolver instance, for chaining.
 * @api public
 */

Resolver.prototype.resolve = function(key, options) {
  if (typeof key !== 'string') {
    options = key;
    key = null;
  }

  if (!key) key = 'default';
  options = utils.extend({}, this.options, options);
  var opts = utils.normalizeOptions(options);
  opts.key = key;
  var patterns = (opts.patterns || opts.pattern);

  var files = this.files[opts.cwd] || utils.glob.sync(patterns, opts);
  this.files[opts.cwd] = files;

  var len = files.length;
  while (len--) {
    var fp = files[len];
    var cwd = opts.configCwd = path.dirname(fp);
    this.paths.push(fp);

    var env = {};
    if (this.cache[cwd]) {
      env = this.cache[cwd];
    } else {
      env = createEnv(fp, cwd, opts);
    }

    this.emit('config', key, env);
    utils.set(this.configs, [key, env.config.alias], env);
  }
  return this;
};

/**
 * Return a new `env` (environment) object with `config`, `module`
 * and `user` properties.
 *
 * @param {String} `fp` The starting filepath for the `config`
 * @param {String} `cwd` The user (process) `cwd`
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

function createEnv(fp, cwd, options) {
  options = options || {};
  var env = {};
  var opts = utils.extend({}, options);
  opts.cwd = cwd;
  env.user = new User(opts);
  env.config = new Config(fp, options);
  env.module = new Mod(options.module, env.config, options);
  return env;
}

/**
 * Expose `Resolver`
 */

module.exports = Resolver;

/**
 * Expose `env` constructors
 */

module.exports.Config = Config;
module.exports.User = User;
module.exports.Mod = Mod;
module.exports.createEnv = createEnv;
