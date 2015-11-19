'use strict';

var base64DecodeToArray = require('./lib/b64decode.js');
var parseNote = require('note-parser');

function Soundfont (audioContext, soundfontsUrlRoot, preferredExtension) {
  if (!(this instanceof Soundfont)) return new Soundfont(audioContext);
  this.ctx = audioContext;
  this.instruments = {};
  this.promises = [];
  this.soundfontsUrlRoot = soundfontsUrlRoot;
  this.preferredExtension = preferredExtension;
}

Soundfont.prototype.instrument = function (name) {
  if (!name) return createDefaultInstrument(this.ctx, 'default');
  var inst = this.instruments[name];
  if (!inst) {
    var ctx = this.ctx;
    inst = createDefaultInstrument(ctx, name);
    var promise = Soundfont.loadBuffers(ctx, name, this).then(function (buffers) {
      var realInst = createInstrument(ctx, name, buffers);
      inst.play = realInst.play;
    });
    this.promises.push(promise);
    inst.onready = function (callback) {
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
 * (`this` may be bound to a `Soundfont` instance with its own
 * urlRoot and extension; if not, defaults are used.)
 *
 * @param {String} name - instrument name
 * @returns {String} the Soundfont data url
 */
Soundfont.nameToUrl = function(name) {
  var urlRoot = this.soundfontsUrlRoot || 'https://cdn.rawgit.com/gleitz/midi-js-Soundfonts/master/FluidR3_GM/';
  var extension = this.preferredExtension && this.preferredExtension === 'mp3' ? 'mp3' : 'ogg';
  return urlRoot + name + '-' + extension + '.js';
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
      reject(Error('Network Error'));
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
  var begin = data.indexOf('MIDI.Soundfont.');
  begin = data.indexOf('=', begin) + 2;
  var end = data.lastIndexOf(',');
  return JSON.parse(data.slice(begin, end) + '}');
}


/*
 * loadBuffers
 *
 * Given a Web Audio context and a instrument name
 * load the instrument data and return a hash of audio buffers
 *
 * @param {Object} ctx - A Web Audio context
 * @param {String} name - the soundfont instrument name
 * @param {Soundfont} soundfont - the soundfont using the buffers (optional)
 */
Soundfont.loadBuffers = function(ctx, name, soundfont) {
  var nameToUrl = Soundfont.nameToUrl;
  if (soundfont instanceof Soundfont) nameToUrl = nameToUrl.bind(soundfont);

  return Promise.resolve(name)
    .then(nameToUrl)
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
    var decodedData = base64DecodeToArray(data.split(',')[1]).buffer;
    context.decodeAudioData(decodedData, function(buffer) {
      done(buffer);
    }, function(e) {
      reject('DecodeAudioData error', e);
    });
  });
}

/*
 * createDefaultInstrument
 */
function createDefaultInstrument (context, name) {
  var instrument = {
    name: name,
    play: function (note, time, duration, options) {
      note = parseNote(note);
      duration = duration || 0.2;
      options = options || {};

      var vcoType = options.vcoType || 'sine';

      var vco = context.createOscillator();
      vco.type = vcoType;
      vco.frequency.value = note.freq;

      /* VCA */
      var vca = context.createGain();
      vca.gain.value = options.gain || 0.5;

      /* Connections */
      vco.connect(vca);
      vca.connect(context.destination);

      vco.start(time);
      if (duration > 0) vco.stop(time + duration);
      return vco;
    }
  };
  return instrument;
}

function createInstrument (audioContext, name, buffers) {
  var instrument = {
    name: name,
    play: function (note, time, duration) {
      note = parseNote(note);
      var buffer = buffers[note.midi];
      if (!buffer) {
        console.log('WARNING: Note buffer not found', name, note);
        return;
      }
      var source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(time);
      if (duration > 0) source.stop(time + duration);
      return source;
    }
  };
  return instrument;
}

if (typeof define === 'function' && define.amd) define(function () { return Soundfont; });
if (typeof module === 'object' && module.exports) module.exports = Soundfont;
if (typeof window !== 'undefined') window.Soundfont = Soundfont;
