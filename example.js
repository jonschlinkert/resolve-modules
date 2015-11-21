'use strict';

var path = require('path');
var Config = require('./config');
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

// var config = new Config({
//   paths: [process.cwd()],
//   configFile: '.eslintrc.yml',
//   // prefixes: ['.'],
//   // suffixes: ['rc'],
//   moduleName: 'resolver'
// });

var config = new Config({
  // configPattern: 'generate.js',
  // modulePattern: 'generate-*',
  searchPattern: 'generate-*/generate.js',
  configName: 'generate',
  moduleName: 'generate'
});

console.log(config.resolve());

// console.log(config)
