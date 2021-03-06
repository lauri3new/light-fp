import { Option } from '../Option'

export interface Either<E, A> {
  _tag: string
  get: () => E | A
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E | EE, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B | C
}

export type Right<A> = Either<never, A>
export type Left<E> = Either<E, never>

export const Right = <A, E = never>(a: A): Either<E, A> => ({
  _tag: 'right',
  get: () => a,
  map: f => Right(f(a)),
  leftMap: f => Right(a),
  flatMap: f => f(a),
  match: (f, g) => g(a)
})

export const Left = <E, A = never>(a: E): Either<E, A> => ({
  _tag: 'left',
  get: () => a,
  map: _ => Left<E>(a),
  leftMap: f => Left(f(a)),
  flatMap: _ => Left<E>(a),
  match: (f, g) => f(a)
})

export const fromOption = <A, B>(a: Option<A>, left?: B) => a.match(
  () => Left(left),
  someA => Right(someA)
)
