'use strict';

require('mocha');
var assert = require('assert');
var Config = require('../lib/config');
var config;

describe('Config', function() {
  beforeEach(function() {
    config = new Config({
      configFile: 'generate.js'
    });
  });

  it('should throw when neither configName or configFile is defined', function(cb) {
    try {
      new Config({});
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'configName or configFile must be defined');
      cb();
    }
  });

  it('should resolve the config path', function() {
    assert.equal(config.path, '/Users/jonschlinkert/dev/repo-utils/resolve-modules');
  });
  it('should resolve "main" using `require.resolve`', function() {
    assert.equal(config.main, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/index.js');
  });
  it('should resolve "dirname"', function() {
    assert.equal(config.dirname, '/Users/jonschlinkert/dev/repo-utils/resolve-modules');
  });
  it('should resolve "cwd"', function() {
    assert.equal(config.cwd, '/Users/jonschlinkert/dev/repo-utils/resolve-modules');
  });
  it('should resolve the package.json path as config.pkg', function() {
    assert.equal(config.pkg, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/package.json');
  });
  it('should resolve "basename"', function() {
    assert.equal(config.basename, 'resolve-modules');
  });
  it('should resolve "name"', function() {
    assert.equal(config.name, 'resolve-modules');
  });
  it('should resolve "alias"', function() {
    assert.equal(config.alias, 'modules');
  });
  it('should resolve "configName"', function() {
    assert.equal(config.configName, 'generate');
  });
  it('should resolve "configFile"', function() {
    assert.equal(config.configFile, 'generate.js');
  });
  it('should resolve "configPath"', function() {
    assert.equal(config.configPath, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/generate.js');
  });
  it('should update "configPath" from configFile setter', function() {
    assert.equal(config.configPath, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/generate.js');
    config.configFile = 'foo.js';
    assert.equal(config.configPath, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/foo.js');
    config.configFile = 'bar.js';
    assert.equal(config.configPath, '/Users/jonschlinkert/dev/repo-utils/resolve-modules/bar.js');
  });
  it('should resolve "moduleName"', function() {
    assert.equal(config.moduleName, '');
  });
  it('should resolve "modulePath"', function() {
    assert.equal(config.modulePath, '');
  });
  it('should update "modulePath" from "moduleName"', function() {
    assert.equal(config.modulePath, '');
    config.moduleName = 'generate';
    assert.equal(config.modulePath, '/usr/local/lib/node_modules/generate/index.js');
  });
  it('should resolve "module"', function() {
    assert.equal(config.module, null);
  });
  it('should require "module" from "modulePath" when `options.require` is true', function() {
    assert.equal(config.module, null);
    config.options.require = true;
    config.moduleName = 'mocha';
    assert.equal(typeof config.module, 'function');
  });
});
