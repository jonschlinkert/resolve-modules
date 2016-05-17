'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('define-property', 'define');
require('extend-shallow', 'extend');
require('fs-exists-sync', 'exists');
require('kind-of', 'typeOf');
require('micromatch', 'mm');
require('npm-paths');
require = fn;

/**
 * Expose `utils` modules
 */

module.exports = utils;
