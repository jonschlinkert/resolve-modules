'use strict';

require('mocha');
var assert = require('assert');
var gm = require('global-modules');
var Resolver = require('..');
var resolver;

describe('Resolver', function() {
  beforeEach(function() {
    resolver = new Resolver({
      module: 'generate'
    });
  });

  it('should resolve config paths', function() {
    resolver.resolve({
      cwd: gm,
      pattern: 'generate-*/generator.js',
    });
    assert(resolver.paths.length > 0);
  });

  it('should emit a `config` object for each resolved path', function(cb) {
    resolver.once('config', function(config) {
      assert(config);
      cb();
    });

    resolver.resolve({
      cwd: gm,
      pattern: 'generate-*/generator.js',
    });

    assert(resolver.paths.length > 0);
  });
});
