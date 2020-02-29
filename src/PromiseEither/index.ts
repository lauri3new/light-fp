
import { Either, Right, Left } from '../Either'
import { Option, Some, None } from '../Option'
import { PromiseOption } from '../PromiseOption'

// TODO: run and flatMap from Promise<Either<_,_>>

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


// export const sequence = <A, B>(as: PromiseEither<A, B>[]): PromiseEither<A, B[]> => as.reduce(
//   (acc, item) => item.flatMap(ia => acc.flatMapF(iacc => Promise.resolve(Right([...iacc, ia])))), (PromiseEither(Promise.resolve(Right<any>([])))),
// )

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

fromPromiseOption(PromiseOption(Promise.resolve(Some(5))))

type PromiseEitherK <A, B, C> = (a: (A)) => PromiseEither<B, C>

export const composeK = <A, B, C, D, E>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>) => (d: A):PromiseEither<B | D, E> => a(d).flatMap(b)

// const dabaMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
//   ...ctx,
//   daba: {
//     daba: '123',
//   },
// })))

// const loggerMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A> => PromiseEither(Promise.resolve(Right(ctx)))

// const fullRoute = (ctx: Context) => composeK(dabaMiddleware, loggerMiddleware)(ctx)

// const fullRouteTwo = (ctx: Context) => composeK(dabaMiddleware, composeK(loggerMiddleware, dabaMiddleware))(ctx)

// const compose3 = <A, B, C, D, E, G, F, J, H> (a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>) => composeK(a, composeK(b, c))

// const a = compose3(loggerMiddleware, dabaMiddleware, loggerMiddleware)

// TODO: write compose as overloads

// middleware makes sense.
