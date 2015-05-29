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

var base64DecodeToArray = require('./lib/b64decode.js');

/*
 * Main funtion. Given a Web Audio context and a instrument name
 * load the instrument data and return a simple instrument
 *
 * @param {Object} ctx - A Web Audio context
 * @param {String} name - the sounfont instrument name
 */
function soundfont(ctx, name) {
  return soundfont.get(soundfont.url(name))
    .then(soundfont.parse)
    .then(function(soundFont) {
      return createInstrument(ctx, name, soundFont)
    })
    .then(decodeNotes)
    .then(function(instruments) {
      return instruments[0];
    });
}

/*
 * API: soundfont.url
 * Given an instrument name returns a URL to its soundfont js file
 *
 * @param {String} name - instrument name
 * @returns {String} the soundfont data url
 */
soundfont.url = function(name) {
  return 'https://cdn.rawgit.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/' + name + '-ogg.js';
}

/*
 * API: soundfont.noteToBufferName
 * Given a note name, return a buffer name.
 *
 * @param {String} note - the note name, exampoles: c#2, Db4
 * @returns {String} the buffer name associated to that note
 */
soundfont.noteToBufferName = function(note) {
  var name = note.toLowerCase();
  if(name.indexOf('#') > 0) {
    name = name.replace(/#/g, 'b');
    var pc = String.fromCharCode(name.charCodeAt(0) + 1);
    pc = pc === 'h' ? 'a' : pc;
    return pc + name.substring(1);
  } else {
    return name;
  }
}

/*
 * Send a GET request to the url and return a Promise
 * @param {String} url - the URL
 */
soundfont.get = function(url) {
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
soundfont.parse = function(data) {
  var begin = data.indexOf("MIDI.Soundfont.");
  begin = data.indexOf('=', begin) + 2;
  var end = data.lastIndexOf(',');
  return JSON.parse(data.slice(begin, end) + "}");
}

/*
 * PRIVATE: Create a instrument object.
 *
 * @param {Object} ctx - Web Audio context
 * @param {String} note - The note name
 * @param {Object} data - The soundfont instrument data as JSON
 */
function createInstrument(ctx, note, data) {
  var instrument = { ctx: ctx, note: note, data: data };
  instrument.buffers = {};
  instrument.play = function(note, time, duration) {
    var bufferName = soundfont.noteToBufferName(note);
    var source = ctx.createBufferSource();
    var buffer = instrument.buffers[bufferName];
    if(!buffer) {
      console.log("WARNING: Note buffer not found", note, bufferName);
      return;
    }
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(time);
    if(duration) source.stop(time + duration)
    return source;
  }

  return instrument;
}

/*
 * INTENAL: decodeNotes
 * Given an instrument, returns a Promise that resolves when
 * all the notes from de instrument are decoded
 */
function decodeNotes(instrument) {
  var promises = Object.keys(instrument.data).map(function(key) {
    return decodeNoteAudioData(instrument.ctx, instrument.data[key])
    .then(function(buffer) {
      instrument.buffers[key.toLowerCase()] = buffer;
      return instrument;
    });
  });

  return Promise.all(promises);
}

/*
 * INTERNAL: decodeAudioData
 * Given a WAA context and a base64 encoded buffer data returns
 * a Promise that resolves when the buffer is decoded
 */
function decodeNoteAudioData(context, data) {
  return new Promise(function(done, reject) {
    var decodedData = base64DecodeToArray(data.split(",")[1]).buffer;
    context.decodeAudioData(decodedData, function(buffer) {
      done(buffer);
    }, function(e) {
      reject("DecodeAudioData error", e);
    });
  });
}


if (typeof define === "function" && define.amd) define(function() { return soundfont; });
if (typeof module === "object" && module.exports) module.exports = soundfont;
if (typeof window !== "undefined") window.soundfont = soundfont;

},{"./lib/b64decode.js":1}]},{},[2]);
