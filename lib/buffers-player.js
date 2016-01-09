'use strict'

var midi = require('note-midi')

module.exports = function (ctx, buffers, options) {
  return function (note, time, duration) {
    var m = note > 0 && note < 128 ? note : midi(note)
    var buffer = buffers[m]
    if (!buffer) return
    var source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(time)
    if (duration > 0) source.stop(time + duration)
    return source
  }
}
