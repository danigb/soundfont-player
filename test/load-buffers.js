'use strict'
var vows = require('vows')
var assert = require('assert')
var fs = require('fs')

var Soundfont = require('../')

// Mocks
var audioContext = {}
audioContext.decodeAudioData = function (data, callback) { callback(data) }

Soundfont.nameToUrl = function (name) { return './test/support/' + name + '.js' }
Soundfont.loadData = function (url) {
  var src = fs.readFileSync(url, 'utf8')
  return Promise.resolve(src)
}

vows.describe('Soundfont.loadBuffers').addBatch({
  'loading a buffer': {
    'topic': function () {
      Soundfont.loadBuffers(audioContext, 'piano').then(this.callback)
    },
    'load buffers': function (buffers, nothing) {
      assert.deepEqual(buffers, { 21: {}, 22: {}, 23: {}, 24: {}, 25: {} })
    }
  }
}).export(module)
