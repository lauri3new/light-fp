
export const curryTwo = <A, B, C>(f: (_:A, __:B) => C): (_:A) => (_:B) => C => (a: A) => (b: B) => f(a, b)
export const uncurryTwo = <A, B, C>(f:(_:A) => (_:B) => C) => (a: A, b: B) => f(a)(b)
export const composeTwo = <A, B, C>(f: (_:A) => B, g: (_:B) => C) => (a: A) => g(f(a))

// control
type Predicate<A> = (_:A) => boolean
export const when = <A, B>(a:Predicate<A>) => (b: (_:A) => B) => (c: A) => {
  if (a(c)) {
    return b(c)
  }
  return c
}
