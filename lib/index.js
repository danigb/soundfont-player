'use strict'

var note = require('note-parser')
var load = require('audio-loader')
var player = require('./bank-player')

/**
 * Load a soundfont instrument. It returns a promise that resolves to a
 * instrument object.
 *
 * The instrument object returned by the promise has the following properties:
 *
 * - name: the instrument name
 * - url: the source url
 * - play: A function to play notes from the buffer with the signature
 * `play(note, time, duration, options)`
 *
 * @param {AudioContext} ac - the audio context
 * @param {String} name - the instrument name. For example: 'acoustic_grand_piano'
 * @param {Object} options - (Optional) the same options as Soundfont.loadBuffers
 * @return {Promise}
 *
 * @example
 * var sf = require('sounfont-player')
 * sf.instrument('marimba').then(function (marimba) {
 *   marimba.play('C4')
 * })
 */
function instrument (ac, name, options) {
  return Soundfont.loadBuffers(ac, name, options).then(function (buffers) {
    return player(ac, name, buffers, options)
  })
}

/**
 * Load the buffers of a given instrument name. It returns a promise that resolves
 * to a hash with midi note numbers as keys, and audio buffers as values.
 *
 * @param {AudioContext} ac - the audio context
 * @param {String} name - the instrument name (it accepts an url if starts with "http")
 * @param {Object} options - (Optional) options object
 * @return {Promise} a promise that resolves to a Hash of { midiNoteNum: <AudioBuffer> }
 *
 * The options object accepts the following keys:
 *
 * - nameToUrl {Function}: a function to convert from instrument names to urls.
 * By default it uses Benjamin Gleitzman's package of
 * [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
 * - notes {Array}: the list of note names to be decoded (all by default)
 *
 * @example
 */
function loadBuffers (ac, name, options) {
  var opts = options || {}
  var nameToUrl = name.startsWith('http') ? function (x) { return x }
    : opts.nameToUrl ? opts.nameToUrl
    : gleitzUrl
  var url = nameToUrl(name)
  console.log('Loading ', url)
  return load(ac, url, { only: opts.only || opts.notes }).then(function (buffers) {
    return Object.keys(buffers).reduce(function (midified, key) {
      midified[note.midi(key)] = buffers[key]
      return midified
    }, {})
  })
}

/*
 * Given an instrument name returns a URL to to the Benjamin Gleitzman's
 * package of [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
 *
 * @param {String} name - instrument name
 * @returns {String} the Soundfont file url
 */
function gleitzUrl (name) {
  return 'https://cdn.rawgit.com/gleitz/midi-js-Soundfonts/master/FluidR3_GM/' + name + '-ogg.js'
}

// In the 1.0.0 release it will be var Soundfont = {}
var Soundfont = require('./legacy')
Soundfont.instrument = instrument
Soundfont.loadBuffers = loadBuffers
Soundfont.nameToUrl = gleitzUrl
Soundfont.noteToMidi = note.midi

if (typeof module === 'object' && module.exports) module.exports = Soundfont
if (typeof window !== 'undefined') window.Soundfont = Soundfont
