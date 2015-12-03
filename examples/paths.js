'use strict';

var utils = require('../lib/utils');

var Config = require('../lib/config');
var config = new Config({
  cwd: '@/generate-node',
  path: 'generate.js'
});

var Mod = require('../lib/mod');
var mod = new Mod('generate', {
  configCwd: config.cwd
});

console.log(config.path);
console.log(mod);
