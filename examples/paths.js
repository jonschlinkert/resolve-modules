'use strict';

var utils = require('../lib/utils');

var Config = require('../lib/config');
var config = new Config({
  verbose: true,
  cwd: '@/generate-node',
  filename: 'generate.js'
});

var Mod = require('../lib/mod');
var mod = new Mod({
  verbose: true,
  name: 'generate',
  cwd: config.cwd
});

console.log(mod);
