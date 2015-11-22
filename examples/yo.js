'use strict';

var util = require('util');
var Resolver = require('..');
var resolver = new Resolver({
  // this isn't really correct for yeoman, it's just
  // for the sake of example
  searchPattern: 'generator-*/*/index.js',
  moduleName: 'yeoman-generator'
});

resolver.on('config', function(config) {
  // console.log(config);
});

resolver.resolve();

console.log(util.inspect(resolver, null, 10));
