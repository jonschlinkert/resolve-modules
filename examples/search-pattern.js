'use strict';

var path = require('path');
var Resolver = require('..');
var resolver = new Resolver({
  searchPattern: 'generate-*/generate.js',
  configFile: 'generate.js',
  moduleName: 'generate'
});

resolver.on('config', function(config) {
  console.log(config);
});

resolver.resolve();
