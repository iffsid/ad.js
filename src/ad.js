"use strict";

// http://stackoverflow.com/questions/502366/structs-in-javascript
function makeStruct() {
  var args = arguments;
  function constructor() {
    for (var i = 0; i < args.length; i++)
      this[args[i]] = arguments[i];
  }
  return constructor;
}

var S_dualNumber = makeStruct('epsilon', 'primal', 'perturbation');
var S_tape = makeStruct('epsilon', 'primal', 'factors', 'tapes', 'fanout', 'sensitivity');

var makeDualNumber = function(epsilon, primal, perturbation) {
  return new S_dualNumber(epsilon, primal, perturbation);
};
var isDualNumber = function(dn) { return dn.hasOwnProperty('perturbation'); };

var makeTape = function(epsilon, primal, factors, tapes, fanout, sensitivity) {
  return new S_tape(epsilon, primal, factors, tapes, fanout, sensitivity);
};
var tape = function(e, primal, factors, tapes) {
  return makeTape(e, primal, factors, tapes, 0, 0.0);
};
var isTape = function(t) { return t.hasOwnProperty('fanout'); };

// needswork: check if all operators used here are primitive or lifted
var lift_realreal_to_real = function(f, df_dx1, df_dx2, x1, x2) {
  var fn = function(x_1, x_2) {
    if (isDualNumber(x_1)) {
      if (isDualNumber(x_2))
        if (x_1.epsilon < x_2.epsilon)
          return makeDualNumber(x_2.epsilon,
                                fn(x_1, x_2.primal),
                                l_mul(df_dx2(x_1, x_2.primal), x_2.perturbation))
        else if (x_2.epsilon < x_1.epsilon)
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2),
                                l_mul(df_dx1(x_1.primal, x_2), x_1.perturbation))
        else
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2.primal),
                                l_add(l_mul(df_dx1(x_1.primal, x_2.primal), x_1.perturbation),
                                      l_mul(df_dx2(x_1.primal, x_2.primal), x_2.perturbation)))
      else if (isTape(x_2))
        if (x_1.epsilon < x_2.epsilon)
          return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
        else
          return makeDualNumber(x_1.epsilon,
                                fn(x_1.primal, x_2),
                                l_mul(df_dx1(x_1.primal, x_2), x_1.perturbation))
      else
        return makeDualNumber(x_1.epsilon,
                              fn(x_1.primal, x_2),
                              l_mul(df_dx1(x_1.primal, x_2), x_1.perturbation))
    } else if (isTape(x_1)) {
      if (isDualNumber(x_2))
        if (x_1.epsilon < x_2.epsilon)
          return makeDualNumber(x_2.epsilon,
                                fn(x_1, x_2.primal),
                                l_mul(df_dx2(x_1, x_2.primal), x_2.perturbation))
        else
          return tape(x_1.epsilon, fn(x_1.primal, x_2), [df_dx1(x_1.primal, x_2)], [x_1])
      else if (isTape(x_2))
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
      if (isDualNumber(x_2))
        return makeDualNumber(x_2.epsilon,
                              fn(x_1, x_2.primal),
                              l_mul(df_dx2(x_1, x_2.primal), x_2.perturbation))
      else if (isTape(x_2))
        return tape(x_2.epsilon, fn(x_1, x_2.primal), [df_dx2(x_1, x_2.primal)], [x_2])
      else
        return f(x_1, x_2)
    }
  };
  return fn(x1, x2);
};

var lift_real_to_real = function(f, df_dx, x) {
  var fn = function(x1) {
    if (isDualNumber(x1))
      return makeDualNumber(x1.epsilon, fn(x1.primal), l_mul(df_dx(x1.primal), x1.perturbation));
    else if (isTape(x1))
      return tape(x1.epsilon, fn(x1.primal), [df_dx(x1.primal)], [x1]);
    else
      return f(x1);
  }
  return fn(x);
};

/** Lifting operations **/
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/** functional wrappers for primitive operators **/
var f_minus = function(a) {return -a};

var f_add = function(a,b) {return a+b};
var f_sub = function(a,b) {return a-b};
var f_mul = function(a,b) {return a*b};
var f_div = function(a,b) {return a/b};
var f_mod = function(a,b) {return a%b};

var f_and = function(a,b) {return a && b};
var f_or = function(a,b) {return a || b};
var f_not = function(a) {return !a};

var f_eq = function(a,b) {return a==b};
var f_neq = function(a,b) {return a!=b};
var f_peq = function(a,b) {return a===b};
var f_pneq = function(a,b) {return a!==b};
var f_gt = function(a,b) {return a>b};
var f_lt = function(a,b) {return a<b};
var f_geq = function(a,b) {return a>=b};
var f_leq = function(a,b) {return a<=b};

/** helpers **/
var overloader_2op = function(baseF, lifter1, lifter2) {
  return function(x1, x2) {
    if (isNumeric(x1) && isNumeric(x2))
      return baseF(x1, x2);
    else
      return lift_realreal_to_real(baseF, lifter1, lifter2, x1, x2);
  }
};
// this might need primal* if cmp operators are used with &rest
var overloader_2cmp = function(baseF) {
  return function(x1, x2) {
    if (isNumeric(x1) && isNumeric(x2))
      return baseF(x1, x2);
    else {
      var fn = function(x1, x2) {
        if (isDualNumber(x1) || isTape(x1))
          return fn(x1.primal, x2);
        else if (isDualNumber(x2) || isTape(x2))
          return fn(x1, x2.primal);
        else
          return baseF(x1, x2);
      }
      return fn(x1, x2);
    }
  };
};
var zeroF = function(x){return 0;};
var oneF = function(x1, x2){return 1.0;};
var m_oneF = function(x1, x2){return -1.0;};
var firstF = function(x1, x2){return x1;};
var secondF = function(x1, x2){return x2;};
var div2F = function(x1, x2){return l_div(1,x2);};
var divNF = function(x1, x2){return l_div(l_sub(0,x1), l_mul(x2, x2));};

