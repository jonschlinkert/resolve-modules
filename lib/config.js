'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var utils = require('./utils');

function Config(file) {
  file = file || {};
  define(this, 'orig', file.config || file);
  this.options = file.options || {};
  this.cache = {};
  this.path = file.path;


  if (!this.orig.configFile && !this.orig.configName) {
    throw new Error('configName or configFile must be defined');
  }
}

/**
 * Get `prop` from `cache`, `options`, or the original `file` object
 * that was passed to the constructor.
 */

Config.prototype.get = function(prop) {
  return this.orig[prop] || this.cache[prop] || this.options[prop];
};

/**
 * Custom inspect method
 */

Config.prototype.inspect = function() {
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
  define(Config.prototype, key, val);
}

/**
 * Get the `path`.
 */

mixin('path', {
  set: function(fp) {
    this.cache.path = fp;
  },
  get: function() {
    if (this.cache.path) {
      return this.cache.path;
    }
    var fp = this.get('path') || process.cwd();
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
    if (this.cache.main) {
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
    if (this.cache.dirname) {
      return this.cache.dirname;
    }
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
    return this.cache.cwd || (this.cache.cwd = this.dirname);
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
    if (this.cache.pkg) {
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
    if (this.cache.name) {
      return this.cache.name;
    }
    var opts = utils.extend({}, this.options);
    var name = this.get('name') || utils.project(this.cwd);
    return (this.cache.name = utils.nameFn(name, opts));
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
    if (this.cache.alias) {
      return this.cache.alias;
    }
    var alias = utils.aliasFn(this.name, this.options);
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
  get: function fn() {
    if (this.cache.configName) {
      return this.cache.configName;
    }
    var configName = this.get('configName');
    if (!configName) {
      var configFile = this.get('configFile');
      configName = path.basename(configFile, path.extname(configFile))
    }
    return (this.cache.configName = configName);
  }
});

/**
 * Get `configFile`
 */

mixin('configFile', {
  set: function(configFile) {
    this.cache.configFile = configFile;
  },
  get: function() {
    if (this.cache.configFile) {
      return this.cache.configFile;
    }
    var configFile = this.get('configFile');
    if (!configFile && this.configName) {
      configFile = this.configName;
    }
    return this.cache.configFile || (this.cache.configFile = configFile);
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
    if (this.cache.moduleName) {
      return this.cache.moduleName;
    }
    var name = this.get('moduleName') || '';
    return (this.cache.moduleName = name);
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
    if (this.cache.modulePath) {
      return this.cache.modulePath;
    }
    if (this.options.resolveModule === false) {
      return false;
    }

    var modulePath = this.get('modulePath');
    if (modulePath) {
      return (this.cache.modulePath = modulePath);
    }

    if (!this.moduleName) {
      return (this.cache.modulePath = '');
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

    var mod = this.get('module');
    if (mod) {
      return (this.cache.module = mod);
    }

    if (this.options.require === true && this.modulePath) {
      var mod = utils.tryRequire(this.modulePath);

      if (!mod && this.options.strictRequire) {
        throw new Error('expected '
          + this.moduleName + ' to be installed locally for '
          + this.name);
      }
      if (!mod) {
        mod = this.options.module;
      }
      return (this.cache.module = mod);
    }

    return (this.cache.modules = null);
  }
});

/**
 * Expose `Config`
 */

module.exports = Config;
