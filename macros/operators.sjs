// precedence and associativity taken from
// http://sweetjs.org/doc/main/sweet.html#custom-operators
operator +   14 { $r } => #{ ad.add(0, $r) }
operator -   14 { $r } => #{ ad.sub(0, $r) }
operator *   13 left { $l, $r } => #{ ad.mul($l, $r) }
operator /   13 left { $l, $r } => #{ ad.div($l, $r) }
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
// needswork: modulo operation
// needswork: binary and bitwise operations
