
// TODO: warning not stack safe!

export interface Future<A> {
  __tag: string
  __val: () => Promise<A>
  map: <B>(f:(_:A) => B) => Future<B>
  flatMap: <B>(f:(_:A) => Future<B>) => Future<B>
  fork: <B>(f: (_:A) => B, g: (_?: any) => B) => Promise<B>
}

function toPromise<A>(a:Future<A>): Promise<A> {
  return a.fork(b => b, c => c)
}

// eslint-disable-next-line import/prefer-default-export
export const Future = <A>(val: () => Promise<A>): Future<A> => ({
  __tag: 'Future',
  __val: val,
  map: <B>(f: (_:A) => B) => Future<B>(() => val().then(a => f(a))),
  flatMap: <B>(f: (_:A) => Future<B>) => Future<B>(
    () => val().then(a => toPromise(f(a))),
  ),
  fork: <B>(f: (_:A) => B, g: (_?: any) => B): Promise<B> => val().then(a => f(a)).catch(e => g(e)),
})

const fromPromise = <A>(a:Promise<A>): Future<A> => Future(() => a)

export const resolve = <A>(a:A) => Future(() => Promise.resolve(a))

// usage examples

const sleep = <A>(a: A) => new Promise((res: any) => {
  setTimeout(() => {
    res()
  }, 5000)
}).then(() => a)

const f = resolve(1)
  .map(a => a + 1)
  .flatMap(a => fromPromise(sleep(a + 5)))
  .flatMap(a => resolve(a + 5))

setTimeout(() => {
  f.fork(a => console.log('wahoo', a), b => b)
}, 5000)
