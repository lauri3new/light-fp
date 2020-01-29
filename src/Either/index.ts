import { Option } from '../Option'

export interface Either<E, A> {
  _tag: string
  get: () => A
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<B>(f:(_: A) => Either<E, B>) => Either<E, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B | C
}

export interface Left<E, A> extends Either<E, A> {
  _tag: string
  get: () => any
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  map:<B>(f:(_: A) => B) => Either<E, B>
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  flatMap:<B>(f:(_: A) => Either<E, B>) => Either<E, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B
}

export interface Right<E, A> extends Either<E, A> {
  _tag: string
  get: () => any
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  map:<B>(f:(_: A) => B) => Either<E, B>
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  flatMap:<B>(f:(_: A) => Either<E, B>) => Either<E, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => C
}

export const Right = <A>(a: A): Either<any, A> => ({
  _tag: 'some',
  get: () => a,
  orElse: f => Right(a),
  map: f => Right(f(a)),
  leftMap: f => Right(a),
  flatMap: f => f(a),
  match: (f, g) => g(a),
})

export const Left = <A>(a: A): Left<A, any> => ({
  _tag: 'none',
  get: () => a,
  orElse: b => b,
  map: _ => Left<A>(a),
  leftMap: f => Left(f(a)),
  flatMap: _ => Left<A>(a),
  match: (f, g) => f(a),
})

export const fromOption = <A, B>(a: Option<A>, left?: B) => a.match(
  someA => Right(someA),
  () => Left(left),
)

// export interface Validation<E, A> {
//   _tag: string
//   map:<B>(f:(_: A) => B) => Validation<E, B>
//   apply:<B>(fab:Validation<E, (_: A) => B>) => Validation<E, B>
// }

// const Validation = () => {

// }
