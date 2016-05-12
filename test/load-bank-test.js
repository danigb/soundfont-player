/* global describe it */
var assert = require('assert')
var fs = require('fs')

var loadBank = require('../lib/load-bank')

// Mocks
var ac = {}
ac.decodeAudioData = function (data, callback) { callback(data) }

function nameToUrl (name) { return './test/support/' + name + '.js' }

loadBank.fetchUrl = function (url) {
  var src = fs.readFileSync(url, 'utf8')
  return Promise.resolve(src)
}

describe('Soundfont.loadBank', function () {
  it('load a bank', function () {
    return loadBank(ac, nameToUrl('piano')).then(function (buffers) {
      assert.deepEqual(buffers, { 21: {}, 22: {}, 23: {}, 24: {}, 25: {} })
    })
  })
  it('load some notes by midi', function () {
    return loadBank(ac, nameToUrl('piano'), { notes: [21, 22] }).then(function (buffers) {
      assert.deepEqual(buffers, { 21: {}, 22: {} })
    })
  })
  it('load some notes by note name', function () {
    return loadBank(ac, nameToUrl('piano'), { notes: ['A0', 'Bb0'] }).then(function (buffers) {
      assert.deepEqual(buffers, { 21: {}, 22: {} })
    })
  })
})
