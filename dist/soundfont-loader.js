/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	if(typeof(window) !== 'undefined') {
	  window.soundfont = __webpack_require__(1);
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var base64DecodeToArray = __webpack_require__(2);

	module.exports = soundfont;

	function soundfont(ctx, name) {
	  return soundfont.get(soundfont.url(name))
	    .then(soundfont.parse)
	    .then(function(data) {
	      return createInstrument(ctx, name, data)
	    })
	    .then(decodeNotes)
	    .then(function(instruments) {
	      return instruments[0];
	    });
	}

	function createInstrument(ctx, name, data) {
	  var instrument = { ctx: ctx, name: name, data: data };
	  instrument.buffers = {};
	  instrument.play = function(name, time, duration) {
	    name = name.toUpperCase();
	    var source = ctx.createBufferSource();
	    source.buffer = instrument.buffers[name];
	    if(!source.buffer) return;
	    source.connect(ctx.destination);
	    source.start(time);
	    if(duration) source.stop(time + duration)
	    return source;
	  }

	  return instrument;
	}

	function decodeNotes(instrument) {
	  var promises = Object.keys(instrument.data).map(function(key) {
	    return decodeNoteAudioData(instrument.ctx, instrument.data[key])
	    .then(function(buffer) {
	      instrument.buffers[key] = buffer;
	      return instrument;
	    });
	  });

	  return Promise.all(promises);
	}

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

	soundfont.url = function(name) {
	  return 'https://cdn.rawgit.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/' + name + '-ogg.js';
	}

	soundfont.get = function(url) {
	  console.log("Loading " + url + " ...");
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
	soundfont.parse = function(data) {
	  var begin = data.indexOf("MIDI.Soundfont.");
	  begin = data.indexOf('=', begin) + 2;
	  var end = data.lastIndexOf(',');
	  return JSON.parse(data.slice(begin, end) + "}");
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

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


/***/ }
/******/ ]);