// import { Either, Left, Right } from '../Either'
// import { Context } from './Server/index'

// // Orthogonal
// // Composable
// type naka = { ok: number }
// type yela = { ok: 123, nok: 'xhe' }
// const af = <A, B, D>(f: (_:A) => B, g: (_:B) => D) => (v: A) => g(f(v))

// const toStuff = (): yela => ({ ok: 123, nok: 'xhe' })

// const fromSomeStuff = (a: naka) => 'hello'

// af(toStuff, fromSomeStuff)

// type Subset<T, U> = { [key in keyof T]: key extends keyof U ? T[key] : never }

// export interface ArrowT<C, E, A, I > {
//   __val: (_: I) => Promise<[Either<E, A>, C]>
//   __tag: string
//   map: <B>(f:(_:A) => B) => ArrowT<C, E, B, I>
//   ctxMap: <CC >(f:(_:C) => CC) => ArrowT<CC, E, A, I>
//   combineA: (f:ArrowT<C, E, A, I>) => ArrowT<C, E, A, I>
//   andThenCtxF: <B, EE>(f:(__:C) => Promise<Either<E | EE, B>>) => ArrowT<C, E | EE, B, I>
//   andThenF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => ArrowT<C, E | EE, B, I>
//   andThen: <CC, B, EE, CI>(f:ArrowT<CC, EE, B, C>) => ArrowT<CC, E | EE, B, I>
//   flatMap: <B, EE>(f:(_:A, __:C) => ArrowT<C, EE, B, I>) => ArrowT<C, E | EE, B, I>
//   thenChangeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => ArrowT<CC, E | EE, A, I>
//   thenMergeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => ArrowT<CC & C, E | EE, A, I>
//   leftMap: <EE>(f:(_:E) => EE) => ArrowT<C, EE, A, I>
//   leftMapP: <EE>(f:(_:E, __:I) => Promise<EE>) => ArrowT<I, EE, A, I>
//   runWith: <L, M, N>(
//     c: I,
//     f: (_:A) => L,
//     g: (_:E) => M,
//     j: (_?: Error) => N
//   ) => Promise<L | M | N>
// }

// export const ArrowT = <C, E, A, I >(val:(_: I) => Promise<[Either<E, A>, C]>): ArrowT<C, E, A, I> => ({
//   __val: val,
//   __tag: 'ArrowT',
//   map: <B>(f: (_:A) => B) => ArrowT<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
//   leftMap: <EE>(f: (_:E) => EE) => ArrowT<C, EE, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.leftMap(f), g])),
//   leftMapP: <EE>(f:(_:E, __: I) => Promise<EE>) => ArrowT<I, EE, A, I>((c: I) => val(c)
//     .then(
//       ([eitherA]): Promise<[Either<EE, A>, I]> => eitherA.match(
//         left => f(left, c).then(res => [Left(res), c] as [Left<EE>, I]),
//         async right => [Right(right), c] as [Right<A>, I]
//       )
//     )),
//   ctxMap: <CC >(f: (_:C) => CC) => ArrowT<CC, E, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA, f(g)])),
//   andThenCtxF: <B, EE>(f:(__:C) => Promise<Either<E | EE, B>>) => ArrowT<C, E | EE, B, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
//           e => {
//             const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
//             return r
//           },
//           a => {
//             const r = f(g).then(b => [b, g]) as Promise<[Either<EE, B>, C]>
//             return r
//           }
//         )
//       )
//   ),
//   andThenF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => ArrowT<C, E | EE, B, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
//           e => {
//             const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
//             return r
//           },
//           a => {
//             const r = f(a, g).then(b => [b, g]) as Promise<[Either<EE, B>, C]>
//             return r
//           }
//         )
//       )
//   ),
//   andThen: <CC, B, EE, CI>(f:ArrowT<CC, EE, B, C>) => ArrowT<CC, E | EE, B, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, B>, CC]> => eitherA.match(
//           e => {
//             const r = Promise.resolve<[Either<E, B>, CC]>([Left(e), g] as unknown as [Either<E, B>, CC])
//             return r
//           },
//           a => {
//             const r = f.__val(g)
//             return r
//           }
//         )
//       )
//   ),
//   combineA: (f:ArrowT<C, E, A, I>) => ArrowT<C, E, A, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]) => eitherA.match(
//           e => f.__val(c),
//           a => [Right(a), g]
//         )
//       )
//   ),
//   thenChangeCtx: <CC, EE>(f:(_:A, __:C) => Promise<Either<E | EE, CC>>) => ArrowT<CC, E | EE, A, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, A>, CC]> => eitherA.match(
//           e => {
//             const r = Promise.resolve([Left(e), g]) as unknown as Promise<[Either<E, A>, CC]>
//             return r
//           },
//           a => {
//             const r = f(a, g).then(b => b.match(
//               e => [Left(e), g],
//               rr => [eitherA, rr]
//             )) as Promise<[Either<EE, A>, CC]>
//             return r
//           }
//         )
//       )
//   ),
//   thenMergeCtx: <EE, CC >(f:(_:A, __:C) => Promise<Either<EE, CC>>) => ArrowT<CC & C, E | EE, A, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, A>, CC & C]> => eitherA.match(
//           e => {
//             const r = Promise.resolve([Left(e), g]) as Promise<[Either<E, A>, C & CC]>
//             return r
//           },
//           a => {
//             const r = f(a, g).then(b => b.match(
//               e => [Left(e), g],
//               rr => [eitherA, { ...g, ...rr }]
//             )) as Promise<[Either<EE, A>, C & CC]>
//             return r
//           }
//         )
//       )
//   ),
//   flatMap: <B, EE>(f:(_:A, __:C) => ArrowT<C, EE, B, I>) => ArrowT<C, E | EE, B, I>(
//     (c: I) => val(c)
//       .then(
//         ([eitherA, g]): Promise<[Either<E | EE, B>, C]> => eitherA.match(
//           e => {
//             const r = Promise.resolve<[Either<E, B>, C]>([Left(e), g])
//             return r
//           },
//           a => {
//             const r = f(a, g)
//             return r.__val(c)
//           }
//         )
//       )
//   ),
//   runWith: <L, M, N>(
//     c: I,
//     f: (_:A) => L,
//     g: (_:E) => M,
//     j: (_?: Error) => N
//   ) => val(c).then(
//     ([a, _c]) => a.match(
//       none => g(none),
//       some => f(some)
//     )
//   )
//     .catch(
//       j
//     )
// })

