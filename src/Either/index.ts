
export interface Either<E, A> {
  _tag: string
  get: () => A
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<EE, B>) => Either<EE, B>
}

export interface Left<E, A> extends Either<E, A> {
  _tag: string
  get: () => any
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<EE, any>) => Either<EE | any, any>
}

export interface Right<E, A> extends Either<E, A> {
  _tag: string
  get: () => A
  orElse: <EE, B>(_:Either<EE, B>) => Either<E, A> | Either<EE, B>
  map:<B>(f:(_: A) => B) => Either<E, B>
  flatMap:<EE, B>(f:(_: A) => Either<any, B>) => Either<any, B>
}

export const Right = <A>(a: A): Either<any, A> => ({
  _tag: 'some',
  get: () => a,
  orElse: f => Right(a),
  map: f => Right(f(a)),
  flatMap: f => f(a),
})

export const Left = <A>(a: A): Left<A, any> => ({
  _tag: 'none',
  get: () => a,
  orElse: a => a,
  map: _ => Left<A>(a),
  flatMap: _ => Left<A>(a),
})
