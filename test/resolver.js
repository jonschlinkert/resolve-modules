'use strict';

require('mocha');
var assert = require('assert');
var gm = require('global-modules');
var Resolver = require('..');
var resolver;

describe('Resolver', function() {
  beforeEach(function() {
    resolver = new Resolver({
      inspectFn: true,
      module: 'generate'
    });
  });

  it('should resolve config paths', function() {
    resolver.resolve({
      pattern: 'generate-*/generator.js',
      cwd: gm
    });
    assert(resolver.paths.length > 0);
  });

  it('should emit the name of resolved configs', function(cb) {
    resolver.once('config', function(name, env) {
      assert(name);
      assert(name === 'foo');
      cb();
    });

    resolver.resolve('foo', {
      pattern: 'generate-*/generator.js',
      cwd: gm,
    });

    assert(resolver.paths.length > 0);
  });

  it('should emit "default" as the name if not defined by the user', function(cb) {
    resolver.once('config', function(name, env) {
      assert(name);
      assert(name === 'default');
      cb();
    });

    resolver.resolve({
      pattern: 'generate-*/generator.js',
      cwd: gm,
    });

    assert(resolver.paths.length > 0);
  });

  it('should emit an `env` object for each resolved path', function(cb) {
    resolver.once('config', function(name, env) {
      assert(env);
      assert.equal(typeof env, 'object');
      cb();
    });

    resolver.resolve({
      pattern: 'generate-*/generator.js',
      cwd: gm,
    });

    assert(resolver.paths.length > 0);
  });

  it('should expose a `config` object on the emitted env', function(cb) {
    resolver.once('config', function(name, env) {
      assert(env.config);
      assert.equal(typeof env.config, 'object');
      cb();
    });

    resolver.resolve({
      pattern: 'generate-*/generator.js',
      cwd: gm,
    });

    assert(resolver.paths.length > 0);
  });
});
