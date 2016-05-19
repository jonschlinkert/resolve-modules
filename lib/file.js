'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var MapCache = require('map-cache');

/**
 * TODO: Use `vinyl` directly and use utils to add `file.stat` and `file.name`.
 *
 * This is temporary, based on `vinyl` and modified for our use case.
 * Namely `file.stat` and `file.name` handling, and cloning related
 * libs are removed since we won't ever have a need for those. The
 * goal is speed here.
 */

function File(file) {
  if (!file) file = {};
  this.isFile = true;

  if (file.name) {
    this.name = file.name;
  }
  // Track path changes
  var history = file.path ? [path.resolve(file.path)] : file.history;
  this.history = history || [];

  this.base = file.base ? path.resolve(file.base) : process.cwd();
  this.cwd = file.cwd ? path.resolve(file.cwd) : process.cwd();
  define(this, 'cache', new MapCache());
}

File.prototype.isDirectory = function() {
  return this.stat && this.stat.isDirectory();
};

File.prototype.isFile = function() {
  return !this.isDirectory();
};

File.prototype.pathError = function(expected, prop, method) {
  return new Error(`Expected 'file.${expected}' to be defined, cannot ${method} 'file.${prop}'`);
};

File.prototype.inspect = function() {
  return '<File "' + this.name + '" ' + this.relative + '>';
};

File.isFile = function(file) {
  return file && file.isFile === true;
};

define(File.prototype, 'stat', {
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
  }
});

define(File.prototype, 'main', {
  set: function(val) {
    this.cache.set('main', val);
  },
  get: function() {
    var main = this.cache.get('main');
    if (main) {
      return main;
    }
    return this.path;
  }
});

define(File.prototype, 'relative', {
  set: function() {
    throw new Error('File#relative is a getter and cannot be defined.');
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'relative', 'set');
    }
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'relative', 'get');
    }
    return path.relative(this.base, this.path);
  }
});

define(File.prototype, 'dirname', {
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

define(File.prototype, 'basename', {
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

define(File.prototype, 'filename', {
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

define(File.prototype, 'extname', {
  set: function(extname) {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'extname', 'set');
    }
    if (extname.charAt(0) !== '.') {
      extname = '.' + extname;
    }
    this.basename = this.stem + extname;
  },
  get: function() {
    if (typeof this.path !== 'string') {
      throw this.pathError('path', 'extname', 'get');
    }
    return path.extname(this.path);
  }
});

define(File.prototype, 'path', {
  set: function(val) {
    if (!isString(val)) {
      throw new Error('Expected `file.path` to be a string.');
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
 * Expose `File`
 */

module.exports = File;
