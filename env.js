'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var MapCache = require('map-cache');

/**
 * Based on `vinyl`, modified for our use case
 */

function Env(env) {
  if (!env) env = {};
  this.isEnv = true;

  if (env.name) {
    this.name = env.name;
  }
  // Track path changes
  var history = env.path ? [path.resolve(env.path)] : env.history;
  this.history = history || [];

  this.base = env.base ? path.resolve(env.base) : process.cwd();
  this.cwd = env.cwd ? path.resolve(env.cwd) : process.cwd();
  define(this, 'cache', new MapCache());
}

Env.prototype.isDirectory = function() {
  return this.stat && this.stat.isDirectory();
};

Env.prototype.isFile = function() {
  return !this.isDirectory();
};

Env.prototype.pathError = function(expected, prop, method) {
  return new Error(`Expected 'env.${expected}' to be defined, cannot ${method} 'env.${prop}'`);
};

Env.prototype.inspect = function() {
  return '<Env "' + this.name + '" ' + this.path + '>';
};

Env.isEnv = function(env) {
  return env && env.isEnv === true;
};

define(Env.prototype, 'stat', {
  set: function(val) {
    this.cache.set('stat', val);
  },
  get: function() {
    var stat = this.cache.get('stat');
    if (stat) return stat;
    try {
      stat = fs.statSync(this.path);
      if (stat.isDirectory()) {
        var index = path.join(this.path, 'index.js');
        try {
          stat = fs.statSync(index);
          this.main = index;
          this.path = index;
          this.cache.set('path', this.path);
          this.cache.set('main', this.main);
          this.cache.set('stat', stat);
          return stat;
        } catch (err) {}

        try {
          var pkgPath = path.join(this.path, 'package.json');
          this.pkgPath = pkgPath;
          try {
            var pkg = require(fs.readFileSync(pkgPath, 'utf8'));
            stat = fs.statSync(this.main);
            this.pkg = pkg;
            this.main = pkg.main || this.path;
            this.cache.set('path', this.path);
            this.cache.set('main', this.main);
            this.cache.set('stat', stat);
            return stat;
          } catch (err) {}
        } catch (err) {}
      }
      this.cache.set('stat', stat);
      return stat;
    } catch (err) {}
  },
});

define(Env.prototype, 'main', {
  set: function(val) {
    this.cache.set('main', val);
  },
  get: function() {
    var main = this.cache.get('main');
    if (main) {
      return main;
    }
    return this.path;
  },
});

define(Env.prototype, 'relative', {
  set: function() {
    throw new Error('Env#relative is a getter and cannot be defined.');
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'relative', 'set');
    }
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'relative', 'get');
    }
    return path.relative(this.base, this.path);
  },
});

define(Env.prototype, 'dirname', {
  set: function(dirname) {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'dirname', 'set');
    }
    this.path = path.join(dirname, path.basename(this.path));
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'dirname', 'get');
    }
    return path.dirname(this.path);
  }
});

define(Env.prototype, 'basename', {
  set: function(basename) {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'basename', 'set');
    }
    this.path = path.join(path.dirname(this.path), basename);
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'basename', 'get');
    }
    return path.basename(this.path);
  }
});

define(Env.prototype, 'filename', {
  set: function(filename) {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'filename', 'set');
    }
    this.path = path.join(path.dirname(this.path), filename + this.extname);
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'filename', 'get');
    }
    return path.basename(this.path, this.extname);
  }
});

define(Env.prototype, 'extname', {
  set: function(extname) {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'extname', 'set');
    }
    this.path = replaceExt(this.path, extname);
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'extname', 'get');
    }
    return path.extname(this.path);
  }
});

define(Env.prototype, 'path', {
  set: function(val) {
    if (!isString(val)) {
      throw new Error('Expected `env.path` to be a string.');
    }
    val = path.resolve(val);
    if (val !== this.path) {
      this.history.push(val);
    }
  },
  get: function() {
    return this.history[this.history.length - 1];
  }
});

function isString(val) {
  return val && typeof val === 'string';
}

/**
 * Expose `Env`
 */

module.exports = Env;
