'use strict';

require('mocha');
var assert = require('assert');
var gm = require('global-modules');
require('generate-foo/generator.js');
var Resolver = require('..');
var resolver;

describe('Resolver', function() {
  beforeEach(function() {
    resolver = new Resolver();
  });

  it('should resolve npm paths', function() {
    resolver.resolve();
    assert(resolver.paths.length > 0);
  });

  it('should emit `match` when a match is found', function(cb) {
    var count = 0;

    resolver.match(function() {
      return true;
    });

    resolver.once('match', function(file) {
      assert(file);
      assert(file.path);
      count++;
    });

    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });

  it('should emit `match` when a loose match is found', function(cb) {
    var count = 0;

    resolver.contains('[a-z]', function() {
      return true;
    });

    resolver.once('match', function(file) {
      assert(file);
      assert(file.path);
      count++;
    });

    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });

  it('should emit `file` with a vinyl file object when a filepath is resolved', function(cb) {
    var count = 0;

    resolver.match(function() {
      return true;
    });

    resolver.once('file', function(file) {
      assert(file);
      assert(file.path);
      count++;
    });

    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });

  it('should emit the name of a matcher when a match is found', function(cb) {
    var count = 0;

    var file = resolver.find('verb');
    if (!file) {
      cb();
      return;
    }

    resolver.match('verb');
    resolver.once('verb', function(file) {
      assert(file);
      assert(file.path);
      count++;
    });

    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });

  it('should pre-filter paths with the given filter function', function(cb) {
    var count = 0;

    var file = resolver.find('verb');
    if (!file) {
      cb();
      return;
    }

    resolver.options.filter = function(name) {
      return name === 'verb';
    };

    resolver.match('verb');
    resolver.once('verb', function(file) {
      assert(file);
      assert(file.path);
      count++;
    });

    resolver.resolve();
    assert.equal(count, 0);
    cb();
  });

  it('should cache paths', function(cb) {
    var count = 0;
    resolver.on('paths', function(paths) {
      count++;
    });
    resolver.resolve();
    resolver.resolve();
    resolver.resolve();
    resolver.resolve();
    resolver.resolve();
    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });
});
