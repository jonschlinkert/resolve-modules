'use strict';

var path = require('path');
var braces = require('braces');
var write = require('write');

function fixture(dest, pattern, options) {
  var arr = braces(pattern, options);
  var len = arr.length;
  var idx = -1;
  while (++idx < len) {
    var fp = path.resolve(dest, arr[idx]);
    console.log(`writing file '%s'`, path.relative(process.cwd(), fp));
    // write.sync(fp, 'fixture');
  }
  console.log('done');
}

function fixtures(dest, patterns, options) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }
  var len = patterns.length;
  var idx = -1;
  while (++idx < len) {
    fixture(dest, patterns[idx], options);
  }
}

fixtures('fixtures', ['{a..c}/{baz,foo,bar}/{d..f}/{bar,baz,foo}/{j..l}/{foo,bar,baz}.txt']);
fixtures('fixtures', ['{a..c}/{one,two,three}.txt']);
fixtures('fixtures', ['{a..c}/{baz,foo,bar}/{d..f}/{one,two,three}.txt']);
fixtures('fixtures', ['{a..c}/{baz,foo,bar}/{d..f}/{bar,baz,foo}/{j..l}/{one,two,three}.txt']);
