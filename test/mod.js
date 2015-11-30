'use strict';

require('mocha');
var assert = require('assert');
var Config = require('../lib/config');
var Mod = require('../lib/mod');
var mod, config;

describe('Mod', function() {
  beforeEach(function() {
    config = new Config({
      options: {cwd: '@/'},
      path: '/Users/jonschlinkert/dev/generate/_generate/generate-node/generate.js'
    });
    mod = new Mod('generate', config);
  });

  it('should get the module name', function() {
    assert.equal(mod.name, 'generate');
  });

  it('should get the module path', function() {
    assert.equal(mod.path, '/usr/local/lib/node_modules/generate/index.js');
  });
});
