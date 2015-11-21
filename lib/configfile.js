'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var utils = require('./utils');

function ConfigFile(file) {
  file = file || {};
  define(this, '_config', file.config);
  this.options = file.options || {};
  this.cache = {};
  this.basename = file.basename;
  this.path = file.path;
  for (var key in file) {
    var val = file[key];
    if (!(key in this) && key !== 'config') {
      this[key] = file[key];
    }
  }
}

/**
 * Custom inspect method
 */

ConfigFile.prototype.inspect = function() {
  var config = {
    alias: this.alias,
    name: this.name,
    path: this.path,
    main: this.main,
    pkg: this.pkg,
    dirname: this.dirname,

    configName: this.configName,
    configFile: this.configFile,
    configPath: this.configPath,

    moduleName: this.moduleName,
    modulePath: this.modulePath,
    module: this.module
  };

  var name = this.pkg.name;
  var desc = this.pkg.description;
  return config;
};

/**
 * Utility function for adding getter/setter methods to the prototype.
 */

function mixin(key, val) {
  define(ConfigFile.prototype, key, val);
}

/**
 * Get the `path`.
 */

mixin('path', {
  set: function(fp) {
    this.cache.path = fp;
  },
  get: function() {
    var fp = this.cache.path || this.options.path || process.cwd();
    return (this.cache.path = fp);
  }
});

/**
 * Get the npm `main` path.
 */

mixin('main', {
  set: function(fp) {
    this.cache.main = fp;
  },
  get: function() {
    if (this.cache.hasOwnProperty('main')) {
      return this.cache.main;
    }
    return (this.cache.main = utils.tryResolve(this.cwd));
  }
});

/**
 * Get the `cwd` (current working directory).
 */

mixin('dirname', {
  set: function(dirname) {
    this.cache.dirname = dirname;
  },
  get: function() {
    var dirname = this.path;
    if (fs.existsSync(this.path)) {
      if (fs.statSync(this.path).isFile()) {
        dirname = path.dirname(this.path);
      }
    } else {
      dirname = path.dirname(this.path);
    }
    return (this.cache.dirname = dirname);
  }
});

/**
 * Get the `cwd` (current working directory).
 */

mixin('cwd', {
  set: function() {
    throw new Error('cwd is a getter and cannot be defined.');
  },
  get: function() {
    return this.dirname;
  }
});

/**
 * Get the `path`.
 */

mixin('pkg', {
  set: function(pkg) {
    this.cache.pkg = pkg;
  },
  get: function() {
    if (!this.cwd) return {};
    if (this.cache.hasOwnProperty('pkg')) {
      return this.cache.pkg;
    }
    var fp = path.resolve(this.cwd, 'package.json');
    return (this.cache.pkg = fp);
  }
});

/**
 * Get the `basename`.
 */

mixin('basename', {
  set: function(basename) {
    this.cache.basename = basename;
  },
  get: function() {
    return this.cache.basename || (this.cache.basename = path.basename(this.cwd));
  }
});

/**
 * Get `name`
 */

mixin('name', {
  set: function(name) {
    this.cache.name = name;
    this.cache.alias = utils.aliasFn(name, this.options);
  },
  get: function() {
    if (this.cache.hasOwnProperty('name')) {
      return this.cache.name;
    }
    var opts = utils.extend({}, this.options);
    var name = this.cache.name || this.basename || utils.nameFn(this.cwd, opts);
    return (this.cache.name = name);
  }
});

/**
 * Get `alias`
 */

mixin('alias', {
  set: function(alias) {
    this.cache.alias = alias;
  },
  get: function() {
    var alias = this.cache.alias || utils.aliasFn(this.name, this.options);
    return (this.cache.alias = alias);
  }
});

/**
 * Get `configName`
 */

mixin('configName', {
  set: function(configName) {
    this.cache.configName = configName;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configName')) {
      return this.cache.configName;
    }
    var name = this.cache.configName || this.options.configName;
    return (this.cache.configName = name);
  }
});

/**
 * Get `configFiles`
 */

mixin('configFile', {
  set: function(configFile) {
    this.cache.configFile = configFile;
  },
  get: function() {
    return this.cache.configFile || (this.cache.configFile = path.basename(this.path));
  }
});

/**
 * Get the `configPaths`.
 */

mixin('configPath', {
  set: function(configPath) {
    this.cache.configPath = configPath;
  },
  get: function() {
    var fp = path.join(this.dirname, this.configFile);
    return (this.cache.configPath || fp);
  }
});

/**
 * Get the `moduleName` to use for lookups
 */

mixin('moduleName', {
  set: function(moduleName) {
    this.cache.moduleName = moduleName;
  },
  get: function() {
    return this.cache.moduleName || (this.cache.moduleName = this._config.moduleName);
  }
});

/**
 * Get the `modulePath` for the constructor to use.
 */

mixin('modulePath', {
  set: function(modulePath) {
    this.cache.modulePath = modulePath;
  },
  get: function() {
    if (this.cache.hasOwnProperty('modulePath')) {
      return this.cache.modulePath;
    }
    if (this.options.resolveModule === false) {
      return false;
    }
    var fp = utils.resolveModule(this.dirname, this.moduleName, this.options);
    return (this.cache.modulePath = fp);
  }
});

/**
 * Require the actual module from `modulePath`
 */

mixin('module', {
  set: function(module) {
    this.cache.module = module;
  },
  get: function() {
    if (this.options.resolveModule === false) {
      return false;
    }
    if (!this.modulePath && this.options.module) {
      return (this.cache.module = this.options.module);
    }
    if (this.cache.hasOwnProperty('module')) {
      return this.cache.module;
    }
    if (this.options.require === true && this.modulePath) {
      var mod = utils.tryRequire(this.modulePath);
      if (!mod) mod = this.options.module;
      return (this.cache.module = mod);
    }
  }
});

/**
 * Expose `ConfigFile`
 */

module.exports = ConfigFile;
