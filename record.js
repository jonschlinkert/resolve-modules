'use strict';

var fs = require('fs');
var path = require('path');
var replaceExt = require('replace-ext');
var define = require('define-property');
var extend = require('extend-shallow');
var resolve = require('resolve');
var utils = require('./lib/utils');

function Record(env, options) {
  options = options || {};
  if (typeof env === 'string') {
    env = { path: env };
  }
  if (typeof env === 'undefined') {
    env = {};
  }

  this.isRecord = true;

  this.options = extend({}, env.options, options);

  // track changes to `path`
  this.history = (env.path ? [env.path] : env.history) || [];
  this.cwd = env.cwd || process.cwd();
  this.base = env.base;

  if (env.app) this._app = env.app;
  if (env.name) this.name = env.name;
  if (env.aliasFn) this.aliasFn = env.aliasFn;
  if (env.alias) this.alias = env.alias;
  if (env.fn) this.fn = env.fn;

  // this.inspect = function() {
  //   var inspect = [];

  //   // Use relative path if possible
  //   var envpath = (this.base && this.path) ? this.relative : this.path;

  //   if (envpath) {
  //     inspect.push('"' + envpath + '"');
  //   }
  //   return '<Record ' + inspect.join(' ') + '>';
  // };

  this.define('stats', {
    enumerable: true,
    set: function(val) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.stats.');
      }
      this._stats = val;
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.stats.');
      }
      return this._stats || (this._stats = fs.lstatSync(this.path));
    },
  });

  this.define('base', {
    enumerable: true,
    set: function(val) {
      this._base = path.resolve(val || this.cwd);
    },
    get: function() {
      return this._base || (this._base = path.resolve(this._base || this.cwd));
    },
  });

  this.define('relative', {
    enumerable: true,
    set: function() {
      throw new Error('env.relative is a getter created from env.base and env.path and cannot be set.');
    },
    get: function() {
      if (!this.base) {
        throw this.pathError('base', 'Cannot set env.relative.');
      }
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.relative.');
      }
      return path.relative(this.base, this.path);
    },
  });

  this.define('dirname', {
    enumerable: true,
    set: function(dirname) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.dirname.');
      }
      this.path = path.join(dirname, path.basename(this.path));
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.dirname.');
      }
      return path.dirname(this.path);
    },
  });

  this.define('basename', {
    enumerable: true,
    set: function(basename) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.basename.');
      }
      this.path = path.resolve(path.dirname(this.path), basename);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.basename.');
      }
      return path.basename(path.dirname(this.path));
    },
  });

  this.define('stem', {
    enumerable: true,
    set: function(stem) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.stem.');
      }
      this.path = path.join(path.dirname(this.path), stem + this.extname);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.stem.');
      }
      return path.basename(this.path, this.extname);
    },
  });

  this.define('filename', {
    enumerable: true,
    set: function(stem) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.filename.');
      }
      this.stem = stem;
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.filename.');
      }
      return this.stem;
    },
  });

  this.define('extname', {
    enumerable: true,
    set: function(extname) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.extname.');
      }
      this.path = replaceExt(this.path, extname);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.extname.');
      }
      return path.extname(this.path);
    },
  });

  this.define('path', {
    enumerable: true,
    set: function(fp) {
      if (typeof fp !== 'string') {
        throw this.pathError('path');
      }
      // track history when path changes
      if (fp && fp !== this.path) {
        this.history.push(resolve.sync(path.resolve(fp)));
      }
    },
    get: function() {
      return resolve.sync(path.resolve(this.history[this.history.length - 1]));
    }
  });

  this.define('pkgPath', {
    enumerable: true,
    set: function(fp) {
      throw new Error('env.pkgPath is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.pkgPath.');
      }
      return path.resolve(this.path, 'package.json');
    },
  });

  this.define('pkg', {
    enumerable: true,
    set: function(fp) {
      throw new Error('env.pkg is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.pkg.');
      }
      if (utils.exists(this.pkgPath)) {
        return this._pkg || (this._pkg = require(this.pkgPath));
      }
      return {};
    },
  });

  this.define('alias', {
    enumerable: true,
    set: function(alias) {
      this._alias = alias;
    },
    get: function() {
      if (this._alias) return this._alias;
      if (typeof this.aliasFn !== 'function') {
        throw new Error('expected env.aliasFn to be a function. cannot set env.alias');
      }
      return (this._alias = this.aliasFn(this.name));
    },
  });

  this.define('name', {
    enumerable: true,
    set: function(name) {
      this._name = name;
    },
    get: function() {
      if (this._name) return this._name;
      if (this.dirname === process.cwd()) {
        return 'default';
      }
      return this.pkg && this.pkg.name || path.basename(this.dirname);
    },
  });

  this.define('main', {
    enumerable: true,
    set: function(fp) {
      throw new Error('env.main is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.main.');
      }
      return this._main || (this._main = resolve.sync(this.path));
    },
  });

  this.define('fn', {
    enumerable: true,
    set: function(fn) {
      this._fn = fn;
    },
    get: function() {
      if (this._fn) return this._fn;
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.fn.');
      }
      return this._fn || (this._fn = require(this.main));
    },
  });
}

Record.prototype.define = function(prop, val) {
  define(this, '_' + prop, null);
  define(this, prop, val);
};

Record.prototype.isMatch = function(str) {
  return this.name === str || this.alias === str || this.path === str;
};

Record.prototype.app = function(context) {
  if (typeof fn !== 'function' && typeof this._app === 'undefined') {
    throw new Error('expected env.fn to be a function. cannot create an instance');
  }
  return this._app || (this._app = fn.call(context, context, context.base));
};

Record.prototype.pathError = function(prop) {
  return new Error('expected env.' + prop + ' to be a string.' + (msg || ''));
};

Record.prototype.isDirectory = function() {
  return this.stats && this.stats.isDirectory();
};


module.exports = Record;


// var env = new Record('./fixtures2/fn.js');
// env.aliasFn = function(name) {
//   return name.replace(/\d$/, '');
// };
// console.log('path:', env.path);
// console.log('dirname:', env.dirname);
// console.log('basename:', env.basename);
// console.log('base:', env.base);
// console.log('cwd:', env.cwd);
// // console.log('fn:', env.fn);
// console.log('main:', env.main);
// console.log('pkg:', env.pkg);
// // console.log(env.isMatch('fixtures'));
