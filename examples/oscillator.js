
var ctx = new window.AudioContext()
var soundfont = require('..')(ctx)

var osc = soundfont.instrument()
osc.onready(function () {
  var time = ctx.currentTime
  'G4 B4 D5'.split(' ').forEach(function (note, index) {
    osc.play(note, time + index)
  })
})
