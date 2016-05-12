'use strict'

var midi = require('note-midi')
var decodeBuffer = require('./decode-buffer')

/**
 * Load a soundfont bank
 *
 * @param {AudioContext} ctx - the audio context object
 * @param {String} url - the url of the js file
 * @param {Function} get - (Optional) given a url return a promise with the contents
 * @param {Function} parse - (Optinal) given a js file return JSON object
 */
function loadBank (ctx, url, options) {
  var notes = options ? options.notes : undefined
  return Promise.resolve(url)
    .then(loadBank.fetchUrl)
    .then(loadBank.parseJS)
    .then(function (data) {
      return {ctx: ctx, data: data, buffers: {}}
    })
    .then(function (data) {
      return decodeBank(data, notes)
    })
    .then(function (bank) {
      return bank.buffers
    })
}

loadBank.fetchUrl = function (url) {
  return new Promise(function (resolve, reject) {
    var req = new window.XMLHttpRequest()
    req.open('GET', url)

    req.onload = function () {
      if (req.status === 200) {
        resolve(req.response)
      } else {
        reject(Error(req.statusText))
      }
    }
    req.onerror = function () {
      reject(Error('Network Error'))
    }
    req.send()
  })
}

/**
 *  Parse the SoundFont data and return a JSON object
 *  (SoundFont data are .js files wrapping json data)
 *
 * @param {String} data - the SoundFont js file content
 * @return {JSON} the parsed data as JSON object
 */
loadBank.parseJS = function (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

/*
 * Decode a bank
 * @param {Object} bank - the bank object
 * @param {Array} notes - an array of required notes
 * @return {Promise} a promise that resolves to the bank with the buffers decoded
 * @api private
 */

function decodeBank (bank, notes) {
  var promises = Object.keys(bank.data).map(function (note) {
    // First check is notes are passed by as param
    if (typeof notes !== 'undefined') {
      // convert the notes to midi number
      var notesMidi = notes.map(midi)
      // if the current notes is needed for the instrument.
      if (notesMidi.indexOf(midi(note)) !== -1) {
        return decodeBuffer(bank.ctx, bank.data[note])
          .then(function (buffer) {
            bank.buffers[midi(note)] = buffer
          })
      }
    } else {
      return decodeBuffer(bank.ctx, bank.data[note])
        .then(function (buffer) {
          bank.buffers[midi(note)] = buffer
        })
    }
  })

  return Promise.all(promises).then(function () {
    return bank
  })
}

module.exports = loadBank
