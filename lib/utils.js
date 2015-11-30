'use strict';

var fs = require('fs');
var path = require('path');
var nameCache = {};

/**
 * Module dependencies
 */

var utils = require('lazy-cache')(require);

/**
 * Temporarily re-assign `require` to trick browserify and
 * webpack into reconizing lazy dependencies.
 *
 * This tiny bit of ugliness has the huge dual advantage of
 * only loading modules that are actually called at some
 * point in the lifecycle of the application, whilst also
 * allowing browserify and webpack to find modules that
 * are depended on but never actually called.
 */

var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('define-property', 'define');
require('project-name', 'project');
require('extend-shallow', 'extend');
require('set-value', 'set');
require('has-value', 'has');
require('get-value', 'get');
require('matched', 'glob');
require('resolve-dir');
require('is-absolute');
require('find-pkg');
require('relative');
require('resolve');

/**
 * Restore `require`
 */

require = fn;

/**
 * Cast `val` to an array
 *
 * @param  {*} val
 * @return {Array}
 */

utils.arrayify = function(val) {
  if (!val) return [];
  return !Array.isArray(val)
    ? [val]
    : val;
};

/**
 * Creates an options object that is a combination of the given `options`
 * and globally defined options, whilst also ensuring that `realpath`
 * and `cwd` are defined so that glob results are what we expect.
 *
 * @param {Object} `options`
 * @return {Object}
 */

utils.normalizeOptions = function(options) {
  var defaults = { realpath: true, cwd: process.cwd() };
  var opts = utils.extend(defaults, options);
  opts.cwd = utils.resolveDir(opts.cwd);
  return opts;
};

/**
 * Get the name of a project.
 *
 * ```js
 * rename('foo/bar/updater-foo');
 * //=> 'update-foo'
 * ```
 */

utils.rename = function(filepath, config) {
  if (config && typeof config.rename === 'function') {
    return config.rename(filepath, config);
  }
  if (nameCache.hasOwnProperty(filepath)) {
    return nameCache[filepath];
  }

  var stat = utils.tryStat(filepath);
  if (stat && stat.isFile()) {
    filepath = path.dirname(filepath);
  }

  var name = path.basename(filepath, path.extname(filepath));
  if (name === '.') {
    name = utils.project(config.cwd);
  }
  nameCache[filepath] = name;
  return name;
};

/**
 * Get the alias to use based on a filepath or "full name".
 */

utils.alias = function(fp, options) {
  if (options && typeof options.aliasFn === 'function') {
    return options.aliasFn(fp, options);
  }
  var name = utils.rename(fp, options);
  var seg = name.slice(name.indexOf('-') + 1);
  if (!options || !options.context) {
    return seg;
  }
  var alias = options.context.alias;
  var rel = options.context.relative;
  if (rel !== alias && rel !== 'app') {
    alias += ':' + rel;
  }
  return alias;
};

/**
 * Try to return the stats object from `fs.statSync`, failing
 * silently if filepath does not exist.
 *
 * @param {String} `filepath`
 * @return {Object|Null}
 */

utils.tryStat = function(filepath) {
  try {
    return fs.statSync(filepath);
  } catch (err) {};
  return null;
};

/**
 * Try to require module `name`, failing silently if not found.
 *
 * @param {String} `name`
 * @return {String|Null}
 */

utils.tryRequire = function(name) {
  try {
    return require(name);
  } catch (err) {};
  return null;
};

/**
 * Try to resolve module `name` from the given `cwd`,
 * failing silently if the module is not found.
 *
 * @param {String} `name`
 * @return {String|Null}
 */

utils.tryResolve = function(name, cwd) {
  try {
    if (cwd) cwd = utils.resolveDir(cwd);
    return utils.resolve.sync(name, {basedir: cwd || process.cwd()});
  } catch (err) {};
  return null;
};

/**
 * Resolve module the module to use from the given cwd.
 *
 * @param {String} `name`
 * @return {String|Null}
 */

utils.resolveModule = function(name, cwd) {
  if (typeof name === 'undefined') {
    throw new TypeError('expected name to be a string');
  }

  name = utils.resolveDir(name);
  if (cwd && path.basename(cwd) === name) {
    var fp = utils.tryResolve(cwd);
    if (fp) return fp;
  }
  return utils.tryResolve(name, cwd)
    || utils.tryResolve(name, '@/');
};

/**
 * Expose `utils`
 */

module.exports = utils;
