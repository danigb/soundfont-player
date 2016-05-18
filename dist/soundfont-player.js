(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var midi = require('note-parser').midi

/**
 * Create a soundfont bank player
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} bank - a midi number to audio buffer hash map
 * @param {Hash} defaultOptions - (Optional) a hash of options:
 * - gain: the output gain (default: 2)
 * - destination: the destination of the player (default: `ac.destination`)
 */
module.exports = function (ctx, bank, defaultOptions) {
  defaultOptions = defaultOptions || {}
  return function (note, time, duration, options) {
    var m = note > 0 && note < 128 ? note : midi(note)
    var buffer = bank[m]
    if (!buffer) return

    options = options || {}
    var gain = options.gain || defaultOptions.gain || 2
    var destination = options.destination || defaultOptions.destination || ctx.destination

    var source = ctx.createBufferSource()
    source.buffer = buffer

    /* VCA */
    var vca = ctx.createGain()
    source.connect(vca)
    vca.connect(destination)
    vca.gain.linearRampToValueAtTime(gain, ctx.currentTime)
    if (duration > 0) {
      source.start(time, 0, duration)
      vca.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + duration)
    } else {
      source.start(time)
    }
    return source
  }
}

},{"note-parser":7}],2:[function(require,module,exports){
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

  this.nameToUrl = nameToUrl || Soundfont.nameToUrl || gleitzUrl
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
Soundfont.loadBuffers = function (ctx, name, options) {
  var nameToUrl = name.startsWith('http') ? function (x) { return x }
    : Soundfont.nameToUrl || gleitzUrl
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
Soundfont.nameToUrl = gleitzUrl

if (typeof module === 'object' && module.exports) module.exports = Soundfont
if (typeof window !== 'undefined') window.Soundfont = Soundfont

},{"./bank-player":1,"./oscillator-player":3,"audio-loader":6,"note-parser":7}],3:[function(require,module,exports){
'use strict'

var parser = require('note-parser')

/**
 * Returns a function that plays an oscillator
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} defaultOptions - (Optional) a hash of options:
 * - vcoType: the oscillator type (default: 'sine')
 * - gain: the output gain value (default: 0.4)
  * - destination: the player destination (default: ac.destination)
 */
module.exports = function (ctx, defaultOptions) {
  defaultOptions = defaultOptions || {}
  return function (note, time, duration, options) {
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

},{"note-parser":7}],4:[function(require,module,exports){
'use strict'

// DECODE UTILITIES
function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65
    : nChr > 96 && nChr < 123 ? nChr - 71
    : nChr > 47 && nChr < 58 ? nChr + 4
    : nChr === 43 ? 62
    : nChr === 47 ? 63
    : 0
}

// Decode Base64 to Uint8Array
// ---------------------------
function decode (sBase64, nBlocksSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '')
  var nInLen = sB64Enc.length
  var nOutLen = nBlocksSize
    ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
    : nInLen * 3 + 1 >> 2
  var taBytes = new Uint8Array(nOutLen)

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255
      }
      nUint24 = 0
    }
  }
  return taBytes
}

