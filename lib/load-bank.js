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
module.exports = function (ctx, url, get, parse) {
  get = get || getContent
  parse = parse || parseJavascript
  return Promise.resolve(url).then(get).then(parse)
    .then(function (data) {
      return { ctx: ctx, data: data, buffers: {} }
    })
    .then(decodeBank)
    .then(function (bank) { return bank.buffers })
}

function getContent (url) {
  return new Promise(function (done, reject) {
    var req = new window.XMLHttpRequest()
    req.open('GET', url)

    req.onload = function () {
      if (req.status === 200) {
        done(req.response)
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
 * @api private
 */
function parseJavascript (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

/*
 * Decode a bank
 * @param {Object} bank - the bank object
 * @return {Promise} a promise that resolves to the bank with the buffers decoded
 * @api private
 */
function decodeBank (bank) {
  var promises = Object.keys(bank.data).map(function (note) {
    return decodeBuffer(bank.ctx, bank.data[note])
    .then(function (buffer) {
      bank.buffers[midi(note)] = buffer
    })
  })

  return Promise.all(promises).then(function () {
    return bank
  })
}
