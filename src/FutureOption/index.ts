
// case class FutOpt[A](value: Future[Option[A]]) {

//   def map[B](f: A => B): FutOpt[B] =
//     FutOpt(value.map(optA => optA.map(f)))
//   def flatMap[B](f: A => FutOpt[B]): FutOpt[B] =
//     FutOpt(value.flatMap(opt => opt match {
//       case Some(a) => f(a).value
//       case None => Future.successful(None)
//     }))
// }

import { Option, Some, None } from '../Option'

interface FutureOption<A> {
  value: Promise<Option<A>>
  map: <B>(f:(_:A) => B) => FutureOption<B>
  flatMap: <B>(f:(_:A) => Promise<Option<B>>) => FutureOption<B>
}

const FutureOption = <A>(value: Promise<Option<A>>): FutureOption<A> => ({
  value,
  map: <B>(f:(_:A) => B) => FutureOption<B>(
    value.then(a => a.map(f))
  ),
  flatMap: <B>(f:(_:A) => Promise<Option<B>>) => FutureOption<B>(
    value.then((optA) => optA.match(
      someA => f(someA),
      (): Promise<Option<B>> => Promise.resolve(None())
    ))
  )
})

const sleep = () => new Promise((res) => setTimeout(() => res(), 3000))

const abba = FutureOption(Promise.resolve(Some(5)))
  .map(a => a + 5)
  .map(a => {
    console.log(a)
    return a
  })
  .flatMap(async a => {
    await sleep()
    return Some(a)
  })
  .map(a => {
    console.log(a)
    return a
  })

// normal option?
//
