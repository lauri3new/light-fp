
import { Either, Right, Left } from '../Either'
import { Option } from '../Option'
import { PromiseOption } from '../PromiseOption'

export interface PromiseEither<A, B> {
  __val: Promise<Either<A, B>>
  __tag: string
  map: <C>(f:(_:B) => C) => PromiseEither<A, C>
  leftMap: <C>(f:(_:A) => C) => PromiseEither<C, B>
  flatMap: <E, C>(f:(_:B) => PromiseEither<A | E, C>) => PromiseEither<A | E, C>
  flatMapF: <E, C>(f:(_:B) => Promise<Either<A | E, C>>) => PromiseEither<A | E, C>
  onComplete: <C, D, E>(onSuccess: (_:B) => C, onFailure: (_:A) => D, onError: (_?: Error) => E) => Promise<C | D | E>
}

export const PromiseEither = <A, B>(val: Promise<Either<A, B>>): PromiseEither<A, B> => ({
  __val: val,
  __tag: 'PromiseEither',
  map: <C>(f: (_:B) => C) => PromiseEither<A, C>(val.then(eitherA => eitherA.map(f))),
  leftMap: <C>(f: (_:A) => C) => PromiseEither<C, B>(val.then(eitherA => eitherA.leftMap(f))),
  flatMap: <E, C>(f: (_:B) => PromiseEither<A | E, C>) => PromiseEither<A | E, C>(
    val.then(eitherA => eitherA.match(
      none => Promise.resolve<Either<A, C>>(Left(none)),
      some => f(some).__val
    ))
  ),
  flatMapF: <E, C>(f: (_:B) => Promise<Either<A | E, C>>) => PromiseEither<A | E, C>(val.then(eitherA => eitherA.match(
    none => Promise.resolve<Either<A, C>>(Left(none)),
    some => f(some)
  ))),
  onComplete: <C, D, E>(f: (_:B) => C, g: (_:A) => D, j: (_?: any) => E) => val.then(
    (a) => a.match(
      none => g(none),
      some => f(some)
    )
  ).catch(
    j
  )
})

export const fromEither = <E, A>(a: Either<E, A>) => PromiseEither(Promise.resolve(a))

export const fromNullable = <A, B>(a: A | null | undefined) => {
  if (a === null) {
    return Left(null)
  }
  if (a === undefined) {
    return Left(null)
  }
  return Right<A>(a)
}

export const fromPromiseOption = <A>(poa: PromiseOption<A>) => PromiseEither<undefined, A>(poa.onComplete(
  someA => Right(someA),
  () => Left(undefined),
  error => { throw error }
))

export const fromPromiseOptionF = <A>(poa: Promise<Option<A>>) => PromiseEither<undefined, A>(poa.then(
  optA => optA.match(
    () => Left(undefined),
    someA => Right(someA)
  )
))

export const peLeft = <E>(e: E) => PromiseEither(Promise.resolve(Left(e)))
export const peRight = <A>(a: A) => PromiseEither(Promise.resolve(Right(a)))

type PromiseEitherK <A, B, C> = (a: (A)) => PromiseEither<B, C>

export function composeK <A, B, C, D, E>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>): (d: A) => PromiseEither<B | D, E>
export function composeK <A, B, C, D, E, F, G>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>): (d: A) => PromiseEither<B | D | F, G>
export function composeK <A, B, C, D, E, F, G, H, I>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>): (d: A) => PromiseEither<B | D | F | H, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>): (d: A) => PromiseEither<B | D | F | H | J, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>)
  : (d: A) => PromiseEither<B | D | F | H | J | L, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N | P, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>, i: PromiseEitherK<Q, R, S>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N | P | R, I>
export function composeK (...a: any[]): PromiseEitherK<any, any, any>
export function composeK<A>(...as: any[]) {
  return function (d: A) {
    const [aa, ...aas] = as
    if (aas && aas.length === 0) return aa(d)
    return aa(d).flatMap(
      composeK(...aas)
    )
  }
}
