/* global describe it */
var assert = require('assert')

var Soundfont = require('../')

function stub () {
  var stub = function () {
    stub.args = Array.prototype.slice.call(arguments)
  }
  return stub
}

var audioContext = {}
var osc = { frequency: { value: -1 },
  connect: stub(), start: stub(), stop: stub()}
var gain = { gain: { value: -1 }, connect: stub() }
audioContext.createOscillator = function () { return osc }
audioContext.createGain = function () { return gain }

describe('Audio Soundfont library', function () {
  var soundfont = new Soundfont(audioContext)

  it('can use a default instrument', function () {
    var instrument = soundfont.instrument()
    var note = instrument.play('A4', 1, 2, { gain: 0.7 })
    assert(typeof note.stop === 'function')
    assert.equal(osc.frequency.value, 440)
    assert.deepEqual(osc.start.args, [ 1 ])
    assert.deepEqual(osc.stop.args, [ 3 ])
  })
})
