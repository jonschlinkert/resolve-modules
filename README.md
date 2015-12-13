# resolve-modules [![NPM version](https://img.shields.io/npm/v/resolve-modules.svg)](https://www.npmjs.com/package/resolve-modules) [![Build Status](https://img.shields.io/travis/jonschlinkert/resolve-modules.svg)](https://travis-ci.org/jonschlinkert/resolve-modules)

> Resolves local and global npm modules that match specified patterns, and returns a configuration object for each resolved module.

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i resolve-modules --save
```

## Usage

```js
var Resolver = require('resolve-modules');
var resolver = new Resolver({
  module: 'generate'
});

resolver.resolve({
  cwd: process.cwd(),
  pattern: 'generate-*/generate.js'
});
```

## Events

When the search pattern finds a match, a `config` event is emitted:

```js
resolver.on('config', function(config) {
  // do stuff with "config"
});
```

The `config` object that is emitted looks something like this:

```js
{
  options:
   { realpath: true,
     cwd: '/usr/local/lib/node_modules',
     module: 'generate',
     pattern: 'generate-*/generator.js',
     configCwd: '/usr/local/lib/node_modules/generate-foo',
     context: {} },
  cache:
   { name: 'generate-foo',
     dirname: '/usr/local/lib/node_modules/generate-foo',
     root: '/usr/local/lib/node_modules/generate-foo',
     filename: 'generator.js',
     cwd: '/usr/local/lib/node_modules/generate-foo',
     pkg: '/usr/local/lib/node_modules/generate-foo/package.json',
     relative: '',
     alias: 'foo' },
  path: '/usr/local/lib/node_modules/generate-foo/generator.js',
  fn: [Getter/Setter],
  filename: [Getter/Setter],
  realpath: [Getter],
  cwd: [Getter/Setter],
  root: [Getter/Setter],
  dirname: [Getter/Setter],
  relative: [Getter/Setter],
  name: [Getter/Setter],
  alias: [Getter/Setter],
  pkg: [Getter/Setter],
  main: [Getter/Setter],
  module:
   Mod {
     name: 'generate',
     configCwd: undefined,
     path: '/usr/local/lib/node_modules/generate/index.js',
     realpath: [Getter],
     pkg: [Getter],
     fn: [Getter] } }
```

## API

### Resolver

### [Resolver](index.js#L33)

Create an instance of `Resolver` with `options`. The only required option is `module`, which is the name of the module that will be used for creating instances for config files by the [resolve](#resolve) method.

For example, [generate][], the project generator, would be the "module",
and individual generators (`generator.js` files) would be the "config" files.

**Params**

* `options` **{Object}**

**Example**

```js
var resolver = new Resolver({
  module: 'generate'
});
```

### [.resolve](index.js#L81)

Searches for config files that match the given glob `patterns` and, when found, emits `config` with details about the module and environment, such as absolute path, `cwd`, path to parent module, etc.

**Params**

* `patterns` **{String|Array|Object}**: Glob pattern(s) or options object. If options, the `pattern` property must be defined with a glob pattern.
* `options` **{Object}**
* `returns` **{Object}**: Returns the resolver instance, for chaining.

**Example**

```js
var resolver = new Resolver({
  module: 'generate'
});

resolver.on('config', function(config, mod) {
  // `config` is an object with fully resolved file paths.
  // Config also has a `fn` getter that returns the contents of
  // the config file. Using the "generate" analogy above, this would
  // be a "generator.js" config file

  // `mod` (module) is a similar object, but for the "parent"
  // module. Using the generate analogy above, this would be an installation
  // "generate", either installed locally to the generator, or as a global
  // npm module
});

resolver
  .resolve('generator.js', {cwd: 'foo'})
  .resolve('generator.js', {cwd: 'bar'})
  .resolve('generator.js', {cwd: 'baz'});
```

### [createEnv](index.js#L120)

Return a new `env` (environment) object with `config`, `module`
and `user` properties.

**Params**

* `fp` **{String}**: The starting filepath for the `config`
* `cwd` **{String}**: The user (process) `cwd`
* `options` **{Object}**
* `returns` **{Object}**

### Config

### Module

### [Mod](lib/mod.js#L16)

Create a new `Mod` with the given `options`

**Params**

* `options` **{Object}**

**Example**

```js
var mod = new Mod(options);
```

## Related projects

* [global-modules](https://www.npmjs.com/package/global-modules): The directory used by npm for globally installed npm modules. | [homepage](https://github.com/jonschlinkert/global-modules)
* [global-paths](https://www.npmjs.com/package/global-paths): Returns an array of unique "global" directories based on the user's platform and environment. The… [more](https://www.npmjs.com/package/global-paths) | [homepage](https://github.com/jonschlinkert/global-paths)
* [global-prefix](https://www.npmjs.com/package/global-prefix): Get the npm global path prefix. | [homepage](https://github.com/jonschlinkert/global-prefix)
* [npm-paths](https://www.npmjs.com/package/npm-paths): Returns an array of unique "npm" directories based on the user's platform and environment. | [homepage](https://github.com/jonschlinkert/npm-paths)

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/resolve-modules/issues/new).

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2015 [Jon Schlinkert](https://github.com/jonschlinkert)
Released under the MIT license.

***

_This file was generated by [verb](https://github.com/verbose/verb) on December 13, 2015._