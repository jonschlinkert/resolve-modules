'use strict';

var util = require('util');
var Resolver = require('..');
var resolver = new Resolver({
  module: 'generate'
});

resolver.on('config', function(config) {
  console.log(config);
});

resolver.resolve({
  cwd: '@/',
  pattern: 'generate-*/generate.js',
});
