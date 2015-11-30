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
  Paths.call(this, config.options);
  this.cache = {};
  for (var key in config) {
    this[key] = config[key];
  }
}

/**
 * Inherit `Paths`
 */

util.inherits(Config, Paths);

/**
 * Custom inspect method
 */

Config.prototype.inspect = function() {
  return {
    name: this.name,
    alias: this.alias,
    filename: this.filename,
    root: this.root,
    cwd: this.cwd,
    path: this.path,
    main: this.main,
    pkg: this.pkg,
    module: this.module
  };
};

Config.prototype.context = function() {
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
  ctx.relative = this.relative;
  return ctx;
};

/**
 * Add getter/setter methods to the prototype.
 */

function mixin(key, val) {
  utils.define(Config.prototype, key, val);
}

/**
 * Get the `filename` for the config
 */

mixin('filename', {
  set: function(filename) {
    this.set('filename', filename);
  },
  get: function() {
    if (this.has('filename')) {
      return this.get('filename');
    }
    var filename = path.basename(this.path);
    return this.set('filename', filename);
  }
});

/**
 * Get the `path` for the config
 */

mixin('path', {
  set: function(fp) {
    this.set('path', fp);
  },
  get: function() {
    if (this.has('path')) {
      return this.get('path');
    }

    if (this.cwd && this.filename) {
      var fp = path.resolve(this.cwd, this.filename);
      return this.set('path', fp);
    }
  }
});

/**
 * Get the `cwd` (current working directory).
 */

mixin('cwd', {
  set: function(cwd) {
    this.set('cwd', cwd);
  },
  get: function() {
    if (this.cache.cwd) {
      return this.cache.cwd;
    }
    var cwd = this.resolveDir(this.options.cwd || process.cwd());
    return this.set('cwd', cwd);
  }
});

/**
 * Get the `root` of the project
 */

mixin('root', {
  set: function(root) {
    this.set('root', root);
  },
  get: function() {
    if (this.cache.root) {
      return this.cache.root;
    }
    var root = this.resolveRoot(this.cwd);
    return this.set('root', root);
  }
});

/**
 * Get the `dirname` for the config
 */

mixin('dirname', {
  set: function(dirname) {
    this.set('dirname', dirname);
  },
  get: function() {
    if (this.has('dirname')) {
      return this.get('dirname');
    }
    var dirname = path.resolve(path.dirname(this.path));
    return this.set('dirname', dirname);
  }
});

/**
 * Get the `relative` path of the project
 */

mixin('relative', {
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

mixin('name', {
  set: function(name) {
    this.set('name', name);
  },
  get: function() {
    if (this.has('name')) {
      return this.get('name');
    }

    var opts = utils.extend({context: this.context()}, this.options);
    var name = utils.rename(this.root, opts);
    return this.set('name', name);
  }
});

/**
 * Get the `alias` of the module
 */

mixin('alias', {
  set: function(alias) {
    this.set('alias', alias);
  },
  get: function() {
    if (this.has('alias')) {
      return this.get('alias');
    }

    var opts = utils.extend({context: this.context()}, this.options);
    var alias = utils.alias(this.name, opts);
    return this.set('alias', alias);
  }
});

/**
 * Get the `package.json` relative to the file.
 */

mixin('pkg', {
  set: function(pkg) {
    this.set('pkg', pkg);
  },
  get: function() {
    if (this.has('pkg')) {
      return this.get('pkg');
    }
    var pkg = path.join(this.dirname, 'package.json');
    return this.set('pkg', pkg);
  }
});

/**
 * Get the `main` filepath from package.json
 */

mixin('main', {
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

/**
 * Expose `Config`
 */

module.exports = Config;
