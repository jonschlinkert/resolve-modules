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

ConfigFile.prototype.inspect = function() {
  var config = {
    path: this.path,
    pkg: this.pkg,
    projectName: this.projectName,
    alias: this.alias,
    dirname: this.dirname,

    configName: this.configName,
    configFile: this.configFile,
    configPath: this.configPath,

    moduleName: this.moduleName,
    modulePath: this.modulePath
  };

  var name = this.pkg.name;
  var desc = this.pkg.description;

  config.pkg.inspect = function() {
    return '<' + name + ': "' + desc + '">';
  };
  return config;
};

function mixin(key, val) {
  define(ConfigFile.prototype, key, val);
}

/**
 * Get the `path` for the instance.
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
 * Get the `cwd` (current working directory) for the instance.
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
 * Get the `cwd` (current working directory) for the instance.
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
 * Get the `path` for the instance.
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
    return (this.cache.pkg = require(path.resolve(this.cwd, 'package.json')));
  }
});

/**
 * Get the `basename` for the instance.
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

mixin('projectName', {
  set: function(projectName) {
    this.cache.projectName = projectName;
    this.cache.alias = utils.aliasFn(projectName, this.options);
  },
  get: function() {
    if (this.cache.hasOwnProperty('projectName')) {
      return this.cache.projectName;
    }
    var opts = utils.extend({}, this.options);
    var name = this.cache.projectName || this.basename || utils.nameFn(this.cwd, opts);
    return (this.cache.projectName = name);
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
    var alias = this.cache.alias || utils.aliasFn(this.projectName, this.options);
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
 * Get the `configPaths` for the instance.
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
 * Get the `modulePath` for the constructor to use for the instance.
 */

mixin('modulePath', {
  set: function(modulePath) {
    this.cache.modulePath = modulePath;
  },
  get: function() {
    if (this.cache.hasOwnProperty('modulePath')) {
      return this.cache.modulePath;
    }
    var fp = utils.resolveModule(this.dirname, this.moduleName, this.options);
    return (this.cache.modulePath = fp);
  }
});

/**
 * Expose `ConfigFile`
 */

module.exports = ConfigFile;
