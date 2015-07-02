"use strict";

/**
   Todo:
   - hyperbolic and inv hyperbolic functions
   - performance testing
 **/

var primops = require('./primops')

var _e_ = 0

var lt_e = function(e1, e2) { return e1 < e2 }

var S_tape = function(epsilon, primal, factors, tapes, fanout, sensitivity) {
  this.epsilon = epsilon;
  this.primal = primal;
  this.factors = factors;
  this.tapes = tapes;
  this.fanout = fanout;
  this.sensitivity = sensitivity;
}

var makeTape = function(epsilon, primal, factors, tapes, fanout, sensitivity) {
  return new S_tape(epsilon, primal, factors, tapes, fanout, sensitivity);
};
var tape = function(e, primal, factors, tapes) {
  return makeTape(e, primal, factors, tapes, 0, 0.0);
};
var isTape = function(t) { return t instanceof S_tape; };

var makeTapifier = function() {
  _e_ += 1;
  return (function() {
    var eThis = _e_;
    return function(p) {return tape(eThis, p, [], []);};
  }())
}

var tapify = makeTapifier();

var untapify = function(x) {
  if (isTape(x)) {
    return untapify(x.primal);
  } else if (Array.isArray(x)) {
    return x.map(untapify);
  } else {
    return x;
  }
}

var lift_real_to_real = function(f, df_dx) {
  var fn = function(x1) {
    if (isTape(x1))
      return tape(x1.epsilon, fn(x1.primal), [df_dx(x1.primal)], [x1]);
    else
      return f(x1);
  }
  return fn;
};

var lift_realreal_to_real = function(f, df_dx1, df_dx2) {
  var fn = function(x_1, x_2) {
    if (isTape(x_1)) {
      if (isTape(x_2))
        if (x_1.epsilon < x_2.epsilon)
          return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
        else if (x_2.epsilon < x_1.epsilon)
          return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
        else
          return tape(x_1.epsilon,
                      fn(x_1.primal, x_2.primal),
                      [df_dx1(x_1.primal, x_2.primal), df_dx2(x_1.primal, x_2.primal)],
                      [x_1, x_2])
      else
        return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
    } else {
      if (isTape(x_2))
        return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
      else
        return f(x_1, x_2)
    }
  };
  return fn;
};

/** Lifting operations **/


/** helpers **/
// this might need primal* if cmp operators are used with &rest
var overloader_2cmp = function(baseF) {
  var fn = function(x1, x2) {
    if (isTape(x1))
      return fn(x1.primal, x2);
    else if (isTape(x2))
      return fn(x1, x2.primal);
    else
      return baseF(x1, x2);
  }
  return fn;
};
var div2F = function(x1, x2){return d_div(1,x2);};
var divNF = function(x1, x2){return d_div(d_sub(0,x1), d_mul(x2, x2));};

/** lifted functions (overloaded) **/
var d_add = lift_realreal_to_real(primops.add, primops.oneF, primops.oneF);
var d_sub = lift_realreal_to_real(primops.sub, primops.oneF, primops.m_oneF);
var d_mul = lift_realreal_to_real(primops.mul, primops.secondF, primops.firstF);
var d_div = lift_realreal_to_real(primops.div, div2F, divNF);
var d_mod = function(a, b) {return d_sub(a, d_mul(a, d_floor(d_div(a, b))));};

var d_eq = overloader_2cmp(primops.eq);
var d_neq = overloader_2cmp(primops.neq);
var d_peq = overloader_2cmp(primops.peq);
var d_pneq = overloader_2cmp(primops.pneq);
var d_gt = overloader_2cmp(primops.gt);
var d_lt = overloader_2cmp(primops.lt);
var d_geq = overloader_2cmp(primops.geq);
var d_leq = overloader_2cmp(primops.leq);

// Chen-Harker-Kanzow-Smale smoothing
var _tolSq_ = 1e-10
var p_extrF = function(a, b, t2) {
  return d_add(d_sqrt(d_add(d_pow(d_sub(a, b), 2), t2)), d_add(a, b));
};
var d_max = function(a, b) {return d_mul(p_extrF(a, b, _tolSq_), 0.5);};
var d_min = function(a, b) {return d_mul(p_extrF(d_sub(0.0, a), d_sub(0.0, b), _tolSq_), -0.5);};

var d_sqrt = lift_real_to_real(Math.sqrt, function(x){return d_div(1, d_mul(2.0, d_sqrt(x)))})
var d_exp = lift_real_to_real(Math.exp, function(x){return d_exp(x)});
var d_log = lift_real_to_real(Math.log, function(x){return d_div(1,x)});
// Note: derivatives of floor and ceil are undefined at integral values
var d_floor = lift_real_to_real(Math.floor, primops.zeroF);
var d_ceil = lift_real_to_real(Math.ceil, primops.zeroF);
// Note: better representation for abs?
var d_abs = function(x) {return d_gt(x, 0.0) ? x : d_sub(0.0, x)}
var d_pow = lift_realreal_to_real(Math.pow,
                                  function(x1, x2){return d_mul(x2, d_pow(x1, d_sub(x2, 1)));},
                                  function(x1, x2){return d_mul(d_log(x1), d_pow(x1, x2));});
