
import { Either, Left, Right } from '../Either'

export interface KleisliPE<C, E, A> {
  __val: (_: C) => Promise<Either<E, A>>
  __tag: string
  map: <B>(f:(_:A) => B) => KleisliPE<C, E, B>
  leftMap: <EE>(f:(_:E) => EE) => KleisliPE<C, EE, A>
  flatMap: <EE, H>(f: KleisliPE<A, EE, H>) => KleisliPE<C, EE | E, H>
  flatMapF: <EE, H>(f:(_: A) => Promise<Either<EE, H>>) => KleisliPE<C, EE | E, H>
  runWith: <I, J, K>(
    context: C,
    onSuccess: (_:A) => I,
    onFailure: (_:E) => J,
    onError: (_?: Error) => K
  ) => Promise<I | J | K>
}

export const KleisliPE = <C, E, A>(val:(_: C) => Promise<Either<E, A>>): KleisliPE<C, E, A> => ({
  __val: val,
  __tag: 'KleisliPE',
  map: <B>(f: (_:A) => B) => KleisliPE<C, E, B>((c: C) => val(c).then(eitherA => eitherA.map(f))),
  leftMap: <EE>(f: (_:E) => EE) => KleisliPE<C, EE, A>((c: C) => val(c).then(eitherA => eitherA.leftMap(f))),
  flatMap: <EE, H>(f: KleisliPE<A, EE, H>) => KleisliPE<C, E | EE, H>(
    (c: C) => val(c)
      .then((eitherA): Promise<Either<E | EE, H>> => eitherA.match(
        left => Promise.resolve<Either<E, H>>(Left(left)),
        right => f.__val(right)
      ))
  ),
  flatMapF: <EE, H>(f:(_: A) => Promise<Either<EE, H>>) => KleisliPE<C, E | EE, H>(
    (c: C) => val(c)
      .then((eitherA): Promise<Either<E | EE, H>> => eitherA.match(
        left => Promise.resolve<Either<E, H>>(Left(left)),
        right => f(right)
      ))
  ),
  runWith: <I, J, K>(
    c: C,
    f: (_:A) => I,
    g: (_:E) => J,
    j: (_?: Error) => K
  ) => val(c).then(
    (a) => a.match(
      none => g(none),
      some => f(some)
    )
  ).catch(
    j
  )
})

type User = {
  name: string
  id: number
}

KleisliPE(async ({
  req,
  user
}: {
  req: Request,
  user: User
}) => Right({
  req,
  user,
  newContext: 1234
}))
