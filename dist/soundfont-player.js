(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

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
function base64DecodeToArray (sBase64, nBlocksSize) {
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

module.exports = base64DecodeToArray

},{}],2:[function(require,module,exports){
'use strict'

var midi = require('note-midi')

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
    vca.gain.value = gain
    source.connect(vca)
    vca.connect(destination)
    if (duration > 0) {
      source.start(time, 0, duration)
    } else {
      source.start(time)
    }
    return source
  }
}

},{"note-midi":8}],3:[function(require,module,exports){
'use strict'

var base64DecodeToArray = require('./b64decode.js')

/**
 * Given a base64 encoded audio data, return a prmomise with an audio buffer
 *
 * @param {AudioContext} context - the [audio context](https://developer.mozilla.org/en/docs/Web/API/AudioContext)
 * @param {String} data - the base64 encoded audio data
 * @return {Promise} a promise that resolves to an [audio buffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)
 * @api private
 */
module.exports = function (context, data) {
  return new Promise(function (resolve, reject) {
    var decodedData = base64DecodeToArray(data.split(',')[1]).buffer
    context.decodeAudioData(decodedData, function (buffer) {
      resolve(buffer)
    }, function (e) {
      reject('DecodeAudioData error', e)
    })
  })
}

},{"./b64decode.js":1}],4:[function(require,module,exports){
'use strict'

var loadBank = require('./load-bank')
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
  var promise = loadBank(ctx, this.nameToUrl(name), options).then(function (bank) {
    inst.play = bankPlayer(ctx, bank, options)
    return inst
  })
  this.promises.push(promise)
  inst.onready = function (cb) {
    promise.then(cb)
  }
  return inst
}

Soundfont.loadBuffers = function (ctx, name) {
  var nameToUrl = Soundfont.nameToUrl || gleitzUrl
  return loadBank(ctx, nameToUrl(name))
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

if (typeof module === 'object' && module.exports) module.exports = Soundfont
if (typeof window !== 'undefined') window.Soundfont = Soundfont

},{"./bank-player":2,"./load-bank":5,"./oscillator-player":6}],5:[function(require,module,exports){
'use strict'

var midi = require('note-midi')
var decodeBuffer = require('./decode-buffer')

/**
 * Load a soundfont bank
 *
 * @param {AudioContext} ctx - the audio context object
 * @param {String} url - the url of the js file
 * @param {Function} get - (Optional) given a url return a promise with the contents
 * @param {Function} parse - (Optinal) given a js file return JSON object
 */
function loadBank (ctx, url, options) {
  var notes = options ? options.notes : undefined
  return Promise.resolve(url)
    .then(loadBank.fetchUrl)
    .then(loadBank.parseJS)
    .then(function (data) {
      return {ctx: ctx, data: data, buffers: {}}
    })
    .then(function (data) {
      return decodeBank(data, notes)
    })
    .then(function (bank) {
      return bank.buffers
    })
}

loadBank.fetchUrl = function (url) {
  return new Promise(function (resolve, reject) {
    var req = new window.XMLHttpRequest()
    req.open('GET', url)

    req.onload = function () {
      if (req.status === 200) {
        resolve(req.response)
      } else {
        reject(Error(req.statusText))
      }
    }
    req.onerror = function () {
      reject(Error('Network Error'))
    }
    req.send()
  })
}

/**
 *  Parse the SoundFont data and return a JSON object
 *  (SoundFont data are .js files wrapping json data)
 *
 * @param {String} data - the SoundFont js file content
 * @return {JSON} the parsed data as JSON object
 */
loadBank.parseJS = function (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

/*
 * Decode a bank
 * @param {Object} bank - the bank object
 * @param {Array} notes - an array of required notes
 * @return {Promise} a promise that resolves to the bank with the buffers decoded
 * @api private
 */

function decodeBank (bank, notes) {
  var promises = Object.keys(bank.data).map(function (note) {
    // First check is notes are passed by as param
    if (typeof notes !== 'undefined') {
      // convert the notes to midi number
      var notesMidi = notes.map(midi)
      // if the current notes is needed for the instrument.
      if (notesMidi.indexOf(midi(note)) !== -1) {
        return decodeBuffer(bank.ctx, bank.data[note])
          .then(function (buffer) {
            bank.buffers[midi(note)] = buffer
          })
      }
    } else {
      return decodeBuffer(bank.ctx, bank.data[note])
        .then(function (buffer) {
          bank.buffers[midi(note)] = buffer
        })
    }
  })

  return Promise.all(promises).then(function () {
    return bank
  })
}

module.exports = loadBank

},{"./decode-buffer":3,"note-midi":8}],6:[function(require,module,exports){
'use strict'

var freq = require('midi-freq')(440)
var midi = require('note-midi')

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
    var f = freq(midi(note))
    if (!f) return

    duration = duration || 0.2

    options = options || {}
    var destination = options.destination || defaultOptions.destination || ctx.destination
    var vcoType = options.vcoType || defaultOptions.vcoType || 'sine'
    var gain = options.gain || defaultOptions.gain || 0.4

    var vco = ctx.createOscillator()
    vco.type = vcoType
    vco.frequency.value = f

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

},{"midi-freq":7,"note-midi":8}],7:[function(require,module,exports){
/**
 * Get the pitch frequency in herzs (with custom concert tuning) from a midi number
 *
 * This function is currified so it can be partially applied (see examples)
 *
 * @name midi.freq
 * @function
 * @param {Float} tuning - the frequency of A4 (null means 440)
 * @param {Integer} midi - the midi number
 * @return {Float} the frequency of the note
 *
 * @example
 * var freq = require('midi-freq')
 * // 69 midi is A4
 * freq(null, 69) // => 440
 * freq(444, 69) // => 444
 *
 * @example
 * // partially applied
 * var freq = require('midi-freq')(440)
 * freq(69) // => 440
 */
module.exports = function freq (tuning, midi) {
  tuning = tuning || 440
  if (arguments.length > 1) return freq(tuning)(midi)

  return function (m) {
    return m > 0 && m < 128 ? Math.pow(2, (m - 69) / 12) * tuning : null
  }
}

},{}],8:[function(require,module,exports){
'use strict'

var parse = require('music-notation/note/parse')

/**
 * Get the midi number of a note
 *
 * If the argument passed to this function is a valid midi number, it returns it
 *
 * The note can be an string in scientific notation or
 * [array pitch notation](https://github.com/danigb/music.array.notation)
 *
 * @name midi
 * @function
 * @param {String|Array|Integer} note - the note in string or array notation.
 * If the parameter is a valid midi number it return it as it.
 * @return {Integer} the midi number
 *
 * @example
 * var midi = require('note-midi')
 * midi('A4') // => 69
 * midi('a3') // => 57
 * midi([0, 2]) // => 36 (C2 in array notation)
 * midi(60) // => 60
 * midi('C') // => null (pitch classes don't have midi number)
 */
function midi (note) {
  if ((typeof note === 'number' || typeof note === 'string') &&
    note > 0 && note < 128) return +note
  var p = Array.isArray(note) ? note : parse(note)
  if (!p || p.length < 2) return null
  return p[0] * 7 + p[1] * 12 + 12
}

if (typeof module === 'object' && module.exports) module.exports = midi
if (typeof window !== 'undefined') window.midi = midi

},{"music-notation/note/parse":10}],9:[function(require,module,exports){
'use strict'

/**
 * A simple and fast memoization function
 *
 * It helps creating functions that convert from string to pitch in array format.
 * Basically it does two things:
 * - ensure the function only receives strings
 * - memoize the result
 *
 * @name memoize
 * @function
 * @private
 */
module.exports = function (fn) {
  var cache = {}
  return function (str) {
    if (typeof str !== 'string') return null
    return (str in cache) ? cache[str] : cache[str] = fn(str)
  }
}

},{}],10:[function(require,module,exports){
'use strict'

var memoize = require('../memoize')
var R = require('./regex')
var BASES = { C: [0, 0], D: [2, -1], E: [4, -2], F: [-1, 1], G: [1, 0], A: [3, -1], B: [5, -2] }

/**
 * Get a pitch in [array notation]()
 * from a string in [scientific pitch notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation)
 *
 * The string to parse must be in the form of: `letter[accidentals][octave]`
 * The accidentals can be up to four # (sharp) or b (flat) or two x (double sharps)
 *
 * This function is cached for better performance.
 *
 * @name note.parse
 * @function
 * @param {String} str - the string to parse
 * @return {Array} the note in array notation or null if not valid note
 *
 * @example
 * var parse = require('music-notation/note/parse')
 * parse('C') // => [ 0 ]
 * parse('c#') // => [ 8 ]
 * parse('c##') // => [ 16 ]
 * parse('Cx') // => [ 16 ] (double sharp)
 * parse('Cb') // => [ -6 ]
 * parse('db') // => [ -4 ]
 * parse('G4') // => [ 2, 3, null ]
 * parse('c#3') // => [ 8, -1, null ]
 */
module.exports = memoize(function (str) {
  var m = R.exec(str)
  if (!m || m[5]) return null

  var base = BASES[m[1].toUpperCase()]
  var alt = m[2].replace(/x/g, '##').length
  if (m[2][0] === 'b') alt *= -1
  var fifths = base[0] + 7 * alt
  if (!m[3]) return [fifths]
  var oct = +m[3] + base[1] - 4 * alt
  var dur = m[4] ? +(m[4].substring(1)) : null
  return [fifths, oct, dur]
})

},{"../memoize":9,"./regex":11}],11:[function(require,module,exports){
'use strict'

/**
 * A regex for matching note strings in scientific notation.
 *
 * The note string should have the form `letter[accidentals][octave][/duration]`
 * where:
 *
 * - letter: (Required) is a letter from A to G either upper or lower case
 * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
 * They can NOT be mixed.
 * - octave: (Optional) a positive or negative integer
 * - duration: (Optional) anything follows a slash `/` is considered to be the duration
 * - element: (Optional) additionally anything after the duration is considered to
 * be the element name (for example: 'C2 dorian')
 *
 * @name note.regex
 * @example
 * var R = require('music-notation/note/regex')
 * R.exec('c#4') // => ['c#4', 'c', '#', '4', '', '']
 */
module.exports = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)(\/\d+|)\s*(.*)\s*$/

},{}]},{},[4]);
