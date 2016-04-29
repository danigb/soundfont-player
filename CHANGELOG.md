CHANGELOG

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
