'use strict';

var resolve = require('resolve')
  , path = require('path')

/**
 * Requires file relative to @see root or process.cwd() if root is not supplied.
 * 
 * @name requireModule
 * @function
 * @param {String} module name of an installed module or path to a module to be required.
 * @param {String=} root defaults to current working directory 
 * @return {Object} the result of requiring the module
 */
module.exports = function requireModule(module, root) {
  root = root || process.cwd(); 
  return (/^[.\/]/).test(module)
    ? require(path.resolve(root, module))
    : require(resolve.sync(module, { basedir: root }));
}
