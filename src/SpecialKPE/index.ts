
import { Either, Left, Right } from '../Either'

export interface Arrow<C, E, A, I> {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => Arrow<C, E, B, I>
  write: <CC>(f:(_:C) => Promise<CC>) => Arrow<CC, E, A, I>
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>
  leftMap: <EE>(f:(_:E) => EE) => Arrow<C, EE, A, I>
  // flatMap: <G, EE, H>(f: SpecialKPE<G, EE, H>) => SpecialKPE<G, EE | E, H>
  runWith: <L, M, N>(
    context: I,
    onError: (_?: Error) => N,
    onSuccess: (_:A) => L,
    onFailure: (_:E) => M
  ) => Promise<L | M | N>
}

export const Arrow = <C, E, A, I>(val:(_: I) => Promise<[Either<E, A>, C]>): Arrow<C, E, A, I> => ({
  __val: val,
  __tag: 'SpecialKPE',
  map: <B>(f: (_:A) => B) => Arrow<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
  leftMap: <EE>(f: (_:E) => EE) => Arrow<C, EE, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.leftMap(f), g])),
  write: <CC>(f:(_:C) => Promise<CC>) => Arrow<CC, E, A, I>((c: I) => val(c)
    .then(
      ([eitherA, g]) => f(g).then((cc) => ([eitherA, cc]))
    )),
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
            return r
          },
          a => {
            const r = f(a, g).then(b => [b, g]) as Promise<[Either<EE, B>, C]>
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
  runWith: <L, M, N>(
    c: I,
    j: (_?: Error) => N,
    f: (_:A) => L,
    g: (_:E) => M
  ) => val(c).then(
    ([a, _c]) => a.match(
      none => g(none),
      some => f(some)
    )
  ).catch(
    j
  )
})

type Service = { userService: { get: () => number } }

type User = {
  name: string
  id: number
}


