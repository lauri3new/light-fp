// import { Either, Left } from '../Either'

// interface ArrowS<S, A, E, B, Sout = S> {
//   __val: (_:A, __:S) => Promise<Either<E, [A, Sout]>>
//   map: <C>(f: (_:B) => C) => ArrowS<S, B, E, C, Sout>
//   leftMap: <E2>(f: (_:E) => E2) => ArrowS<S, B, E2, A, Sout>
//   flatMap: <E2, B, S2Out>(f: (_:Sout) => ArrowS<Sout, E2, B, S2Out>) => ArrowS<Sout, E | E2, B, S2Out>
//   andThen: <E2, B, S2Out>(_: ArrowS<Sout, E2, B, S2Out>) => ArrowS<Sout, E | E2, B, S2Out>
//   andThenMerge: <E2, B, S2Out>(_: ArrowS<Sout, E | E2, B, S2Out>) => ArrowS<S, E | E2, A & B, S2Out>
//   andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => ArrowS<S, E | E2, S2Out>
//   runWith: <A, B, C>(
//     context: S,
//     f: (_:Sout) => A,
//     g: (_:E) => B,
//     j: (_?: Error) => C
//   ) => Promise<A | B | C>
// }

// const ArrowS = <S, E, Sout>(__val: (_:S) => Promise<Either<E, Sout>>) => ({
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
