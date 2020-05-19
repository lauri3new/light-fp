
// TODO: warning not stack safe!

export interface Future<A> {
  __tag: string
  __val: () => Promise<A>
  map: <B>(f:(_:A) => B) => Future<B>
  flatMap: <B>(f:(_:A) => Future<B>) => Future<B>
  run: <B>(f: (_:A) => B, g: (_?: any) => B) => any
}

function toPromise<A>(a:Future<A>): Promise<A> {
  return a.run(b => b, c => c)
}

export const Future = <A>(val: () => Promise<A>): Future<A> => ({
  __tag: 'Future',
  __val: val,
  map: <B>(f: (_:A) => B) => Future<B>(() => val().then(a => f(a))),
  flatMap: <B>(f: (_:A) => Future<B>) => Future<B>(
    () => val().then(a => toPromise(f(a)))
  ),
  run: async <B>(f: (_:A) => B, g: (_?: any) => B): Promise<any> => {
    let h = val() as any

    while (h) {
      if (typeof h.then === 'function') {
        // 如果递归函数返回的是promise,则执行promise
        // eslint-disable-next-line no-await-in-loop
        h = await h
      } else if (typeof h === 'function') {
        h = h()
      } else {
        break
      }
    }

    return h
    // return val().then(a => f(a)).catch(e => g(e))
  }
})

const fromPromise = <A>(a:Promise<A>): Future<A> => Future(() => a)

export const resolve = <A>(a:A) => Future(() => Promise.resolve(a))

// usage examples

const sleep = <A>(a: A) => new Promise((res: any) => {
  setTimeout(() => {
    res()
  }, 5000)
}).then(() => a)

// setTimeout(() => {
//   f.run(a => console.log('wahoo', a), b => b)
// }, 5000)

let a = Future(() => Promise.resolve(5))

for (let i = 0; i < 100000; i += 1) {
  a = a.flatMap(() => Future(() => Promise.resolve(5)))
}

a.run(
  () => {},
  () => {}
)
