'use strict';


var opts = {alias: {logTimes: 'l', times: 't'}};
var argv = require('minimist')(process.argv.slice(2), opts);
var Time = require('time-diff');
var time = new Time(argv);
var diff = time.diff('find');
diff('1');
var Paths = require('./resolve');
var resolve = new Paths(argv);
diff('2');

function isInstalled() {
  return resolve.resolveDirs(function(file, env) {
    return /verb-(([^-]+)-generator|generate-.*)/.test(file.name);
  });
}

diff('3');
var files = isInstalled();
diff('4');

console.log(resolve.find('verb'));
diff('5');
console.log(resolve.find('verb'));
diff('6');
console.log(resolve.find('verb'));
diff('7');
console.log(resolve.find('verb'));
diff('8');
