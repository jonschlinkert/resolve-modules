'use strict';

var util = require('util');
var Resolver = require('..');
var resolver = new Resolver({
  configPattern: 'updatefile.js',
  modulePattern: 'update-*',
  configFile: 'updatefile.js',
  moduleName: 'update'
});

resolver.on('config', function(config) {
  console.log(config);
});

resolver.resolve();

// console.log(util.inspect(resolver, null, 10));
