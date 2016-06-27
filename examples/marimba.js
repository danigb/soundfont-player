var AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var Soundfont = require('..')

var vca = ac.createGain()
vca.gain.value = 1
vca.connect(ac.destination)

document.body.innerHTML = '<h1>Marimba (soundfont-player demo)</h1>' +
 '<h3>Load a "marimba" instrument and play a chromatic scale</h3>' +
 '<p>(Open the development console)</p>'

console.log('Loading marimba...')

function arr (n) { return new Array(n + 1).join('0').split('') }

Soundfont.instrument(ac, 'marimba', { destination: vca }).then(function (marimba) {
  console.log('Loaded from: ', marimba.url)
  console.log('Loaded notes: ', Object.keys(marimba.buffers))
  // Add an event listener
  marimba.on('event', function (event, time, obj, opts) {
    console.log(event, time, obj, opts)
  })
  marimba.schedule(ac.currentTime, arr(25).map(function (_, i) {
    return { note: i + 60, time: i * 0.2 }
  }))
})
