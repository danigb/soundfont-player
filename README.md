# soundfont-player [![npm](https://img.shields.io/npm/v/soundfont-player.svg)](https://www.npmjs.com/package/soundfont-player)

[![Build Status](https://travis-ci.org/danigb/soundfont-player.svg?branch=master)](https://travis-ci.org/danigb/soundfont-player) [![Code Climate](https://codeclimate.com/github/danigb/soundfont-player/badges/gpa.svg)](https://codeclimate.com/github/danigb/soundfont-player) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard) [![license](https://img.shields.io/npm/l/soundfont-player.svg)](https://www.npmjs.com/package/soundfont-player)

A soundfont loader/player to use MIDI sounds in WebAudio API.
The purpose of this library is be able to play MIDI soundfonts with little client code and no server setup.

It is a much simpler and lightweight replacement for [MIDI.js](https://github.com/mudcube/MIDI.js) soundfont loader (MIDI.js is much bigger, capable of play midi files, for example)

Works out of the box with Benjamin Gleitzman's package of
[pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts). Just load the library and play. Try the [demo](http://danigb.github.io/soundfont-player/#demo)

## Usage

Load the library...

```html
<script src="soundfont-player.js"></script>
```

... or require it using a npm package compatible environment (webpack, browserify):

```js
var Soundfont = require('soundfont-player')
```

Create an AudioContext and request an instrument, and play when ready:

```js
var ac = new AudioContext()
var instrument = Soundfont.instrument(ac, 'acoustic_grand_piano').then(function (piano) {
  piano.play('C4')
})
```

That's it.

__Important__: This library uses Promises, so you need a browser capable or a polyfill.

__< 0.9.x users__: The API in the 0.9.x releases has been changed and some features are going to be removed (like oscillators). While 0.9.0 adds warnings to the deprecated API, the 1.0.0 will remove the support.


## API

<a name="instrument"></a>

## instrument(ac, name, options) ⇒ <code>Promise</code>
Load a soundfont instrument. It returns a promise that resolves to a
instrument object.

The instrument object returned by the promise has the following properties:

- name: the instrument name
- play: A function to play notes from the buffer with the signature
`play(note, time, duration, options)`


The valid options are:

- `nameToUrl` <Function>: a function to convert from instrument names to URL
- `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
- `gain`: the gain of the player (1 by default)
- `notes`: an array of the notes to decode. It can be an array of strings
with note names or an array of numbers with midi note numbers. This is a
performance option: since decoding mp3 is a cpu intensive process, you can limit
limit the number of notes you want and reduce the time to load the instrument.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ac | <code>AudioContext</code> | the audio context |
| name | <code>String</code> | the instrument name. For example: 'acoustic_grand_piano' |
| options | <code>Object</code> | (Optional) the same options as Soundfont.loadBuffers |

**Example**  
```js
var Soundfont = require('sounfont-player')
Soundfont.instrument('marimba').then(function (marimba) {
  marimba.play('C4')
})
```
<a name="loadBuffers"></a>

## loadBuffers(ac, name, options) ⇒ <code>Promise</code>
Load the buffers of a given instrument name. It returns a promise that resolves
to a hash with midi note numbers as keys, and audio buffers as values.

**Kind**: global function  
**Returns**: <code>Promise</code> - a promise that resolves to a Hash of { midiNoteNum: <AudioBuffer> }

The options object accepts the following keys:

- nameToUrl {Function}: a function to convert from instrument names to urls.
By default it uses Benjamin Gleitzman's package of
[pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
- notes {Array}: the list of note names to be decoded (all by default)  

| Param | Type | Description |
| --- | --- | --- |
| ac | <code>AudioContext</code> | the audio context |
| name | <code>String</code> | the instrument name (it accepts an url if starts with "http") |
| options | <code>Object</code> | (Optional) options object |

**Example**  
```js
var Soundfont = require('soundfont-player')
Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
 buffers[60] // => An <AudioBuffer> corresponding to note C4
})
```
<a name="nameToUrl"></a>

## nameToUrl(name, format) ⇒ <code>String</code>
Given an instrument name returns a URL to to the Benjamin Gleitzman's
package of [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)

**Kind**: global function  
**Returns**: <code>String</code> - the Soundfont file url  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | instrument name |
| format | <code>String</code> | (Optional) Can be 'mp3' or 'ogg' (mp3 by default) |

**Example**  
```js
var Soundfont = require('soundfont-player')
Soundfont.nameToUrl('marimba', 'mp3')
```
<a name="noteToMidi"></a>

## noteToMidi(noteName) ⇒ <code>Integer</code>
Given a note name, return the note midi number

**Kind**: global function  
**Returns**: <code>Integer</code> - the note midi number or null if not a valid note name  

| Param | Type |
| --- | --- |
| noteName | <code>String</code> |


## Run the tests, examples and build the library distribution file

First clone this repo and install dependencies: `npm i`

To run tests use npm: `npm test`

The `dist` folder contains ready to use file for browser. You can use the dist file from the repo, but if you want to build you own run: `npm run dist`

To run the html example start a local http server. For example:

```bash
npm install -g http-server
http-server
```

And open [http://localhost:8080/examples](http://localhost:8080/examples)

To run pure javascript examples `npm install -g beefy` then `beefy examples/piano.js` and navigate to http://localhost:9966/


## Available instruments

You can grab a [json file](https://github.com/danigb/soundfont-player/blob/master/instruments.json) with all the instrument names, or require it:

```js
var instrumentNames = require('soundfont-player/instruments.json')
```

The complete list [is here](https://github.com/danigb/soundfont-player/blob/master/INSTRUMENTS.md)

## Resources

- SoundFont technical specification: http://freepats.zenvoid.org/sf2/sfspec24.pdf

## License

MIT License
