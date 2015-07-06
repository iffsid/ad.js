## Automatic Differentiation for JavaScript

A translation of the ad library from Jeff Siskind's Qobischeme.

Some links that explain what AD is:
- [Wikipedia]
- [Introduction to Automatic Differentiation]

This package provides
- transformed functions and means to transform others
- sweetjs macros that can be used to effect replacement of primitive functions
with above transformed/overloaded ones.

### Usage

Install as `npm install ad.js`

Use sweet to load the macros and compile code

``` javascript
var sweet = require('sweet.js');
var adMacros = sweet.loadNodeModule(null, 'ad.js/macros')
var adLoadString = "var ad = require('ad.js')({});\n";
var _compiled = sweet.compile(<your-file-contents>, {modules: adMacros});
var compiled = adLoadString + _compiled.code
```

Also, the `ad` require statement must be passed options.
To get the default behaviour:

``` javascript
var ad = require('ad.js')({})
```

To run only `reverse mode` (faster)

``` javascript
var ad = require('ad.js')({mode: 'r'})
```

To run only `reverse mode` with only first-derivatives (faster even)

``` javascript
var ad = require('ad.js')({mode: 'r', noHigher: true})
```

### Test

Uses nodeunit. To run tests, do `npm test`

### Example
The setup takes a file that looks like so:

``` javascript
var cube = function(x) {
  return x * x * x;
}
```

and transforms it into code that looks like so:

``` javascript
var cube = function(x) {
  return ad.mul(x, ad.mul(x, x));
}
```

after which one can do things like:

``` javascript
var dCube_dx = ad.derivativeF(cube);
console.log(dCube_dx(10))
// will print 300 => d/dx(x^3) = 3x^2 @x=10 = 300
```

and even higher-order derivatives as:

``` javascript
var d2Cube_dx2 = ad.derivativeF(dcube_dx);
console.log(d2Cube_dx2(10))
// will print 60 => d2/dx2(x^3) = 6x @x=10 = 60
```

The bulk of the instructions above are just the means by which sweet gets its
hands on the code you want to transform and the macros to transform it with.

[Introduction to Automatic Differentiation]: http://alexey.radul.name/ideas/2013/introduction-to-automatic-differentiation/
[Wikipedia]: https://en.wikipedia.org/wiki/Automatic_differentiation
