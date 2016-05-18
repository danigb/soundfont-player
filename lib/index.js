'use strict'

var note = require('note-parser')
var load = require('audio-loader')
var oscillatorPlayer = require('./oscillator-player')
var bankPlayer = require('./bank-player')

/**
 * Create a Soundfont object
 *
 * @param {AudioContext} context - the [audio context](https://developer.mozilla.org/en/docs/Web/API/AudioContext)
 * @param {Function} nameToUrl - (Optional) a function that maps the sound font name to the url
 * @return {Soundfont} a soundfont object
 */
function Soundfont (ctx, nameToUrl) {
  if (!(this instanceof Soundfont)) return new Soundfont(ctx)

  this.nameToUrl = nameToUrl || Soundfont.nameToUrl
  this.ctx = ctx
  this.instruments = {}
  this.promises = []
}

Soundfont.prototype.onready = function (callback) {
  Promise.all(this.promises).then(callback)
}

Soundfont.prototype.instrument = function (name, options) {
  var ctx = this.ctx
  name = name || 'default'
  if (name in this.instruments) return this.instruments[name]
  var inst = {name: name, play: oscillatorPlayer(ctx, options)}
  this.instruments[name] = inst
  if (name !== 'default') {
    console.log('Load ', name)
    var promise = Soundfont.loadBuffers(ctx, name, options).then(function (bank) {
      inst.play = bankPlayer(ctx, bank, options)
      return inst
    })
    this.promises.push(promise)
    inst.onready = function (cb) { promise.then(cb) }
  } else {
    inst.onready = function (cb) { cb() }
  }
  return inst
}

/**
 * Load the buffers of a given instrument name
 * @param {AudioContext} ac - the audio context
 * @param {String} name - the instrument name (it accepts an url if starts with "http")
 * @param {Object} options - (Optional) options object
 * The options object accepts (all optional):
 *
 * - notes: the list of note names to be decoded
 */
function loadBuffers (ctx, name, options) {
  var nameToUrl = name.startsWith('http') ? function (x) { return x }
    : options && options.nameToUrl ? nameToUrl
    : gleitzUrl
  var opts = options && options.notes ? { only: options.notes } : {}
  return load(ctx, nameToUrl(name), opts).then(function (buffers) {
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

Soundfont.loadBuffers = loadBuffers
Soundfont.nameToUrl = gleitzUrl

if (typeof module === 'object' && module.exports) module.exports = Soundfont
if (typeof window !== 'undefined') window.Soundfont = Soundfont
