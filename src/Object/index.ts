import { when } from '..'

// export const tail = <A>([a, ...as]: A[]) => as
// export const setHead = <A>(a: A) => ([_, ...as]: A[]) => [a, ...as]
// export const drop = <A>(n: number) => (as: A[]): A[] => {
//   if (n === 0) return as
//   const [a, ...rest] = as
//   return drop<A>(n - 1)(rest)
// }
export const map = <A, B> (f:(_:A) => B) => (as: { [key: string]: A }): { [key: string]: B } => Object.keys(as).reduce((acc: { [key: string]: B}, key) => {
  acc[key] = f(as[key])
  return acc
}, {})

export const mapWhen = <A, B> (g:(_:A) => boolean) => (f:(_:A) => B) => (as: { [key: string]: A }): { [key: string]: A | B } => map<A, A | B>(when<A, B>(g)(f))(as)

// export const removeIf = <A>(n: number, f: (_:A) => boolean) => (as: A[]): A[] => {
//   if (n === 0) return as
//   const [a, ...rest] = as
//   if (f(a)) {
//     return dropWhile<A>(n - 1, f)(rest)
//   }
//   return as
// }
// export const foldRight = <A, B>(f:(_:A,__:B) => B, b: B) => ([a, ...as]: A[]): B => {
//   if (!a) return b
//   if (as.length === 0) return f(a, b)
//   return f(a, foldRight(f, b)(as))
// }
// export const foldLeft = <A, B>(f:(_:B,__:A) => B, b: B) => ([a, ...as]: A[]): B => {
//   if (!a) return b
//   if (as.length === 0) return f(b, a)
//   return f(foldLeft(f, b)(as), a)
// }
// export const flatMap = <A>([a, ...as]: A[][]): A[] => {
//   if (as.length === 0) return a
//   return [...a, ...flatMap(as)]
// }
// export const filter = <A, B>([a, ...as]: A[]) => (f:(_:A) => boolean): A[] => {
//   if (!a) return []
//   if (f(a)) return [a, ...filter(as)(f)]
//   return [...filter(as)(f)]
// }
