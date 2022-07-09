'use strict';
/*jshint asi: true */

var test = require('tap').test
var requireModule = require('../')

test('\nrequire installed module', function (t) {
  var tap = requireModule('tap', __dirname + '../')
  t.equal(tap, tap, 'requires installed tap')
  t.end()
})

test('\nrequire module relative to root', function (t) {
  var bingo = requireModule('./relative-module.js', __dirname + '/fixture')

  t.equal(bingo, 'bingo', 'requires module relative to root')
  t.end()
})
