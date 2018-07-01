# soundfont-player [![npm](https://img.shields.io/npm/v/soundfont-player.svg?style=flat-square)](https://www.npmjs.com/package/soundfont-player)

[![Build Status](https://img.shields.io/travis/danigb/soundfont-player/master.svg?style=flat-square)](https://travis-ci.org/danigb/soundfont-player)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard) [![license](https://img.shields.io/npm/l/soundfont-player.svg?style=flat-square)](https://www.npmjs.com/package/soundfont-player)

A soundfont loader/player to play MIDI sounds using WebAudio API.

It loads Benjamin Gleitzman's package of
[pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts) by default with no server setup. Just a few lines of javascript:

```js
Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano').then(function (piano) {
  piano.play('C4')
})
```

It is a much simpler and lightweight replacement for [MIDI.js](https://github.com/mudcube/MIDI.js) soundfont loader (MIDI.js is much bigger, capable of play midi files, for example, but it weights an order of magnitude more).

## Features

- Load soundfont files in MIDI.js format or json format.
- Unlimited poliphony (and stop all sounds with a single function call)
- Use midi note numbers. Accepts decimal points to detune.
- Easily connect to a Web MIDI API `MidiInput`
- Schedule a list of notes

It uses [audio-loader](https://github.com/danigb/audio-loader) to load soundfont files and [sample-player](https://github.com/danigb/sample-player) to play the sounds.

## Install

Via npm: `npm install --save soundfont-player`

Or download the [minified code](https://raw.githubusercontent.com/danigb/soundfont-player/master/dist/soundfont-player.min.js) and include it in your html:

```html
<script src="soundfont-player.js"></script>
<script>
  Soundfont.instrument(new AudioContext(), 'marimba').then(function (marimba) {
  })
</script>
```

## Usage

__The soundfont loader__

Out of the box are two Soundfonts available: MusyngKite and FluidR3_GM (MusyngKite by default: has more quality, but also weights more). You can load them with `instrument` function:

```js
Soundfont.instrument(ac, 'clavinet').then(function (clavinet) {
  clavinet.play('C4')
})
// or use FluidR3_GM
Soundfont.instrument(ac, 'clavinet', { soundfont: 'FluidR3_GM' }).then(function (clavinet) {
  clavinet.play('C4')
})
```

You can load your own Soundfont files passing the .js path or url:

```js
Soundfont.instrument(ac, '/soundfonts/clavinet-mp3.js').then(...)
// or
Soundfont.instrument(ac, 'clavinet-mp3.js', { from: 'server.com/soundfonts/' })
```

__The soundfont player__

Once you have an instrument you can:

```js
// The first step is always create an instrument:
Soundfont.instrument(ac, 'clavinet').then(function (clavinet) {
  // Then you can play a note using names or midi numbers:
  clavinet.play('C4')
  clavinet.play(69)
  // float point midi numbers are accepted (and notes are detuned):
  clavinet.play(60.5) // => 500 cents over C4

  // you can stop all playing notes
  clavinet.stop()
  // or stop only one
  clavinet.play('C4').stop(ac.currentTime + 0.5)
  // or pass a duration argument to `play`
  clavinet.play('C4', ac.currentTime, { duration: 0.5})


  // You can connect the instrument to a midi input:
  window.navigator.requestMIDIAccess().then(function (midiAccess) {
    midiAccess.inputs.forEach(function (midiInput) {
      clavinet.listenToMidi(midiInput)
    })
  })

  // Or schedule events at a given time
  clavinet.schedule(ac.currentTime + 5, [ { time: 0, note: 60}, { time: 0.5, note: 61}, ...])
})
```

## API

__< 0.9.x users__: The API in the 0.9.x releases has been changed and some features are going to be removed (like oscillators). While 0.9.0 adds warnings to the deprecated API, the 1.0.0 will remove the support.


<a name="instrument"></a>

## instrument(ac, name, options) ⇒ <code>Promise</code>
Load a soundfont instrument. It returns a promise that resolves to a
instrument object.

The instrument object returned by the promise has the following properties:

- name: the instrument name
- play: A function to play notes from the buffer with the signature
`play(note, time, duration, options)`

The valid options are:

- `format`: can be 'mp3' or 'ogg'
- `soundfont`: can be 'FluidR3_GM' or 'MusyngKite'
- `nameToUrl`: a function to convert from instrument names to URL
- `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
- `gain`: the gain (volume) of the player (1 by default)
- `attack`: the attack time of the amplitude envelope
- `decay`: the decay time of the amplitude envelope
- `sustain`: the sustain gain value of the amplitude envelope
- `release`: the release time of the amplitude envelope
- `adsr`: the amplitude envelope as array of `[attack, decay, sustain, release]`. It overrides other options.
- `loop`: set to true to loop audio buffers
- `notes`: an array of the notes to decode. It can be an array of strings
with note names or an array of numbers with midi note numbers. This is a
performance option: since decoding mp3 is a cpu intensive process, you can limit
limit the number of notes you want and reduce the time to load the instrument.

| Param | Type | Description |
| --- | --- | --- |
| ac | <code>AudioContext</code> | the audio context |
| name | <code>String</code> | the instrument name. For example: 'acoustic_grand_piano' |
| options | <code>Object</code> | (Optional) the same options as Soundfont.loadBuffers |

**Example**  
```js
var Soundfont = require('sounfont-player')
var ac = new AudioContext()
Soundfont.instrument(ac, 'marimba', { soundfont: 'MusyngKite' }).then(function (marimba) {
  marimba.play('C4')
})
```

<a name="player"></a>
### The player

The player object returned by the promise has the following functions:

<a name="player.start"></a>
#### player.play
An alias for `player.start`

<a name="player.start"></a>
#### player.start(name, when, options) ⇒ <code>AudioNode</code>
Start a sample buffer. The returned object has a function `stop(when)` to stop the sound.

Valid options are:

- `gain`: float between 0 to 1
- `attack`: the attack time of the amplitude envelope
- `decay`: the decay time of the amplitude envelope
- `sustain`: the sustain gain value of the amplitude envelope
- `release`: the release time of the amplitude envelope
- `adsr`: an array of `[attack, decay, sustain, release]`. Overrides other parameters.
- `duration`: set the playing duration in seconds of the buffer(s)
- `loop`: set to true to loop the audio buffer

<a name="player.stop"></a>
#### player.stop(when, nodes) ⇒ <code>Array</code>
Stop some or all samples

<a name="player.on"></a>
#### player.on(event, callback) ⇒ <code>[player](#player)</code>
Adds a listener of an event

<a name="player.connect"></a>
#### player.connect(destination) ⇒ <code>AudioPlayer</code>
Connect the player to a destination node

<a name="player.schedule"></a>
#### player.schedule(when, events) ⇒ <code>Array</code>
Schedule a list of events to be played at specific time.

<a name="player.listenToMidi"></a>
#### player.listenToMidi(input, options) ⇒ <code>[player](#player)</code>
Connect a player to a midi input

See [soundfont-player](https://github.com/danigb/soundfont-player) for more information.

<a name="nameToUrl"></a>
## nameToUrl(name, soundfont, format) ⇒ <code>String</code>
Given an instrument name returns a URL to to the Benjamin Gleitzman's
package of [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)

**Returns**: <code>String</code> - the Soundfont file url  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | instrument name |
| soundfont | <code>String</code> | (Optional) 'FluidR3_GM' or 'MusyngKite' ('MusyngKite' by default) |
| format | <code>String</code> | (Optional) Can be 'mp3' or 'ogg' (mp3 by default) |

**Example**  
```js
var Soundfont = require('soundfont-player')
Soundfont.nameToUrl('marimba', null, 'ogg') // => http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/marimba-ogg.js
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

To run pure javascript examples `npm install -g beefy` then `beefy examples/marimba.js` and navigate to http://localhost:9966/


## Available instruments

By default it loads Benjamin Gleitzman's
[pre-rendered SoundFonts](https://github.com/gleitz/midi-js-soundfonts).

__Instrument names__

You can download the names of the instruments as a .json file:
  - [FluidR3_GM](https://raw.githubusercontent.com/danigb/soundfont-player/master/names/fluidR3.json)
  - [MusyngKite](https://raw.githubusercontent.com/danigb/soundfont-player/master/names/musyngkite.json)

Or require them:

```js
var fluidNames = require('soundfont-player/names/fuildR3.json')
var musyngNames = require('soundfont-player/names/musyngkite.json')
```

## Resources

- SoundFont technical specification: http://freepats.zenvoid.org/sf2/sfspec24.pdf

## License

MIT License
