'use strict';

var fs = require('fs');
var path = require('path');
var Emitter = require('component-emitter');
var Config = require('./lib/config');
var utils = require('./lib/utils');
var defaultExts = ['.js', '.json', '.yml'];

/**
 * Expose `Resolver`
 */

module.exports = Resolver;

/**
 * Create an instance of `Resolver` with the given `options`. This
 * function is the main export of `resolve-modules`.
 *
 * ```js
 * var resolver = new Resolver(options);
 * ```
 * @param {Object} `options`
 * @api public
 */

function Resolver(options) {
  this.options = options || {};
  this.cache = {configPaths: [], configs: []};
  this.configs = {};
  this.validate();
}

/**
 * Inherit Emitter
 */

Emitter(Resolver.prototype);

/**
 * Validate that required properties are defined upon instantiation.
 */

Resolver.prototype.validate = function() {
  this.assert('moduleName');
};

/**
 * Convenience method for asserting required properties
 */

Resolver.prototype.assert = function(prop) {
  if (typeof this.options[prop] === 'undefined') {
    throw new Error('expected options.' + prop + ' to be a string');
  }
};

/**
 * Get property `key` from `cache` or `options`.
 */

Resolver.prototype.get = function(key) {
  return this.cache[key] || this.options[key];
};

/**
 * Creates an options object that is a combination of the given `options`
 * and globally defined options, whilst also ensuring that `realpath`
 * and `cwd` are defined so that glob results are what we expect.
 *
 * @param {Object} `options`
 * @return {Object}
 */

Resolver.prototype.normalizeOptions = function(options) {
  var opts = utils.extend({realpath: true, cwd: ''}, this.options);
  opts.cwd = utils.resolveDir(opts.cwd);
  return opts;
};

/**
 * Searches npm paths and any addition paths that were specified on the
 * options for files that match the `searchPattern`. The `searchPattern`
 * is a glob pattern that may be specified directly on the options, or
 * if not specified, it is created from `modulePattern` and `configPattern`.
 *
 * When a matching file is found, a new `Config` object is create for the
 * filepath, and a `config` event is emitted with the config object.
 *
 * ```js
 * resolver.resolve();
 * ```
 * @param {Object} `options`
 * @param {Function} `callback` Callback function that exposes `err` and `files` as its only parameters. This method is primarily used as an emitter, but you can also get the matched files as an array in the callback.
 * @api public
 */

Resolver.prototype.resolve = function(cb) {
  var opts = this.normalizeOptions();
  var pattern = this.searchPattern;
  var self = this;
  var results = [];
  for (var i = 0; i < this.paths.length; i++) {
    var cwd = this.paths[i];
    var opt = utils.extend({}, opts, {cwd: cwd});
    var files = utils.glob.sync(pattern, opt);
    if (files.length) {
      files.forEach(function(fp) {
        var config = new Config({config: self, options: opts, path: fp});
        self.cache.configs.push(config);
        self.configs[config.alias] = config;
        if (self.cache.configPaths.indexOf(fp) === -1) {
          self.cache.configPaths.push(fp);
          results.push(fp);
          self.emit('config', config);
        }
      });
    }
  }

  self.cache.configPaths.sort();
  if (typeof cb === 'function') {
    cb(null, results);
  }
  return this;;
};

/**
 * Utility function for adding getter/setter methods to the prototype.
 */

function mixin(key, val) {
  utils.define(Resolver.prototype, key, val);
}

/**
 * Get the module `path`
 */

mixin('path', {
  set: function(filepath) {
    this.cache.path = filepath;
  },
  get: function() {
    return (this.cache.path || (this.cache.path = utils.tryResolve(this.cwd)));
  }
});

/**
 * Get `cwd` (current working directory)
 */

mixin('cwd', {
  set: function(cwd) {
    this.cache.cwd = cwd;
  },
  get: function() {
    return this.get('cwd') || (this.cache.cwd = process.cwd());
  }
});

/**
 * Get `basename`
 */

mixin('basename', {
  set: function(basename) {
    this.cache.basename = basename;
  },
  get: function() {
    return this.get('basename') || (this.cache.basename = path.basename(this.cwd));
  }
});

/**
 * Get `dirname`
 */

mixin('dirname', {
  set: function(dirname) {
    this.cache.dirname = dirname;
  },
  get: function() {
    return this.get('dirname') || (this.cache.dirname = path.dirname(this.path));
  }
});

/**
 * Get `paths`
 */

mixin('paths', {
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
      paths = paths.concat(utils.npmPaths(opts));
    }
    return (this.cache.paths = utils.unique(paths));
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
 * Create regex for matching file names and extensions.
 */

mixin('regex', {
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

mixin('configPattern', {
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

mixin('modulePattern', {
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

mixin('searchPattern', {
  set: function(searchPattern) {
    this.cache.searchPattern = searchPattern;
  },
  get: function() {
    if (this.cache.hasOwnProperty('searchPattern')) {
      return this.cache.searchPattern;
    }
    if (this.options.hasOwnProperty('searchPattern')) {
      return (this.cache.searchPattern = this.options.searchPattern);
    }
    var pattern = path.join(this.modulePattern, this.configPattern);
    return (this.cache.searchPattern = pattern);
  }
});

/**
 * Get `extensions`
 */

mixin('extensions', {
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

mixin('prefixes', {
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

mixin('suffixes', {
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
 * Get `methodName`
 */

mixin('methodName', {
  set: function(methodName) {
    this.cache.methodName = methodName;
  },
  get: function() {
    if (this.cache.methodName) {
      return this.cache.methodName;
    }
    var methodName = this.get('methodName') || this.configName;
    return (this.cache.methodName = methodName);
  }
});

/**
 * Get `single` property name. The "single" name is the singularized form
 * of the property that will be used for storing items.
 */

mixin('single', {
  set: function(single) {
    this.cache.single = single;
  },
  get: function() {
    if (this.cache.single) {
      return this.cache.single;
    }
    var single = this.get('single') || utils.single(this.methodName);
    return (this.cache.single = single);
  }
});

/**
 * Get `plural` property name
 */

mixin('plural', {
  set: function(plural) {
    this.cache.plural = plural;
  },
  get: function() {
    if (this.cache.plural) {
      return this.cache.plural;
    }
    var plural = this.get('plural') || utils.plural(this.methodName);
    return (this.cache.plural = plural);
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

mixin('configFile', {
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

mixin('configNames', {
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

mixin('configFiles', {
  set: function(configFiles) {
    this.cache.configFiles = configFiles;
  },
  get: function() {
    if (this.cache.hasOwnProperty('configFiles')) {
      return this.cache.configFiles;
    }
    if (this.options.hasOwnProperty('configFile')) {
      return (this.cache.configFiles = [this.options.configFile]);
    }
    var names = utils.createNames(this.configNames, this.extensions);
    return (this.cache.configFiles = names);
  }
});

/**
 * Get `configPaths`
 */

mixin('configPaths', {
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

mixin('moduleName', {
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

mixin('modulePath', {
  set: function(modulePath) {
    this.cache.modulePath = modulePath;
  },
  get: function() {
    if (!this.moduleName) return null;
    if (this.cache.hasOwnProperty('modulePath')) {
      return this.cache.modulePath;
    }
    var fp = this.path || utils.resolveModule(this.cwd, this.moduleName, this.options);
    return (this.cache.modulePath = fp);
  }
});

/**
 * Expose `Resolver`
 */

module.exports = Resolver;
