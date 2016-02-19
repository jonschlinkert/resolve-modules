'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;
var nameCache = {};

/**
 * Lazily required module dependencies
 */

require('arr-union', 'union');
require('ansi-bold', 'bold');
require('ansi-yellow', 'yellow');
require('ansi-magenta', 'magenta');
require('extend-shallow', 'extend');
require('global-modules', 'gm');
require('is-absolute');
require('isobject', 'isObject');
require('micromatch', 'mm');
require('resolve');
require('resolve-up', 'resolveUp');
require('try-open', 'exists');
require('vinyl', 'File');
require = fn;

/**
 * Cast `val` to an array
 *
 * @param  {*} val
 * @return {Array}
 */

utils.arrayify = function(val) {
  return val ? (!Array.isArray(val) ? [val] : val) : [];
};

utils.aliasFn = function(name, file) {
  return name.replace(new RegExp('^generate-?'), '');
};

utils.isValid = function(file, opts) {
  if (typeof opts.validate === 'function') {
    return opts.validate(file, opts);
  }
  return true;
};

utils.formatAlias = function(file) {
  return utils.yellow(file.alias);
}

utils.formatPath = function(file) {
  var inspectType = file.inspectType || 'path';
  var fp = file.path;
  if (!/\.\.\//.test(file.relative)) {
    fp = file.relative;
  }
  var name = path.dirname(fp);
  if (name === '.') {
    name = file.name;
  }
  var res = ' <' + utils.magenta(inspectType) + '>';
  if (inspectType === 'function') {
    return res;
  }
  res += ' ';
  res += utils.yellow(utils.bold(name));
  return res;
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

utils.tryRequire = function(name, options) {
  var opts = utils.extend({}, options);
  try {
    return require(name);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw err;
    }
  };

  try {
    return require(utils.resolve(name, opts));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw err;
    }
  };
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
