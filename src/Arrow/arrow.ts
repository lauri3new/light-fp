import { Either, Left, Right } from '../Either'

interface Arrow<S, E, Sout> {
  __val: (_:S) => Promise<Either<E, Sout>>
  map: <S2out>(f: (_:Sout) => S2out) => Arrow<S, E, S2out>
  combineA: (f:Arrow<S, E, Sout>) => Arrow<S, E, Sout>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<S, E2, Sout>
  flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, S2Out>
  andThen: <E2, S2Out>(_: Arrow<Sout, E | E2, S2Out>) => Arrow<S, E | E2, S2Out>
  andThenMerge: <E2, S2Out>(_: Arrow<Sout, E | E2, S2Out>) => Arrow<S, E | E2, Sout & S2Out>
  andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => Arrow<S, E | E2, S2Out>
  andThenPair: <E2, A>(f: Arrow<Sout, E2, A>) => Arrow<S, E | E2, [A, Sout]>
  runWith: <A, B, C>(
    context: S,
    f: (_:Sout) => A,
    g: (_:E) => B,
    j: (_?: Error) => C
  ) => Promise<A | B | C>
}

const Arrow = <S, E, Sout>(__val: (_:S) => Promise<Either<E, Sout>>) => ({
  __val,
  map: <S2out>(f: (_:Sout) => S2out) => Arrow<S, E, S2out>((_:S) => __val(_).then(a => a.map(f))),
  combineA: (f:Arrow<S, E, Sout>) => Arrow<S, E, Sout>(
    (c: S) => __val(c)
      .then(
        (eitherA) => eitherA.match(
          e => f.__val(c),
          a => Right(a)
        )
      )
  ),
  leftMap: <E2>(f: (_:E) => E2) => Arrow<S, E2, Sout>((_:S) => __val(_).then(a => a.leftMap(f))),
  flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<S, E2, S2Out>) => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2).__val(a)
    ))
  ),
  andThen: <E2, S2Out>(f: Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2)
    ))
  ),
  andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  andThenMerge: <E2, A>(f: Arrow<Sout, E2, A>) => Arrow<S, E | E2, Sout & A>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, Sout & A>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2).then(eitherS => eitherS.map(a2 => ({ ...s2, ...a2 })))
    ))
  ),
  andThenPair: <E2, A>(f: Arrow<Sout, E2, A>) => Arrow<S, E | E2, [A, Sout]>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, [A, Sout]>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2).then(eitherS => eitherS.map(a2 => [a2, s2]))
    ))
  ),
  runWith: <A, B, C>(
    context: S,
    f: (_:Sout) => A,
    g: (_:E) => B,
    j: (_?: Error) => C
  ) => __val(context).then(
    (eitherS) => eitherS.match(
      none => g(none),
      some => f(some)
    )
  )
    .catch(
      j
    )
})

// constructors
// from value, from promise, of context, from either, from kleisliP

// sequence
// const sequence = <A, B, C>(as: Arrow<A, B, C>[]): Arrow<A, B, C[]> => as.reduce(
//   (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c])), Arrow<A, B, C[]>(async (ctx: A) => Right<C[]>([]))
// )

// combine
const combineA = <A, B, C>(...as: Arrow<A, B, C>[]): Arrow<A, B, C> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combineA(as[1])
  const [a, b, ...aas] = as
  return combineA(a.combineA(b), ...as)
}

const a = Arrow(async (_: string) => Right(5))

// retry
