'use strict';

var fs = require('fs');
var path = require('path');
var npmPaths = require('npm-paths');
var Emitter = require('component-emitter');
var define = require('define-property');
var ConfigFile = require('./lib/configfile');
var utils = require('./lib/utils');
var defaultExts = ['.js', '.json', '.yml'];

function Config(options) {
  Emitter.call(this);
  this.options = options || {};
  this.cache = {configs: [], configPaths: []};
  this.configs = {};
  this.cwd = path.resolve(this.options.cwd || '.');
  this.validate();
}

/**
 * Inherit `Emitter`
 */

Emitter(Config.prototype);

/**
 * Throw if required properties are missing upon instantiation.
 */

Config.prototype.validate = function() {
  this.assert('moduleName');
  // this.assert('configName');
};

/**
 * Convenience method for asserting required properties
 */

Config.prototype.assert = function(prop) {
  if (typeof this.options[prop] === 'undefined') {
    throw new Error('expected options.' + prop + ' to be a string');
  }
};

/**
 * Creates an options object that is a combination of the given `options`
 * and globally defined options, whilst also ensuring that `realpath`
 * and `cwd` are defined so that glob results are what we expect.
 *
 * @param {Object} `options`
 * @return {Object}
 */

Config.prototype.normalizeOptions = function(options) {
  var opts = utils.extend({realpath: true, cwd: ''}, this.options);
  opts.cwd = utils.resolveDir(opts.cwd);
  return opts;
};

/**
 * Iterate over `config.paths` and create a new `Config` for each
 * resolved path that matches `config.modulePattern`.
 *
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

Config.prototype.resolve = function(options) {
  var opts = this.normalizeOptions(options);
  var pattern = this.searchPattern;
  var self = this;
  var res = [];

  for (var i = 0; i < this.paths.length; i++) {
    var cwd = this.paths[i];
    var opt = utils.extend({}, opts, {cwd: cwd});
    var files = utils.glob.sync(pattern, opt);
    if (files.length) {
      files.forEach(function(fp) {
        var config = new ConfigFile({config: self, options: opts, path: fp});
        self.cache.configs.push(config);
        self.configs[config.alias] = config;
        if (self.cache.configPaths.indexOf(fp) === -1) {
          self.cache.configPaths.push(fp);
        }
        res.push(fp);
      });
    }
  }
  return res;
};

/**
 * Get `cwd` (current working directory)
 */

Object.defineProperty(Config.prototype, 'cwd', {
  set: function(cwd) {
    this.cache.cwd = cwd;
  },
  get: function() {
    return (this.cache.cwd || (this.cache.cwd = this.dirname));
  }
});

/**
 * Get `basename`
 */

Object.defineProperty(Config.prototype, 'basename', {
  set: function(basename) {
    this.cache.basename = basename;
  },
  get: function() {
    return this.cache.basename || (this.cache.basename = path.basename(this.cwd));
  }
});

/**
 * Get `paths`
 */

Object.defineProperty(Config.prototype, 'paths', {
  set: function(paths) {
    this.cache.paths = paths;
  },
  get: function() {
    if (this.cache.hasOwnProperty('paths')) {
      return this.cache.paths;
    }
    var paths = this.options.paths || [];
    if (paths.indexOf(this.cwd) === -1) {
      paths.push(this.cwd);
    }

    if (this.options.npmPaths !== false) {
      var opts = utils.extend({fast: true}, this.options);
      paths = paths.concat(npmPaths(opts));
    }
    return (this.cache.paths = utils.unique(paths));
  }
});

/**
 * Get `name`
 */