var d_sin = lift_real_to_real(Math.sin, function(x){return d_cos(x)});
var d_cos = lift_real_to_real(Math.cos, function(x){return d_sub(0, d_sin(x))});
var d_atanF = lift_realreal_to_real(Math.atan2,
                                    function(x1, x2){return d_div(x2, d_add(d_mul(x1,x1), d_mul(x2,x2)));},
                                    function(x1, x2){return d_div(d_sub(0,x1), d_add(d_mul(x1,x1), d_mul(x2,x2)));});
var d_atan = function(x1, x2) {
  x2 = x2 === undefined ? 1 : x2; // just atan, not atan2
  return d_atanF(x1, x2);
};

var d_Math = {};
Object.getOwnPropertyNames(Math).forEach(function(n) {d_Math[n] = Math[n]});
d_Math.floor = d_floor;
d_Math.ceil = d_ceil;
d_Math.abs = d_abs;
d_Math.sqrt = d_sqrt;
d_Math.exp = d_exp;
d_Math.log = d_log;
d_Math.pow = d_pow;
d_Math.sin = d_sin;
d_Math.cos = d_cos;
d_Math.atan = d_atan;
d_Math.atan2 = d_atan;
d_Math.max = d_max;
d_Math.min = d_min;

/** derivatives and gradients **/

var determineFanout = function(tape) {
  tape.fanout += 1;
  if (tape.fanout === 1) {
    var n = tape.tapes.length;
    while (n--) determineFanout(tape.tapes[n]);
  }
}

var initializeSensitivity = function(tape) {
  tape.sensitivity = 0.0;
  tape.fanout -= 1;
  if (tape.fanout === 0) {
    var n = tape.tapes.length;
    while (n--) initializeSensitivity(tape.tapes[n]);
  }
}

var reversePhase = function(sensitivity, tape) {
  tape.sensitivity = d_add(tape.sensitivity, sensitivity);
  tape.fanout -= 1;
  if (tape.fanout === 0) {
    var sens = tape.sensitivity;
    var n = tape.factors.length;
    while (n--) reversePhase(d_mul(sens, tape.factors[n]), tape.tapes[n]);
  }
}

var gradientR = function(f) {
  return function(x) {
    _e_ += 1;
    var new_x = x.map( function(xi) { return tape(_e_, xi, [], []) } )
    var y = f(new_x);
    if (isTape(y) && !lt_e(y.epsilon, _e_)) {
      determineFanout(y);
      reversePhase(1.0, y);
    }
    _e_ -= 1;
    return new_x.map(function(v){return v.sensitivity})
  }
}

var derivativeR = function(f) {
  return function(x) {
    var r = gradientR( function(x1) {return f(x1[0])} )([x])
    return r[0]
  }
}

var yGradientR = function(yReverse) {
  // propogate sensitivities from y backwards
  var ySensitivity = 1.0;
  var thisE = tapify(0.0).epsilon;
  if (isTape(yReverse) && !lt_e(yReverse.epsilon, thisE)) {
    determineFanout(yReverse);
    initializeSensitivity(yReverse);
  }
  if (isTape(yReverse) && !lt_e(yReverse.epsilon, thisE)) {
    determineFanout(yReverse);
    reversePhase(ySensitivity, yReverse);
  }
}

var xyGradientR = function(mapIndependent, xReverse, yReverse) {
  var mapDependent = function(f, yReverse) {return f(yReverse);};
  var forEachDependent1 = function(f, yReverse) {return f(yReverse);};
  var forEachDependent2 = function(f, yReverse, ySensitivity) {
    return f(yReverse, ySensitivity);
  };
  // propogate sensitivities from y backwards
  var ySensitivities = [1.0];
  var thisE = tapify(0.0).epsilon;
  var xSensitivities = _.map(ySensitivities, function(ySensitivity) {
    forEachDependent1(function(yReverse) {
      if (isTape(yReverse) && !lt_e(yReverse.epsilon, thisE)) {
        determineFanout(yReverse);
        initializeSensitivity(yReverse);
      }
    }, yReverse);
    forEachDependent2(function(yReverse, ySensitivity) {
      if (isTape(yReverse) && !lt_e(yReverse.epsilon, thisE)) {
        determineFanout(yReverse);
        reversePhase(ySensitivity, yReverse);
      }
    }, yReverse, ySensitivity);
    return mapIndependent(function(tape) {return tape.sensitivity}, xReverse);
  }, ySensitivities);
  // return untapified y and the x derivatives
  return [mapDependent(function(yReverse) {
    return !isTape(yReverse) || lt_e(yReverse.epsilon, thisE) ?
      yReverse :
      yReverse.primal;
  }, yReverse),
          xSensitivities];
}

module.exports = {
  add: d_add,
  sub: d_sub,
  mul: d_mul,
  div: d_div,
  mod: d_mod,
  eq: d_eq,
  neq: d_neq,
  peq: d_peq,
  pneq: d_pneq,
  gt: d_gt,
  lt: d_lt,
  geq: d_geq,
  leq: d_leq,
  maths: d_Math,
  derivativeR: derivativeR,
  gradientR: gradientR,
  yGradientR: yGradientR,
  xyGradientR: xyGradientR,
  makeTapifier: makeTapifier,
  tapify: tapify,
  untapify: untapify
}
