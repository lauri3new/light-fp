
import { Option, Some, None } from '../Option'

// TODO: fork and flatMap from Promise<Either<_,_>>

export interface PromiseOption<A> {
  __val: Promise<Option<A>>
  __tag: string
  map: <B>(f:(_:A) => B) => PromiseOption<B>
  flatMap: <B>(f:(_:A) => PromiseOption<B>) => PromiseOption<B>
  flatMapF: <B>(f:(_:A) => Promise<Option<B>>) => PromiseOption<B>
  onComplete: <C, D, E>(onSuccess: (_:A) => C, onFailure: () => D, onError: (_?: Error) => E) => Promise<C | D | E>
}

export const PromiseOption = <A>(val: Promise<Option<A>>): PromiseOption<A> => ({
  __val: val,
  __tag: 'PromiseOption',
  map: <B>(f: (_:A) => B) => PromiseOption<B>(val.then(optionA => optionA.map(f))),
  flatMap: <B>(f: (_:A) => PromiseOption<B>) => PromiseOption<B>(
    val.then(option => option.match(
      some => f(some).__val,
      () => Promise.resolve<Option<B>>(None())
    ))
  ),
  flatMapF: <B>(f: (_:A) => Promise<Option<B>>) => PromiseOption<B>(val.then(optionA => optionA.match(
    some => f(some),
    () => Promise.resolve<Option<B>>(None())
  ))),
  onComplete: <C, D, E>(f: (_:A) => C, g: () => D, j: (_?: any) => E) => val.then(
    (a) => a.match(
      some => f(some),
      () => g()
    )
  ).catch(
    j
  )
})


export const sequence = <A>(as: PromiseOption<A>[]): PromiseOption<A[]> => as.reduce(
  (acc, item) => item.flatMap(ia => acc.flatMapF(iacc => Promise.resolve(Some([...iacc, ia])))), (PromiseOption(Promise.resolve(Some<any>([]))))
)
