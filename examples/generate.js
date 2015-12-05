'use strict';

var util = require('util');
var gm = require('global-modules');
var Resolver = require('..');
var resolver = new Resolver({
  module: 'generate'
});

resolver.on('config', function(config, mod) {
  // console.log('config.path', config.path);
  // console.log(config.fn);
  // console.log();
  // console.log('module.path', require(mod.path).name);
});

resolver
  // .resolve({
  //   cwd: gm,
  //   pattern: 'generate-*/generator.js',
  // })
  .resolve({
    cwd: __dirname,
    pattern: 'generate/three/**/generator.js',
    aliasFn: function(key) {
      return key;
    }
  })
  // .resolve({
  //   cwd: process.cwd(),
  //   pattern: 'generator.js'
  // })