// type Service = { userService: { get: () => number } }

// type User = {
//   name: string
//   id: number
// }

// type withUser = {
//   user: User
// }

// type With<A, B> = {
//   A: B
// }

// type newType = With<'user', any>

// export const ofContext = <Context >(): ArrowT<Context, never, undefined, Context> => ArrowT(async (c: Context) => [Right(undefined), c])
// export const extendContext = <A extends Context>(): ArrowT<A, never, undefined, A> => ArrowT(async (c: A) => [Right(undefined), c])


// export const of = <Value, Context>(v: Value) => ArrowT<Context, never, Value, Context>(async (c: Context) => [Right(v), c])

// // export const fromCtx = <Context, E, nextContext>(v: (c: Context) => Promise<Either<E, nextContext>>) => ArrowT<Context, E, undefined, nextContext>((_: Context) => v(_).then(eitherCtx => e))

// export const fromEither = <E, A, Context = {}>(eitherA: Either<E, A>) => ArrowT<Context, E, A, Context>(async (c: Context) => [eitherA, c])

// export const fromPromise = <E, A, Context = {}>(eitherA: Promise<A>) => ArrowT<Context, E, A, Context>((c: Context): Promise<[Either<E, A>, Context]> => eitherA.then(a => [Right(a), c] as [Right<A>, Context]).catch((e: E) => [Left(e), c]))

// export const fromPEither = <E, A, Context = {}>(eitherA: Promise<Either<E, A>>) => ArrowT<Context, E, A, Context>((c: Context) => eitherA.then(a => [a, c]))

// export const sequence = <A, B, C, D >(as: ArrowT<A, B, C, D>[]): ArrowT<A, B, C[], D> => as.reduce(
//   (acc, arrowA) => acc.flatMap((a, _) => arrowA.map(c => [...a, c])), ArrowT<A, B, C[], D>(async (ctx: D) => [Right<C[], B>([]), ctx as unknown as A])
// )

// const getUser = (service: Service) => service.userService.get()

// // later in program
// // mapK ?
// // semiFlatMap ?
// // flatMapSync ?
// // tap
// // type alias <A,B,C,D> to <A,B,C>

// // bimap? whats this zip? zip is ArrowT<Ctx, E, A>.zip(ArrowT<Ctx, E, A>): ArrowT<Ctx, E, [A, B]>
// // more constructors - promise, function, either...
// // sequence? or not... sequence is bimap?
// // clone?
// // what else is useful - logging?
// // runWithoutContext

// const hi = of<number, {userService:()=> number, dabaService:() => string}>(12)
//   .andThenF(async (n: number, ctx: { userService: () => number }) => (Math.random() < 0.8 ? Right(n * 5) : Left('yela')))

