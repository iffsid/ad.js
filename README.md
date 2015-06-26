## Automatic Differentiation for JavaScript

A translation of the ad library from Jeff Siskind's Qobischeme.

The package provides
- transformed functions and means to transform others
- sweetjs macros that can be used to effect replacement of primitive functions
with above transformed/overloaded ones.

### Usage

Install as `npm install ad.js`

Use sweet to load the macros and compile code
```
var sweet = require('sweet.js');
var adMacros = sweet.loadNodeModule(null, 'ad.js/macros')
var adLoadString = "var ad = require('ad.js');\n";
var _compiled = sweet.compile(<your-file-contents>, {modules: adMacros});
var compiled = adLoadString + _compiled.code
```
