/* global AudioContext */
var ac = new AudioContext()
var sf = require('..')

document.body.innerHTML = '<h1>Local piano</h1>' +
 '<h3>Load a acoustic_grand_piano soundfont from localhost and play C major scale</h3>' +
 '<p>If you can\'t hear the piano, open the development console</p>'

function localUrl (name) {
  return 'examples/assets/' + name + '-ogg.js'
}
sf.instrument(ac, 'acoustic_grand_piano', {
  nameToUrl: localUrl,
  only: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
}).then(function (piano) {
  var now = ac.currentTime
  'C D E F G A B C5 D5 C5 B A G F E D C'.split(' ').forEach(function (note, index) {
    piano.play(note.length === 1 ? note + '4' : note, now + index / 3)
  })
}).catch(function (err) {
  console.log('err', err)
})
