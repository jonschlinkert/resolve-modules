'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var resolveDir = require('resolve-dir');
var Emitter = require('component-emitter');
var extend = require('extend-shallow');
var resolveUp = require('resolve-up');
var glob = require('matched');
var utils = require('./utils');

/**
 * Expose `Resolver`
 */

module.exports = Resolver;

/**
 * Create an instance of `Resolver` with the given `options`.
 *
 * ```js
 * var resolver = new Resolver();
 * ```
 * @param {Object} `options`
 * @api public
 */

function Resolver(options) {
  Emitter.call(this);
  this.options = options || {};
  this.cache = {};
  this.files = [];
}

Emitter(Resolver.prototype);

/**
 * Resolves locally- and globally-installed npm modules that
 * match the given `patterns` and `options`.
 *
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

Resolver.prototype.resolve = function(cwd, options) {
  var opts = this.config(options);
  var files = fs.readdirSync(cwd);
  var len = files.length, i = -1;

  var names = this.createNames(opts.configfile, opts.extensions);
  var res = [];

  while (++i < len) {
    var basename = files[i];
    var fp = path.resolve(cwd, basename);
    var stat = fs.statSync(fp);

    if (stat.isDirectory()) {
      continue;
    }
    if (names.indexOf(basename) > -1) {
      res.push(new Config(fp, opts, this.cache));
    }
  }
  return res;
};

Resolver.prototype.createNames = function(configfile, extensions) {
  return extensions.reduce(function(acc, ext) {
    return acc.concat(configfile + utils.formatExt(ext));
  }, []);
};

Resolver.prototype.config = function(options) {
  var opts = extend({realpath: true, cwd: ''}, this.options, options);
  opts.cwd = resolveDir(opts.cwd);
  return opts;
};

/**
 * Get the absolute filepath for a module.
 *
 * @param {String} `fp`
 * @return {String}
 */

Resolver.prototype.modulePath = function(fp) {
  var filepath = resolveDir(fp);

  if (filepath.slice(0, 2) === './') {
    filepath = path.resolve(filepath);
  }

  if (path.extname(filepath) === '') {
    filepath += path.sep;
  }

  return require.resolve(filepath);
};


function Config(fp, options, cache) {
  this.path = fp;
  this.cwd = path.dirname(fp);
  this.basename = path.basename(fp);

  this.configfile = options.configfile
    ? path.resolve(this.cwd, options.configfile)
    : null;

  this.config = utils.tryRequire(this.configfile);
  this.moduleName = options.moduleName || null;

  this.modulePath = options.modulePath
    ? path.resolve(this.cwd, options.modulePath)
    : null;

  if (!this.modulePath && this.moduleName) {
    this.modulePath = require.resolve(this.moduleName);
  }

  if (cache[this.modulePath]) {
    this.module = cache[this.modulePath];
  } else if (this.modulePath) {
    this.module = (cache[this.modulePath] = utils.tryRequire(this.modulePath));
  } else {
    this.module = null;
  }
}

