#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var Liftoff = require('liftoff');
var liftoff = new Liftoff({
  name: 'generate',
  moduleName: 'generate',
  configName: 'generator',
  extensions: {
    '.js': null,
    '.coffee': 'coffee-script/register'
  },
  v8flags: ['--harmony'] // or v8flags: require('v8flags');
});

// var liftoff = new Liftoff({
//   name: 'generate',
//   //  moduleName: 'generate',   // these are assigned
//   //  configName: 'generator',  // automatically by
//   //  processTitle: 'generate', // the "name" option
//   extensions: require('interpret').jsVariants,
//   // ^ automatically attempt to require module for any javascript variant
//   // supported by interpret.  e.g. coffee-script / livescript, etc
//   v8flags: ['--harmony'] // to support all flags: require('v8flags')
//     // ^ respawn node with any flag listed here
// });

liftoff.on('require', function(name, module) {
  console.log('Loading:', name);
});

liftoff.on('requireFail', function(name, err) {
  console.log('Unable to load:', name, err);
});

liftoff.on('respawn', function(flags, child) {
  console.log('Detected node flags:', flags);
  console.log('Respawned to PID:', child.pid);
});

liftoff.launch({
  cwd: argv.cwd,
  configPath: argv.generator,
  require: argv.require,
  completion: argv.completion,
  verbose: argv.v
}, function(env) {
  if (argv.v) {
    console.log();
    console.log('LIFTOFF SETTINGS:', this);
    console.log('CLI OPTIONS:', argv);
    console.log('CWD:', env.cwd);
    console.log('LOCAL MODULES PRELOADED:', env.require);
    console.log('SEARCHING FOR:', env.configNameRegex);
    console.log('FOUND CONFIG AT:', env.configPath);
    console.log('CONFIG BASE DIR:', env.configBase);
    console.log('YOUR LOCAL MODULE IS LOCATED:', env.modulePath);
    console.log('LOCAL PACKAGE.JSON:', env.modulePackage);
    console.log('CLI PACKAGE.JSON', require('./package'));
    console.log();
  }

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log('Working directory changed to', env.cwd);
    console.log();
  }

  if (!env.modulePath) {
    console.log('Local', liftoff.moduleName, 'module not found in:', env.cwd);
    console.log();
    // process.exit(1);
  }

  if (env.configPath) {
    require(env.configPath);
  } else {
    console.log('No', liftoff.configName, 'found.');
  }
});
