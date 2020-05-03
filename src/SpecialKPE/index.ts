
import { Either, Left, Right } from '../Either'

export interface SpecialKPE<C, E, A, I> {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => SpecialKPE<C, E, B, I>
  write: <CC>(f:(_:C) => Promise<CC>) => SpecialKPE<CC, E, A, I>
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => SpecialKPE<C, E | EE, B, I>
  // leftMap: <EE>(f:(_:E) => EE) => SpecialKPE<C, EE, A>
  // flatMap: <G, EE, H>(f: SpecialKPE<G, EE, H>) => SpecialKPE<G, EE | E, H>
  // flatMapF: <EE, H extends object>(f:(_: A) => Promise<Either<EE, H>>) => SpecialKPE<C, EE | E, H>
  runWith: <L, M, N>(
    context: I,
    onError: (_?: Error) => N,
    onSuccess: (_:A) => L,
    onFailure: (_:E) => M
  ) => Promise<L | M | N>
}

export const SpecialKPE = <C, E, A, I>(val:(_: I) => Promise<[Either<E, A>, C]>): SpecialKPE<C, E, A, I> => ({
  __val: val,
  __tag: 'SpecialKPE',
  map: <B>(f: (_:A) => B) => SpecialKPE<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
  write: <CC>(f:(_:C) => Promise<CC>) => SpecialKPE<CC, E, A, I>((c: I) => val(c)
    .then(
      ([eitherA, g]) => f(g).then((cc) => ([eitherA, cc]))
    )),
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => SpecialKPE<C, E | EE, B, I>(
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

type Service = { userService: { get: () => 2 } }

const SpecialK = SpecialKPE<Service, never, number, Service>(async (c) => [Right(1), c])
const specialK = <C>() => SpecialKPE<C, never, undefined, C>(async (cc) => [Right(undefined), cc])

// specialK<Service>()
//   .flatMapF(async (a, g) => Right(123))

type User = {
  name: string
  id: number
}

SpecialK
  .map((a) => {
    console.log('hiya')
    return a
  })
  .runWith(
    { userService: { get: () => 2 } },
    a => console.log('error', a),
    a => console.log('success', a),
    a => console.log('failure', a)
  )

const yela = specialK<Service>()
  .flatMapF(async (_, ctx) => Right(ctx.userService.get()))

setTimeout(() => {
  yela.runWith(
    { userService: { get: () => 2 } },
    a => console.log('error', a),
    a => console.log('success', a),
    a => console.log('failure', a)
  )
}, 5000)

// const b = SpecialKPE(async (c: { userService: { get: () => 2 } }) => [Right(1), c])
//   .map(a => 2)
//   .flatMapF(async (f, g) => Right('wasup'))
//   .flatMapF(async (f, g) => Right(g.userService.get()))
//   .write(async (g) => ({ ...g, mySecondService: { get: () => 214 } }))
