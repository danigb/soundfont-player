'use strict';

var base64DecodeToArray = require('./lib/b64decode.js');

function get(url) {
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

function addNote(instrument, key, buffer) {
  var ctx = instrument.context;
  var note = instrument.notes[key] = {}
  note.buffer = buffer;
  note.play = function(time) {
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(time);
  };
}

function decodeNotes(instrument, data) {
  var promises = Object.keys(data).map(function(key) {
    return decodeNoteAudioData(instrument.context, data[key])
    .then(function(buffer) {
      addNote(instrument, key, buffer);
    });
  });

  return Promise.all(promises);
}

function soundfont(ctx, name) {
  return new Promise(function (done, reject) {
    var url = soundfont.instrumentURL(name);
    return get(url)
      .then(JSON.parse)
      .then(function(data) {
        return soundfount.load(ctx, data);
      });
  });
}

soundfont.instrumentURL = function(name) {
  return 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/' + name + '-ogg.js';
}
soundfont.load = function(ctx, data) {
  var instrument = function(note) {
    note = note.toUpperCase();
    console.debug(instrument.notes);
    console.log("joder", note, instrument.notes[note]);
    return instrument.notes[note];
  };
  instrument.context = ctx;
  instrument.notes = {};

  return decodeNotes(instrument, data);
}

module.exports = soundfont;
