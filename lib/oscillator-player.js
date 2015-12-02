'use strict'

var freq = require('midi.freq')(440)
var midi = require('note.midi')

/**
 * Returns a function that plays an oscillator
 *
 */
module.exports = function (context, options) {
  return function (note, time, duration) {
    var f = freq(midi(note))
    if (!f) return

    options = options || {}
    duration = duration || 0.2

    var vcoType = options.vcoType || 'sine'

    var vco = context.createOscillator()
    vco.type = vcoType
    vco.frequency.value = f

    /* VCA */
    var vca = context.createGain()
    vca.gain.value = options.gain || 0.5

    /* Connections */
    vco.connect(vca)
    vca.connect(context.destination)

    vco.start(time)
    if (duration > 0) vco.stop(time + duration)
    return vco
  }
}
