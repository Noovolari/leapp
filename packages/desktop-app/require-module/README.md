# require-module [![build status](https://secure.travis-ci.org/thlorenz/require-module.png)](http://travis-ci.org/thlorenz/require-module)

Requires a module found relative to given root or working directory.

```js
var requireModule = require('require-module');

// require relative-module which is located relative to current directory
var relative = requireModule('./relative-module.js');

// require tap module installed in ../dir/node_modules
var tap = requireModule('tap', path.join(__dirname, '..', 'dir'));
```

## Installation

    npm install require-module

## API

### requireModule(module, root)

**Parameters**

**module**:  *String*,  name of an installed module or path to a module to be required.

**root**:  *String=*,  defaults to current working directory

**Returns**

*Object*,  the result of requiring the module

## Kudos

Adapted function found in @substack's [catw](https://github.com/substack/catw) module

## License

MIT
