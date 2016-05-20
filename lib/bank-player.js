'use strict'

var midi = require('note-parser').midi

/**
 * Create a soundfont bank player
 *
 * @param {AudioContext} ac - the audio context
 * @param {Hash} bank - a midi number to audio buffer hash map
 * @param {Hash} defaults - (Optional) a hash of options:
 * - gain: the output gain (default: 2)
 * - destination: the destination of the player (default: `ac.destination`)
 */
module.exports = function player (ctx, name, bank, defaults) {
  defaults = defaults || {}
  var player = { name: name }
  player.play = function (note, time, duration, options) {
    var m = note > 0 && note < 128 ? note : midi(note)
    var buffer = bank[m]
    if (!buffer) {
      console.log('Instrument ' + name + ' does NOT conaint note ' + note)
      return
    }

    options = options || {}
    var gain = options.gain || defaults.gain || 2
    var destination = options.destination || defaults.destination || ctx.destination
    return playBuffer(ctx, destination, buffer, time, duration, gain)
  }
  return player
}

function playBuffer (ctx, destination, buffer, time, duration, gain) {
  var source = ctx.createBufferSource()
  source.buffer = buffer

  /* VCA */
  var vca = ctx.createGain()
  source.connect(vca)
  vca.connect(destination)
  vca.gain.linearRampToValueAtTime(gain, time)
  if (duration > 0) {
    source.start(time, 0, duration)
    vca.gain.exponentialRampToValueAtTime(0.1, time + duration)
  } else {
    source.start(time)
  }
  return source
}
