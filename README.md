## Automatic Differntiation in JavaScript

A translation of the ad library from Jeff Siskind's Qobischeme.

### Requirements:

- [sweetjs](http://sweetjs.org/)

### Example
The following example directly uses the lifted operators

``` js
var ad = require('./src/ad.js');

// the cubing function
var testFn = function(x) {return ad.mul(x, ad.mul(x, x))};

// compute the first derivative
var d1 = derivativeF(testFn);

d1(10);
// -> 300 -- d/dx x^3 = 3*x^2

// compute the 2nd derivative from the first
var d2 = derivativeF(d1);

d2(10);
// -> 60 -- d^2/dx^2 x^3 = 6x

```
