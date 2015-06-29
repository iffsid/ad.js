// -*- mode: js -*-
// precedence and associativity taken from
// http://sweetjs.org/doc/main/sweet.html#custom-operators
operator +   14 { $r } => #{ ad.add(0, $r) }
operator -   14 { $r } => #{ ad.sub(0, $r) }
operator *   13 left { $l, $r } => #{ ad.mul($l, $r) }
operator /   13 left { $l, $r } => #{ ad.div($l, $r) }
operator %   13 left { $l, $r } => #{ ad.mod($l, $r) }
operator +   12 left { $l, $r } => #{ ad.add($l, $r) }
operator -   12 left { $l, $r } => #{ ad.sub($l, $r) }
operator <   10 left { $l, $r } => #{ ad.lt($l, $r) }
operator <=  10 left { $l, $r } => #{ ad.leq($l, $r) }
operator >   10 left { $l, $r } => #{ ad.gt($l, $r) }
operator >=  10 left { $l, $r } => #{ ad.geq($l, $r) }
operator ==   9 left { $l, $r } => #{ ad.eq($l, $r) }
operator !=   9 left { $l, $r } => #{ ad.neq($l, $r) }
operator ===  9 left { $l, $r } => #{ ad.peq($l, $r) }
operator !==  9 left { $l, $r } => #{ ad.pneq($l, $r) }

// TODO? - the pre/post increment/decrement nuance only comes with assignment
//       - requires wrapping up when isolated as statement (x++);
macro ++ {
  rule { $r } => { $r = $r + 1 }
  rule infix { $l | } => { $l = $l + 1 }
}
macro -- {
  rule { $r } => { $r = $r - 1 }
  rule infix { $l | } => { $l = $l - 1 }
}

macro += {
  rule infix { $var:expr | $exprVal:expr } => { $var = $var + $exprVal }
}
macro -= {
  rule infix { $var:expr | $exprVal:expr } => { $var = $var - $exprVal }
}
macro /= {
  rule infix { $var:expr | $exprVal:expr } => { $var = $var / $exprVal }
}
macro *= {
  rule infix { $var:expr | $exprVal:expr } => { $var = $var * $exprVal }
}

macro Math {
  rule { .$x } => { ad.maths.$x }
}

export +
export -
export *
export /
export <
export <=
export >
export >=
export ==
export !=
export ===
export !==
export ++
export --
export +=
export -=
export /=
export *=
export Math
