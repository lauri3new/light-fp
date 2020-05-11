
import { Either, Left, Right } from '../Either'

// handle tuples of failures - contexts with error, or 1 success tuple

export interface Arrow2<C, E, A, I> {
  __val: (_: I) => Promise<Either<[E, C], [A, C]>>
  __tag: string
  map: <B>(f:(_:A) => B) => Arrow2<C, E, B, I>
  leftMap: <EE>(f:(_:E) => EE) => Arrow2<C, EE, A, I>
  ctxMap: <CC>(f:(_:C) => CC) => Arrow2<CC, E, A, I>
  // write: <CC>(f:(_:C) => Promise<CC>) => Arrow2<CC, E, A, I>
  flatMapF: <EE, B>(f:(_:A, __:C) => Promise<Either<EE, B>>) => Arrow2<C, E | EE, B, I>
  flatMapCtxF: <EE, CC>(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow2<CC | C, E | EE, A, I>
  // flatMap: <B, EE>(f:(_:A, __:C) => Arrow2<C, EE, B, I>) => Arrow2<C, E | EE, B, I>
  // runWith: <L, M, N>(
  //   context: I,
  //   onError: (_?: Error) => N,
  //   onSuccess: (_:A) => L,
  //   onFailure: (_:E) => M
  // ) => Promise<L | M | N>
}

export const Arrow2 = <C, E, A, I>(val:(_: I) => Promise<Either<[E, C], [A, C]>>): Arrow2<C, E, A, I> => ({
  __val: val,
  __tag: 'Arrow2',
  map: <B>(f: (_:A) => B) => Arrow2<C, E, B, I>((c: I) => val(c).then((eitherA) => eitherA.map(([a, ctx]) => [f(a), ctx]))),
  leftMap: <EE>(f: (_:E) => EE) => Arrow2<C, EE, A, I>((c: I) => val(c).then((eitherA) => eitherA.leftMap(([a, ctx]) => [f(a), ctx]))),
  ctxMap: <CC>(f: (_:C) => CC) => Arrow2<CC, E, A, I>((c: I) => val(c).then((eitherA) => eitherA.match(
    ([a, ctx]) => Left([a, f(ctx)]) as Left<[E, CC]>,
    ([a, ctx]) => Right([a, f(ctx)]) as Right<[A, CC]>
  ))),
  // write: <CC>(f:(_:C) => Promise<CC>) => Arrow2<CC, E, A, I>((c: I) => val(c)
  //   .then(
  //     ([eitherA, g]) => f(g).then((cc) => ([eitherA, cc]))
  //   )),
  flatMapF: <EE, B>(f:(_:A, __:C) => Promise<Either<EE, B>>) => Arrow2<C, E | EE, B, I>(
    (c: I) => val(c)
      .then(
        (eitherA): Promise<Either<[E | EE, C], [B, C]>> => eitherA.match(
          ([e, ctx]) => {
            const r = Promise.resolve<Either<[E, C], [B, C]>>(Left([e, ctx]))
            return r
          },
          ([a, ctx]) => {
            const r = f(a, ctx).then(b => b.match(
              (e) => Left([e, c]),
              (bb) => Right([bb, c])
            )) as Promise<Either<[EE, C], [B, C]>>
            return r
          }
        )
      )
  ),
  flatMapCtxF: <EE, CC>(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow2<C | CC, E | EE, A, I>(
    (c: I) => val(c)
      .then(
        (eitherA): Promise<Either<[E | EE, C], [A, CC | C]>> => eitherA.match(
          ([e, ctx]) => {
            const r = Promise.resolve<Either<[E, C], [A, C]>>(Left([e, ctx]))
            return r
          },
          ([a, ctx]) => {
            const r = f(a, ctx).then(b => b.match(
              (e) => Left([e, c]),
              (bb) => Right([a, bb])
            )) as Promise<Either<[EE, C], [A, CC]>>
            return r
          }
        )
      )
  ),
  // runWith: <L, M, N>(
  //   c: I,
  //   j: (_?: Error) => N,
  //   f: (_:A) => L,
  //   g: (_:E) => M
  // ) => val(c).then(
  //   ([a, _c]) => a.match(
  //     none => g(none),
  //     some => f(some)
  //   )
  // ).catch(
  //   j
  // )
})

const bb = Arrow2<{ok: string}, never, number, undefined>(
  async () => Right([123, { ok: 'hello' }])
)
  .flatMapF<string, number>(
    async (a, b): Promise<Either<string, number>> => (Math.random() > 0.5 ? Right(123) : Left('doh'))
  )
  .flatMapF(
    async (a, b) => (Math.random() > 0.5 ? Right({ dee: 123 }) : Left({ error: a }))
  ).flatMapCtxF(
    async () => Right(123)
  )
// .flatMapF(
//   async (a, b): Promise<Either<string, number>> => (Math.random() > 0.5 ? Right(123) : Left('doh'))
// )
