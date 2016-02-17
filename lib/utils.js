'use strict';

var fs = require('fs');
var path = require('path');
var nameCache = {};

/**
 * Module dependencies
 */

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('define-property', 'define');
require('project-name', 'project');
require('extend-shallow', 'extend');
require('try-open', 'exists');
require('set-value', 'set');
require('has-value', 'has');
require('get-value', 'get');
require('matched', 'glob');
require('is-valid-glob');
require('resolve-dir');
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
 * Return true if a directory exists and is empty.
 *
 * @param  {*} val
 * @return {Array}
 */

utils.isEmpty = function(dir) {
  if (!utils.exists(dir, 'r')) {
    return false;
  }

  var files;
  try {
    files = fs.readdirSync(dir);
    files = files.filter(function(fp) {
      return !/\.DS_Store/i.test(fp);
    });
    return files.length === 0;
  } catch (err) {};
  return true;
};

/**
 * Creates an options object that is a combination of the given `options`
 * and globally defined options, whilst also ensuring that `realpath`
 * and `cwd` are defined so that glob results are what we expect.
 *
 * @param {Object} `options`
 * @return {Object}
 */

utils.normalizeOptions = function(key, patterns, options) {
  options = options || {};

  if (utils.isValidGlob(patterns)) {
    options.patterns = patterns;
  } else {
    options = utils.extend({}, options, patterns);
  }

  if (typeof key === 'string') {
    if (!utils.isValidGlob(options.patterns) && !utils.isValidGlob(options.pattern)) {
      options.patterns = key;
      options.key = null;
    } else {
      options.key = key;
    }
  } else if (Array.isArray(key)) {
    options.patterns = key;
    options.key = null;
  } else if (key && typeof key === 'object') {
    options = utils.extend({}, options, key);
  }

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

utils.rename = function(filepath, options) {
  options = options || {};
  if (typeof options.rename === 'function') {
    if (!options.context) {
      options.context = options.contextFn
        ? options.contextFn()
        : {};
    }
    return options.rename(filepath, options);
  }
  if (nameCache.hasOwnProperty(filepath)) {
    return nameCache[filepath];
  }

  var stat = utils.tryStat(filepath);
  if (stat && stat.isFile()) {
    filepath = path.dirname(filepath);
  }

  if (filepath === '.') {
    name = utils.project(options.cwd || process.cwd());
    nameCache[filepath] = name;
    return name;
  }

  var name = path.basename(filepath, path.extname(filepath));
  if (name === '.') {
    name = utils.project(options.cwd || process.cwd());
  }
  nameCache[filepath] = name;
  return name;
};

/**
 * Get the alias to use based on a filepath or "full name".
 */

utils.alias = function(fp, options) {
  options = options || {};
  options.context = options.contextFn
    ? options.contextFn()
    : {};

  if (typeof options.aliasFn === 'function') {
    return options.aliasFn(fp, options);
  }
  var name = utils.rename(fp, options);
  var seg = name.slice(name.indexOf('-') + 1);
  var alias = options.context.alias || seg;
  var rel = options.context.relative;
  if (rel && rel !== alias && rel !== 'app') {
    alias += '.' + rel;
  }
  return alias;
};

/**
 * Try to get the `fs.realpath` of a filepath/symlink, failing
 * silently if filepath does not exist.
 *
 * @param {String} `filepath`
 * @return {String|Null}
 */

utils.tryRealpath = function(filepath) {
  try {
    return fs.realpathSync(filepath);
  } catch (err) {};
  return null;
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
  } catch (err) {
    console.log(err)
  };
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

utils.resolveRoot = function(dir, limit) {
  var fp = utils.findPkg.sync(utils.resolveDir(dir), limit);
  return path.dirname(fp);
};
utils.findUp = function(dir, limit) {
  var fp = utils.findPkg.sync(utils.resolveDir(dir), limit);
  return path.dirname(fp);
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
