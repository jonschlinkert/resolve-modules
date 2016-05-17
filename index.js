'use strict';

var fs = require('fs');
var path = require('path');
var Emitter = require('component-emitter');
var utils = require('./lib/utils');
var File = require('./lib/file');

/**
 * Iterates over [npm-paths][] and emits `file` for every resolved filepath, and `match`
 * for files that match any specified [matchers][]. Paths are cached in memory using a few
 * different objects:
 *
 * - `cache.paths`: array of absolute directory and file paths
 * - `cache.names`: object of [vinyl][] files, where `file.name` is the object key. `file.name` is the basename of the filepath, but it's aliased as `name` so we can use it without touching the getters/setters on the vinyl file.
 * - `cache.files`: array of [vinyl][] files
 *
 * ```js
 * var resolver = new Resolver();
 * resolver.resolve();
 * console.log(resolver);
 * ```
 * @param {Object} `options` Specify a cache to use on `options.cache`.
 * @api public
 */

function Resolver(options) {
  this.options = options || {};
  this.matchers = {};
  utils.define(this, 'fns', []);
  utils.define(this, '_callbacks', {});
  this.cache = this.options.cache || {
    matches: {},
    files: [],
    paths: [],
    names: {},
    dirs: null
  };
  this.paths = null;
  this.matches = [];
}

/**
 * Mix in Emitter methods
 */

Object.setPrototypeOf(Resolver.prototype, Emitter.prototype);

/**
 * Iterates over [npm-paths][] and returns an array of [vinyl][] files that match any
 * provided matchers. Also emits `file` for all files, and `match` for matches. Additionally,
 * paths are cached on the first call to `.resolve` so that any subsequent calls during
 * the same process will use the cached filepaths instead of hitting the file system again.
 * You can force `.resolve` to hit the file system again by deleting or nulling
 * `resolver.cache.dirs`.
 *
 * ```js
 * resolver.match('verb', function(basename, file) {
 *   return basename === 'verb';
 * });
 *
 * // matches
 * console.log(resolver.resolve());
 *
 * // all cached paths
 * console.log(resolver);
 * ```
 * @param {Function|String|Array|RegExp} `fn` Optionally specify a matcher value.
 * @param {Object} `options`
 * @return {Array} Returns an array of [vinyl][] files.
 * @api public
 */

Resolver.prototype.resolve = function(fn) {
  if (fn) this.match.apply(this, arguments);
  this.resolveDirs();
  return this.matches;
};

/**
 * Find a filepath where `file.basename` exactly matches the given `name`. This method is standalone and
 * does not require use of the `.resolve` method or matchers.
 *
 * ```js
 * var filepath = resolver.find('foo');
 * ```
 * @param {String} `name` Basename of the file to match.
 * @return {String|undefined} Returns the absolute filepath if a match is found, otherwise undefined.
 * @api public
 */

Resolver.prototype.find = function(name) {
  if (this.cache.names.hasOwnProperty(name)) {
    return this.cache.names[name];
  }
  var paths = this.npmPaths();
  for (var i = 0; i < paths.length; i++) {
    var fp = path.resolve(paths[i], name);
    if (utils.exists(fp)) {
      this.cache.names[name] = fp;
      return fp;
    }
  }
};

/**
 * Define a matcher to use for matching files when the `resolve` method is called. If a string or array of strings is passed, strict equality is used for comparisons with `file.name`.
 *
 * ```js
 * resolver.match('foo');
 * ```
 * @param {String|Function|Array|RegExp} `name` Optionally provide `name` to emit when a match is found, a matcher function, string to match, array of strings, or regex.
 * @param {String|Function|Array|RegExp} `val` Matcher function, string to match, array of strings, or regex.
 * @param {Object} `options` If a string is passed, options may be passed to [micromatch][] to convert the string to regex.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Resolver.prototype.match = function(name, val, options) {
  if (utils.typeOf(val) === 'undefined' || utils.typeOf(val) === 'object') {
    options = val;
    val = this.matcher(name, options);
    if (typeof name !== 'string') {
      this.fns.push(val);
      return this;
    }
  } else {
    val = this.matcher(val, options);
  }
  this.matchers[name] = this.matchers[name] || [];
  this.matchers[name].push(val);
  return this;
};

/**
 * Define a matcher to use for matching files when the `resolve` method is called. If a string or array of strings is passed, any `file.name` that contains the given string or strings will return true.
 *
 * ```js
 * resolver.contains('foo');
 * ```
 * @param {String|Function|Array|RegExp} `name` Optionally provide `name` to emit when a match is found, a matcher function, string to match, array of strings, or regex.
 * @param {String|Function|Array|RegExp} `val` Matcher function, string to match, array of strings, or regex.
 * @param {Object} `options` If a string is passed, options may be passed to [micromatch][] to convert the string to regex.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Resolver.prototype.contains = function(name, fn, options) {
  var args = [].slice.call(arguments);
  if (utils.typeOf(args[args.length - 1]) === 'object') {
    options = args.pop();
  }
  options = utils.extend({}, options, {contains: true});
  args.push(options);
  return this.match.apply(this, args);
};

/**
 * Private method that takes a value and returns a matcher function to use for matching files.
 *
 * @param {any} val
 * @param {Object} options
 * @return {Function}
 */

