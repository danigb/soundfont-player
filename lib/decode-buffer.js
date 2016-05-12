'use strict'

var base64DecodeToArray = require('./b64decode.js')

/**
 * Given a base64 encoded audio data, return a prmomise with an audio buffer
 *
 * @param {AudioContext} context - the [audio context](https://developer.mozilla.org/en/docs/Web/API/AudioContext)
 * @param {String} data - the base64 encoded audio data
 * @return {Promise} a promise that resolves to an [audio buffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)
 * @api private
 */
module.exports = function (context, data) {
  return new Promise(function (resolve, reject) {
    var decodedData = base64DecodeToArray(data.split(',')[1]).buffer
    context.decodeAudioData(decodedData, function (buffer) {
      resolve(buffer)
    }, function (e) {
      reject('DecodeAudioData error', e)
    })
  })
}
