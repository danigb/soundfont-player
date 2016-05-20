
var ac = new window.AudioContext()
var Soundfont = require('..')

var vca = ac.createGain()
vca.gain.value = 1
vca.connect(ac.destination)

console.log('Create a piano instrument')

Soundfont.instrument(ac, 'acoustic_grand_piano', { destination: vca }).then(function (piano) {
  console.log('Instrument ready')
  play(piano, 'E5 C#5 A4')
})

function play (piano, notes) {
  var time = ac.currentTime
  notes.split(' ').forEach(function (note, index) {
    piano.play(note, time + index)
  })
}
