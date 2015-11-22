'use strict';

var fs = require('fs');
var path = require('path');
var nameCache = {};
var resolveModuleCache = {};
var modulePathCache = {};

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
require('array-unique', 'unique');
require('matched', 'glob');
require('resolve-dir');
require('resolve-up');
require('inflection');
require('npm-paths');

/**
 * Restore `require`
 */

require = fn;

/**
 * Singularize the given `name`
 */

utils.single = function(name) {
  return utils.inflection.singularize(name);
};

/**
 * Pluralize the given `name`
 */

utils.plural = function(name) {
  return utils.inflection.pluralize(name);
};

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
 * Utils
 */

utils.prepend = function(names, prefixes) {
  prefixes = utils.arrayify(prefixes);
  names = utils.arrayify(names);

  var plen = prefixes.length;
  var nlen = names.length, i = -1;

  if (plen === 0 || nlen === 0) {
    return names;
  }

  var res = names.slice();
  while (++i < nlen) {
    var name = names[i];

    for (var j = 0; j < plen; j++) {
      var prefix = prefixes[j];
      res.push(prefix + name);
    }
  }
  return res;
};

utils.append = function(names, suffixes) {
  suffixes = utils.arrayify(suffixes);
  names = utils.arrayify(names);

  var plen = suffixes.length;
  var nlen = names.length, i = -1;

  if (plen === 0 || nlen === 0) {
    return names;
  }

  var res = names.slice();
  while (++i < nlen) {
    var name = names[i];

    for (var j = 0; j < plen; j++) {
      var suffix = suffixes[j];
      res.push(name + suffix);
    }
  }
  return res;
};

utils.createNames = function(names, extensions) {
  var exts = utils.arrayify(extensions);
  names = utils.arrayify(names);

  var plen = exts.length;
  var nlen = names.length, i = -1;

  if (plen === 0 || nlen === 0) {
    return names;
  }

  var res = names.slice();
  while (++i < nlen) {
    var name = names[i];

    for (var j = 0; j < plen; j++) {
      res.push(name + utils.formatExt(exts[j]));
    }
  }
  return res;
};

utils.formatExt = function(ext) {
  if (!ext || typeof ext !== 'string') return ext;
  if (ext.charAt(0) !== '.') {
    return '.' + ext;
  }
  return ext;
};

utils.stripDot = function(ext) {
  if (!ext) return ext;
  if (ext.charAt(0) === '.') {
    return ext.slice(1);
  }
  return ext;
};

utils.createNameRegex = function(names, exts) {
  var extPattern = utils.createExtRegex(exts);
  if (names.length > 1) {
    names = '(' + names.join('|') + ')';
  }
  return new RegExp(names + extPattern);
};

utils.createExtRegex = function(exts) {
  exts = utils.arrayify(exts);
  if (exts.length > 1) {
    return '\\.(' + exts.join('|') + ')$';
  }
  return '\\' + utils.formatExt(exts[0]);
};

utils.createExtGlob = function(exts) {
  exts = utils.arrayify(exts);
  if (exts.length > 1) {
    return '.{' + exts.join(',') + '}';
  }
  return utils.formatExt(exts[0]);
};

utils.createNamePattern = function(names, exts) {
  var extGlob = utils.createExtGlob(exts);
  names = utils.arrayify(names);
  var pattern = names.join(',');
  if (names.length > 1) {
    pattern = '{' + pattern + '}';
  }
  return pattern + extGlob;
};

/**
 * Rename a filepath to the "alias" of the project.
 *
 * ```js
 * nameFn('updater-foo');
 * //=> 'foo'
 * ```
 */

utils.nameFn = function(fp, options) {
  if (options && typeof options.nameFn === 'function') {
    return options.nameFn(fp);
  }
  if (nameCache.hasOwnProperty(fp)) {
    return nameCache[fp];
  }
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    fp = path.dirname(fp);
  }
  var name = path.basename(fp, path.extname(fp));
  if (name === '.') {
    name = utils.project(options.cwd);
  }
  nameCache[fp] = name;
  return name;
};

/**
 * Get the alias to use based on a filepath or "full name".
 */

utils.aliasFn = function(fp, options) {
  options = options || {};
  if (typeof options.aliasFn === 'function') {
    return options.aliasFn(fp);
  }
  var name = utils.nameFn(fp, options);
  return name.slice(name.indexOf('-') + 1);
};

utils.tryRequire = function(name, cwd) {
  try {
    return require(name);
  } catch (err) {};

  try {
    return require(path.resolve((cwd || process.cwd()), name));
  } catch (err) {};
  return null;
};

utils.tryResolve = function(name) {
  try {
    return require.resolve(name);
  } catch (err) {};
  return null;
};

/**
 * Resolve the correct updater module to instantiate.
 * If `update` exists in `node_modules` of the cwd,
 * then that will be used to create the instance,
 * otherwise this module will be used.
 */

utils.resolveModule = function(cwd, name, options) {
  if (resolveModuleCache.hasOwnProperty(name)) {
    return resolveModuleCache[name];
  }

  var opts = utils.extend({}, options);
  var modulePath;
  opts.cwd = cwd;

  var dir = path.resolve(opts.cwd, 'node_modules', name, 'index.js');
  if (fs.existsSync(dir)) {
    modulePath = utils.modulePath(dir) || utils.tryResolve(path.dirname(dir));
    resolveModuleCache[name] = modulePath;
    return modulePath;
  }

  if (path.basename(opts.cwd) === name) {
    dir = path.resolve(opts.cwd, 'index.js');
    if (fs.existsSync(dir)) {
      modulePath = utils.modulePath(dir);
      resolveModuleCache[name] = modulePath;
      return modulePath;
    }
  }

  var paths = utils.resolveUp(name + '/index.js');
  if (paths.length) {
    resolveModuleCache[name] = paths[0];
    return paths[0];
  }
  return null;
};

/**
 * Get the absolute filepath for a module.
 *
 * @param {String} `fp`
 * @return {String}
 */

utils.modulePath = function(fp) {
  if (modulePathCache.hasOwnProperty(fp)) {
    return modulePathCache[fp];
  }
  var filepath = utils.resolveDir(fp);

  if (filepath.charAt(0) === '.') {
    filepath = path.resolve(filepath);
  }

  if (path.extname(filepath) === '' && path.basename(filepath).charAt(0) !== '.') {
    filepath += path.sep;
  }

  var res = utils.tryResolve(filepath) || null;
  modulePathCache[fp] = res;
  return res;
};

/**
 * Expose `utils`
 */

module.exports = utils;
