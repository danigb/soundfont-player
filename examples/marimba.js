
var ac = new window.AudioContext()
var Soundfont = require('..')

var vca = ac.createGain()
vca.gain.value = 1
vca.connect(ac.destination)

document.body.innerHTML = '<h1>Marimba (soundfont-player demo)</h1>' +
 '<h3>Load a "marimba" instrument and play a chromatic scale</h3>' +
 '<p>(Open the development console)</p>'

console.log('Loading marimba...')

Soundfont.instrument(ac, 'marimba', { destination: vca }).then(function (marimba) {
  console.log('Loaded from: ', marimba.url)
  console.log('Loaded notes: ', Object.keys(marimba.buffers))
  marimba.schedule(48, function (i) {
    return { name: i + 24, time: i * 0.1 }
  })
})
