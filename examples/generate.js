'use strict';

var Resolver = require('..');
var resolver = new Resolver({
  configPattern: 'generate.js',
  modulePattern: 'generate-*',
  configName: 'generate',
  moduleName: 'generate'
});

resolver.on('config', function(config) {
  console.log(config);
});

resolver.resolve();
