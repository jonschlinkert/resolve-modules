'use strict';

var fs = require('fs');
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

Resolver.prototype.resolveModule = function(cwd, cb) {
  if (this.hasOwnProperty('module')) return this.module;
  var res = utils.resolveModule(this.options.module, cwd);
  return (this.module = res || null);
};

Resolver.prototype.localConfig = function(patterns, cwd) {
  if (this.hasOwnProperty('local')) return this.local;
  if (!cwd) cwd = process.cwd();
  console.log(utils.findUp(process.cwd(), 1))
  var fp = path.resolve(cwd, filename);
  if (!utils.exists(fp)) {
    fp = null;
  }
  return (this.local = fp);
};

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

Resolver.prototype.resolve = function(key, patterns, options) {
  var opts = utils.normalizeOptions(key, patterns, options);
  opts = utils.extend({}, this.options, opts);
  opts.key = opts.key || 'default';

  patterns = (opts.patterns || opts.pattern);
  var files = this.files[opts.cwd] || utils.glob.sync(patterns, opts);
  this.files[opts.cwd] = files;

  if (!this.user) {
    this.user = new User(opts);
  }

  var len = files.length;
  while (len--) {
    var fp = files[len];
    var cwd = opts.configCwd = path.dirname(fp);
    this.paths.push(fp);

    var env = this.cache[cwd] || createEnv(fp, cwd, opts, this.user);

    this.emit('config', opts.key, env);
    utils.set(this.configs, [opts.key, env.config.alias], env);
    if (opts.first) {
      this.first = env;
      break;
    }
  }
  return this;
};

Resolver.prototype.resolveFirst = function(patterns, dirs) {
  if (!dirs) dirs = [process.cwd()];
  if (this.options.fallback) {
    dirs.push(this.options.fallback);
  }
  dirs = utils.arrayify(dirs || []);
  var len = dirs.length, i = -1;

  while (++i < len) {
    this.resolve(patterns, {cwd: dirs[i], first: true});
    if (this.first) {
      break;
    }
  }

  if (!this.first) {
    var env = {user: this.user};
    env.mod = new Mod(this.options.module, {cwd: this.options.fallback});
    env.config = {};
    this.first = env;
  }
  return this.first;
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

function createEnv(fp, cwd, options, user) {
  options = options || {};
  var env = {};
  var opts = utils.extend({}, options);
  opts.cwd = cwd;
  env.user = user || new User();
  env.config = new Config(fp, options);
  env.module = new Mod(options.module, options);
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
