'use strict';

var path = require('path');
var Resolver = require('./');
// var Resolver = require('./');
// var resolver = new Resolver({
//   configfile: 'configfoo.js',
//   moduleName: 'vinyl'
// });

// resolver.on('file', function(file) {
//   // console.log(file)
// });

// resolver.resolve('configfoo.js');
// resolver.resolveUp('generate-*/generate.js');

// console.log(resolver.files);

// var resolver = new Resolver();

// var config = new Resolver({
//   configFile: '.eslintrc',
//   // prefixes: ['.'],
//   // suffixes: ['rc'],
//   aliasFn: function (fp) {
//     return fp;
//   },
//   // searchPattern: '.eslintrc',
//   moduleName: 'resolve-modules'
// });

var config = new Resolver({
  configPattern: 'generate.js',
  modulePattern: 'generate-*',
  configName: 'generate',
  moduleName: 'generate'
});

// var config = new Resolver({
//   searchPattern: 'generate-*/generate.js',
//   configFile: 'generate.js',
//   moduleName: 'generate'
// });

config.resolve();

console.log(config)
