
'use strict';

var ctx = new AudioContext();
var soundfont = require('../lib/soundfont.js');
var piano;

document.addEventListener('load', function() {
  var notesField = document.getElementById('notes');
  document.getElementById('play').addEventListener("click", function(e) {
    e.preventDefault();
    if(!piano) return;
    var time = ctx.currentTime + 0.1;
    notesField.value.split(" ").forEach(function(note) {
      piano.play(note, time);
      console.log("play", note, time);
      time += 1;
    });
  });
}, true);

soundfont(ctx, 'acoustic_grand_piano').then(function(instrument) {
  piano = instrument;
  console.log("Ready");
});
