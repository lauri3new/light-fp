
import { Either, Right, Left } from '../Either'

// TODO: fork and flatMap from Promise<Either<_,_>>

export interface PromiseEither<A, B> {
  __val: Promise<Either<A, B>>
  __tag: string
  map: <C>(f:(_:B) => C) => PromiseEither<A, C>
  leftMap: <C>(f:(_:A) => C) => PromiseEither<C, B>
  flatMap: <C>(f:(_:B) => PromiseEither<A, C>) => PromiseEither<A, C>
  flatMapF: <C>(f:(_:B) => Promise<Either<A, C>>) => PromiseEither<A, C>
  onComplete: <C, D, E>(onSuccess: (_:B) => C, onFailure: (_:A) => D, onError: (_?: Error) => E) => Promise<C | D | E>
}

export const PromiseEither = <A, B>(val: Promise<Either<A, B>>): PromiseEither<A, B> => ({
  __val: val,
  __tag: 'PromiseEither',
  map: <C>(f: (_:B) => C) => PromiseEither<A, C>(val.then(eitherA => eitherA.map(f))),
  leftMap: <C>(f: (_:A) => C) => PromiseEither<C, B>(val.then(eitherA => eitherA.leftMap(f))),
  flatMap: <C>(f: (_:B) => PromiseEither<A, C>) => PromiseEither<A, C>(
    val.then(eitherA => eitherA.match(
      none => Promise.resolve<Either<A, C>>(Left(none)),
      some => f(some).__val,
    )),
  ),
  flatMapF: <C>(f: (_:B) => Promise<Either<A, C>>) => PromiseEither<A, C>(val.then(eitherA => eitherA.match(
    none => Promise.resolve<Either<A, C>>(Left(none)),
    some => f(some),
  ))),
  onComplete: <C, D, E>(f: (_:B) => C, g: (_:A) => D, j: (_?: any) => E) => val.then(
    (a) => a.match(
      none => g(none),
      some => f(some),
    ),
  ).catch(
    j,
  ),
})


export const sequence = <A, B>(as: PromiseEither<A, B>[]): PromiseEither<A, B[]> => as.reduce(
  (acc, item) => item.flatMap(ia => acc.flatMapF(iacc => Promise.resolve(Right([...iacc, ia])))), (PromiseEither(Promise.resolve(Right<any>([])))),
)

let a = PromiseEither(Promise.resolve(Right(5)))

for (let i = 0; i < 1000000; i += 1) {
  a = a.map(b => b + 1)
}

const log = <A>(b:A) => {
  console.log(b)
  return b
}

a.map(log)
console.log('wha?')
