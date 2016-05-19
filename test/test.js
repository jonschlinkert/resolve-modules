'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Resolver = require('..');
var resolver;

var cwd = path.resolve(__dirname, '..');

describe('Resolver', function() {
  beforeEach(function() {
    resolver = new Resolver();
  });

  it('should resolve npm paths', function() {
    resolver.resolve();
    assert(resolver.paths.length > 0);
  });

  it('should use custom paths passed on options', function(cb) {
    resolver = new Resolver({paths: [cwd]});
    var count = 0;

    resolver.match('LICENSE');

    resolver.once('match', function(file) {
      assert.equal(file.name, 'LICENSE');
      count++;
    });

    resolver.resolve();
    assert.equal(count, 1);
    cb();
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

    resolver.once('file', function(name, file) {
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

  it('should recurse when options.recurse is true', function(cb) {
    resolver = new Resolver({
      recurse: true, 
      paths: [cwd],
      filter: function(name) {
        return /(node_modules|tmp|coverage)/.test(name);
      }
    });

    var count = 0;

    resolver.on('file', function(name, file) {
      if (name === 'file.js') {
        count++;
      }
    });
    resolver.resolve();
    assert.equal(count, 1);
    cb();
  });
});
