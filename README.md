soundfont-player
================

A really simple soundfont loader/player to use MIDI sounds in WebAudio API.
The purpose of this project is to reduce as minimum the setup and code required
to play MIDI sounds.

It is a much simpler and lightweight replacement for [MIDI.js](https://github.com/mudcube/MIDI.js)

Works out of the box with Benjamin Gleitzman's package of
[pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts). Just load the library and play. Try the [demo](http://danigb.github.io/soundfont-player/#demo)

## Usage

Load the library...

```html
<script src="soundfont-player.js"></script>
```

... or require it using a npm package compatible environment (webpack, browserify):

```js
var Soundfont = require('soundfont-player');
```

Create a Soundfont object:

```js
var ctx = new AudioContext();
var soundfont = new Soundfont(ctx);
```

Then get the instrument and play:

```js
var instrument = soundfont.instrument('acoustic_grand_piano');
instrument.onready(function() {
  instrument.play('C4', 0);
}
```

## What it does....

Basically it fetches the instruments from https://github.com/gleitz/midi-js-soundfonts using https://rawgit.com, decode them and wrap in a simple buffer player.

It uses Promises and the Web Audio API.

## API

### Soundfont(audioContext)

Create a soundfont object. The soundfont object has two methods:

#### soundfont.instrument(instName)

Returns an instrument with the given instrument name (take a look to all the names below).
All the instruments has a play method with the form: `play(noteName, time, duration [, options])`.

You can use the `instrument.onready` method to know when the instrument is loaded.
If you play the instrument before its loaded, a simple sine oscillator is used
to generate the note:

```js
var inst = soundfont.instrument('accordion');
inst.play('c4', 2, 0.2); // => a sine wave sound
inst.onready(function() {
  inst.play('c4', 2, 0.2); // => a midi accordion sound
});
```

If you want to control the note release manually you can pass `-1` as duration and call `stop`:

```js
note = inst.play('c4', 0, -1)
note.stop(1) // stops after 1 second
```

The instruments are cached, so call `soundfont.instrument` twice with the same
name only loads the instrument once.

You can pass `null` to get the default sine oscillator instrument:

```js
var inst = soundfont.instrument();
inst.play('c2', 1, 0.5);
```

#### soundfont.onready(callback)

The callback is fired when __all__ the instruments are loaded:

```js
var harmonics = soundfont.instrument('guitar_harmonics');
var sax = soundfont.instrument('soprano_sax');
soundfont.onready(function() {
  console.log('Guitar harmonics and Sax ready.');
  harmonics.play('c3', 1, 1);
  sax.play('e2', 1, 1);
});
```

### Soundfont.loadBuffers(audioContext, instName)

Returns a Promise with a buffers object. The buffers object map midi notes to
audio buffers:

```js
Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
  buffers[Soundfont.noteToMidi('C4')] // => audio buffer of C4
});
```

### Soundfont.noteToMidi(noteName)

Returns the midi name of the note.

## Configuration

Overrinding `Soundfont.nameToUrl` you can change the URL associated to a given instrument name:
```js
Soundfont.nameToUrl= function(instName) { return '/' + instName + '-ogg.js'; }
```


## Run the example and build the library

The `dist` folder contains ready to use file for browser. You can build you own with:

```bash
npm run dist
```

To run the html example start a local http server. For example:

```bash
npm install -g http-server
http-server
```

And open [http://localhost:8080/examples](http://localhost:8080/examples)

To run pure javascript examples `npm install -g beefy` then `beefy examples/piano.js` and navigate to http://localhost:9966/


## Available instruments

You can grab a [json file](https://github.com/danigb/soundfont-player/blob/master/instruments.json) with all the instruments, or require it:

```js
var instrumentNames = require('soundfont-player/instruments.json');
```

The complete list [is here](https://github.com/danigb/soundfont-player/blob/master/INSTRUMENTS.md)

## Resources

- SoundFont technical specification: http://freepats.zenvoid.org/sf2/sfspec24.pdf

## License

MIT License
