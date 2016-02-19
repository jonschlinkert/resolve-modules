#!/usr/bin/env node

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var Resolver = require('./');
var resolver = new Resolver();

function validate(file, opts) {
  if (!/^generate-/.test(file.name)) {
    return false;
  }
  var keys = file.pkg.keywords || [];
  return ~keys.indexOf('generator');
}

var generators = resolver.resolve('generate-*/{generator,index}.js', {
  ignore: require('./blacklist'),
  validate: validate
});

// var verbfiles = resolver.resolve('verb-*-generator/{generator,index}.js', {
//   ignore: require('./blacklist'),
//   validate: validate
// });

// console.log(verbfiles);
// console.log(verbfiles.name('generate-foo'));
// console.log(verbfiles.match('*-readme*'));

var results = [];
results.push(generators.name('generate-mocha'));
results.push(generators.alias('mocha'));

results.push(generators.match('*-mocha'));
results.push(generators.match('*-foo'));

console.log(results);
// console.log(generators);
// console.log(resolve.fragment);
// var foo = resolve.register('generate-foo');
// console.log(foo.fn);
// console.log(generators);
// console.log(resolve.fragment);

// var bar = resolver.resolve(path.resolve('node_modules/generate-foo'));
// console.log(bar.fn);
// console.log(bar.alias);
// console.log(bar.path);
// console.log(bar.name);

// var def = resolver.resolve('default', './generator');
// console.log(def);
// console.log(def.alias);
// console.log(def.path);
// console.log(def.name);

// var auto = resolver.resolve('./generator');
// console.log(auto);
// console.log(auto.alias);
// console.log(auto.path);
// console.log(auto.name);

// console.log(generators);
// console.log(resolver.resolvefragment);

// var gen = resolve.register('quux', function() {
//   console.log('inside quux');
// });
// console.log(gen);
// console.log(resolve.fragment);
// gen.fn();
// console.log(resolve.fragment);

// var gen2 = resolve.register('bar', path.resolve('node_modules', 'generate-foo'));
// console.log(gen2);
// console.log(resolve.fragment);
// // gen2.fn();
// console.log(resolve.fragment);

// app.register('foo', function() {

// });

// var defaults = require('generate-defaults');

// app.register('defaults', defaults);
