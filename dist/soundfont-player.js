(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

// Decode Base64 to Uint8Array
// ---------------------------
function base64DecodeToArray(sBase64, nBlocksSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
  var nInLen = sB64Enc.length;
  var nOutLen = nBlocksSize ?
    Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize :
    nInLen * 3 + 1 >> 2;
  var taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}

module.exports = base64DecodeToArray;

},{}],2:[function(require,module,exports){
'use strict';

var NOTE = /^([a-gA-G])(#{0,2}|b{0,2})(-?\d{0,1})$/
/*
 * parseNote
 *
 * @param {String} note - the note string to be parsed
 * @return {Object} a object with the following attributes:
 * - pc: pitchClass, the letter of the note, ALWAYS in lower case
 * - acc: the accidentals (or '' if no accidentals)
 * - oct: the octave as integer. By default is 4
 */
var parse = function(note, defaultOctave, defaultValue) {
  var parsed, match;
  if(typeof(note) === 'string' && (match = NOTE.exec(note))) {
    var octave = match[3] !== '' ? +match[3] : (defaultOctave || 4);
    parsed = { pc: match[1].toLowerCase(),
      acc: match[2], oct: octave };
  } else if(typeof(note.pc) !== 'undefined'
    && typeof(note.acc) !== 'undefined'
    && typeof(note.oct) !== 'undefined') {
    parsed = note;
  }

  if (parsed) {
    parsed.midi = parsed.midi || toMidi(parsed);
    parsed.freq = parsed.freq || midiToFrequency(parsed.midi);
    return parsed;
  } else if (typeof(defaultValue) !== 'undefined') {
    return defaultValue;
  } else {
    throw Error("Invalid note format: " + note);
  }
}

parse.toString = function(obj) {
  return obj.pc + obj.acc + obj.oct;
}

var SEMITONES = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
function toMidi(note) {
  var alter = note.acc.length;
  if(note.acc[0] === 'b') alter = -1 * alter;
  return SEMITONES[note.pc] + alter + 12 * (note.oct + 1);
}
function midiToFrequency (note) {
    return Math.pow(2, (note-69)/12)*440;
}

module.exports = parse;

},{}],3:[function(require,module,exports){
'use strict';

var base64DecodeToArray = require('./lib/b64decode.js');
var parseNote = require('note-parser');

function Soundfont(audioContext) {
  if(!(this instanceof Soundfont)) return new Soundfont(audioContext);
  this.ctx = audioContext;
  this.instruments = {};
  this.promises = [];
}

Soundfont.prototype.instrument = function (name) {
  if(!name) return createDefaultInstrument(this.ctx, "default");
  var inst = this.instruments[name];
  if(!inst) {
    var ctx = this.ctx;
    var inst = createDefaultInstrument(ctx, name);
    var promise = Soundfont.loadBuffers(ctx, name).then(function(buffers) {
      var realInst = createInstrument(ctx, name, buffers);
      inst.play = realInst.play;
    });
    this.promises.push(promise);
    inst.onready = function(callback) {
      return promise.then(callback);
    };
    this.instruments[name] = inst;
  }
  return inst;
};

Soundfont.prototype.onready = function (callback) {
  Promise.all(this.promises).then(callback);
};

Soundfont.noteToMidi = function(note) {
  return parseNote(note).midi;
}

/*
 * Soundfont.nameToUrl
 * Given an instrument name returns a URL to its Soundfont js file
 *
 * @param {String} name - instrument name
 * @returns {String} the Soundfont data url
 */
Soundfont.nameToUrl = function(name) {
  return 'https://cdn.rawgit.com/gleitz/midi-js-Soundfonts/master/FluidR3_GM/' + name + '-ogg.js';
}

/*
 * SoundFont.getScript
 *
 * Given a script URL returns a Promise with the script contents as text
 * @param {String} url - the URL
 */
Soundfont.loadData = function(url) {
  return new Promise(function(done, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      if (req.status == 200) {
        done(req.response);
      } else {
        reject(Error(req.statusText));
      }
    };
    req.onerror = function() {
      reject(Error("Network Error"));
    };
    req.send();
  });
}

/*
 *  Parse the SoundFont data and return a JSCON object
 *  (SoundFont data are .js files wrapping json data)
 *
 * @param {String} data - the SoundFont js file content
 * @returns {JSON} the parsed data as JSON object
 */
Soundfont.dataToJson = function(data) {
  var begin = data.indexOf("MIDI.Soundfont.");
  begin = data.indexOf('=', begin) + 2;
  var end = data.lastIndexOf(',');
  return JSON.parse(data.slice(begin, end) + "}");
}


/*
 * loadBuffers
 *
 * Given a Web Audio context and a instrument name
 * load the instrument data and return a hash of audio buffers
 *
 * @param {Object} ctx - A Web Audio context
 * @param {String} name - the sounfont instrument name
 */
Soundfont.loadBuffers = function(ctx, name) {
  return Promise.resolve(name)
    .then(Soundfont.nameToUrl)
    .then(Soundfont.loadData)
    .then(Soundfont.dataToJson)
    .then(function(jsonData) {
      return createBank(ctx, name, jsonData)
    })
    .then(decodeBank)
    .then(function(bank) {
      return bank.buffers;
    });
}

/*
 * @param {Object} ctx - Web Audio context
 * @param {String} name - The bank name
 * @param {Object} data - The Soundfont instrument data as JSON
 */
function createBank(ctx, name, data) {
  var bank = { ctx: ctx, name: name, data: data };
  bank.buffers = {};

  return bank;
}

/*
 * INTENAL: decodeBank
 * Given an instrument, returns a Promise that resolves when
 * all the notes from de instrument are decoded
 */
function decodeBank(bank) {
  var promises = Object.keys(bank.data).map(function(note) {
    return decodeNote(bank.ctx, bank.data[note])
    .then(function(buffer) {
      note = parseNote(note);
      bank.buffers[note.midi] = buffer;
    });
  });

  return Promise.all(promises).then(function() {
    return bank;
  })
}

/*
 * Given a WAA context and a base64 encoded buffer data returns
 * a Promise that resolves when the buffer is decoded
 */
function decodeNote(context, data) {
  return new Promise(function(done, reject) {
    var decodedData = base64DecodeToArray(data.split(",")[1]).buffer;
    context.decodeAudioData(decodedData, function(buffer) {
      done(buffer);
    }, function(e) {
      reject("DecodeAudioData error", e);
    });
  });
}

/*
 * createDefaultInstrument
 */
function createDefaultInstrument(context, name) {
  var instrument = {
    name: name,
    play: function(note, time, duration, options) {
      note = parseNote(note);
      options = options || {};
      var gain = options.gain || 0.2;
      var vcoType = options.vcoType || 'sine';

      var vco = context.createOscillator();
      vco.type = vcoType;
      vco.frequency.value = note.freq;

      /* VCA */
      var vca = context.createGain();
      vca.gain.value = 0.5;

      /* Connections */
      vco.connect(vca);
      vca.connect(context.destination);

      vco.start(time);
      vco.stop(time + duration);
      return vco;
    }
  }
  return instrument;
}

function createInstrument(audioContext, name, buffers) {
  var instrument = {
    name: name,
    play: function(note, time, duration) {
      note = parseNote(note);
      var buffer = buffers[note.midi];
      if(!buffer) {
        console.log("WARNING: Note buffer not found", note, bufferName);
        return;
      }
      var source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(time);
      if(duration) source.stop(time + duration)
      return source;
    }
  }
  return instrument;
}



if (typeof define === "function" && define.amd) define(function() { return Soundfont; });
if (typeof module === "object" && module.exports) module.exports = Soundfont;
if (typeof window !== "undefined") window.Soundfont = Soundfont;

},{"./lib/b64decode.js":1,"note-parser":2}]},{},[3]);
