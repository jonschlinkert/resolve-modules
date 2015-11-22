'use strict';

var path = require('path');
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
