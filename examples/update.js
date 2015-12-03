'use strict';

var util = require('util');
var gm = require('global-modules');
var Resolver = require('..');
var resolver = new Resolver({
  module: 'update'
});

resolver.on('config', function(config) {
  console.log(config);
});

resolver.resolve({
  pattern: 'update-*/updatefile.js',
  cwd: gm
});

// console.log(util.inspect(resolver, null, 10));
