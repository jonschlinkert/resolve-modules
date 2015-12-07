'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var commands = require('spawn-commands');
var User = require('../lib/user');
var user;

var dir = path.join(gm, 'generate-foo');

describe('User', function() {
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
    user = new User(path.join(dir, 'generator.js'), {cwd: gm});
  });

  it('should resolve the package.json path', function() {
    assert.equal(user.pkgPath, path.join(process.cwd(), 'package.json'));
  });

  it('should resolve package.json object', function() {
    assert.equal(user.pkg.name, 'resolve-modules');
  });

  it('should resolve the search pattern cwd', function() {
    assert.equal(user.cwd, process.cwd());
  });
});
