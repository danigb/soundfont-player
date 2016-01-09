/* global describe it */
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

describe('Soundfont.loadBuffers', function () {
  it('load a buffer', function (done) {
    loadBank(audioContext, nameToUrl('piano'), load).then(function (buffers) {
      assert.deepEqual(buffers, { 21: {}, 22: {}, 23: {}, 24: {}, 25: {} })
      done()
    })
  })
})
