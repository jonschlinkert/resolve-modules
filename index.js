'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('resolve-modules');
var MapCache = require('map-cache');
var FragmentCache = require('./lib/fragment');
var define = require('./lib/define');
var utils = require('./lib/utils');

/**
 * Create a new `Resolver` with the given `options`
 *
 * ```js
 * var resolver = new Resolver();
 * ```
 * @param {Object} `options`
 * @api public
 */

function Resolver(options) {
  this.options = options || {};
  this.fragment = this.options.fragment || new FragmentCache();
  this.cache = new MapCache();
  this.files = [];
}

/**
 * Searches the same directories used by npm and creates and array of
 * resolved modules that match the given `pattern`.
 *
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

Resolver.prototype.resolve = function(patterns, options) {
  var opts = utils.extend({}, this.options, options);
  utils.union(this.files, utils.resolveUp(patterns, opts));
  return this;
};

/**
 * Returns a matcher function bound to `files`. The returned function
 * takes a glob pattern and optionally a property from the returned
 * value.
 *
 * @param {Array} `files`
 * @param {Object} `options`
 * @return {String}
 */

Resolver.prototype.match = function(pattern, prop) {
  var opts = utils.extend({}, this.options);
  var cached = this.fragment.get('match', pattern);
  if (cached) {
    return prop ? cached[prop] : cached;
  }

  var isMatch = utils.mm.matcher(pattern, opts);
  var len = this.files.length;
  var idx = -1;

  while (++idx < len) {
    var fp = this.files[idx];
    var file = this.cache.get(fp) || this.createEnv(fp, opts);
    if (!utils.isValid(file, opts)) {
      continue;
    }

    this.cache.set(fp, file);

    if (isMatch(file.name)) {
      this.fragment.set('name', file.name, file);
      this.fragment.set('match', pattern, file);
      return prop ? file[prop] : file;
    }
  }
};

/**
 * Returns a function bound to `files` for getting the
 * given `property`
 *
 * @param {Array} `files`
 * @param {Object} `options`
 * @return {String}
 */

Resolver.prototype.getProp = function(name) {
  var opts = utils.extend({}, this.options);
  var app = this;

  return function(key, prop) {
    var cached = app.fragment.get(name, key);
    if (cached) {
      return prop ? cached[prop] : cached;
    }

    var len = app.files.length;
    var idx = -1;

    while (++idx < len) {
      var fp = app.files[idx];
      var file = app.cache.get(fp) || app.createEnv(fp, opts);
      if (!file) {
        return null;
      }

      app.cache.set(fp, file);

      if (file[name] === key) {
        app.fragment.set(name, file[name], file);
        return prop ? file[prop] : file;
      }
    }
  };
};

Resolver.prototype.get = function(key, prop) {
  return this.path(key, prop) || this.name(key, prop) || this.alias(key, prop);
};

Resolver.prototype.path = function(key, prop) {
  return this.getProp('path', this.options)(key, prop)
    || this.fragment.get('path', key);
};

Resolver.prototype.name = function(key, prop) {
  return this.getProp('name', this.options)(key, prop)
    || this.fragment.get('name', key);
};

Resolver.prototype.alias = function(key, prop) {
  return this.getProp('alias', this.options)(key, prop)
    || this.fragment.get('alias', key);
};


Resolver.prototype.resolvePath = function(key, prop) {
  return this.getProp('alias', this.options)(key, prop)
    || this.fragment.get('alias', key);
};


Resolver.prototype.createLookup = function(name) {
  var opts = utils.extend({}, this.options);

  return function(key, prop) {
    var result = this.getProp(name, opts)(key, prop);
    if (typeof result !== 'undefined') {
      return result;
    }
    return this.fragment.get(name, key);
  }
};

Resolver.prototype.createEnv = function(fp, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  var opts = utils.extend({}, this.options, options);
  var file = new utils.File({path: fp, content: null});
  var stat = file.stat;

  var cwd = path.dirname(file.path);
  var app = this;

  file.pkgPath = path.resolve(cwd, 'package.json');
  var pkg;

  /**
   * file.pkg
   */

  define(file, 'pkg', function() {
    if (pkg) return pkg;

    if (utils.exists(file.pkgPath)) {
      pkg = require(file.pkgPath);
    }

    if (!pkg && file.stat.isDirectory()) {
      file.pkgPath = path.resolve(file.path, 'package.json');
      pkg = require(file.pkgPath);

      if (pkg && pkg.main) {
        var dir = file.path;
        file.path = path.resolve(dir, pkg.main);
      }
    }
    return pkg || {};
  });

  /**
   * file.pkg
   */

  define(file, 'stat', function() {
    return stat || fs.lstatSync(file.path);
  });

  /**
   * file.name
   */

  define(file, 'name', function() {
    // if the dirname is the current working directory,
    // this is our default generator
    var name = file.dirname !== process.cwd()
      ? (pkg ? pkg.name : path.basename(file.dirname))
      : name = 'default';

    app.fragment.set('name', name, file);
    return name;
  });

  /**
   * file.fn
   */

  define(file, 'fn', function() {
    if (typeof fn === 'function') {
      return fn;
    }
    fn = app.fragment.get('fn', file.name);
    if (typeof fn === 'function') {
      return fn;
    }
    fn = require(file.path);
    app.fragment.set('fn', fn);
    return fn;
  });

  /**
   * file.alias
   */

  define(file, 'alias', function() {
    var alias = typeof opts.alias === 'function'
      ? opts.alias.call(file, file.name)
      : utils.aliasFn.call(file, file.name, file);

    if (alias) {
      app.fragment.set('alias', alias, file);
    }
    return alias;
  });

  /**
   * file.main
   */

  define(file, 'main', function() {
    var main = (pkg && pkg.main || file.pkg && file.pkg.main);
    if (typeof main === 'string') {
      return path.resolve(file.dirname, main);
    }
    return file.path;
  });

  /**
   * custom inspect
   */

  file.inspect = function() {
    return '<Generator ' + utils.formatAlias(file) + utils.formatPath(file) + '>';
  };

  // set the file on the fragment cache
  this.fragment.set('path', file.path, file);
  return file;
};

/**
 * Expose `Resolver`
 */

module.exports = Resolver;
