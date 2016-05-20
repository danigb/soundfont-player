/* global describe it */
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var load = require('audio-loader')
var Soundfont = require('..')

var piano = fs.readFileSync(path.join(__dirname, '../examples/acoustic_grand_piano-ogg.js'))

// AudioContext stub
var ac = {
  decodeAudioData: function (data, fn) {
    fn(new Float32Array(10))
  }
}

load.fetch = function (url) {
  load.fetch.url = url
  return Promise.resolve(piano.toString())
}

describe('Soundfont player', function () {
  describe('Load instruments', function () {
    it('returns a promise', function () {
      assert.equal(typeof Soundfont.instrument(ac, 'piano').then, 'function')
    })
    it('loads mp3 by default', function () {
      return Soundfont.instrument(ac, 'piano').then(function () {
        assert.equal(load.fetch.url,
          'http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/piano-mp3.js')
      })
    })
    it('the promise resolve to an instrument', function () {
      return Soundfont.instrument(ac, 'piano')
      .then(function (piano) {
        assert(piano)
        assert.equal(piano.name, 'piano')
        assert.equal(typeof piano.play, 'function')
      })
    })
    it('options.nameToUrl', function () {
      var toUrl = function (name) { return 'URL:' + name + '.js' }
      return Soundfont.instrument(ac, 'piano', { nameToUrl: toUrl }).then(function (piano) {
        assert.equal(load.fetch.url, 'URL:piano.js')
      })
    })
  })
})
