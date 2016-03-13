'use strict'

var midi = require('note-midi')

/**
 * Create a soundfont buffers player
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} buffers - a midi number to audio buffer hash map
 * @param {Hash} options - (Optional) a hash of options:
 * - gain: the output gain (default: 2)
 * - destination: the destination of the player (default: `ac.destination`)
 */
module.exports = function (ctx, buffers, options) {
  options = options || {}
  var gain = options.gain || 2
  var destination = options.destination || ctx.destination

  return function (note, time, duration) {
    var m = note > 0 && note < 128 ? note : midi(note)
    var buffer = buffers[m]
    if (!buffer) return
    var source = ctx.createBufferSource()
    source.buffer = buffer

    /* VCA */
    var vca = ctx.createGain()
    vca.gain.value = gain
    source.connect(vca)
    vca.connect(destination)

    source.start(time)
    if (duration > 0) source.stop(time + duration)
    return source
  }
}
