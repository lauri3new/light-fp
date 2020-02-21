
export interface Option<A> {
  _tag: string
  get: () => A | null
  map:<B>(f:(_: A) => B) => Option<B>
  getOrElse:<B>(_:B) => A | B
  flatMap:<B>(f:(_: A) => Option<B>) => Option<B>
  orElse:<B>(_: Option<B>) => Option<A> | Option<B>
  filter:(f:(_:A) => boolean) => Option<A>
  match:<B, C>(g:() => C, f:(_:A) => B) => B | C
}

export const None = (): Option<never> => ({
  _tag: 'none',
  get: () => null,
  map: f => None(),
  getOrElse: b => b,
  orElse: b => b,
  flatMap: f => None(),
  filter: f => None(),
  match: (f, g) => f()
})

export const Some = <A>(a: A): Option<A> => ({
  _tag: 'some',
  get: () => a,
  map: f => Some(f(a)),
  getOrElse: _ => a,
  orElse: () => Some(a),
  flatMap: f => f(a),
  filter: f => (f(a) ? Some(a) : None()),
  match: (f, g) => g(a)
})

export const isNone = <A>(a: Option<A>): a is Option<A> => a._tag === 'none'
export const isSome = <A>(a: Option<A>): a is Option<A> => a._tag === 'some'
export const fromNullable = <A>(a: A | null | undefined) => {
  if (a === null) {
    return None()
  }
  if (a === undefined) {
    return None()
  }
  return Some<A>(a)
}
