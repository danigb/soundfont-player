'use strict'

var midi = require('note-midi')

/**
 * Create a soundfont bank player
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} bank - a midi number to audio buffer hash map
 * @param {Hash} defaultOptions - (Optional) a hash of options:
 * - gain: the output gain (default: 2)
 * - destination: the destination of the player (default: `ac.destination`)
 */
module.exports = function (ctx, bank, defaultOptions) {
  defaultOptions = defaultOptions || {}
  return function (note, time, duration, options) {
    var m = note > 0 && note < 128 ? note : midi(note)
    var buffer = bank[m]
    if (!buffer) return

    options = options || {}
    var gain = options.gain || defaultOptions.gain || 2
    var destination = options.destination || defaultOptions.destination || ctx.destination

    var source = ctx.createBufferSource()
    source.buffer = buffer

    /* VCA */
    var vca = ctx.createGain()
    source.connect(vca)
    vca.connect(destination)
    vca.gain.linearRampToValueAtTime(gain, ctx.currentTime)
    if (duration > 0) {
      source.start(time, 0, duration)
      vca.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + duration)
    } else {
      source.start(time)
    }
    return source
  }
}