Object.defineProperty(Config.prototype, 'projectName', {
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

Object.defineProperty(Config.prototype, 'alias', {
  set: function(alias) {
    this.cache.alias = alias;
  },
  get: function() {
    var alias = this.cache.alias || utils.aliasFn(this.projectName, this.options);
    return (this.cache.alias = alias);
  }
});

/**
 * Create regex for matching file names and extensions.
 */

Object.defineProperty(Config.prototype, 'regex', {
  set: function(regex) {
    this.cache.regex = regex;
  },
  get: function() {
    if (this.cache.hasOwnProperty('regex')) {
      return this.cache.regex;
    }
    var regex = utils.createNameRegex(this.configNames, this.extensions);
    return (this.cache.regex = regex);
  }
});

/**
 * Create search pattern for matching config files using `configNames`,
 * `configFiles`, `extensions`, `suffixes`, and `prefixes`
 *
 * @param {Options} options
 * @return {String}
 */

Object.defineProperty(Config.prototype, 'configPattern', {
  set: function(configPattern) {
    this.cache.configPattern = configPattern;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configPattern')) {
      return this.cache.configPattern;
    }

    if (this.options.configPattern) {
      return (this.cache.configPattern = this.options.configPattern);
    }

    var configPattern = this.configFiles.length > 1
      ? '{' + this.configFiles.join(',') + '}'
      : this.configFiles[0];

    return(this.cache.configPattern = configPattern);
  }
});

/**
 * Create `modulePattern` to use for lookups
 */

Object.defineProperty(Config.prototype, 'modulePattern', {
  set: function(modulePattern) {
    this.cache.modulePattern = modulePattern;
  },
  get: function() {
    if (this.cache.hasOwnProperty('modulePattern')) {
      return this.cache.modulePattern;
    }
    var modulePattern = this.options.modulePattern || '*';
    return (this.cache.modulePattern = modulePattern);
  }
});

/**
 * Create `searchPattern` to use for lookups
 */

Object.defineProperty(Config.prototype, 'searchPattern', {
  set: function(searchPattern) {
    this.cache.searchPattern = searchPattern;
  },
  get: function() {
    if (this.cache.hasOwnProperty('searchPattern')) {
      return this.cache.searchPattern;
    }
    var pattern = path.join(this.modulePattern, this.configPattern);
    return (this.cache.searchPattern = pattern);
  }
});

/**
 * Get `extensions`
 */

Object.defineProperty(Config.prototype, 'extensions', {
  set: function(extensions) {
    this.cache.extensions = extensions;
  },
  get: function() {
    if (this.cache.hasOwnProperty('extensions')) {
      return this.cache.extensions;
    }
    var exts = this.cache.extensions || this.options.extensions || defaultExts;
    return (this.cache.extensions = exts.map(utils.stripDot));
  }
});

/**
 * Get `prefixes`
 */

Object.defineProperty(Config.prototype, 'prefixes', {
  set: function(prefixes) {
    this.cache.prefixes = prefixes;
  },
  get: function() {
    if (this.cache.hasOwnProperty('prefixes')) {
      return this.cache.prefixes;
    }
    var prefixes = utils.arrayify(this.options.prefixes || this.options.prefix || []);
    return (this.cache.prefixes = prefixes);
  }
});

/**
 * Get `suffixes`
 */

Object.defineProperty(Config.prototype, 'suffixes', {
  set: function(suffixes) {
    this.cache.suffixes = suffixes;
  },
  get: function() {
    if (this.cache.hasOwnProperty('suffixes')) {
      return this.cache.suffixes;
    }
    var suffixes = utils.arrayify(this.options.suffixes || this.options.suffix || []);
    return (this.cache.suffixes = suffixes);
  }
});

/**
 * Get `configName`
 */

Object.defineProperty(Config.prototype, 'configName', {
  set: function(configName) {
    this.cache.configName = configName;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configName')) {
      return this.cache.configName;
    }
    var name = this.options.configName;
    if (!name && this.configFile) {
      var extname = path.extname(this.configFile);
      var ext = utils.stripDot(extname);
      if (this.extensions.indexOf(ext) === -1) {
        this.extensions.push(ext);
      }
      name = path.basename(this.configFile, extname);
    }
    return (this.cache.configName = name);
  }
});

/**
 * Get `configFile`
 */

Object.defineProperty(Config.prototype, 'configFile', {
  set: function(configFile) {
    this.cache.configFile = configFile;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configFile')) {
      return this.cache.configFile;
    }
    return (this.cache.configFile = this.options.configFile);
  }
});

/**
 * Get `configNames`
 */

Object.defineProperty(Config.prototype, 'configNames', {
  set: function(configNames) {
    this.cache.configNames = configNames;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configNames')) {
      return this.cache.configNames;
    }
    var names = this.cache.configNames || this.options.configNames || [];
    if (this.configName && names.indexOf(this.configName) === -1) {
      names.push(this.configName);
    }
    if (this.suffixes.length) {
      names = utils.append(names, this.suffixes);
    }
    if (this.prefixes.length) {
      names = utils.prepend(names, this.prefixes);
    }
    return (this.cache.configNames = names);
  }
});

/**
 * Get `configFiles`
 */

Object.defineProperty(Config.prototype, 'configFiles', {
  set: function(configFiles) {
    this.cache.configFiles = configFiles;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configFiles')) {
      return this.cache.configFiles;
    }
    var names = utils.createNames(this.configNames, this.extensions);
    return (this.cache.configFiles = names);
  }
});

/**
 * Get `configPaths`
 */

Object.defineProperty(Config.prototype, 'configPaths', {
  set: function(configPaths) {
    this.cache.configPaths = configPaths;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configPaths')) {
      return this.cache.configPaths;
    }
    return (this.cache.configPaths = this.resolve());
  }
});

/**
 * Get `moduleName` to use for lookups
 */

Object.defineProperty(Config.prototype, 'moduleName', {
  set: function(moduleName) {
    this.cache.moduleName = moduleName;
  },
  get: function() {
    return this.cache.moduleName || (this.cache.moduleName = this.options.moduleName);
  }
});

/**
 * Get `modulePath` to use for lookups
 */

Object.defineProperty(Config.prototype, 'modulePath', {
  set: function(modulePath) {
    this.cache.modulePath = modulePath;
  },
  get: function() {
    if (!this.moduleName) return null;
    if (this.cache.hasOwnProperty('modulePath')) {
      return this.cache.modulePath;
    }
    var fp = utils.resolveModule(this.cwd, this.moduleName, this.options);
    return (this.cache.modulePath = fp);
  }
});

/**
 * Expose `Config`
 */

module.exports = Config;
