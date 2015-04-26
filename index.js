'use strict';

var base64DecodeToArray = require('./lib/b64decode.js');


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
    return soundfont.get(url)
      .then(soundfont.parseData)
      .then(function(json) {
        return soundfount.load(ctx, json);
      });
  });
}

/*
 * soundfont.get
 *
 * Given a URL return a Promise with the response
 *
 * You can override this method to use other sources
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

soundfont.parseData = function(data) {
  var begin = data.indexOf("MIDI.Soundfont.");
  begin = data.indexOf('=', begin) + 2;
  var end = data.lastIndexOf(',');
  return JSON.parse(data.slice(begin, end) + "}");
}

soundfont.instrumentURL = function(name) {
  return 'https://cdn.rawgit.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/' + name + '-ogg.js';
}

soundfont.load = function(ctx, data) {
  var instrument = function(note) {
    note = note.toUpperCase();
    return instrument.notes[note];
  };
  instrument.play = function(note, time) {
    time = time || 0;
    var source = context.createBufferSource();
    source.buffer = instrument(node);
    source.connect(context.destination);
    source.start(time);
  }
  instrument.context = ctx;
  instrument.notes = {};

  return new Promise(function(done, reject) {
    var decode = decodeNotes(instrument, data);
    decode.then(function() {
      done(instrument);
    });
  });
}

module.exports = soundfont;
