'use strict';

var fs = require('fs');
var path = require('path');
var File = require('./lib/file');
var utils = require('./lib/utils');
var Emitter = require('component-emitter');
var cache = {dirs: {}, files: [], paths: null};

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
  utils.define(this, '_callbacks', {});
  utils.define(this, 'fns', []);
  this.cwd = this.options.cwd || process.cwd();
  this.initCache();
}

/**
 * Mix in Emitter methods
 */

Object.setPrototypeOf(Resolver.prototype, Emitter.prototype);

/**
 * Clear the cache
 */

Resolver.prototype.initCache = function() {
  if (typeof this.options.paths !== 'undefined') {
    this.paths = this.options.paths;
  }

  this.filters = [];
  this.matchers = {};
  this.cache = this.options.cache || {};
  this.cache.dirs = null;
  this.cache.files = [];
  this.cache.paths = [];
  this.cache.names = {};
  this.cache.ignored = {};
  this.cache.matches = {};
  this.matches = [];

  var ignored = utils.arrayify(this.options.ignore || utils.ignore);
  if (ignored.length) {
    var fn = utils.ignoreMatcher(ignored, this.options);
    this.filters.push(function(name, file) {
      return fn(name) || fn(file.path);
    });
  }
};

/**
 * Clear the cache
 */

Resolver.prototype.clearCache = function() {
  cache = {dirs: {}, files: [], paths: null};
  this.initCache();
};

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

Resolver.prototype.resolve = function(fn, options) {
  if (utils.isObject(fn)) {
    options = fn;
    fn = null;
  }
  if (fn) this.match.apply(this, arguments);
  // pass options only, not filter function
  this.resolveDirs(options);
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
 * Define a matcher to use for matching files when the `resolve` method is called.
 * If a string or array of strings is passed, strict equality is used for comparisons
 * with `file.name`.
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
 * Define a filter function, glob, string or regex to use for excluding files before
 * matchers are run.
 *
 * ```js
 * resolver.filter('*.foo');
 * ```
 * @param {String|RegExp|Function} `val`
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

Resolver.prototype.filter = function(val, options) {
  this.filters.push(this.matcher(val, options));
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
    if (utils.isGlob(val)) {
      this.options.recurse = true;
    }
    val = utils.mm.makeRe(val, options);
  }
  if (utils.typeOf(val) === 'regexp') {
    return function(name, file) {
      return val.test(name) || val.test(file.relative);
    };
  }
  if (utils.typeOf(val) !== 'function') {
    return function noop() {};
  }
  return val;
};

/**
 * Resolve sub-directories from npm-paths. This method probably doesn't need to
 * be used directly, but it's exposed in case you want to customize behavior. Also note that
 * `options.recurse` must be defined as `true` to recurse into child directories. Alternative,
 * if **any** matcher is a glob pattern with a globstar (double star: `**`), `options.recurse`
 * will automatically be set to `true`.
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

Resolver.prototype.resolveDirs = function(fn, options) {
  if (!this.cache.dirs) {
    this.cache.dirs = {};

    var paths = this.paths || this.npmPaths();
    this.emit('paths', paths);

    for (var i = 0; i < paths.length; i++) {
      this.readdir(path.resolve(paths[i]), fn, options);
    }
  } else {
    var files = this.cache.files;
    for (var j = 0; j < files.length; j++) {
      this.runMatchers(files[j]);
    }
  }
  return this.cache;
};

/**
 * Create a new vinyl file at the given `cwd`
 */

Resolver.prototype.readdir = function(dir, fn, options) {
  if (typeof fn !== 'function') {
    options = fn;
    fn = null;
  }

  var opts = utils.extend({}, this.options, options);

  // since the npm paths array is created dynamically, we need to make sure they actually exist
  if (utils.exists(dir)) {
    var stat = fs.lstatSync(dir);
    var file;

    if (!stat.isDirectory()) {
      file = this.toFile(path.dirname(dir), path.dirname(dir));
      file.stat = stat;
      this.cacheFile(dir, file, fn);
      return;
    }

    this.cache.paths.push(dir);
    this.cache.dirs[dir] = [];

    var files = cache.files[dir] || (cache.files[dir] = fs.readdirSync(dir));
    var len = files.length;
    var idx = -1;

    this.emit('dir', dir, files);

    while (++idx < len) {
      file = this.toFile(dir, files[idx]);
      file.stat = fs.lstatSync(file.path);

      var cached = this.cacheFile(dir, file, fn);
      if (cached === false) {
        continue;
      }

      this.cache.dirs[dir].push(file);
      if (opts.recurse === true && file.stat.isDirectory()) {
        this.readdir(file.path, fn, options);
      }
    }
  }
};

/**
 * Create a new vinyl file at the given `cwd`
 */

Resolver.prototype.toFile = function(cwd, name) {
  var obj = {};

  obj.name = name;
  obj.path = path.resolve(cwd, name);
  obj.base = this.cwd;

  // create a vinyl file
  var file = new File(obj);
  this.emit('file', name, file);
  return file;
};

/**
 * Create a new vinyl file at the given `cwd`
 */

Resolver.prototype.cacheFile = function(dir, file, fn) {
  var filter = this.options.filter;

  if (this.runFilters(file) === true) {
    return false;
  }

  // run filter functions
  if (typeof filter === 'function') {
    if (filter.call(this, file.name, file) === true) {
      this.emit('ignore', file);
      return false;
    }
  }
  if (typeof fn === 'function') {
    if (fn.call(this, file.name, file) === true) {
      this.emit('ignore', file);
      return false;
    }
  }

  // run matchers
  this.runMatchers(file);
  // cache files and paths
  this.cache.names[file.name] = file;
  this.cache.paths.push(file.path);
  this.cache.files.push(file);
  return file;
};

/**
 * Create the array of npm paths to iterate over. This is only done once, as paths are cached after
 * the first call. To force [npm-paths][] to be called again delete or null `resolver.paths`.
 * @return {Array}
 */

Resolver.prototype.npmPaths = function() {
  return cache.paths || this.paths || (cache.paths = this.paths = utils.npmPaths());
};

/**
 * Run the array of un-named matcher functions over the given [vinyl][] `file` object, and
 * emit `match` for each match.
 *
 * @param {Object} `file` Instance of [vinyl][].
 * @return {undefined}
 */

Resolver.prototype.runFilters = function(file) {
  if (this.cache.ignored.hasOwnProperty(file.path)) {
    return true;
  }
  for (var i = 0; i < this.filters.length; i++) {
    var filter = this.filters[i];
    if (filter(file.name, file)) {
      this.cache.ignored[file.path] = true;
      this.emit('ignore', file);
      return true;
    }
  }
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
        this.cache.matches[file.path] = true;
        this.matches.push(file);
        this.emit('match', file);
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
            this.cache.matches[file.path] = true;
            this.matches.push(file);
            this.emit('match', file);
            this.emit(key, file);
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
