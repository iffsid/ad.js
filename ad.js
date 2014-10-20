/**
  1. operator macro shouldn't expand within macro template
     https://github.com/mozilla/sweet.js/issues/400
 **/

var sjs = require('sweetjs')
var ops = require('operators.sjs')

// http://stackoverflow.com/questions/502366/structs-in-javascript
function makeStruct(names) {
  var names = names.split(' ');
  var count = names.length;
  function constructor() {
    for (var i = 0; i < count; i++) {
      this[names[i]] = arguments[i];
    }
  }
  return constructor;
}

var S_dualNumber = makeStruct("epsilon primal perturbation")
var makeDualNumber = function(epsilon, primal, perturbation) {
  return new S_dualNumber(epsilon, primal, perturbation) }
var isDualNumber = function(dn) { return dn.hasOwnProperty('perturbation') }

var S_tape = makeStruct("epsilon primal factors tapes fanout sensitivity")
var makeTape = function(epsilon, primal, factors, tapes, fanout, sensitivity) {
  return new S_tape(epsilon, primal, factors, tapes, fanout, sensitivity) }
var tape = function(e, primal, factors, tapes) {
  return makeTape(e, primal, factors, tapes, 0, 0.0) }
var isTape = function(t) { return t.hasOwnProperty('fanout') }

// needswork: need to defined macro templates for operators such that they
//            are lifted correctly -- relates to 1. above
//  unary: -, ++, --
// binary: +, -, *, /, %, <, <=, >, >=, ==, !=, ===, !==

// needswork: <_e ==> < here (where < is overloaded appropriately)
//            make sure it does the correct thing
var lift_realreal_to_real = function(f, df_dx1, df_dx1, x1, x2) {
  var fn = function(x_1, x_2) {
    if (isDualNumber(x_1)) {
      if (isDualNumber(x_2)) {
        if (x_1.epsilon < x_2.epsilon) {
          return makeDualNumber(x_2.epsilon,
                                fn(x_1, x_2.primal),
                                df_dx2(x_1, x_2.primal)*x_2.perturbation)
        } else if (x_2.epsilon < x_1.epsilon) {
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2),
                                df_dx1(x_1.primal, x_2)*x_1.perturbation)
        } else {
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2.primal),
                                (df_dx1(x_1.primal, x_2.primal)*x_1.perturbation)
                                +(df_dx2(x_1.primal, x_2.primal)*x_2.perturbation))
        }
      } else if (isTape(x_2)) {
        if (x_1.epsilon < x_2.epsilon) {
          return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
        } else {
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2),
                                df_dx1(x_1.primal, x_2)*x_1.perturbation)
        }
      } else {
        return makeDualNumber(x_1.epsilon,
                              fn(x_1.primal, x_2),
                              df_dx1(x_1.primal, x_2)*x_1.perturbation)
      }
    } else if (isTape(x_1)) {
      if (isDualNumber(x_2)) {
        if (x_1.epsilon < x_2.epsilon) {
          return makeDualNumber(x_2.epsilon,
                                fn(x_1, x_2.primal),
                                df_dx2(x_1, x_2.primal)*x_2.perturbation)
        } else {
          return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
        }
      } else if (isTape(x_2)) {
        if (x_1.epsilon < x_2.epsilon) {
          return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
        } else if (x_2.epsilon < x_1.epsilon) {
          return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
        } else {
          return tape(x_1.epsilon,
                      fn(x_1.primal, x_2.primal),
                      [df_dx1(x_1.primal, x_2.primal), df_dx2(x_1.primal, x_2.primal)],
                      [x_1, x_2])
        }
      } else {
        return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
      }
    } else {
      if (isDualNumber(x_2)) {
        return makeDualNumber(x_2.epsilon,
                              fn(x_1, x_2.primal),
                              df_dx2(x_1, x_2.primal)*x_2.perturbation)
      } else if (isTape(x_2)) {
        return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
      } else {
        return f(x_1, x_2)
      }
    }
  }
  return fn(x1, x2)
}

var lift_real_to_real = function(f, df_dx, x) {
  var fn = function(x1) {
    if (isDualNumber(x1)) {
      return makeDualNumber(x1.epsilon, fn(x1.primal), df_dx(x1.primal)*x1.perturbation)
    } else if (isTape(x1)) {
      return tape(x1.epsilon, fn(x1.primal), [df_dx(x1.primal)], [x1])
    } else {
      return f(x1)
    }
  }
  return fn(x)
}

// this helps with mapping ops over lists -- not really required for js
var primal_star = function(p) {
  return (p.hasOwnProperty('primal')) ? primal_star(p.primal) : p
}

var _e_ = 0

var lt_e = function(e1, e2) { return old_lt_two(e1, e2) }

var derivativeF = function(f) {
  return function(x) {
    _e_ += 1
    var y = f(makeDualNumber(_e_, x, 1.0))
    var y_prime = (!isDualNumber(y) || lt_e(y.epsilon, _e_)) ? 0.0 : y.perturbation
    _e_ -= 1
    return y_prime
  }
}

var replace_ith = function(x, i, xi) { var c = x.slice(0); c[i] = xi; return c; }

var gradientF = function(f) {
  return function(x) {
    x.map(function(xval){
      derivativeF( function(xi) { return f(replace_ith(x, i, xi)) } )(xval) })
  }
}

var determineFanout = function(tape) {
  tape.fanout += 1
  if (tape.fanout == 1) { tape.tapes.forEach(determineFanout) }
}

var reversePhase = function(sensitiviy, tape) {
  tape.sensitivity += sensitivity
  tape.fanout -= 1
  if (tape.fanout == 0) {
    var sens = tape.sensitivity
    // need foreach2
    forEach2(
      function(factor, tape) { reversePhase(sens * factor, tape) },
      tape.factors,
      tape.tapes
    )
  }
}

var gradientR = function(f) {
  return function(x) {
    _e_ += 1
    var new_x = x.map( function(xi) { return tape(_e_, xi, [], []) } )
    var y = f(new_x)
    (isTape(y) && !lt_e(y.epsilon, _e_)) ? determineFanout(y) : reversePhase(1.0, y)
    _e_ -= 1
    return x.map(function(v){return v.sensitivity})
  }
}

var derivativeR = functin(f) {
  return function(x) {
    var r = gradientR( function(x1) {return x1[0]} )([x])
    return r[0]
  }
}

// needswork: setup exports appropriately
//            ideally, proper js module, otherwise us `sjs --module ...`
