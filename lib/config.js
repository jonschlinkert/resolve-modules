'use strict';

var path = require('path');
var util = require('util');
var utils = require('./utils');
var Paths = require('./paths');

/**
 * Create a new `Config` with the given `options`
 *
 * ```js
 * var paths = new Config(options);
 * ```
 * @param {Object} `options`
 */

function Config(config) {
  config = config || {};
  Paths.call(this, utils.extend({}, config.options));
  this.cache = {};

  for (var key in config) {
    this[key] = config[key];
  }

  if (!this.path) {
    throw new Error('expected `config.path` to be defined');
  }

  this.path = path.resolve(utils.resolveDir(this.path));
  if (!utils.tryStat(this.path)) {
    throw new Error('file ' + this.path + ' does not exist');
  }

  /**
   * Custom inspect method
   */

  utils.define(this, 'contextFn', function() {
    var ctx = {};
    if (this.options.rename) {
      ctx.name = utils.rename(this.root, {});
    } else {
      ctx.name = utils.rename(this.root, this.options);
    }
    if (this.options.aliasFn && (ctx.name || this.cache.name)) {
      ctx.alias = utils.alias(ctx.name, {});
    } else if (ctx.name || this.cache.name) {
      ctx.alias = utils.alias(ctx.name, this.options);
    }
    ctx.filename = this.filename;
    ctx.root = this.root;
    ctx.cwd = this.cwd;
    ctx.path = this.path;
    ctx.pkg = this.pkg;
    ctx.relative = this.relative;
    return ctx;
  }.bind(this));

  /**
   * Get the `fn` (configfile) for the config
   */

  utils.define(this, 'fn', {
    enumerable: true,
    configurable: true,
    set: function(fn) {
      this.set('fn', fn);
    },
    get: function() {
      return utils.tryRequire(this.path);
    }
  });

  /**
   * Get the `filename` for the config
   */

  utils.define(this, 'filename', {
    enumerable: true,
    configurable: true,
    set: function(filename) {
      this.set('filename', filename);
    },
    get: function() {
      var filename = path.basename(this.path);
      return this.set('filename', filename);
    }
  });

  /**
   * Get the `path` for the module
   */

  utils.define(this, 'realpath', {
    enumerable: true,
    configurable: true,
    get: function() {
      if (!this.has('name')) {
        throw new TypeError('expected name to be a string');
      }
      if (this.cache.realpath) {
        return this.cache.realpath;
      }
      return (this.cache.realpath = utils.tryRealpath(this.path));
    }
  });

  /**
   * Get the `cwd` (current working directory).
   */

  utils.define(this, 'cwd', {
    enumerable: true,
    configurable: true,
    set: function(cwd) {
      this.set('cwd', cwd);
    },
    get: function() {
      return this.set('cwd', path.dirname(this.path));
    }
  });

  /**
   * Get the `root` of the project
   */

  utils.define(this, 'root', {
    enumerable: true,
    configurable: true,
    set: function(root) {
      this.set('root', root);
    },
    get: function() {
      if (this.cache.root) {
        return this.cache.root;
      }
      var root = this.resolveRoot(this.dirname);
      return this.set('root', root);
    }
  });

  /**
   * Get the `dirname` for the config
   */

  utils.define(this, 'dirname', {
    enumerable: true,
    configurable: true,
    set: function(dirname) {
      this.set('dirname', dirname);
    },
    get: function() {
      if (this.cache.dirname) {
        return this.cache.dirname;
      }
      var dirname = path.resolve(path.dirname(this.path));
      return this.set('dirname', dirname);
    }
  });

  /**
   * Get the `relative` path of the project
   */

  utils.define(this, 'relative', {
    enumerable: true,
    configurable: true,
    set: function(filepath) {
      this.set('relative', filepath);
    },
    get: function() {
      if (this.cache.relative) {
        return this.cache.relative;
      }
      var fp = utils.relative.toBase(this.root, this.cwd);
      return this.set('relative', fp);
    }
  });

  /**
   * Get the `name` of the module
   */

  utils.define(this, 'name', {
    enumerable: true,
    configurable: true,
    set: function(name) {
      this.set('name', name);
    },
    get: function() {
      if (this.has('name')) {
        return this.get('name');
      }

      var opts = utils.extend({
        contextFn: this.contextFn
      }, this.options);
      var name = utils.rename(this.path, opts);
      return this.set('name', name);
    }
  });

  /**
   * Get the `alias` of the module
   */

  utils.define(this, 'alias', {
    enumerable: true,
    configurable: true,
    set: function(alias) {
      this.set('alias', alias);
    },
    get: function() {
      if (this.has('alias')) {
        return this.get('alias');
      }

      var opts = utils.extend({
        contextFn: this.contextFn
      }, this.options);
      var alias = utils.alias(this.name, opts);
      return this.set('alias', alias);
    }
  });

  /**
   * Get the `package.json` relative to the file.
   */

  utils.define(this, 'pkg', {
    enumerable: true,
    configurable: true,
    set: function(pkg) {
      this.set('pkg', pkg);
    },
    get: function() {
      if (this.cache.pkg) {
        return this.cache.pkg;
      }
      var pkg = path.join(this.root, 'package.json');
      return this.set('pkg', pkg);
    }
  });

  /**
   * Get the `main` filepath from package.json
   */

  utils.define(this, 'main', {
    enumerable: true,
    configurable: true,
    set: function(main) {
      this.set('main', main);
    },
    get: function() {
      if (this.has('main')) {
        return this.get('main');
      }
      var main = utils.tryResolve(this.dirname);
      return this.set('main', main);
    }
  });
}

util.inherits(Config, Paths);

/**
 * Expose `Config`
 */

module.exports = Config;
