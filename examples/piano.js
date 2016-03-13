
var ctx = new window.AudioContext()
var soundfont = require('..')(ctx)

var vca = ctx.createGain()
vca.gain.value = 0.3
vca.connect(ctx.destination)

console.log('Create a piano instrument')
var piano = soundfont.instrument('acoustic_grand_piano', { destination: vca })
console.log('Play', 'A4 C#5 E5')
play('A4 C#5 E5')
piano.onready(function () {
  console.log('Instrument ready')
  vca.gain.value = 8
  play('E5 C#5 A4')
})

function play (notes) {
  var time = ctx.currentTime
  notes.split(' ').forEach(function (note, index) {
    piano.play(note, time + index)
  })
}
