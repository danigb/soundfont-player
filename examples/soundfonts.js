/* global AudioContext */
var ac = new AudioContext()
var sf = require('..')
var names = require('./assets/musyngkite.json')
var NOTES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
var notes = NOTES.map(function (n, i) {
  return { time: i * 0.3, note: n + 60 }
})

function loadAndPlay (name) {
  console.log('Loading... ', name)
  sf.instrument(ac, name, { soundfont: 'FluidR3_GM' }).then(function (p1) {
    var now = ac.currentTime
    p1.schedule(now, notes)
    sf.instrument(ac, name, { soundfont: 'MusyngKite' }).then(function (p2) {
      p2.schedule(now + 12 * 0.3, notes)
    })
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
