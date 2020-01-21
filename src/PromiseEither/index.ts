
import { Either, Right, Left } from '../Either'

interface PromiseEither<A, B> {
  __val: Promise<Either<A, B>>
  __tag: string
  map: <C>(f:(_:B) => C) => PromiseEither<A, C>
  flatMap: <D, C>(f:(_:B) => PromiseEither<D, C>) => PromiseEither<D, C>
}

const PromiseEither = <A, B>(val: Promise<Either<A, B>>): PromiseEither<A, B> => ({
  __val: val,
  __tag: 'PromiseEither',
  map: <C>(f: (_:B) => C) => PromiseEither<A, C>(val.then(eitherA => eitherA.map(f))),
  flatMap: <D, C>(f: (_:B) => PromiseEither<D, C>) => PromiseEither<D, C>(
    val.then(eitherA => f(eitherA.get()).__val),
  ),
})

PromiseEither(Promise.resolve(Right(5)))
  .map(a => a + 1)
  .map(a => {
    console.log(a)
    return a
  })
  .flatMap(a => PromiseEither(Promise.resolve(Right('doh'))))
  .map(a => a + 1)
  .map(a => {
    console.log('after left', a)
    return a
  })
