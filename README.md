## Automatic Differentiation for JavaScript

A translation of the ad library from Jeff Siskind's Qobischeme.

The package provides
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
