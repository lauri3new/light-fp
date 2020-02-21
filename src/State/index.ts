
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
