'use strict';

require('mocha');
var assert = require('assert');
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
      cwd: '@/',
      pattern: 'generate-*/generate.js',
    });
    
    assert(resolver.paths.length > 0);
  });
});
