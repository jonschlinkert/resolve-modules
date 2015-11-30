'use strict';

var utils = require('../lib/utils');
var resolve = require('resolve');

var fp = utils.resolveDir('@/generate-node');

console.log(utils.resolveModule('write'))
console.log(fp)
console.log(resolve.sync('write', {basedir: fp}))
