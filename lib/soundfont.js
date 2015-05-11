'use strict';

var base64DecodeToArray = require('./b64decode.js');

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
