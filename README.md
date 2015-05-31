soundfont-player
================

Simple soundfont loader/player to use MIDI sounds in WebAudio API.
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

## How it works

Basically it fetches the instruments from https://github.com/gleitz/midi-js-soundfonts using https://rawgit.com, decode them and wrap in a simple buffer player.

It uses Promises and the Web Audio API.

## API

### Soundfont(audioContext)

Create a soundfont object.

### soundfont.instrument(instName)

Returns an instrument with the given instrument name (take a look to all the names below).
All the instruments has a play method with the form: `instrument.play(noteName, time, duration, options)`.

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

The instruments are cached, so call `soundfont.instrument` twice with the same
name only loads the instrument once.

You can pass `null` to get the default sine oscillator instrument:

```js
var inst = soundfont.instrument();
inst.play('c2', 1, 0.5);
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

The `dist` folder contains ready to use file for browser. You can run the example starting a local http server. For example:

```bash
npm install -g http-server
http-server
```

And open [http://localhost:8080/example](http://localhost:8080/example)

## Instruments available

Just copy and paste:

accordion
acoustic_bass
acoustic_grand_piano
acoustic_guitar_nylon
acoustic_guitar_steel
agogo
alto_sax
applause
bagpipe
banjo
baritone_sax
bassoon
bird_tweet
blown_bottle
brass_section
breath_noise
bright_acoustic_piano
celesta
cello
choir_aahs
church_organ
clarinet
clavinet
contrabass
distortion_guitar
drawbar_organ
dulcimer
electric_bass_finger
electric_bass_pick
electric_grand_piano
electric_guitar_clean
electric_guitar_jazz
electric_guitar_muted
electric_piano_1
electric_piano_2
english_horn
fiddle
flute
french_horn
fretless_bass
fx_1_rain
fx_2_soundtrack
fx_3_crystal
fx_4_atmosphere
fx_5_brightness
fx_6_goblins
fx_7_echoes
fx_8_scifi
glockenspiel
guitar_fret_noise
guitar_harmonics
gunshot
harmonica
harpsichord
helicopter
honkytonk_piano
kalimba
koto
lead_1_square
lead_2_sawtooth
lead_3_calliope
lead_4_chiff
lead_5_charang
lead_6_voice
lead_7_fifths
lead_8_bass__lead
marimba
melodic_tom
music_box
muted_trumpet
oboe
ocarina
orchestra_hit
orchestral_harp
overdriven_guitar
pad_1_new_age
pad_2_warm
pad_3_polysynth
pad_4_choir
pad_5_bowed
pad_6_metallic
pad_7_halo
pad_8_sweep
pan_flute
percussive_organ
piccolo
pizzicato_strings
recorder
reed_organ
reverse_cymbal
rock_organ
seashore
shakuhachi
shamisen
shanai
sitar
slap_bass_1
slap_bass_2
soprano_sax
steel_drums
string_ensemble_1
string_ensemble_2
synth_bass_1
synth_bass_2
synth_brass_1
synth_brass_2
synth_choir
synth_drum
synth_strings_1
synth_strings_2
taiko_drum
tango_accordion
telephone_ring
tenor_sax
timpani
tinkle_bell
tremolo_strings
trombone
trumpet
tuba
tubular_bells
vibraphone
viola
violin
voice_oohs
whistle
woodblock
xylophone

## License

MIT License
