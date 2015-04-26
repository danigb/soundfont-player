'use strict';

var fs = require('fs');
var soundfont = require('../index.js');

describe("soundfont-player", function() {
  it("should parse data", function() {
    var data = fs.readFileSync(__dirname + '/xylophone-ogg.js');
    var parsed = soundfont.parseData(data.toString());
    expect(parsed).not.toBeNull();
    expect(parsed['A0']).toBeDefined();
  });
});