Resolver.prototype.matcher = function(val, options) {
  if (utils.typeOf(val) === 'array') {
    val = val.join('|');
  }
  if (utils.typeOf(val) === 'string') {
    val = utils.mm.makeRe(val, options);
  }
  if (utils.typeOf(val) === 'regexp') {
    return function(name) {
      return val.test(name);
    };
  }
  if (utils.typeOf(val) !== 'function') {
    return function noop() {};
  }
  return val;
};

/**
 * Resolve sub-directories from npm-paths (does not recurse). This method probably doesn't need to
 * be used directly, but it's exposed in case you want to customize behavior.
 *
 * ```js
 * resolver.resolveDirs(function(basename, file) {
 *   return !/foo/.test(file.path);
 * });
 * ```
 * @emits `ignore` when a file is removed.
 * @param {Function} `fn` Optionally specify a filter function to use on filepaths. If provided, the function will be called before any matchers are called. `basename` and `file` are exposed to the filter function as arguments, where `file` is an instance of [vinyl][].
 * @return {Object} Returns the [cache](#cache).
 * @api public
 */

Resolver.prototype.resolveDirs = function(fn) {
  var filter = this.options.filter;

  if (!this.cache.dirs) {
    this.cache.dirs = {};
    var paths = this.npmPaths();
    this.emit('paths', paths);

    for (var i = 0; i < paths.length; i++) {
      var dir = paths[i];

      // npm paths are created, we need to make sure they actually exist
      if (utils.exists(dir)) {
        this.emit('dir', dir);

        this.cache.paths.push(dir);
        this.cache.dirs[dir] = [];

        var files = fs.readdirSync(dir);
        var len = files.length;
        var idx = -1;

        while (++idx < len) {
          var obj = {};
          obj.name = files[idx];
          obj.path = path.resolve(dir, obj.name);
          obj.base = dir;

          // create a vinyl file
          var file = new File(obj);
          this.emit('file', file);

          // run filter functions
          if (typeof filter === 'function') {
            if (filter.call(this, file.name, file) === true) {
              this.emit('ignore', file);
              continue;
            }
          }

          if (typeof fn === 'function') {
            if (fn.call(this, file.name, file) === true) {
              this.emit('ignore', file);
              continue;
            }
          }

          // run matchers
          this.runMatchers(file);

          // cache files and paths
          this.cache.names[file.name] = file;
          this.cache.paths.push(file.path);
          this.cache.files.push(file);
          this.cache.dirs[dir].push(file);
        }
      }
    }
  } else {
    for (var j = 0; j < this.cache.files.length; j++) {
      this.runMatchers(this.cache.files[j]);
    }
  }
  return this.cache;
};

/**
 * Create the array of npm paths to iterate over. This is only done once, as paths are cached after
 * the first call. To force [npm-paths][] to be called again delete or null `resolver.paths`.
 * @return {Array}
 */

Resolver.prototype.npmPaths = function() {
  return this.paths || (this.paths = utils.npmPaths());
};

/**
 * Run all provided matchers, both named and un-named functions.
 *
 * @param {Object} file
 * @return {undefined}
 */

Resolver.prototype.runMatchers = function(file) {
  this.runFns(file);
  this.runNamedMatchers(file);
};

/**
 * Run the array of un-named matcher functions over the given [vinyl][] `file` object, and
 * emit `match` for each match.
 *
 * @param {Object} `file` Instance of [vinyl][].
 * @return {undefined}
 */

Resolver.prototype.runFns = function(file) {
  for (var i = 0; i < this.fns.length; i++) {
    var isMatch = this.fns[i];
    if (isMatch(file.name, file)) {
      if (!this.cache.matches.hasOwnProperty(file.path)) {
        this.emit('match', file);
        this.cache.matches[file.path] = true;
        this.matches.push(file);
      }
    }
  }
};

/**
 * Run named matcher functions over the given [vinyl][] `file` object. Emits two events:
 * `match` and the `name` of the matcher for each match.
 *
 * @param {Object} `file` Instance of [vinyl][].
 * @return {undefined}
 */

Resolver.prototype.runNamedMatchers = function(file) {
  for (var key in this.matchers) {
    if (this.matchers.hasOwnProperty(key)) {
      var fns = this.matchers[key];
      var len = fns.length;
      var idx = -1;

      while (++idx < len) {
        var isMatch = fns[idx];
        if (isMatch(file.name, file)) {
          if (!this.cache.matches.hasOwnProperty(file.path)) {
            this.emit('match', file);
            this.emit(key, file);
            this.cache.matches[file.path] = true;
            this.matches.push(file);
          }
        }
      }
    }
  }
};

/**
 * Expose `Resolver`
 */

module.exports = Resolver;
