import { Either, Left, Right } from '../Either'
import { Context } from './Server/index'

// Orthogonal
// Composable
type naka = { ok: number }
type yela = { ok: 123, nok: 'xhe' }
const af = <A, B, D>(f: (_:A) => B, g: (_:B) => D) => (v: A) => g(f(v))

const toStuff = (): yela => ({ ok: 123, nok: 'xhe' })

const fromSomeStuff = (a: naka) => 'hello'

af(toStuff, fromSomeStuff)

type Subset<T, U> = { [key in keyof T]: key extends keyof U ? T[key] : never }

export interface Arrow<C, E, A, I > {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => Arrow<C, E, B, I>
  ctxMap: <CC >(f:(_:C) => CC) => Arrow<CC, E, A, I>
  combineA: (f:Arrow<C, E, A, I>) => Arrow<C, E, A, I>
  andThenCtxF: <B, EE>(f:(__:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>
  andThenF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>
  andThen: <CC, B, EE, CI>(f:Arrow<CC, EE, B, C>) => Arrow<CC, E | EE, B, I>
  flatMap: <B, EE>(f:(_:A, __:C) => Arrow<C, EE, B, I>) => Arrow<C, E | EE, B, I>
  thenChangeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow<CC, E | EE, A, I>
  thenMergeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow<CC & C, E | EE, A, I>
  leftMap: <EE>(f:(_:E) => EE) => Arrow<C, EE, A, I>
  leftMapP: <EE>(f:(_:E, __:I) => Promise<EE>) => Arrow<I, EE, A, I>
  runWith: <L, M, N>(
    c: I,
    f: (_:A) => L,
    g: (_:E) => M,
    j: (_?: Error) => N
  ) => Promise<L | M | N>
}

export const Arrow = <C, E, A, I >(val:(_: I) => Promise<[Either<E, A>, C]>): Arrow<C, E, A, I> => ({
  __val: val,
  __tag: 'Arrow',
  map: <B>(f: (_:A) => B) => Arrow<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
  leftMap: <EE>(f: (_:E) => EE) => Arrow<C, EE, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.leftMap(f), g])),
  leftMapP: <EE>(f:(_:E, __: I) => Promise<EE>) => Arrow<I, EE, A, I>((c: I) => val(c)
    .then(
      ([eitherA]): Promise<[Either<EE, A>, I]> => eitherA.match(
        left => f(left, c).then(res => [Left(res), c] as [Left<EE>, I]),
        async right => [Right(right), c] as [Right<A>, I]
      )
    )),
  ctxMap: <CC >(f: (_:C) => CC) => Arrow<CC, E, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA, f(g)])),
  andThenCtxF: <B, EE>(f:(__:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
            return r
          },
          a => {
            const r = f(g).then(b => [b, g]) as Promise<[Either<EE, B>, C]>
            return r
          }
        )
      )
  ),
  andThenF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>(
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
  andThen: <CC, B, EE, CI>(f:Arrow<CC, EE, B, C>) => Arrow<CC, E | EE, B, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, B>, CC]> => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, B>, CC]>([Left(e), g] as unknown as [Either<E, B>, CC])
            return r
          },
          a => {
            const r = f.__val(g)
            return r
          }
        )
      )
  ),
  combineA: (f:Arrow<C, E, A, I>) => Arrow<C, E, A, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]) => eitherA.match(
          e => f.__val(c),
          a => [Right(a), g]
        )
      )
  ),
  thenChangeCtx: <CC, EE>(f:(_:A, __:C) => Promise<Either<E | EE, CC>>) => Arrow<CC, E | EE, A, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, A>, CC]> => eitherA.match(
          e => {
            const r = Promise.resolve([Left(e), g]) as unknown as Promise<[Either<E, A>, CC]>
            return r
          },
          a => {
            const r = f(a, g).then(b => b.match(
              e => [Left(e), g],
              rr => [eitherA, rr]
            )) as Promise<[Either<EE, A>, CC]>
            return r
          }
        )
      )
  ),
  thenMergeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow<CC & C, E | EE, A, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]): Promise<[Either<E | EE, A>, CC & C]> => eitherA.match(
          e => {
            const r = Promise.resolve([Left(e), g]) as Promise<[Either<E, A>, C & CC]>
            return r
          },
          a => {
            const r = f(a, g).then(b => b.match(
              e => [Left(e), g],
              rr => [eitherA, { ...g, ...rr }]
            )) as Promise<[Either<EE, A>, C & CC]>
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
  runWith: <L, M, N>(
    c: I,
    f: (_:A) => L,
    g: (_:E) => M,
    j: (_?: Error) => N
  ) => val(c).then(
    ([a, _c]) => a.match(
      none => g(none),
      some => f(some)
    )
  )
    .catch(
      j
    )
})

