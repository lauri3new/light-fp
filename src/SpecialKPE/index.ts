import inquirer, { Inquirer } from 'inquirer'
import { Either, Left, Right } from '../Either'
import { Request } from 'express'

export interface Arrow<C, E, A, I> {
  __val: (_: I) => Promise<[Either<E, A>, C]>
  __tag: string
  map: <B>(f:(_:A) => B) => Arrow<C, E, B, I>
  leftMap: <EE>(f:(_:E) => EE) => Arrow<C, EE, A, I>
  ctxMap: <CC>(f:(_:C) => CC) => Arrow<CC, E, A, I>
  write: <CC>(f:(_:C) => Promise<CC>) => Arrow<CC, E, A, I>
  flatMapF: <B, EE>(f:(_:A, __:C) => Promise<Either<E | EE, B>>) => Arrow<C, E | EE, B, I>
  flatMap: <B, EE>(f:(_:A, __:C) => Arrow<C, EE, B, I>) => Arrow<C, E | EE, B, I>
  ctxflatMapF: <EE, CC>(f:(_:A, __:C) => Promise<Either<EE, CC>>) => Arrow<CC, E | EE, A, I>
  leftflatMapF: <EE, CC>(f:(_:A, __:I) => Promise<Either<E | EE, CC>>) => Arrow<CC, E | EE, A, I>
  unsafeLeftFlatMapF: <EE, CC>(f:(_:A, __:C) => Promise<Either<E | EE, CC>>) => Arrow<CC, E | EE, A, I>
  runWith: <L, M, N>(
    context: I,
    onError: (_?: Error) => N,
    onSuccess: (_:A) => L,
    onFailure: (_:E) => M
  ) => Promise<L | M | N>
}

