
var ctx = new window.AudioContext()
var soundfont = require('..')(ctx)

var osc = soundfont.instrument()
osc.onready(function () {
  var time = ctx.currentTime
  'G3 B3 D4'.split(' ').forEach(function (note, index) {
    osc.play(note, time + index)
  })
})
