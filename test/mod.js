'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var commands = require('spawn-commands');
var Config = require('../lib/config');
var Mod = require('../lib/mod');
var mod, config;

var dir = path.join(gm, 'generate-foo');

describe('Modules', function() {
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
    mod = new Mod('generate', config);
  });

  it('should get the module name', function() {
    assert.equal(mod.name, 'generate');
  });

  it('should get the module path', function() {
    assert.equal(mod.path, '/usr/local/lib/node_modules/generate/index.js');
  });
});
