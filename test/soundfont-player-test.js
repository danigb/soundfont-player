/* global describe it AudioContext */
require('web-audio-test-api')
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var load = require('audio-loader')
var Soundfont = require('..')

var piano = fs.readFileSync(path.join(__dirname, '../examples/assets/acoustic_grand_piano-ogg.js'))

load.fetch = function (url) {
  load.fetch.url = url
  return Promise.resolve(piano.toString())
}

describe('Soundfont player', function () {
  describe('Load instruments', function () {
    it('returns a promise', function () {
      var ac = new AudioContext()
      assert.equal(typeof Soundfont.instrument(ac, 'piano').then, 'function')
    })
    it('loads mp3 by default', function () {
      var ac = new AudioContext()
      return Soundfont.instrument(ac, 'piano').then(function (piano) {
        assert.equal(piano.url,
          'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/piano-mp3.js')
      })
    })
    it('the promise resolve to an instrument', function () {
      var ac = new AudioContext()
      return Soundfont.instrument(ac, 'piano')
      .then(function (piano) {
        assert(piano)
        assert.equal(piano.name, 'piano')
        assert.equal(typeof piano.play, 'function')
      })
    })
    it('options.nameToUrl', function () {
      var ac = new AudioContext()
      var toUrl = function (name) { return 'URL:' + name + '.js' }
      return Soundfont.instrument(ac, 'piano', { nameToUrl: toUrl }).then(function (piano) {
        assert.equal(piano.url, 'URL:piano.js')
      })
    })
  })
  describe('Build urls', function () {
    it('get default url', function () {
      assert.equal(Soundfont.nameToUrl('marimba'),
        'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/marimba-mp3.js')
    })
    it('get MusyngKite url', function () {
      assert.equal(Soundfont.nameToUrl('marimba', 'FluidR3_GM'),
        'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/marimba-mp3.js')
    })
    it('accepts ogg', function () {
      assert.equal(Soundfont.nameToUrl('marimba', null, 'ogg'),
        'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/marimba-ogg.js')
    })
  })
})
