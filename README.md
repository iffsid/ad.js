## Automatic Differentiation in JavaScript

A translation of the ad library from Jeff Siskind's Qobischeme.

### Requirements:

- [sweetify](https://www.npmjs.com/package/sweetify)

### Usage

Currently works through the use of `sweetify` and `browserify`.

Intended use is to identify those files that need to use the overloaded
operators and insert the following lines at the top

``` shell
import macros from 'ad/macros'
__initAD;
```

(Note that the test refers to them through relative path rather than npm
package paths, i.e., `./macros`)

This will transform the code in that file with the requisite macros before
making the ad-lifted functions available in the global namespace (that's what
`__initAD` does), so that the transformed code can run.

Calling `browserify -t sweetify test.sjs` will then produce a file that can be
used to run AD. Alternately, call `browserify -t sweetify test.sjs | node` to
run the computation.

The dependence on `.sjs` is because of vanilla `sweetify`.

### Todo:

1. make this a proper browserify transform module
2. figure out a way to get sweetify to select files based on some sort of
   pragma, not only file extensions.
