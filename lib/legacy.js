'use strict'

var parser = require('note-parser')

/**
 * Create a Soundfont object
 *
 * @param {AudioContext} context - the [audio context](https://developer.mozilla.org/en/docs/Web/API/AudioContext)
 * @param {Function} nameToUrl - (Optional) a function that maps the sound font name to the url
 * @return {Soundfont} a soundfont object
 */
function Soundfont (ctx, nameToUrl) {
  console.warn('new Soundfont() is deprected')
  console.log('Please use Soundfont.instrument() instead of new Soundfont().instrument()')
  if (!(this instanceof Soundfont)) return new Soundfont(ctx)

  this.nameToUrl = nameToUrl || Soundfont.nameToUrl
  this.ctx = ctx
  this.instruments = {}
  this.promises = []
}

Soundfont.prototype.onready = function (callback) {
  console.warn('deprecated API')
  console.log('Please use Promise.all(Soundfont.instrument(), Soundfont.instrument()).then() instead of new Soundfont().onready()')
  Promise.all(this.promises).then(callback)
}

Soundfont.prototype.instrument = function (name, options) {
  console.warn('new Soundfont().instrument() is deprecated.')
  console.log('Please use Soundfont.instrument() instead.')
  var ctx = this.ctx
  name = name || 'default'
  if (name in this.instruments) return this.instruments[name]
  var inst = {name: name, play: oscillatorPlayer(ctx, options)}
  this.instruments[name] = inst
  if (name !== 'default') {
    var promise = Soundfont.instrument(ctx, name, options).then(function (instrument) {
      inst.play = instrument.play
      return inst
    })
    this.promises.push(promise)
    inst.onready = function (cb) {
      console.warn('onready is deprecated. Use Soundfont.instrument().then()')
      promise.then(cb)
    }
  } else {
    inst.onready = function (cb) {
      console.warn('onready is deprecated. Use Soundfont.instrument().then()')
      cb()
    }
  }
  return inst
}

/*
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
  console.warn('Soundfont.loadBuffers is deprecate.')
  console.log('Use Soundfont.instrument(..) and get buffers properties from the result.')
  return Soundfont.instrument(ac, name, options).then(function (inst) {
    return inst.buffers
  })
}
Soundfont.loadBuffers = loadBuffers

/**
 * Returns a function that plays an oscillator
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} defaultOptions - (Optional) a hash of options:
 * - vcoType: the oscillator type (default: 'sine')
 * - gain: the output gain value (default: 0.4)
  * - destination: the player destination (default: ac.destination)
 */
function oscillatorPlayer (ctx, defaultOptions) {
  defaultOptions = defaultOptions || {}
  return function (note, time, duration, options) {
    console.warn('The oscillator player is deprecated.')
    console.log('Starting with version 0.9.0 you will have to wait until the soundfont is loaded to play sounds.')
    var midi = note > 0 && note < 129 ? +note : parser.midi(note)
    var freq = midi ? parser.midiToFreq(midi, 440) : null
    if (!freq) return

    duration = duration || 0.2

    options = options || {}
    var destination = options.destination || defaultOptions.destination || ctx.destination
    var vcoType = options.vcoType || defaultOptions.vcoType || 'sine'
    var gain = options.gain || defaultOptions.gain || 0.4

    var vco = ctx.createOscillator()
    vco.type = vcoType
    vco.frequency.value = freq

    /* VCA */
    var vca = ctx.createGain()
    vca.gain.value = gain

    /* Connections */
    vco.connect(vca)
    vca.connect(destination)

    vco.start(time)
    if (duration > 0) vco.stop(time + duration)
    return vco
  }
}

/**
 * Given a note name, return the note midi number
 *
 * @name noteToMidi
 * @function
 * @param {String} noteName
 * @return {Integer} the note midi number or null if not a valid note name
 */
Soundfont.noteToMidi = parser.midi

module.exports = Soundfont
