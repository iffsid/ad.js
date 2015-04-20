var ad = require('./src/ad');

var f = function(x) {return x * x * x; };

// test forwad derivatives
var d1F = ad.derivativeF(f);
var d2F = ad.derivativeF(d1F);
console.log(d1F(10));
console.log(d2F(10));

// test reverse derivatives
var d1R = ad.derivativeR(f);
var d2R = ad.derivativeR(d1R);
console.log(d1R(10));
console.log(d2R(10));
