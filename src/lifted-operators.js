"use strict";

var ad = require('./ad.js');

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

var f_bw_and = function(a,b) {return a & b};
var f_bw_or = function(a,b) {return a | b};
var f_bw_xor = function(a,b) {return a ^ b};
var f_bw_not = function(a) {return ~a};
var f_lshft = function(a,b) {return a << b};
var f_rshft = function(a,b) {return a >> b};
var f_urshft = function(a,b) {return a >>> b};

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
      return ad.lift_realreal_to_real(baseF, lifter1, lifter2, x1, x2);
  }
};
// this might need primal* if cmp operators are used with &rest
var overloader_2cmp = function(baseF) {
  return function(x1, x2) {
    if (isNumeric(x1) && isNumeric(x2))
      return baseF(x1, x2);
    else {
      var fn = function(x1, x2) {
        if (ad.isDualNumber(x1) || ad.isTape(x1))
          return fn(x1.primal, x2);
        else if (ad.isDualNumber(x2) || ad.isTape(x2))
          return fn(x1, x2.primal);
        else
          return baseF(x1, x2);
      }
      return fn(x1, x2);
    }
  };
};
var oneF = function(x1, x2){return 1.0;};
var m_oneF = function(x1, x2){return -1.0;};
var firstF = function(x1, x2){return x1;};
var secondF = function(x1, x2){return x2;};
var div2F = function(x1, x2){return 1 / x2;};         // lifted ops?
var divNF = function(x1, x2){return x1 / (x2 * x2);}; // lifted ops?

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
  return ad.lift_real_to_real(Math.sqrt, function(x){return 1 / (2.0 * l_sqrt(x))}, x)
};

var l_exp = function(x) {
  return ad.lift_real_to_real(Math.exp, function(x){return l_exp(x)}, x);
};

var l_log = function(x) {
  return ad.lift_real_to_real(Math.log, function(x){return 1 / x}, x);
};

var l_pow = function(x1, x2) {
  return ad.lift_realreal_to_real(Math.pow,
                                  function(x1, x2){return x2 * l_pow(x1, x2 - 1);},
                                  function(x1, x2){return l_log(x1) * l_pow(x1, x2);},
                                  x1,
                                  x2);
};

var l_sin = function(x) {
  return ad.lift_real_to_real(Math.sin, function(x){return l_cos(x)}, x);
};

var l_cos = function(x) {
  return ad.lift_real_to_real(Math.cos, function(x){return -l_sin(x)}, x);
};

var l_atan = function(x1, x2) {
  x2 = x2 === undefined ? 1 : x2; // just atan, not atan2
  return ad.lift_realreal_to_real(Math.atan2,
                                  function(x1, x2){return x2 / (x1*x1 + x2*x2)},
                                  function(x1, x2){return -x1 / (x1*x1 + x2*x2)},
                                  x1,
                                  x2);
};

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
  atan: l_atan
}
