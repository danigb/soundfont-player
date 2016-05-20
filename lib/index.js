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
 * - play: A function to play notes from the buffer with the signature
 * `play(note, time, duration, options)`
 *
 *
 * The valid options are:
 *
 * - `nameToUrl` <Function>: a function to convert from instrument names to URL
 * - `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
 * - `gain`: the gain of the player (1 by default)
 * - `notes`: an array of the notes to decode. It can be an array of strings
 * with note names or an array of numbers with midi note numbers. This is a
 * performance option: since decoding mp3 is a cpu intensive process, you can limit
 * limit the number of notes you want and reduce the time to load the instrument.
 *
 * @param {AudioContext} ac - the audio context
 * @param {String} name - the instrument name. For example: 'acoustic_grand_piano'
 * @param {Object} options - (Optional) the same options as Soundfont.loadBuffers
 * @return {Promise}
 *
 * @example
 * var Soundfont = require('sounfont-player')
 * Soundfont.instrument('marimba').then(function (marimba) {
 *   marimba.play('C4')
 * })
 */
function instrument (ac, name, options) {
  return loadBuffers(ac, name, options).then(function (buffers) {
    var p = player(ac, name, buffers, options)
    return p
  })
}

function isSoundfontURL (name) {
  return /\.js(\?.*)?$/i.test(name)
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
 * var Soundfont = require('soundfont-player')
 * Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
 *  buffers[60] // => An <AudioBuffer> corresponding to note C4
 * })
 */
function loadBuffers (ac, name, options) {
  var opts = options || {}
  var isUrl = opts.isSoundfontURL || isSoundfontURL
  var url = isUrl(name) ? name
    : opts.nameToUrl ? opts.nameToUrl(name)
    : nameToUrl(name)

  return load(ac, url, { only: opts.only || opts.notes }).then(function (buffers) {
    return Object.keys(buffers).reduce(function (midified, key) {
      midified[note.midi(key)] = buffers[key]
      return midified
    }, {})
  })
}

/**
 * Given an instrument name returns a URL to to the Benjamin Gleitzman's
 * package of [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
 *
 * @param {String} name - instrument name
 * @param {String} format - (Optional) Can be 'mp3' or 'ogg' (mp3 by default)
 * @returns {String} the Soundfont file url
 * @example
 * var Soundfont = require('soundfont-player')
 * Soundfont.nameToUrl('marimba', 'mp3')
 */
function nameToUrl (name, format) {
  format = format === 'ogg' ? format : 'mp3'
  return 'http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/' + name + '-' + format + '.js'
}

// In the 1.0.0 release it will be:
// var Soundfont = {}
var Soundfont = require('./legacy')
Soundfont.instrument = instrument
Soundfont.loadBuffers = loadBuffers
Soundfont.nameToUrl = nameToUrl

/**
 * Given a note name, return the note midi number
 *
 * @name noteToMidi
 * @function
 * @param {String} noteName
 * @return {Integer} the note midi number or null if not a valid note name
 */
Soundfont.noteToMidi = note.midi

if (typeof module === 'object' && module.exports) module.exports = Soundfont
if (typeof window !== 'undefined') window.Soundfont = Soundfont
