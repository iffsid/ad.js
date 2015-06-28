var fs = require('fs');
var sweet = require('sweet.js')
var adMacros = sweet.loadModule(fs.readFileSync('macros/index.js'));
var sweetOptions = {modules: adMacros, readableNames: true};
var adLoadString = "var ad = require('functions/index.js')({});\n";
var ad = require('../functions/index.js')({});

var rawcode = fs.readFileSync('tests/models/cube.js').toString();
var adcode = sweet.compile(rawcode, sweetOptions).code;
eval(adcode);

exports.forwardMode = {
  derivatives: {
    d_dx: function(test) {
      test.equal(ad.derivativeF(cube)(10), 300);
      test.done();
    },
    d2_dx2: function(test) {
      test.equal(ad.derivativeF(ad.derivativeF(cube))(10), 60);
      test.done();
    }
  }
}

exports.ReverseMode = {
  derivatives: {
    d_dx: function(test) {
      test.equal(ad.derivativeR(cube)(10), 300);
      test.done();
    },
    d2_dx2: function(test) {
      test.equal(ad.derivativeR(ad.derivativeR(cube))(10), 60);
      test.done();
    }
  }
}