module.exports = { decode: decode }

},{}],5:[function(require,module,exports){
/* global XMLHttpRequest */
'use strict'

/**
 * Given a url and a return type, returns a promise to the content of the url
 * Basically it wraps a XMLHttpRequest into a Promise
 *
 * @param {String} url
 * @param {String} type - can be 'text' or 'arraybuffer'
 * @return {Promise}
 */
module.exports = function (url, type) {
  return new Promise(function (done, reject) {
    var req = new XMLHttpRequest()
    if (type) req.responseType = type

    req.open('GET', url)
    req.onload = function () {
      req.status === 200 ? done(req.response) : reject(Error(req.statusText))
    }
    req.onerror = function () { reject(Error('Network Error')) }
    req.send()
  })
}

},{}],6:[function(require,module,exports){
'use strict'

var base64 = require('./base64')
var fetch = require('./fetch')

// Given a regex, return a function that test if against a string
function fromRegex (r) {
  return function (o) { return typeof o === 'string' && r.test(o) }
}
// Try to apply a prefix to a name
function prefix (pre, name) {
  return typeof pre === 'string' ? pre + name
    : typeof pre === 'function' ? pre(name)
    : name
}

/**
 * Load one or more audio files
 *
 *
 * Possible option keys:
 *
 * - __from__ {Function|String}: a function or string to convert from file names to urls.
 * If is a string it will be prefixed to the name:
 * `load(ac, 'snare.mp3', { from: 'http://audio.net/samples/' })`
 * If it's a function it receives the file name and should return the url as string.
 * - __only__ {Array} - when loading objects, if provided, only the given keys
 * will be included in the decoded object:
 * `load(ac, 'piano.json', { only: ['C2', 'D2'] })`
 *
 * @param {AudioContext} ac - the audio context
 * @param {Object} source - the object to be loaded
 * @param {Object} options - (Optional) the load options for that object
 * @param {Object} defaultValue - (Optional) the default value to return as
 * in a promise if not valid loader found
 */
function load (ac, source, options, defVal) {
  var loader =
    // Basic audio loading
      isArrayBuffer(source) ? loadArrayBuffer
    : isAudioFileName(source) ? loadAudioFile
    : isPromise(source) ? loadPromise
    // Compound objects
    : isArray(source) ? loadArrayData
    : isObject(source) ? loadObjectData
    : isJsonFileName(source) ? loadJsonFile
    // Base64 encoded audio
    : isBase64Audio(source) ? loadBase64Audio
    : isJsFileName(source) ? loadMidiJSFile
    : null

  var opts = options || {}
  return loader ? loader(ac, source, opts)
    : defVal ? Promise.resolve(defVal)
    : Promise.reject('Source not valid (' + source + ')')
}
load.fetch = fetch

// BASIC AUDIO LOADING
// ===================

// Load (decode) an array buffer
function isArrayBuffer (o) { return o instanceof ArrayBuffer }
function loadArrayBuffer (ac, array, options) {
  return new Promise(function (done, reject) {
    ac.decodeAudioData(array,
      function (buffer) { done(buffer) },
      function () { reject("Can't decode audio data (" + array.slice(0, 30) + '...)') }
    )
  })
}

// Load an audio filename
var isAudioFileName = fromRegex(/\.(mp3|wav|ogg)(\?.*)?$/i)
function loadAudioFile (ac, name, options) {
  var url = prefix(options.from, name)
  return load(ac, load.fetch(url, 'arraybuffer'), options)
}

// Load the result of a promise
function isPromise (o) { return o && typeof o.then === 'function' }
function loadPromise (ac, promise, options) {
  return promise.then(function (value) {
    return load(ac, value, options)
  })
}

// COMPOUND OBJECTS
// ================

// Try to load all the items of an array
var isArray = Array.isArray
function loadArrayData (ac, array, options) {
  return Promise.all(array.map(function (data) {
    return load(ac, data, options, data)
  }))
}

// Try to load all the values of a key/value object
function isObject (o) { return o && typeof o === 'object' }
function loadObjectData (ac, obj, options) {
  var dest = {}
  var promises = Object.keys(obj).map(function (key) {
    if (options.only && options.only.indexOf(key) === -1) return null
    var value = obj[key]
    return load(ac, value, options, value).then(function (audio) {
      dest[key] = audio
    })
  })
  return Promise.all(promises).then(function () { return dest })
}

// Load the content of a JSON file
var isJsonFileName = fromRegex(/\.json(\?.*)?$/i)
function loadJsonFile (ac, name, options) {
  var url = prefix(options.from, name)
  return load(ac, load.fetch(url, 'text').then(JSON.parse), options)
}

// BASE64 ENCODED FORMATS
// ======================

// Load strings with Base64 encoded audio
var isBase64Audio = fromRegex(/^data:audio/)
function loadBase64Audio (ac, source, options) {
  var i = source.indexOf(',')
  return load(ac, base64.decode(source.slice(i + 1)).buffer, options)
}

// Load .js files with MidiJS soundfont prerendered audio
var isJsFileName = fromRegex(/\.js(\?.*)?$/i)
function loadMidiJSFile (ac, name, options) {
  var url = prefix(options.from, name)
  return load(ac, load.fetch(url, 'text').then(midiJsToJson), options)
}

// convert a MIDI.js javascript soundfont file to json
function midiJsToJson (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  if (begin < 0) throw Error('Invalid MIDI.js Soundfont format')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

if (typeof module === 'object' && module.exports) module.exports = load
if (typeof window !== 'undefined') window.loadAudio = load

},{"./base64":4,"./fetch":5}],7:[function(require,module,exports){
'use strict'

var REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/
/**
 * A regex for matching note strings in scientific notation.
 *
 * @name regex
 * @function
 * @return {RegExp} the regexp used to parse the note name
 *
 * The note string should have the form `letter[accidentals][octave][element]`
 * where:
 *
 * - letter: (Required) is a letter from A to G either upper or lower case
 * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
 * They can NOT be mixed.
 * - octave: (Optional) a positive or negative integer
 * - element: (Optional) additionally anything after the duration is considered to
 * be the element name (for example: 'C2 dorian')
 *
 * The executed regex contains (by array index):
 *
 * - 0: the complete string
 * - 1: the note letter
 * - 2: the optional accidentals
 * - 3: the optional octave
 * - 4: the rest of the string (trimmed)
 *
 * @example
 * var parser = require('note-parser')
 * parser.regex.exec('c#4')
 * // => ['c#4', 'c', '#', '4', '']
 * parser.regex.exec('c#4 major')
 * // => ['c#4major', 'c', '#', '4', 'major']
 * parser.regex().exec('CMaj7')
 * // => ['CMaj7', 'C', '', '', 'Maj7']
 */
function regex () { return REGEX }

var SEMITONES = [0, 2, 4, 5, 7, 9, 11]
/**
 * Parse a note name in scientific notation an return it's components,
 * and some numeric properties including midi number and frequency.
 *
 * @name parse
 * @function
 * @param {String} note - the note string to be parsed
 * @param {Boolean} isTonic - true if the note is the tonic of something.
 * If true, en extra tonicOf property is returned. It's false by default.
 * @param {Float} tunning - The frequency of A4 note to calculate frequencies.
 * By default it 440.
 * @return {Object} the parsed note name or null if not a valid note
 *
 * The parsed note name object will ALWAYS contains:
 * - letter: the uppercase letter of the note
 * - acc: the accidentals of the note (only sharps or flats)
 * - pc: the pitch class (letter + acc)
 * - step: s a numeric representation of the letter. It's an integer from 0 to 6
 * where 0 = C, 1 = D ... 6 = B
 * - alt: a numeric representation of the accidentals. 0 means no alteration,
 * positive numbers are for sharps and negative for flats
 * - chroma: a numeric representation of the pitch class. It's like midi for
 * pitch classes. 0 = C, 1 = C#, 2 = D ... It can have negative values: -1 = Cb.
 * Can detect pitch class enhramonics.
 *
 * If the note has octave, the parser object will contain:
 * - oct: the octave number (as integer)
 * - midi: the midi number
 * - freq: the frequency (using tuning parameter as base)
 *
 * If the parameter `isTonic` is set to true, the parsed object will contain:
 * - tonicOf: the rest of the string that follows note name (left and right trimmed)
 *
 * @example
 * var parse = require('note-parser').parse
 * parse('Cb4')
 * // => { letter: 'C', acc: 'b', pc: 'Cb', step: 0, alt: -1, chroma: -1,
 *         oct: 4, midi: 59, freq: 246.94165062806206 }
 * // if no octave, no midi, no freq
 * parse('fx')
 * // => { letter: 'F', acc: '##', pc: 'F##', step: 3, alt: 2, chroma: 7 })
 */
function parse (str, isTonic, tuning) {
  if (typeof str !== 'string') return null
  var m = REGEX.exec(str)
  if (!m || !isTonic && m[4]) return null

  var p = { letter: m[1].toUpperCase(), acc: m[2].replace(/x/g, '##') }
  p.pc = p.letter + p.acc
  p.step = (p.letter.charCodeAt(0) + 3) % 7
  p.alt = p.acc[0] === 'b' ? -p.acc.length : p.acc.length
  p.chroma = SEMITONES[p.step] + p.alt
  if (m[3]) {
    p.oct = +m[3]
    p.midi = p.chroma + 12 * (p.oct + 1)
    p.freq = midiToFreq(p.midi, tuning)
  }
  if (isTonic) p.tonicOf = m[4]
  return p
}

/**
 * Given a midi number, return its frequency
 * @param {Integer} midi - midi note number
 * @param {Float} tuning - (Optional) the A4 tuning (440Hz by default)
 * @return {Float} frequency in hertzs
 */
function midiToFreq (midi, tuning) {
  return Math.pow(2, (midi - 69) / 12) * (tuning || 440)
}

var parser = { parse: parse, regex: regex, midiToFreq: midiToFreq }
var FNS = ['letter', 'acc', 'pc', 'step', 'alt', 'chroma', 'oct', 'midi', 'freq']
FNS.forEach(function (name) {
  parser[name] = function (src) {
    var p = parse(src)
    return p && (typeof p[name] !== 'undefined') ? p[name] : null
  }
})

module.exports = parser

// extra API docs
/**
 * Get midi of a note
 *
 * @name midi
 * @function
 * @param {String} note - the note name
 * @return {Integer} the midi number of the note or null if not a valid note
 * or the note does NOT contains octave
 * @example
 * var parser = require('note-parser')
 * parser.midi('A4') // => 69
 * parser.midi('A') // => null
 */
/**
 * Get freq of a note in hertzs (in a well tempered 440Hz A4)
 *
 * @name freq
 * @function
 * @param {String} note - the note name
 * @return {Float} the freq of the number if hertzs or null if not valid note
 * or the note does NOT contains octave
 * @example
 * var parser = require('note-parser')
 * parser.freq('A4') // => 440
 * parser.freq('A') // => null
 */

},{}]},{},[2]);
