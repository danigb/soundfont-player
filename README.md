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

### Soundfont.instrument(audioContext, name, options)

Request a soundfont instrument, and return a promise that resolves to a soundfont instrument player.

The possible values for the options object are:

- `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
- `gain`: the gain of the player (1 by default)
- `notes`: an array of the notes to decode. It can be an array of strings with note names or an array of numbers with midi note numbers. This is a performance option: since decoding mp3 is a cpu intensive process, you can limit the number of notes you want and reduce the time to load the instrument.

The returned instrument has a play function : `play(noteName, time, duration [, options])`. The options, if present, overrides the options passed to the `instrument` function.

If you want to control the note release manually you can pass `-1` as duration and call `stop`:

```js
note = inst.play('c4', 0, -1)
note.stop(1) // stops after 1 second
```

### Soundfont.loadBuffers(audioContext, name, options)

Returns a Promise with a buffers object. The buffers object map midi notes to
audio buffers:

```js
Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
  buffers[60] // => An <AudioBuffer> corresponding to note C4
})
```

### Soundfont.nameToUrl(name, format)

Given an instrument name, return a url to the Benjamin Gleitzman's package of
[pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts). This is the function used to convert from instrument names to url, but you can pass other function with `options.nameToUrl`

### Soundfont.noteToMidi(noteName)

Returns the midi number of a note name.

## Configuration

Overrinding `Soundfont.nameToUrl` you can change the URL associated to a given instrument name:
```js
Soundfont.nameToUrl= function(instName) { return '/' + instName + '-ogg.js'; }
```


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
