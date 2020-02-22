
import { Either, Right, Left } from '../Either'
import { Future, resolve } from '../Future'

interface FutureEither<E, B> {
  __val: Future<Either<E, B>>
  __tag: string
  map: <C>(f:(_:B) => C) => FutureEither<E, C>
  flatMap: <EE, C>(f:(_:B) => FutureEither<E | EE, C>) => FutureEither<E | EE, C>
  flatMapF: <EE, C>(f:(_:B) => Future<Either<E | EE, C>>) => FutureEither<E | EE, C>
  run: <C>(onSuccess: (_:B) => C, onFailure: (_:E) => C, onError: (_?: any) => C) => Promise<C>
}

const FutureEither = <E, B>(val: Future<Either<E, B>>): FutureEither<E, B> => ({
  __val: val,
  __tag: 'FutureEither',
  map: <C>(f: (_:B) => C) => FutureEither<E, C>(val.map(eitherE => eitherE.map(f))),
  flatMap: <EE, C>(f: (_:B) => FutureEither<E | EE, C>) => FutureEither<E | EE, C>(
    val.flatMap(eitherE => eitherE.match(
      a => FutureEither<E, C>(Future(() => Promise.resolve(Left(a)))).__val,
      b => f(b).__val
    ))
  ),
  flatMapF: <EE, C>(f: (_:B) => Future<Either<E | EE, C>>) => FutureEither<E | EE, C>(
    val.flatMap(eitherE => eitherE.match(
      a => Future(() => Promise.resolve(Left(a))),
      b => f(b)
    ))
  ),
  run: <C>(f: (_:B) => C, onFailure: (_:E) => C, g: (_?: any) => C): Promise<C> => val.run(
    a => a.match(
      left => onFailure(left),
      right => f(right)
    ),
    a => g(a)
  )
})
