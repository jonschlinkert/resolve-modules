'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('resolve-modules');
var MapCache = require('map-cache');
var findup = require('find-pkg');
var Fragment = require('./lib/fragment');
var define = require('./lib/define');
var utils = require('./lib/utils');
var File = require('vinyl');

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
  this.fragment = this.options.fragment || new Fragment();
  this.cache = this.options.cache || new MapCache();
  this.fileCache = {};
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
  var fn = opts.filter || function() {
    return true;
  };

  opts.filter = function(filepath) {
    console.log(filepath)
    return fn.call(this, filepath);
  }.bind(this);

  utils.resolveUp(patterns, opts);
  return this;
};

Resolver.prototype.lookup = function(name, key, prop) {
  var opts = utils.extend({}, this.options);
  var result = this.getProp(name, opts)(key, prop);
  return result || this.fragment.get(name, key);
};

Resolver.prototype.cacheFile = function(filepath) {
  if (!this.fileCache.hasOwnProperty(filepath)) {
    this.fileCache[filepath] = this.createFile(filepath);
    this.files.push(filepath);
  }
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
    var file = this.cache.get(fp) || this.createFile(fp, opts);

    if (utils.isValid(file, opts)) {
      this.cache.set(fp, file);

      if (isMatch(file.name)) {
        this.fragment.set('path', file.path, file);
        this.fragment.set('name', file.name, file);
        this.fragment.set('match', pattern, file);
        return prop ? file[prop] : file;
      }
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
      var file = app.cache.get(fp) || app.createFile(fp, opts);
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
  return this.alias(key, prop) || this.name(key, prop) || this.path(key, prop);
};

Resolver.prototype.path = function(key, prop) {
  return this.lookup('path', key, prop);
};

Resolver.prototype.name = function(key, prop) {
  return this.lookup('name', key, prop);
};

Resolver.prototype.alias = function(key, prop) {
  return this.lookup('alias', key, prop);
};

Resolver.prototype.createFile = function(filepath, options) {
  var opts = utils.extend({}, this.options, options);
  var file = new File({path: filepath});
  var self = this;

  file.inspect = function() {
    return '<Env ' + this.name + ' <' + this.path + '>>';
  };

  define(file, 'stat', function() {
    var stat = fs.statSync(this.path);
    if (stat.isDirectory()) {
      var pkgPath = findup.sync(this.path);
      console.log(this.path)
    }
  });

  define(file, 'cache', function() {
    return new MapCache();
  });

  define(file, 'cwd', function() {
    return path.dirname(this.pkgPath);
  });

  define(file, 'main', function() {
    return utils.resolve.sync(this.path);
  });

  define(file, 'pkgPath', function() {
    // var pkgPath = file.cache.get('pkgPath');
    return file.cache.get('pkgPath');
    // if (pkgPath) {
    //   return pkgPath;
    // }

    // if (!this.stat.isDirectory()) {
    //   return findup.sync(this.dirname);
    // }
    // return path.join(this.path, 'package.json');
  });

  define(file, 'pkg', function() {
    return require(this.pkgPath);
  });

  define(file, 'name', function() {
    return this.pkg.name;
  });

  define(file, 'alias', function() {
    return (opts.toAlias || utils.toAlias).call(this, this.name, opts);
  });

  console.log(file.stat);
  console.log(file.main);

  this.fragment.set('path', file.path, file);
  return file;
};

/**
 * Expose `Resolver`
 */

module.exports = Resolver;
