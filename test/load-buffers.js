'use strict'
var vows = require('vows')
var assert = require('assert')
var fs = require('fs')

var loadBank = require('../lib/load-bank')

// Mocks
var audioContext = {}
audioContext.decodeAudioData = function (data, callback) { callback(data) }

function nameToUrl (name) { return './test/support/' + name + '.js' }
function load (url) {
  var src = fs.readFileSync(url, 'utf8')
  return Promise.resolve(src)
}

vows.describe('Soundfont.loadBuffers').addBatch({
  'loading a buffer': {
    'topic': function () {
      loadBank(audioContext, nameToUrl('piano'), load).then(this.callback)
    },
    'load buffers': function (buffers, nothing) {
      assert.deepEqual(buffers, { 21: {}, 22: {}, 23: {}, 24: {}, 25: {} })
    }
  }
}).export(module)
