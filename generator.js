'use strict';

/**
 * testing...
 */

module.exports = function(app, base) {
  app.task('default', function(cb) {
    console.log(app.namespace, 'task >', this.name);
    cb();
  });
  app.task('a', function(cb) {
    console.log(app.namespace, 'task >', this.name);
    cb();
  });
  app.task('b', function(cb) {
    cb();
  });
  app.task('c', function(cb) {
    cb();
  });

  app.register('docs', function() {
    app.task('x', function(cb) {
      cb();
    });
    app.task('y', function(cb) {
      cb();
    });
    app.task('z', function(cb) {
      cb();
    });
  });
};