export const Arrow = <C, E, A, I>(val:(_: I) => Promise<[Either<E, A>, C]>): Arrow<C, E, A, I> => ({
  __val: val,
  __tag: 'Arrow',
  map: <B>(f: (_:A) => B) => Arrow<C, E, B, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.map(f), g])),
  leftMap: <EE>(f: (_:E) => EE) => Arrow<C, EE, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA.leftMap(f), g])),
  ctxMap: <CC>(f: (_:C) => CC) => Arrow<CC, E, A, I>((c: I) => val(c).then(([eitherA, g]) => [eitherA, f(g)])),
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
  ctxflatMapF: <CC, EE>(f:(_:A, __:C) => Promise<Either<E | EE, CC>>) => Arrow<CC, E | EE, A, I>(
    (c: I) => val(c)
      .then(
        ([eitherA, g]) => eitherA.match(
          e => {
            const r = Promise.resolve<[Either<E, A>, C]>([Left(e), g])
            return r
          },
          a => {
            const r = f(a, g).then(b => [b, g]) as Promise<[Either<EE, A>, CC]>
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

// export const fromPromise = <A>(_: Promise<A>): Arrower<undefined, never, undefined> => Arrow(async (c: Context) => [Right(undefined), c])

export const fromEither = <Context>(): Arrower<Context, never, undefined> => Arrow(async (c: Context) => [Right(undefined), c])

export const of = <Value>(c: Value) => Arrow<undefined, never, Value, undefined>(async () => [Right(c), undefined])

const getUser = (service: Service) => service.userService.get()

// later in program
// andThen
// mapK ?
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

// const myProgram2 = ofContext<Service>()
//   .flatMapF(async (_, ctx) => Right(getUser(ctx)))


// myProgram2
//   .runWith(
//     { userService: { get: () => 2 } },
//     a => console.log(a),
//     a => console.log(a),
//     a => console.log(a)
//   )

// ofContext<Service>()
//   .flatMapF(async (_, ctx) => Right(getUser(ctx)))
//   .runWith(
//     { userService: { get: () => 10 } },
//     a => console.log(a),
//     a => console.log(a),
//     a => console.log(a)
//   )

// of(5)
//   .runWith(
//     undefined,
//     a => console.log(a),
//     a => console.log(a),
//     a => console.log(a)
//   )

const repeat = (n: number) => <C, E, A, I>(effect: Arrow<C, E, A, I>): Arrow<C, E, A, I> => (n < 1 ? effect : effect.flatMap(() => repeat(n - 1)(effect)))

// const b = Arrow(async (c: { console: Console }) => [Right(console.log('all work and no play')), null])

// const g = repeat(100)(b)

// g.runWith({ console }, () => 0, () => 1, () => 1)

// tap

// const program1 = ofContext<{ prompt: Inquirer }>()

// program1.flatMapF(
//   (_, ctx) => ctx.prompt.prompt([{ type: 'input', name: 'dee', message: 'whats your name?' }]).then(Right)
// )
//   .map(a => console.log(a.dee))
//   .runWith({ prompt: inquirer }, () => 0, () => 1, () => 1)

const repeatUntil = <A>(predicate: (_:A) => Boolean) => <C, E, I>(effect: Arrow<C, E, A, I>): Arrow<C, E, A, I> => effect.flatMap((a) => (predicate(a) ? effect : repeatUntil(predicate)(effect)))

const program2 = ofContext<{ prompt: Inquirer, random:(_: void) => number }>()

const program3 = ofContext<{ prompt: Inquirer, random:(_: void) => number, yela: number }>()

const prog25 = program2.flatMapF(
  (_, ctx) => ctx.prompt.prompt([{ type: 'input', name: 'dee', message: 'Guess a number?' }]).then(Right)
)
  .flatMapF(
    async (a, ctx) => (Number(a.dee) === ctx.random() ? Left('you guessed right') : Right('you guessed wrong'))
  )
  .ctxMap(c => ({ ...c, hello: 123 }))

const prog26 = program3.flatMapF(
  (_, ctx) => ctx.prompt.prompt([{ type: 'input', name: 'dee', message: 'Guess a number?' }]).then(Right)
)
  .flatMapF(
    async (a, ctx) => (Number(a.dee) === ctx.random() ? Left('you guessed right') : Right('you guessed wrong'))
  )
  .ctxMap(c => ({ ...c, hello: 123 }))

const e = prog25
  .flatMap(
    (a, b) => Arrow(async () => [Right({ ...b, yela: a }), b])
  )
// repeatUntil(a => a === 5)(prog25)
//   .runWith({ prompt: inquirer, random: () => 5 }, () => 0, () => 1, () => 1)

type Context = {
  req: Request
}

const myMiddleWare = async (ctx: Service & Context) => {
  const result = ctx.userService.get() === parseInt(ctx.req.params.userId, 10) ? Left('not authorised') : Right('authorised')
  return [result, ctx]
}

const myMiddleWare2 = Arrow(async (ctx: Service & Context) => {
  const result = ctx.userService.get() === parseInt(ctx.req.params.userId, 10) ? Left('not authorised') : Right('authorised')
  return [result, { ...ctx, userId: ctx.req.params.userId }]
})

// new value -> map
// new async value -> flatMapF
// new failable async value -> flatMapF
// modify context from value and context -> write
// modify context async from context -> write
// transform context sync -> ctxMap
// modify context failable async -> ctxFlatMapF which is flatMap -> write
// new value and modify context ? dont do this? -> ctxFlatMap / ctxFlatMapF
// new value from context alone ->
// modify context from context alone -> write

const newp = Arrow(async () => [Right('hello'), 123])

// const newb = (a: number) => Arrow(async (a) => [Right('hello'), 123])

newp.flatMapF(
  async (_, b) => Right('hello')
)
  .ctxflatMapF(
    async (_, b): Promise<Either<string, { yela: number }>> => (Math.random() > 0.5 ? Right({ yela: b }) : Left('faan'))
  )
  .flatMapF(
    async (_, b) => Right('hello')
  )
