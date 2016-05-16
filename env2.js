'use strict';

var utils = require('./lib/utils');

module.exports = function(app) {
  return function(fp, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    var opts = utils.extend({}, app.options, options);
    var file = new utils.File({path: fp, content: null});
    var stat = file.stat;

    var cwd = path.dirname(file.path);

    file.pkgPath = path.resolve(cwd, 'package.json');
    var pkg;

    /**
     * file.pkg
     */

    define(file, 'pkg', function() {
      if (pkg) return pkg;

      if (utils.exists(file.pkgPath)) {
        pkg = require(file.pkgPath);
      }

      if (!pkg && file.stat.isDirectory()) {
        file.pkgPath = path.resolve(file.path, 'package.json');
        pkg = require(file.pkgPath);

        if (pkg && pkg.main) {
          var dir = file.path;
          file.path = path.resolve(dir, pkg.main);
        }
      }
      return pkg || {};
    });

    /**
     * file.pkg
     */

    define(file, 'stat', function() {
      return stat || fs.lstatSync(file.path);
    });

    /**
     * file.name
     */

    define(file, 'name', function() {
      // if the dirname is the current working directory,
      // this is our default generator
      var name = file.dirname !== process.cwd()
        ? (pkg ? pkg.name : path.basename(file.dirname))
        : 'default';

      app.fragment.set('name', name, file);
      return name;
    });

    /**
     * file.fn
     */

    define(file, 'fn', function() {
      if (typeof fn === 'function') {
        return fn;
      }
      fn = app.fragment.get('fn', file.name);
      if (typeof fn === 'function') {
        return fn;
      }
      fn = require(file.path);
      app.fragment.set('fn', fn);
      return fn;
    });

    /**
     * file.alias
     */

    define(file, 'alias', function() {
      var alias = typeof opts.alias === 'function'
        ? opts.alias.call(file, file.name)
        : utils.aliasFn.call(file, file.name, file);

      if (alias) {
        app.fragment.set('alias', alias, file);
      }
      return alias;
    });

    /**
     * file.main
     */

    define(file, 'main', function() {
      var main = (pkg && pkg.main || file.pkg && file.pkg.main);
      if (typeof main === 'string') {
        return path.resolve(file.dirname, main);
      }
      return file.path;
    });

    /**
     * custom inspect
     */

    file.inspect = function() {
      return '<Env ' + utils.formatAlias(file) + utils.formatPath(file) + '>';
    };

    // set the file on the fragment cache
    app.fragment.set('path', file.path, file);
    return file;
  };
};
