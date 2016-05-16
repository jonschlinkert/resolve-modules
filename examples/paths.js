'use strict';

var Paths = require('../resolve');
var blacklist = require('../blacklist');
var paths = new Paths({
  filter: function(file) {
    // console.log(file)
    return /verb-|generate-/.test(file.path) && !~blacklist.indexOf(file.name);
  }
});

// var files = [];

// paths.resolveDirs(function(file, env) {
//   file.env = env;
//   files.push(file);
// });

// console.log(files);
// console.log(files[0].env.main);

console.log(paths.findModule('verb'))
