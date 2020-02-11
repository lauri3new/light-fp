import { map } from '../Object'

export interface Option<A> {
  _tag: string
  get: () => A | null
  map:<B>(f:(_: A) => B) => Option<A | B>
  getOrElse:<B>(_:B) => A | B
  flatMap:<B>(f:(_: A) => Option<B>) => Option<B>
  orElse:<B>(_: Option<B>) => Option<A> | Option<B>
  filter:(f:(_:A) => boolean) => Option<A>
  match:<B, C>(f:(_:A) => B, g:() => C) => B | C
}

export interface Either<E, A> {
  _tag: string
  get: () => E | A
  // orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E | EE, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B | C
}

// export interface None<A> extends Option<A> {
//   _tag: string
//   get: () => any
//   map:<B>(f:(_: A) => B) => None<any>
//   getOrElse:<B>(_:B) => B
//   orElse:<B>(_: Option<B>) => Option<B>
//   flatMap:<B>(f:(_: A) => Option<B>) => None<any>
//   filter:(f:(_:A) => boolean) => None<A>
//   match:<B, C>(f:(_:A) => B, g:() => C) => C
// }

// type Some<A> = Option<A>

export const None = <A>(): Option<A> => ({
  _tag: 'none',
  get: () => null,
  map: f => None<A>(),
  getOrElse: b => b,
  orElse: b => b,
  flatMap: f => None(),
  filter: f => None(),
  match: (f, g) => g()
})

export const Some = <A>(a: A): Option<A> => ({
  _tag: 'some',
  get: () => a,
  map: f => Some(f(a)),
  getOrElse: _ => a,
  orElse: () => Some(a),
  flatMap: f => f(a),
  filter: f => (f(a) ? Some(a) : None()),
  match: (f, g) => f(a)
})

export const isNone = <A>(a: Option<A>): a is Option<A> => a._tag === 'none'
export const isSomething = <A>(a: Option<A>): a is Option<A> => a._tag === 'some'
export const fromNullable = <A>(a: A | null | undefined) => {
  if (a === null) {
    return None<A>()
  }
  if (a === undefined) {
    return None<A>()
  }
  return Some<A>(a)
}
