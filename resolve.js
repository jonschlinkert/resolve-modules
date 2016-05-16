'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var exists = require('fs-exists-sync');
var npmPaths = require('npm-paths');
var glob = require('matched');
var mm = require('micromatch');
var File = require('vinyl');
var blacklist = require('./blacklist');
var Env = require('./env');

/**
 * - `configs`: object of `Config` objects
 * - `paths`: array of absolute paths, dirs and files mixed
 * - `files`: array of vinyl files
 */

function Paths(options) {
  this.options = options || {};
  define(this, 'cache', {});
  this.cache.files = [];
  this.cache.paths = [];
  this.cache.envs = {};
  this.nameCache = {};
}

Paths.prototype.resolveDirs = function(fn) {
  var filter = this.options.filter;
  var matcher = function() {};
  var self = this;

  if (typeof fn === 'string') {
    matcher = function(file) {
      if (file.name === fn) {
        self.match = file;
        return true;
      }
    };
  }

  if (!this.cache.dirs) {
    this.cache.dirs = {};
    var paths = this.npmPaths();

    for (var i = 0; i < paths.length; i++) {
      var dir = paths[i];

      if (exists(dir)) {
        this.cache.paths.push(dir);
        this.cache.dirs[dir] = [];

        var files = fs.readdirSync(dir);
        var len = files.length;
        var idx = -1;

        while (++idx < len) {
          var file = {}
          file.name = files[idx];
          file.path = path.resolve(dir, file.name);
          file.base = dir;

          var env = new Env(file);
          if (matcher(env) === true) {
            break;
          }

          if (typeof filter === 'function') {
            if (filter.call(this, file, env) === false) {
              continue;
            }
          }

          if (typeof fn === 'function') {
            if (fn.call(this, file, env) === false) {
              continue;
            }
          }

          this.nameCache[file.name] = env;
          this.cache.envs[file.name] = env;
          this.cache.paths.push(file.path);
          this.cache.files.push(env);
          this.cache.dirs[dir].push(env);
        }
      }
    }
  }
  return this.cache;
};

Paths.prototype.npmPaths = function() {
  return this.paths || (this.paths = npmPaths());
};

Paths.prototype.findModule = function(name) {
  if (this.nameCache.hasOwnProperty(name)) {
    return this.nameCache[name];
  }

  this.resolveDirs(name);
  if (this.match) {
    return this.match;
  }

  var paths = this.npmPaths();
  for (var i = 0; i < paths.length; i++) {
    var fp = path.resolve(paths[i], name);
    if (exists(fp)) {
      this.nameCache[name] = fp;
      return fp;
    }
  }
};

/**
 * Expose `Paths`
 */

module.exports = Paths;
