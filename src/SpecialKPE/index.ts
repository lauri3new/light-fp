
import { Either, Left, Right } from '../Either'

export interface SpecialKPE<C, E, A, I> {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => SpecialKPE<C, E, B, I>
  write: <CC>(f:(_:C) => Promise<CC>) => SpecialKPE<CC, E, A, I>
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => SpecialKPE<C, E, B, I>
  // leftMap: <EE>(f:(_:E) => EE) => SpecialKPE<C, EE, A>
  // flatMap: <G, EE, H>(f: SpecialKPE<G, EE, H>) => SpecialKPE<G, EE | E, H>
  // flatMapF: <EE, H extends object>(f:(_: A) => Promise<Either<EE, H>>) => SpecialKPE<C, EE | E, H>
  // runWith: <I, J, K>(
  //   context: C,
  //   onSuccess: (_:A) => I,
  //   onFailure: (_:E) => J,
  //   onError: (_?: Error) => K
  // ) => Promise<I | J | K>
}

export const SpecialKPE = <C, E, A, I>(val:(_: I) => Promise<[Either<E, A>, C]>): SpecialKPE<C, E, A, I> => ({
  __val: val,
  __tag: 'SpecialKPE',
  map: <B>(f: (_:A) => B) => SpecialKPE<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
  write: <CC>(f:(_:C) => Promise<CC>) => SpecialKPE<CC, E, A, I>((c: I) => val(c)
    .then(
      ([eitherA, g]) => f(g).then((cc) => ([eitherA, cc]))
    )),
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => SpecialKPE<C, E, B, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
            return r
          },
          a => {
            const r = f(a, g).then(b => [b, g] as [Either<EE, B>, C])
            return r
          }
        )
      )
  ),
  // write: <D>(f:(_:C) => D) => SpecialKPE<C, G, E, A>((c: C) => val(c).then(([eitherA]) => [eitherA, f(c)]))
  // mapWithCtx: <B extends object>(f:(_:A) => B) => SpecialKPE<C, E, C & B>((c: C) => val(c).then((eitherA) => eitherA.map(f).map(a => ({ ...a, ...c })))),
  // leftMap: <EE>(f: (_:E) => EE) => SpecialKPE<C, EE, A>((c: C) => val(c).then(eitherA => eitherA.leftMap(f))),
  // flatMap: <G, EE, H>(f: SpecialKPE<A, EE, H>) => SpecialKPE<C, E | EE, H>(
  //   (c: C) => val(c)
  //     .then((eitherA): Promise<Either<E | EE, H>> => eitherA.match(
  //       left => Promise.resolve<Either<E, H>>(Left(left)),
  //       right => f.__val(right)
  //     ))
  // ),
  // runWith: <I, J, K>(
  //   c: C,
  //   f: (_:A) => I,
  //   g: (_:E) => J,
  //   j: (_?: Error) => K
  // ) => val(c).then(
  //   (a) => a.match(
  //     none => g(none),
  //     some => f(some)
  //   )
  // ).catch(
  //   j
  // )
})

type User = {
  name: string
  id: number
}

const b = SpecialKPE(async () => [Right(1), 'hello'])
  .map(a => 2)
