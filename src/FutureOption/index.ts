
import { Option, Some, None } from '../Option'
import { Future, resolve } from '../Future'

interface FutureOption<A> {
  __val: Future<Option<A>>
  __tag: string
  map: <B>(f:(_:A) => B) => FutureOption<B>
  flatMap: <B>(f:(_:A) => FutureOption<B>) => FutureOption<B>
  flatMapF: <B>(f:(_:A) => Future<Option<B>>) => FutureOption<B>
  run: <B>(onSuccess: (_:A) => B, onFailure: () => B, onError: (_?: any) => B) => Promise<B>
}

const FutureOption = <A>(val: Future<Option<A>>): FutureOption<A> => ({
  __val: val,
  __tag: 'FutureOption',
  map: <B>(f: (_:A) => B) => FutureOption<B>(val.map(optionA => optionA.map(f))),
  flatMap: <B>(f: (_:A) => FutureOption<B>) => FutureOption<B>(
    val.flatMap(optionA => optionA.match(
      () => FutureOption<B>(Future(() => Promise.resolve(None()))).__val,
      b => f(b).__val
    ))
  ),
  flatMapF: <B>(f: (_:A) => Future<Option<B>>) => FutureOption<B>(
    val.flatMap(optionA => optionA.match(
      () => Future(() => Promise.resolve(None())),
      b => f(b)
    ))
  ),
  run: <B>(f: (_:A) => B, onFailure: () => B, g: (_?: any) => B): Promise<B> => val.fork(
    a => a.match(
      () => onFailure(),
      right => f(right)
    ),
    a => g(a)
  )
})
