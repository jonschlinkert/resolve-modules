'use strict';

require('benchmarked')({cwd: __dirname})
  .addFixtures('fixtures/*.js')
  .addCode('code/*.js');
