# soundfont-player [![npm](https://img.shields.io/npm/v/soundfont-player.svg)](https://www.npmjs.com/package/soundfont-player)

[![Build Status](https://travis-ci.org/danigb/soundfont-player.svg?branch=master)](https://travis-ci.org/danigb/soundfont-player) [![Code Climate](https://codeclimate.com/github/danigb/soundfont-player/badges/gpa.svg)](https://codeclimate.com/github/danigb/soundfont-player) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard) [![license](https://img.shields.io/npm/l/soundfont-player.svg)](https://www.npmjs.com/package/soundfont-player)

A soundfont loader/player to use MIDI sounds in WebAudio API.
The purpose of this project is to reduce as minimum the setup and code required
to play MIDI sounds.

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

Create a Soundfont object:

```js
var ctx = new AudioContext()
var soundfont = new Soundfont(ctx)
```

Then get the instrument and play:

```js
var instrument = soundfont.instrument('acoustic_grand_piano')
instrument.onready(function() {
  instrument.play('C4', 0)
})
```

#### Note about using the library on iOS

Since iOS don't support ogg audio files, you have tu use a custom nameToUrl function (see [configuration](https://github.com/danigb/soundfont-player#configuration)):

```js
function nameToUrl(name) {
  return 'https://cdn.rawgit.com/gleitz/midi-js-Soundfonts/master/FluidR3_GM/' + name + '-mp3.js'
}

var soundfont = new Soundfont(ctx, nameToUrl)
...
```

#### Note about using this library in production

This library uses `rawgit` to fetch the general midi soundfont banks. If you have a very high traffic site consider move the soundfont banks to your own server/CDN (take a look to [rawgit FAW](https://github.com/rgrove/rawgit/wiki/Frequently-Asked-Questions))

## What it does....

Basically it fetches the instruments from https://github.com/gleitz/midi-js-soundfonts using https://rawgit.com, decode them and wrap in a simple buffer player.

It uses Promises and the Web Audio API.

## API

### Soundfont(audioContext)

Create a soundfont object. The soundfont object has two methods:

#### soundfont.instrument(instName [, options])

Returns an instrument with the given instrument name (take a look to all the names below).

The possible properties for the options object are:

- `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
- `gain`: the gain of the player (1 by default)
- `notes`: an array of the notes to decode. It can be an array of strings with note names or an array of numbers with midi note numbers. This is a performance option: since decoding mp3 is a cpu intensive process, you can limit the number of notes you want and reduce the time to load the instrument.

The returned instrument has a play function : `play(noteName, time, duration [, options])`. The options, if present, overrides the options passed to the `instrument` function.

You can use the `instrument.onready` function to know when the instrument is loaded.

If you play the instrument before its loaded, a simple sine oscillator is used to generate the note:

```js
var inst = soundfont.instrument('accordion')
inst.play('c4', 2, 0.2) // => a sine wave sound
inst.onready(function (accordion) {
  inst.play('c4', 2, 0.2) // => a midi accordion sound
})
```

If you want to control the note release manually you can pass `-1` as duration and call `stop`:

```js
note = inst.play('c4', 0, -1)
note.stop(1) // stops after 1 second
```

The instruments are cached, so call `soundfont.instrument` twice with the same name only loads the instrument once.

You can pass `null` to get the default sine oscillator instrument:

```js
var inst = soundfont.instrument()
inst.play('c2', 1, 0.5)
```

The valid `options` are:

- `gain`: the gain value (by default 2.0)
- `destination`: the instrument destination (by default the audio context destination)

Options for `play` override the `defaultOptions` on `instrument`.

#### soundfont.onready(callback)

The callback is fired when __all__ the instruments are loaded:

```js
var harmonics = soundfont.instrument('guitar_harmonics')
var sax = soundfont.instrument('soprano_sax')
soundfont.onready(function() {
  console.log('Guitar harmonics and Sax ready.')
  harmonics.play('c3', 1, 1)
  sax.play('e2', 1, 1)
})
```

### Soundfont.loadBuffers(audioContext, instName)

Returns a Promise with a buffers object. The buffers object map midi notes to
audio buffers:

```js
Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
  buffers[Soundfont.noteToMidi('C4')] // => audio buffer of C4
})
```

### Soundfont.noteToMidi(noteName)

Returns the midi name of the note.

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
