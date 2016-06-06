/* global AudioContext */
var ac = new AudioContext()
var sf = require('..')

document.body.innerHTML = '<h1>Local piano</h1>' +
 '<h3>Load a piano soundfont from localhost, but only C4 major scale notes</h3>' +
 '<h3>Then play a chromatic scale</h3>' +
 '<p>If you can\'t hear the piano, open the development console</p>'

function localUrl (name) {
  return 'examples/assets/' + name + '-ogg.js'
}
function arr (n) { return new Array(n + 1).join('0').split('') }

sf.instrument(ac, 'acoustic_grand_piano', {
  nameToUrl: localUrl,
  only: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
}).then(function (piano) {
  piano.schedule(ac.currentTime, arr(13).map(function (_, i) {
    return [i * 0.5, i + 60]
  }))
}).catch(function (err) {
  console.log('err', err)
})
