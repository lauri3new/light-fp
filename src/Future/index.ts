
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
    while (typeof h === 'object' && typeof h.then === 'function') {
      // eslint-disable-next-line no-await-in-loop
      h = await h
    }
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
