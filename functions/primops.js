/** functional wrappers for primitive operators **/

var add   = function(a,b) {return a+b};
var sub   = function(a,b) {return a-b};
var mul   = function(a,b) {return a*b};
var div   = function(a,b) {return a/b};
var mod   = function(a,b) {return a%b};

var eq    = function(a,b) {return a==b};
var neq   = function(a,b) {return a!=b};
var peq   = function(a,b) {return a===b};
var pneq  = function(a,b) {return a!==b};
var gt    = function(a,b) {return a>b};
var lt    = function(a,b) {return a<b};
var geq   = function(a,b) {return a>=b};
var leq   = function(a,b) {return a<=b};

/** simple helper functions **/

var zeroF   = function(x){return 0;};
var oneF    = function(x1, x2){return 1.0;};
var m_oneF  = function(x1, x2){return -1.0;};
var firstF  = function(x1, x2){return x1;};
var secondF = function(x1, x2){return x2;};

module.exports = {
  add: add,
  sub: sub,
  mul: mul,
  div: div,
  mod: mod,
  eq:   eq,
  neq:  neq,
  peq:  peq,
  pneq: pneq,
  gt:   gt,
  lt:   lt,
  geq:  geq,
  leq:  leq,
  zeroF:   zeroF,
  oneF:    oneF,
  m_oneF:  m_oneF,
  firstF:  firstF,
  secondF: secondF
}
