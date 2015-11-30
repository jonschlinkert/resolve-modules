'use strict';

var util = require('util');
var path = require('path');
var Resolver = require('..');
var gm = require('global-modules');
var resolver = new Resolver({
  module: 'yeoman-generator'
});

resolver.on('config', function(config) {
  // console.log(config);
});

// yeoman does more than this, but hopefully
// you get the gist
resolver
  .resolve({
    pattern: 'generator-*/*/index.js',
    cwd: gm
  })
  .resolve({
    pattern: 'generator-*/*/index.js',
    cwd: path.join(process.cwd(), 'node_modules')
  })

console.log(util.inspect(resolver, null, 10));
