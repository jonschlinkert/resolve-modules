'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var commands = require('spawn-commands');
var Config = require('../lib/config');
var config;

var dir = path.join(gm, 'generate-foo');

describe('Config', function() {
  before(function(cb) {
    fs.exists(dir, function(exists) {
      if (exists) return cb();

      commands({cmd: 'npm', args: ['i', '-g', 'generate-foo']}, function(err) {
        if (err) return cb(err);
        cb();
      });
    });
  });

  beforeEach(function() {
    config = new Config({
      options: { cwd: gm },
      path: path.join(dir, 'generator.js')
    });
  });

  it('should get the config path', function() {
    assert.equal(config.path, path.join(dir, 'generator.js'));
  });

  it('should resolve the filename', function() {
    assert.equal(config.filename, 'generator.js');
  });

  it('should resolve the dirname', function() {
    assert.equal(config.dirname, dir);
  });

  it('should resolve the package.json path', function() {
    assert.equal(config.pkg, path.join(dir, 'package.json'));
  });

  it('should resolve the search pattern cwd', function() {
    assert.equal(config.cwd, dir);
  });

  it('should get the name', function() {
    assert.equal(config.name, 'generate-foo');
  });

  it('should get the alias', function() {
    assert.equal(config.alias, 'foo');
  });
});
