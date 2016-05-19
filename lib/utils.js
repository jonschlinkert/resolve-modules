'use strict';

var path = require('path');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('define-property', 'define');
require('extend-shallow', 'extend');
require('fs-exists-sync', 'exists');
require('is-glob');
require('kind-of', 'typeOf');
require('micromatch', 'mm');
require('npm-paths');
require = fn;

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Default files or directories to ignore
 */

utils.ignore = ['Thumbs.db', '.DS_Store', '.git', 'coverage', 'tmp', 'temp', 'vendor', 'fixtures', 'actual', '*.sublime-project', '*.sublime-workshow'];

utils.ignore.push(path.join(process.cwd(), 'node_modules'));
utils.ignoreMatcher = function(ignored, options) {
  var opts = utils.extend({flags: 'i'}, options);
  var re = utils.mm.makeRe('{' + utils.arrayify(ignored).join('|') + '}', opts);
  return function(name) {
    return re.test(name);
  };
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