// const xhe = of<number, {userService:()=> number, dabaService:() => string}>(12)
//   .andThenF(async (n: number, ctx: { userService: () => number }) => Right(n * 5))
//   .thenMergeCtx(async (n: number, ctx: { dabaService: () => string }) => Right({ yela: 'ooh' }))
//   .leftMap(a => 'wasup')

// export const composeA = <A, B, C, D, E, F, G>(a: ArrowT<A, B, C, D>, b: ArrowT<E, F, G, A>) => a.andThen(b)

// export const combineA = <A extends Context, B, C, D>(...as: ArrowT<A, B, C, D>[]): ArrowT<A, B, C, D> => {
//   if (as.length === 1) return as[0]
//   if (as.length === 2) return as[0].combineA(as[1])
//   const [a, b, ...aas] = as
//   return combineA(a.combineA(b), ...as)
// }

// const aef = ofContext<yela>()

// const baf = <A extends { ok: number }>() => of<number, A>(5).ctxMap((a) => ({ ...a, xhama: 234 }))

// aef.andThen(baf())

// // .andThenF(async (_, b: naka) => Righst({}))

// // const b = hi
// //   .andThenA(xhe)
// //   .runWith(
// //     { userService: () => 5, dabaService: () => 'hello' },
// //     a => console.log('yekaSheka', a),
// //     a => console.log('fail', a),
// //     a => console.log('err', a)
// //   )
// type IUser = {
//   id: number
//   name: string
// }

// type firebase = {
//   firebase: { validate: (_: number) => IUser }
// }

// // export const composeKHandler = <A extends Context, B extends Context, C extends Context>(a: ArrowT<B, Context, Context, A>, b: ArrowT<C, Context, Context, B>): ArrowT<C, Context, Context, A> => b.andThen(b)

// const ga = (a: string) => Promise.resolve({ ok: 123, xhaba: 234 })
// const gb = (a: { ok: number }) => Promise.resolve('daba')
// const gc = (a: string) => Promise.resolve('daba')

// const composekleisli = <A, B, C>(a: (_:A) => Promise<B>, b: (_:B) => Promise<C>) => (aa: A) => a(aa).then(b)

// const yelal = composekleisli(ga, gb)

// interface Arrow<S, E, Sout> {
//   __val: (_:S) => Promise<Either<E, Sout>>
//   map: <S2out>(f: (_:Sout) => S2out) => Arrow<S, E, S2out>
//   leftMap: <E2>(f: (_:E) => E2) => Arrow<S, E2, Sout>
//   flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, S2Out>
//   andThen: <E2, S2Out>(_: Arrow<Sout, E | E2, S2Out>) => Arrow<S, E | E2, S2Out>
//   andThenMerge: <E2, S2Out>(_: Arrow<Sout, E | E2, S2Out>) => Arrow<S, E | E2, Sout & S2Out>
//   andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => Arrow<S, E | E2, S2Out>
//   runWith: <A, B, C>(
//     context: S,
//     f: (_:Sout) => A,
//     g: (_:E) => B,
//     j: (_?: Error) => C
//   ) => Promise<A | B | C>
// }

// const Arrow = <S, E, Sout>(__val: (_:S) => Promise<Either<E, Sout>>) => ({
//   __val,
//   map: <S2out>(f: (_:Sout) => S2out) => Arrow<S, E, S2out>((_:S) => __val(_).then(a => a.map(f))),
//   leftMap: <E2>(f: (_:E) => E2) => Arrow<S, E2, Sout>((_:S) => __val(_).then(a => a.leftMap(f))),
//   flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<S, E2, S2Out>) => Arrow<S, E | E2, S2Out>(
//     (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f(s2).__val(a)
//     ))
//   ),
//   andThen: <E2, S2Out>(f: Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, S2Out>(
//     (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f.__val(s2)
//     ))
//   ),
//   andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => Arrow<S, E | E2, S2Out>(
//     (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f(s2)
//     ))
//   ),
//   andThenMerge: <E2, S2Out>(f: Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, Sout & S2Out>(
//     (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, Sout & S2Out>> => eitherS2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f.__val(s2).then(eitherS => eitherS.map(a2 => ({ ...s2, ...a2 })))
//     ))
//   ),
//   runWith: <A, B, C>(
//     context: S,
//     f: (_:Sout) => A,
//     g: (_:E) => B,
//     j: (_?: Error) => C
//   ) => __val(context).then(
//     (eitherS) => eitherS.match(
//       none => g(none),
//       some => f(some)
//     )
//   )
//     .catch(
//       j
//     )
// })
