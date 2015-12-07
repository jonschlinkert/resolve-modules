'use strict';

var path = require('path');
var utils = require('./utils');

/**
 * Create a new `Config` with the given `options`
 *
 * ```js
 * var paths = new Config(options);
 * ```
 * @param {Object} `options`
 */

function Config(filepath, options) {
  if (!filepath || typeof filepath !== 'string') {
    throw new Error('expected `path` to be defined');
  }

  this.path = filepath;
  var opts = (this.options = options || {});

  utils.define(this, 'options', this.options);
  utils.define(this, 'cache', {});
  var cache = this.cache;

  for (var key in opts) {
    this[key] = opts[key];
  }

  this.path = path.resolve(utils.resolveDir(this.path));
  if (!utils.tryStat(this.path)) {
    throw new Error('file ' + this.path + ' does not exist');
  }

  /**
   * Custom inspect method
   */

  if (opts.inspectFn === true) {
    this.inspect = function() {
      return '<' + opts.key + ' "' + this.name + '" <' + this.path + '>>';
    };
  }

  if (typeof opts.inspectFn === 'function') {
    this.inspect = opts.inspectFn;
  }

  /**
   * Utils
   */

  function has(prop) {
    return !!(cache[prop] || opts[prop]);
  }

  function get(prop) {
    return cache[prop] || opts[prop];
  }

  /**
   * Context for custom `rename` and `alias` functions
   */

  utils.define(this, 'contextFn', function() {
    var ctx = {};
    if (opts.rename) {
      ctx.name = utils.rename(this.root, {});
    } else {
      ctx.name = utils.rename(this.root, opts);
    }
    if (opts.aliasFn && (ctx.name || cache.name)) {
      ctx.alias = utils.alias(ctx.name, {});
    } else if (ctx.name || cache.name) {
      ctx.alias = utils.alias(ctx.name, opts);
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
      cache.fn = fn;
    },
    get: function() {
      return utils.tryRequire(this.path);
    }
  });

  /**
   * Get the `path` for the module
   */

  utils.define(this, 'realpath', {
    enumerable: true,
    configurable: true,
    get: function() {
      if (!has('name')) {
        throw new TypeError('expected name to be a string');
      }
      if (cache.realpath) {
        return cache.realpath;
      }
      return (cache.realpath = utils.tryRealpath(this.path));
    }
  });

  /**
   * Get the `cwd` (current working directory).
   */

  utils.define(this, 'cwd', {
    enumerable: true,
    configurable: true,
    set: function(cwd) {
      cache.cwd = cwd;
    },
    get: function() {
      return (cache.cwd = path.dirname(this.path));
    }
  });

  /**
   * Get the `root` of the project
   */

  utils.define(this, 'root', {
    enumerable: true,
    configurable: true,
    set: function(root) {
      cache.root = root;
    },
    get: function() {
      if (cache.root) {
        return cache.root;
      }
      var root = utils.resolveRoot(this.dirname);
      return (cache.root = root);
    }
  });

  /**
   * Get the `dirname` for the config
   */

  utils.define(this, 'dirname', {
    enumerable: true,
    configurable: true,
    set: function(dirname) {
      cache.dirname = dirname;
    },
    get: function() {
      if (cache.dirname) {
        return cache.dirname;
      }
      var dirname = path.resolve(path.dirname(this.path));
      return (cache.dirname = dirname);
    }
  });

  /**
   * Get the `relative` path of the project
   */

  utils.define(this, 'relative', {
    enumerable: true,
    configurable: true,
    set: function(filepath) {
      cache.relative = filepath;
    },
    get: function() {
      if (cache.relative) {
        return cache.relative;
      }
      var fp = utils.relative.toBase(this.root, this.cwd);
      return (cache.relative = fp);
    }
  });

  /**
   * Get the `name` of the module
   */

  utils.define(this, 'name', {
    enumerable: true,
    configurable: true,
    set: function(name) {
      cache.name = name;
    },
    get: function() {
      if (has('name')) {
        return get('name');
      }

      var opts = utils.extend({contextFn: this.contextFn }, opts);
      var name = utils.rename(this.path, opts);
      return (cache.name = name);
    }
  });

  /**
   * Get the `alias` of the module
   */

  utils.define(this, 'alias', {
    enumerable: true,
    configurable: true,
    set: function(alias) {
      cache.alias = alias;
    },
    get: function() {
      if (has('alias')) {
        return get('alias');
      }

      var opts = utils.extend({contextFn: this.contextFn}, opts);
      var alias = utils.alias(this.name, opts);
      return (cache.alias = alias);
    }
  });

  /**
   * Get the path for `package.json` relative to the file.
   */

  utils.define(this, 'pkgPath', {
    enumerable: true,
    configurable: true,
    set: function(pkgPath) {
      cache.pkgPath = pkgPath;
    },
    get: function() {
      if (cache.pkgPath) {
        return cache.pkgPath;
      }
      var pkgPath = path.join(this.root, 'package.json');
      return (cache.pkgPath = pkgPath);
    }
  });

  /**
   * Get the `package.json` relative to the file.
   */

  utils.define(this, 'pkg', {
    enumerable: true,
    configurable: true,
    set: function(pkg) {
      cache.pkg = pkg;
    },
    get: function() {
      if (cache.pkg) {
        return cache.pkg;
      }
      return (cache.pkg = utils.tryRequire(this.pkgPath));
    }
  });
}

/**
 * Expose `Config`
 */

module.exports = Config;