type Service = { userService: { get: () => number } }

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

export const ofContext = <Context >(): Arrow<Context, never, undefined, Context> => Arrow(async (c: Context) => [Right(undefined), c])
export const extendContext = <A extends Context>(): Arrow<A, never, undefined, A> => Arrow(async (c: A) => [Right(undefined), c])


export const of = <Value, Context>(v: Value) => Arrow<Context, never, Value, Context>(async (c: Context) => [Right(v), c])

// export const fromCtx = <Context, E, nextContext>(v: (c: Context) => Promise<Either<E, nextContext>>) => Arrow<Context, E, undefined, nextContext>((_: Context) => v(_).then(eitherCtx => e))

export const fromEither = <E, A, Context = {}>(eitherA: Either<E, A>) => Arrow<Context, E, A, Context>(async (c: Context) => [eitherA, c])

export const fromPromise = <E, A, Context = {}>(eitherA: Promise<A>) => Arrow<Context, E, A, Context>((c: Context): Promise<[Either<E, A>, Context]> => eitherA.then(a => [Right(a), c] as [Right<A>, Context]).catch((e: E) => [Left(e), c]))

export const fromPEither = <E, A, Context = {}>(eitherA: Promise<Either<E, A>>) => Arrow<Context, E, A, Context>((c: Context) => eitherA.then(a => [a, c]))

export const sequence = <A, B, C, D >(as: Arrow<A, B, C, D>[]): Arrow<A, B, C[], D> => as.reduce(
  (acc, arrowA) => acc.flatMap((a, _) => arrowA.map(c => [...a, c])), Arrow<A, B, C[], D>(async (ctx: D) => [Right<C[], B>([]), ctx as unknown as A])
)

const getUser = (service: Service) => service.userService.get()

// later in program
// mapK ?
// semiFlatMap ?
// flatMapSync ?
// tap
// type alias <A,B,C,D> to <A,B,C>

// bimap? whats this zip? zip is Arrow<Ctx, E, A>.zip(Arrow<Ctx, E, A>): Arrow<Ctx, E, [A, B]>
// more constructors - promise, function, either...
// sequence? or not... sequence is bimap?
// clone?
// what else is useful - logging?
// runWithoutContext

const hi = of<number, {userService:()=> number, dabaService:() => string}>(12)
  .andThenF(async (n: number, ctx: { userService: () => number }) => (Math.random() < 0.8 ? Right(n * 5) : Left('yela')))

const xhe = of<number, {userService:()=> number, dabaService:() => string}>(12)
  .andThenF(async (n: number, ctx: { userService: () => number }) => Right(n * 5))
  .thenChangeCtx(async (n: number, ctx: { dabaService: () => string }) => Right({ yela: 'ooh' }))
  .leftMap(a => 'wasup')

export const composeA = <A, B, C, D, E, F, G>(a: Arrow<A, B, C, D>, b: Arrow<E, F, G, A>) => a.andThen(b)

export const combineA = <A extends Context, B, C, D>(...as: Arrow<A, B, C, D>[]): Arrow<A, B, C, D> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combineA(as[1])
  const [a, b, ...aas] = as
  return combineA(a.combineA(b), ...as)
}

const aef = ofContext<yela>().andThenF(async (_, b: naka) => Right({}))

// const b = hi
//   .andThenA(xhe)
//   .runWith(
//     { userService: () => 5, dabaService: () => 'hello' },
//     a => console.log('yekaSheka', a),
//     a => console.log('fail', a),
//     a => console.log('err', a)
//   )
type IUser = {
  id: number
  name: string
}

type firebase = {
  firebase: { validate: (_: number) => IUser }
}
