
var ctx = new window.AudioContext()
var soundfont = require('..')(ctx)

var piano = soundfont.instrument('acoustic_grand_piano')
play('A4 C#5 E5')
piano.onready(function () { play('E5 C#5 A4') })

function play (notes) {
  var time = ctx.currentTime
  notes.split(' ').forEach(function (note, index) {
    piano.play(note, time + index)
  })
}
