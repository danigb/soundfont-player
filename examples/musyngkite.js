/* global AudioContext */
var ac = new AudioContext()
var sf = require('..')
var names = require('../assets/musyngkite.json')
var NOTES = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]

function loadAndPlay (name) {
  console.log('Loading... ', name)
  sf.instrument(ac, name, { soundfont: 'MusyngKite' }).then(function (player) {
    console.log('Loaded')
    player.schedule(ac.currentTime, NOTES.map(function (n, i) {
      return [i * 0.5, n]
    }))
  })
}

function viewName (name) {
  return '<a href="#">' + name + '</a><br/>'
}

document.body.innerHTML = '<div>' + names.map(viewName).join('') + '</div>'

var links = document.querySelectorAll('a')
for (var i = 0; i < links.length; i++) {
  var a = links.item(i)
  a.onclick = function (e) {
    loadAndPlay(e.target.text)
  }
}
