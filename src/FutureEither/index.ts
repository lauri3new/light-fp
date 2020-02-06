// case class FutOpt[A](value: Future[Option[A]]) {
//   def map[B](f: A => B): FutOpt[B] =
//     FutOpt(value.map(optA => optA.map(f)))
//   def flatMap[B](f: A => FutOpt[B]): FutOpt[B] =
//     FutOpt(value.flatMap(opt => opt match {
//       case Some(a) => f(a).value
//       case None => Future.successful(None)
//     }))
// }

// import { Either, Right, Left } from '../Either'
// import { Future, resolve } from '../Future'

// interface FutureEither<A, B> {
//   __val: Future<Either<A, B>>
//   __tag: string
//   map: <C>(f:(_:B) => C) => FutureEither<A, C>
//   flatMap: <D, C>(f:(_:B) => FutureEither<D, C>) => FutureEither<D, C>
//   fork: <C>(onSuccess: (_:B) => C, onFailure: (_:A) => C, onError: (_?: any) => C) => Promise<C>
// }

// const FutureEither = <A, B>(val: Future<Either<A, B>>): FutureEither<A, B> => ({
//   __val: val,
//   __tag: 'FutureEither',
//   map: <C>(f: (_:B) => C) => FutureEither<A, C>(val.map(eitherA => eitherA.map(f))),
//   flatMap: <D, C>(f: (_:B) => FutureEither<D, C>) => FutureEither<D, C>(
//     val.flatMap(eitherA => f(eitherA.get()).__val),
//   ),
//   fork: <C>(f: (_:B) => C, onFailure: (_:A) => C, g: (_?: any) => C): Promise<C> => val.fork(
//     a => a.match(
//       left => onFailure(left),
//       right => f(right),
//     ),
//     a => g(a),
//   ),
// })

// FutureEither(resolve(Right(5)))
//   .map(a => a + 1)
//   .map(a => {
//     console.log(a)
//     return a
//   })
// .flatMap(a => FutureEither(() => Promise.resolve(Left('doh'))))
// .map(a => a + 1)
// .map(a => {
//   console.log('after left', a)
//   return a
// })
// .fork(a => console.log('wahoo', a), a => console.log('doh', a))

// TODO: write in terms of Future
// TODO: write match functions for all either monads
// TODO: write helper functions for monads
