import macros from './macros'
__initAD;

var f = function(x) {return x * x * x; };
console.log("Testing y = x^3");

// test forwad derivatives
var d1F = ad_derivativeF(f);
var d2F = ad_derivativeF(d1F);
console.log("Forward Mode: d/dx(y) = 3*x^2, at x = 10");
console.log(d1F(10));
console.log("Forward Mode: d^2/dx^2(y) = 6*x, at x = 10");
console.log(d2F(10));

// test reverse derivatives
var d1R = ad_derivativeR(f);
var d2R = ad_derivativeR(d1R);
console.log("Reverse Mode: d/dx(y) = 3*x^2, at x = 10");
console.log(d1R(10));
console.log("Reverse Mode: d^2/dx^2(y) = 6*x, at x = 10");
console.log(d2R(10));
