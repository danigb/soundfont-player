'use strict';

var base64DecodeToArray = require('./lib/b64decode.js');
var parse = require('note-parser');

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

function normalizeNote(name) {
  name = name.toLowerCase();
  if(name.indexOf('#') > 0) {
    name = name.replace(/#/g, 'b');
    var pc = String.fromCharCode(name.charCodeAt(0) + 1);
    pc = pc === 'h' ? 'a' : pc;
    return pc + name.substring(1);
  } else {
    return name;
  }
}

function createInstrument(ctx, name, data) {
  var instrument = { ctx: ctx, name: name, data: data };
  instrument.buffers = {};
  instrument.play = function(name, time, duration) {
    var note = normalizeNote(name);
    var source = ctx.createBufferSource();
    var buffer = instrument.buffers[note];
    if(!buffer) {
      console.log("WARNING: Note buffer not found", name, note);
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

if (typeof define === "function" && define.amd) define(function() { return soundfont; });
if (typeof module === "object" && module.exports) module.exports = soundfont;
if (typeof window !== "undefined") window.soundfont = soundfont;
