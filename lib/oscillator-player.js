'use strict'

var freq = require('midi-freq')(440)
var midi = require('note-midi')

/**
 * Returns a function that plays an oscillator
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} options - (Optional) a hash of options:
 * - vcoType: the oscillator type (default: 'sine')
 * - gain: the output gain value (default: 0.2)
 * - destination: the player destination (default: ac.destination)
 */
module.exports = function (ctx, options) {
  options = options || {}
  var destination = options.destination || ctx.destination
  var vcoType = options.vcoType || 'sine'
  var gain = options.gain || 0.2

  return function (note, time, duration) {
    var f = freq(midi(note))
    if (!f) return

    duration = duration || 0.2

    var vco = ctx.createOscillator()
    vco.type = vcoType
    vco.frequency.value = f

    /* VCA */
    var vca = ctx.createGain()
    vca.gain.value = gain

    /* Connections */
    vco.connect(vca)
    vca.connect(destination)

    vco.start(time)
    if (duration > 0) vco.stop(time + duration)
    return vco
  }
}
