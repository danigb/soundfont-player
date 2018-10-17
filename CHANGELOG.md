CHANGELOG

0.10.7

- Add typescript definitions (thanks @rakannimer)

  0.10.6

- Chenage MusyngKite names to follow Gleitz renames (thanks @kirlen)
- Add yarn.lock
- Update dependencies

[0.10.4] Update sample-player (`gain: 0` option is not ignored, `start` and `play` are the same function)
[0.10.1] Update sample-player: add adsr individual parameters to options. New `started` event.
[0.10.0]

- Add support to MusyngKite soundfonts.
- `instrument` can be partially applied with an AudioContext instance
- Deprecate noteToMidi

[0.9.2] Update sample-player
[0.9.1] Use sample-player
[0.9.0]

- Load soundfonts directly from github.io (https://github.com/gleitz/midi-js-soundfonts/issues/9)
- New API
- Deprecate old API
  [0.8.4]
- Use audio-loader
- Use note-parser instead of note-midi and note-freq
  [0.8.3]
- Use Ramp up to value functions for enabling and disabling the gain, when note duration is set.
  [0.8.2]
- Standard JS style support
- Add `notes` options

[0.8.1]

- Use `duration` parameter from AudioBufferSourceNode `start` function instead of `stop`. Thanks @frankbaele
- Add REAME notes about iOS usage and production usage
- Fix gh-pages links

[0.8.0]

- Add optional `options` parameter to `play()` that overrides the `defaultOptions` of `instrument()`. Thanks @mattbierner

[0.6.1]

- Update dependencies
- Remove unused code
- Use mocha instead of vows

[0.6.0]

- On ready callback now receives the instrument
- You can pass a midi value to play function
- Split functionality in files

[0.5.0]

- Duration no longer required (thanks @benwiley4000).

[0.4.0]

- Add soundfont.onready
- Fix a bug with vco oscillator
- Amplitude of oscillator is now similar to soundfont notes

[0.3.0]

- Move to a class based library
- Default instrument with a sine oscillator
- Instruments play notes before the soundfont is loaded
- Use note-parser to parase notes
- Use midi numbers to map buffer notes

[0.2.0]

- Altered notes are correctly assigned to the buffer (issue #1)
- Simplify lib structure
- Add soundfont.noteToBufferName function

[0.1.0]

- First version
