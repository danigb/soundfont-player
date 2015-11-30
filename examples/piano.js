
var ctx = new window.AudioContext()
var soundfont = require('..')(ctx)

var piano = soundfont.instrument('acoustic_grand_piano')
piano.onready(function () {
  var time = ctx.currentTime
  'A4 C#5 E5'.split(' ').forEach(function (note, index) {
    piano.play(note, time + index)
  })
})
