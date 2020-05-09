
import { Either, Left, Right } from '../Either'

export interface Arrow<C, E, A, I> {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => Arrow<C, E, B, I>
  write: <CC>(f:(_:C) => Promise<CC>) => Arrow<CC, E, A, I>
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>
  leftMap: <EE>(f:(_:E) => EE) => Arrow<C, EE, A, I>
  flatMap: <B, EE>(f:(_:A, __:C) => Arrow<C, EE, B, I>) => Arrow<C, E | EE, B, I>
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
  leftMap: <EE>(f: (_:E) => EE) => Arrow<C, EE, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.leftMap(f), g])),
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
  flatMap: <B, EE>(f:(_:A, __:C) => Arrow<C, EE, B, I>) => Arrow<C, E | EE, B, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
            return r
          },
          a => {
            const r = f(a, g)
            return r.__val(c)
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

type Arrower<A, B, C> = Arrow<A, B, C, A>

type User = {
  name: string
  id: number
}

type withUser = {
  user: User
}

type With<A, B> = {
  A: B
}

type newType = With<'user', any>

export const ofContext = <Context>(): Arrower<Context, never, undefined> => Arrow(async (c: Context) => [Right(undefined), c])

export const of = <Value>(c: Value) => Arrow<undefined, never, Value, undefined>(async () => [Right(c), undefined])

const getUser = (service: Service) => service.userService.get()

// later in program
// semiFlatMap
// flatMapSync
// contextMap
// tap
// type alias <A,B,C,D> to <A,B,C>

// bimap? whats this zip? zip is Arrow<Ctx, E, A>.zip(Arrow<Ctx, E, A>): Arrow<Ctx, E, [A, B]>
// more constructors - promise, function, either...
// sequence? or not
// clone?
// what else is useful - logging?
// runWithoutContext

const myProgram2 = ofContext<Service>()
  .flatMapF(async (_, ctx) => Right(getUser(ctx)))


myProgram2
  .runWith(
    { userService: { get: () => 2 } },
    a => console.log(a),
    a => console.log(a),
    a => console.log(a)
  )

ofContext<Service>()
  .flatMapF(async (_, ctx) => Right(getUser(ctx)))
  .runWith(
    { userService: { get: () => 10 } },
    a => console.log(a),
    a => console.log(a),
    a => console.log(a)
  )

of(5)
  .runWith(
    undefined,
    a => console.log(a),
    a => console.log(a),
    a => console.log(a)
  )

const repeat = (n: number) => <C, E, A, I>(effect: Arrow<C, E, A, I>): Arrow<C, E, A, I> => (n < 1 ? effect : effect.flatMap(() => repeat(n - 1)(effect)))

const b = Arrow(async (c: { console: Console }) => [Right(console.log('all work and no play')), null])

const g = repeat(100)(b)

g.runWith({ console }, () => 0, () => 1, () => 1)

const myProg = Arrow(async (c: { console:   }) => [Right(console.log('all work and no play')), null])
