'use strict';

require('mocha');
var assert = require('assert');
var Config = require('../lib/config');
var config;

describe('Config', function() {
  beforeEach(function() {
    config = new Config({
      options: {cwd: '@/', verbose: true},
      path: '/Users/jonschlinkert/dev/generate/_generate/generate-node/generate.js'
    });
  });

  it('should get the config path', function() {
    assert.equal(config.path, '/Users/jonschlinkert/dev/generate/_generate/generate-node/generate.js');
  });

  it('should resolve the filename', function() {
    assert.equal(config.filename, 'generate.js');
  });

  it('should resolve the dirname', function() {
    assert.equal(config.dirname, '/Users/jonschlinkert/dev/generate/_generate/generate-node');
  });

  it('should resolve the package.json path', function() {
    assert.equal(config.pkg, '/Users/jonschlinkert/dev/generate/_generate/generate-node/package.json');
  });

  it('should resolve the search pattern cwd', function() {
    assert.equal(config.cwd, '/usr/local/lib/node_modules/');
  });

  it('should get the name', function() {
    assert.equal(config.name, 'generate-node');
  });

  it('should get the alias', function() {
    assert.equal(config.alias, 'node');
  });
});
