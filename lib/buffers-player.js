'use strict'

var midi = require('note.midi')

module.exports = function (ctx, buffers, options) {
  return function (note, time, duration) {
    var buffer = buffers[midi(note)]
    if (!buffer) return
    var source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(time)
    if (duration > 0) source.stop(time + duration)
    return source
  }
}
