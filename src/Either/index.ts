import { Option } from '../Option'

export interface Either<E, A> {
  _tag: string
  get: () => A
  // orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E | EE, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B | C
}

// export interface Left<E, A> extends Either<E, A> {
//   _tag: string
//   get: () => any
//   orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
//   map:<B>(f:(_: A) => B) => Either<E, B>
//   leftMap:<B>(f:(_: E) => B) => Either<B, A>
//   flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E, B>
//   match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B
// }

// export interface Right<E, A> extends Either<E, A> {
//   _tag: string
//   get: () => any
//   orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
//   map:<B>(f:(_: A) => B) => Either<E, B>
//   leftMap:<B>(f:(_: E) => B) => Either<B, A>
//   flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E | EE, B>
//   match:<B, C>(f:(_:E) => B, g:(_:A) => C) => C
// }

export const Right = <A, E = any>(a: A): Either<E, A> => ({
  _tag: 'some',
  get: () => a,
  // orElse: f => Right(a),
  map: f => Right(f(a)),
  leftMap: f => Right(a),
  flatMap: f => f(a),
  match: (f, g) => g(a),
})

export const Left = <A>(a: A): Either<A, any> => ({
  _tag: 'none',
  get: () => a,
  // orElse: b => b,
  map: _ => Left<A>(a),
  leftMap: f => Left(f(a)),
  flatMap: _ => Left<A>(a),
  match: (f, g) => f(a),
})

export const fromOption = <A, B>(a: Option<A>, left?: B) => a.match(
  someA => Right(someA),
  () => Left(left),
)

export const sequence = <A, B>(as: Either<A, B>[]): Either<A, B[]> => as.reduce(
  (acc, item) => item.flatMap(b => acc.flatMap(iacc => (Right([...iacc, b])))), (Right<any>([])),
)

// export const sequenceV = <T extends Array<Either<any, any>>[]>(...as: T): {
//   [K in keyof T]: T[K] extends Either<any, any> ? InstanceType<T[K]> : never
// } => as.reduce(
//   (acc, item) => item.flatMap(b => acc.flatMap(iacc => (Right([...iacc, b])))), (Right<any>([])),
// )


// export interface Validation<E, A> {
//   _tag: string
//   map:<B>(f:(_: A) => B) => Validation<E, B>
//   apply:<B>(fab:Validation<E, (_: A) => B>) => Validation<E, B>
// }

// const Validation = () => {

// }