/** lifted functions (overloaded) **/
var l_add = overloader_2op(f_add, oneF, oneF);
var l_sub = overloader_2op(f_sub, oneF, m_oneF);
var l_mul = overloader_2op(f_mul, secondF, firstF);
var l_div = overloader_2op(f_div, div2F, divNF);
// needswork: l_mod should be derived through `l_div` and `l_sub`
// needswork: logical and bitwise operations

var l_eq = overloader_2cmp(f_eq);
var l_neq = overloader_2cmp(f_neq);
var l_peq = overloader_2cmp(f_peq);
var l_pneq = overloader_2cmp(f_pneq);
var l_gt = overloader_2cmp(f_gt);
var l_lq = overloader_2cmp(f_lt);
var l_geq = overloader_2cmp(f_geq);
var l_leq = overloader_2cmp(f_leq);

var l_sqrt = function(x) {
  return lift_real_to_real(Math.sqrt, function(x){return l_div(1, l_mul(2.0, l_sqrt(x)))}, x)
};

var l_exp = function(x) {
  return lift_real_to_real(Math.exp, function(x){return l_exp(x)}, x);
};

var l_log = function(x) {
  return lift_real_to_real(Math.log, function(x){return l_div(1,x)}, x);
};

var l_floor = function(x) {
  return lift_real_to_real(Math.floor, zeroF, x);
};

var l_pow = function(x1, x2) {
  return lift_realreal_to_real(Math.pow,
                               function(x1, x2){return l_mul(x2, l_pow(x1, l_sub(x2, 1)));},
                               function(x1, x2){return l_mul(l_log(x1), l_pow(x1, x2));},
                               x1,
                               x2);
};

var l_sin = function(x) {
  return lift_real_to_real(Math.sin, function(x){return l_cos(x)}, x);
};

var l_cos = function(x) {
  return lift_real_to_real(Math.cos, function(x){return l_sub(0, l_sin(x))}, x);
};

var l_atan = function(x1, x2) {
  x2 = x2 === undefined ? 1 : x2; // just atan, not atan2
  return lift_realreal_to_real(Math.atan2,
                               function(x1, x2){return l_div(x2, l_add(l_mul(x1,x1), l_mul(x2,x2)));},
                               function(x1, x2){return l_div(l_sub(0,x1), l_add(l_mul(x1,x1), l_mul(x2,x2)));},
                               x1,
                               x2);
};


/** derivatives and gradients **/
var _e_ = 0

var lt_e = function(e1, e2) { return e1 < e2 }

var derivativeF = function(f) {
  return function(x) {
    _e_++;
    var y = f(makeDualNumber(_e_, x, 1.0));
    var y_prime = (isDualNumber(y) || lt_e(y.epsilon, _e_)) ? 0.0 : y.perturbation;
    _e_--;
    return y_prime;
  }
}

var replace_ith = function(x, i, xi) { var c = x.slice(0); c[i] = xi; return c; }

var gradientF = function(f) {
  return function(x) {
    return x.map(function(xval) {
      var i = x.indexOf(xval);
      return derivativeF(function(xi) {return f(replace_ith(x, i, xi))})(xval);
    })
  }
}

var determineFanout = function(tape) {
  tape.fanout--;
  if (tape.fanout == 1) { tape.tapes.forEach(determineFanout) }
}

var reversePhase = function(sensitivity, tape) {
  tape.sensitivity += sensitivity;
  tape.fanout--;
  if (tape.fanout == 0) {
    var sens = tape.sensitivity;
    // needswork: check that tape.factors and tape.tapes are equal length
    for (var i = 0; i < tape.factors.length; i++) {
      reversePhase(l_mul(sens, tape.factors[i]), tape.tapes[i]);
    }
  }
}

var gradientR = function(f) {
  return function(x) {
    _e_++;
    var new_x = x.map( function(xi) { return tape(_e_, xi, [], []) } )
    var y = f(new_x);
    if (isTape(y) && !lt_e(y.epsilon, _e_)) {
      determineFanout(y);
      reversePhase(1.0, y);
    }
    _e_--;
    return new_x.map(function(v){return v.sensitivity})
  }
}

var derivativeR = function(f) {
  return function(x) {
    var r = gradientR( function(x1) {return f(x1[0])} )([x])
    return r[0]
  }
}

module.exports = {
  add: l_add,
  sub: l_sub,
  mul: l_mul,
  div: l_div,
  eq: l_eq,
  neq: l_neq,
  peq: l_peq,
  pneq: l_pneq,
  gt: l_gt,
  lq: l_lq,
  geq: l_geq,
  leq: l_leq,
  sqrt: l_sqrt,
  exp: l_exp,
  log: l_log,
  pow: l_pow,
  sin: l_sin,
  cos: l_cos,
  atan: l_atan,
  derivativeF: derivativeF,
  gradientF: gradientF,
  derivativeR: derivativeR,
  gradientR: gradientR
}
