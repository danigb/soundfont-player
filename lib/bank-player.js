'use strict'

var midi = require('note-parser').midi
var midimessage = require('midimessage')

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

  player.midiStartedNotes = {}
  player.proccessMidiMessage = function processMidiMessage (message) {
    if (message.messageType == null) {
      message = midimessage(message)
    }

    if (message.messageType === 'noteon' && message.velocity === 0) {
      message.messageType = 'noteoff'
    }

    switch (message.messageType) {
      case 'noteon':
        player.midiStartedNotes[message.key] = player.play(message.key, 0)
        break
      case 'noteoff':
        if (player.midiStartedNotes[message.key]) {
          player.midiStartedNotes[message.key].stop()
        }
        break
      default:
    }

    return player.midiStartedNotes
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
