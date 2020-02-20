// def unit[S, A](a: A): State[S, A] = state => {
//   (a, state)
// }
// def map[S, A, B](sm: State[S, A])(f: A => B): State[S, B] = state => {
//   val (value, newState) = sm(state)
//   (f(value), newState)
// }
// def flatMap[S, A, B](sm: State[S, A])(f: A => State[S, B]): State[S, B] = state => {
//   val (value, newState) = sm(state)
//   f(value)(newState)
// }

const State = <S, A>(s: (_:S) => [S, A]) => ({
  map: <B>(f:(_:A) => B) => State((_s: S) => {
    const is = s(_s)
    return [is[0], f(is[1])]
  }),
  flatMap: <B>(f:(_:A) => [S, B]) => State((_s: S) => {
    const is = s(_s)
    return f(is[1])
  }),
  set: (c: S) => State((_s: S) => {
    const is = s(c)
    return [is[0], is[1]]
  }),
  runWith: (v: S) => s(v)
})

console.log(State((a: number) => [a, a]).map(a => a + 10).set(10).map(a => a)
  .runWith(5))
