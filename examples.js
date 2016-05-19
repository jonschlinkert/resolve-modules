'use strict';

var Resolver = require('./');
var resolver = new Resolver();

// resolver.match('verb');
// resolver.contains('-verb');

// resolver.match('verb', function(basename, file) {
//   return basename === 'verb';
// });

// resolver.on('file', function(file) {
//   console.log(file)
// });

// resolver.on('match', function(file) {
//   console.log(file);
// });

// resolver.on('verb', function(file) {
//   console.log(file);
// });

// var files = resolver.resolve(function(basename, file) {
//   return /^ansi/.test(file.name);
// });

resolver.match('verb', function(basename, file) {
  return basename === 'verb';
});
console.log(resolver.resolve());

// resolver.match('udpate', function(basename, file) {
//   return /update/.test(basename);
// });
// console.log(resolver.resolve());

