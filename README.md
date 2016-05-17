# resolve-modules [![NPM version](https://img.shields.io/npm/v/resolve-modules.svg?style=flat)](https://www.npmjs.com/package/resolve-modules) [![NPM downloads](https://img.shields.io/npm/dm/resolve-modules.svg?style=flat)](https://npmjs.org/package/resolve-modules) [![Build Status](https://img.shields.io/travis/jonschlinkert/resolve-modules.svg?style=flat)](https://travis-ci.org/jonschlinkert/resolve-modules)

Resolves local and global npm modules that match specified patterns, and returns a configuration object for each resolved module.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install resolve-modules --save
```

## Usage

```js
var Resolver = require('resolve-modules');
var resolver = new Resolver();
```

## API

### [Resolver](index.js#L27)

Iterates over [npm-paths](https://github.com/jonschlinkert/npm-paths) and emits `file` for every resolved filepath, and `match` for files that match any specified [matchers](https://github.com/cezary/matchers). Paths are cached in memory using a few different objects:

* `cache.paths`: array of absolute directory and file paths
* `cache.names`: object of [vinyl](http://github.com/gulpjs/vinyl) files, where `file.name` is the object key. `file.name` is the basename of the filepath, but it's aliased as `name` so we can use it without touching the getters/setters on the vinyl file.
* `cache.files`: array of [vinyl](http://github.com/gulpjs/vinyl) files

**Params**

* `options` **{Object}**: Specify a cache to use on `options.cache`.

**Example**

```js
var resolver = new Resolver();
resolver.resolve();
console.log(resolver);
```

### [.resolve](index.js#L74)

Iterates over [npm-paths](https://github.com/jonschlinkert/npm-paths) and returns an array of [vinyl](http://github.com/gulpjs/vinyl) files that match any provided matchers. Also emits `file` for all files, and `match` for matches. Additionally, paths are cached on the first call to `.resolve` so that any subsequent calls during the same process will use the cached filepaths instead of hitting the file system again. You can force `.resolve` to hit the file system again by deleting or nulling `resolver.cache.dirs`.

**Params**

* `fn` **{Function|String|Array|RegExp}**: Optionally specify a matcher value.
* `options` **{Object}**
* `returns` **{Array}**: Returns an array of [vinyl](http://github.com/gulpjs/vinyl) files.

**Example**

```js
resolver.match('verb', function(basename, file) {
  return basename === 'verb';
});

// matches
console.log(resolver.resolve());

// all cached paths
console.log(resolver);
```

### [.find](index.js#L92)

Find a filepath where `file.basename` exactly matches the given `name`. This method is standalone and does not require use of the `.resolve` method or matchers.

**Params**

* `name` **{String}**: Basename of the file to match.
* `returns` **{String|undefined}**: Returns the absolute filepath if a match is found, otherwise undefined.

**Example**

```js
var filepath = resolver.find('foo');
```

### [.match](index.js#L119)

Define a matcher to use for matching files when the `resolve` method is called. If a string or array of strings is passed, strict equality is used for comparisons with `file.name`.

**Params**

* `name` **{String|Function|Array|RegExp}**: Optionally provide `name` to emit when a match is found, a matcher function, string to match, array of strings, or regex.
* `val` **{String|Function|Array|RegExp}**: Matcher function, string to match, array of strings, or regex.
* `options` **{Object}**: If a string is passed, options may be passed to [micromatch](https://github.com/jonschlinkert/micromatch) to convert the string to regex.
* `returns` **{Object}**: Returns the instance for chaining.

**Example**

```js
resolver.match('foo');
```

### [.contains](index.js#L148)

Define a matcher to use for matching files when the `resolve` method is called. If a string or array of strings is passed, any `file.name` that contains the given string or strings will return true.

**Params**

* `name` **{String|Function|Array|RegExp}**: Optionally provide `name` to emit when a match is found, a matcher function, string to match, array of strings, or regex.
* `val` **{String|Function|Array|RegExp}**: Matcher function, string to match, array of strings, or regex.
* `options` **{Object}**: If a string is passed, options may be passed to [micromatch](https://github.com/jonschlinkert/micromatch) to convert the string to regex.
* `returns` **{Object}**: Returns the instance for chaining.

**Example**

```js
resolver.contains('foo');
```

### [.resolveDirs](index.js#L199)

Resolve sub-directories from npm-paths (does not recurse). This method probably doesn't need to be used directly, but it's exposed in case you want to customize behavior.

**Params**

* `fn` **{Function}**: Optionally specify a filter function to use on filepaths. If provided, the function will be called before any matchers are called. `basename` and `file` are exposed to the filter function as arguments, where `file` is an instance of [vinyl](http://github.com/gulpjs/vinyl).
* `returns` **{Object}**: Returns the [cache](#cache).

**Events**

* `emits`: `ignore` when a file is removed.

**Example**

```js
resolver.resolveDirs(function(basename, file) {
  return !/foo/.test(file.path);
});
```

## Related projects

You might also be interested in these projects:

* [global-modules](https://www.npmjs.com/package/global-modules): The directory used by npm for globally installed npm modules. | [homepage](https://github.com/jonschlinkert/global-modules)
* [global-paths](https://www.npmjs.com/package/global-paths): Returns an array of unique "global" directories based on the user's platform and environment. The… [more](https://www.npmjs.com/package/global-paths) | [homepage](https://github.com/jonschlinkert/global-paths)
* [global-prefix](https://www.npmjs.com/package/global-prefix): Get the npm global path prefix. | [homepage](https://github.com/jonschlinkert/global-prefix)
* [npm-paths](https://www.npmjs.com/package/npm-paths): Returns an array of unique "npm" directories based on the user's platform and environment. | [homepage](https://github.com/jonschlinkert/npm-paths)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/resolve-modules/issues/new).

## Building docs

Generate readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install verb && npm run docs
```

Or, if [verb](https://github.com/verbose/verb) is installed globally:

```sh
$ verb
```

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/jonschlinkert/resolve-modules/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on May 16, 2016._