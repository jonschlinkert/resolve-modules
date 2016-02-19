'use strict';

var Cache = require('map-cache');

function define(file, prop, val) {
  var cache = new Cache();

  Object.defineProperty(file, prop, {
    configurable: true,
    enumerable: true,
    set: function(v) {
      cache.set(prop, v);
    },
    get: function() {
      var res = cache.get(prop);
      if (res) return res;
      if (typeof val === 'function') {
        val = val.call(file);
      }
      cache.set(prop, val);
      return val;
    }
  });
}

/**
 * Expose `define`
 */

module.exports = define;
