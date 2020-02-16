// Controlled pull based Streams
import fs, { ReadStream } from 'fs'

interface CSink<A> {
  next: (a: A) => Promise<void>,
  onError: (e: Error) => void,
  onComplete: () => void,
}

interface CStream<A> {
  _source: AsyncIterator<A>
  subscribe: (csink: CSink<A>) => void,
  map: <B>(g: (_:A) => B) => CStream<B>,
  flatMap: <B>(g: (_:A) => CStream<B>) => CStream<B>,
  flatMapF: <B>(g: (_:A) => AsyncIterator<B>) => CStream<B>,
  merge: (_: CStream<A>) => CStream<A>
}

const runStream = async <A>(_csink: CSink<A>, _dataProvider: AsyncIterator<A>): Promise<any> => {
  try {
    const _next = await _dataProvider.next()
    if (_next.done) {
      return _csink.onComplete()
    }
    await _csink.next(_next.value)
    return runStream(_csink, _dataProvider)
  } catch (e) {
    _csink.onError(e)
  }
}

const cStream = <A>(dataProvider: AsyncIterator<A>): CStream<A> => ({
  _source: dataProvider,
  subscribe: (csink: CSink<A>) => {
    runStream(csink, dataProvider)
  },
  map: <B>(g: (_:A) => B) => cStream<B>(({
    next: async () => {
      const { value, done } = await dataProvider.next()
      return {
        value: g(value),
        done
      }
    }
  })),
  flatMap: <B>(g: (_:A) => CStream<B>) => {
    // 1
    let proccessNext = true
    let currentVal: A
    let currentDp: AsyncIterator<B>
    return cStream<B>(({
      next: async () => {
        if (proccessNext) {
          const { value: _value, done: _done } = await dataProvider.next()
          currentVal = _value
          currentDp = g(currentVal)._source
          proccessNext = false
        } // fresh each time
        const { value, done } = await currentDp.next()
        if (done) {
          const { value: _value, done: _done } = await dataProvider.next()
          if (_done) {
            return {
              value,
              done: true
            }
          }
          currentVal = _value
          currentDp = g(currentVal)._source
          const { value: __value, done: __done } = await currentDp.next()
          return {
            value: __value,
            done: __done
          }
        }
        return {
          value,
          done
        }
      }
    }))
  },
  flatMapF: <B>(g: (_:A) => AsyncIterator<B>) => {
    // 1
    let proccessNext = true
    let currentVal: A
    let currentDp: AsyncIterator<B>
    return cStream<B>(({
      next: async () => {
        if (proccessNext) {
          const { value: _value, done: _done } = await dataProvider.next()
          currentVal = _value
          currentDp = g(currentVal)
          proccessNext = false
        } // fresh each time
        const { value, done } = await currentDp.next()
        if (done) {
          const { value: _value, done: _done } = await dataProvider.next()
          if (_done) {
            return {
              value,
              done: true
            }
          }
          currentVal = _value
          currentDp = g(currentVal)
          const { value: __value, done: __done } = await currentDp.next()
          return {
            value: __value,
            done: __done
          }
        }
        return {
          value,
          done
        }
      }
    }))
  },
  merge: (s: CStream<A>) => {
    let v1done = false
    let v2done = false
    let turn = true
    return cStream({
      next: async () => {
        if (!v1done && turn) {
          const v1 = await dataProvider.next()
          if (v1.done) {
            v1done = true
          }
          if (!v2done) {
            turn = false
          }
          return {
            value: v1.value,
            done: false
          }
        }
        if (!v2done && !turn) {
          const v2 = await s._source.next()
          if (v2.done) {
            v2done = true
          }
          if (!v1done) {
            turn = true
          }
          return {
            value: v2.value,
            done: false
          }
        }
        return {
          value: null,
          done: true
        }
      }
    })
  }
})

const sleep = (n: number) => new Promise((res) => setTimeout(() => res(), n))

const xaba = (): AsyncIterator<number> => {
  let state = [1, 2, 3]
  return {
    next: async () => {
      await sleep(200)
      const [a, ...rest] = state
      if (!a) {
        return {
          value: a,
          done: true
        }
      }
      state = rest
      return {
        value: a,
        done: false
      }
    }
  }
}

const gaba = <A>(b: A): AsyncIterator<A> => {
  let state = [b, b]
  return {
    next: async () => {
      await sleep(200)
      const [a, ...rest] = state
      if (!a) {
        return {
          value: a,
          done: true
        }
      }
      state = rest
      return {
        value: a,
        done: false
      }
    }
  }
}

async function* lines(a: string) {
  if (a) {
    const b = a.split('\n')
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < b.length; i += 1) {
      yield b[i]
    }
  }
  yield ''
}

async function* bla() {
  yield 1
}

// example

// const x = () => fs.createReadStream('./b.txt').setEncoding('utf8')
// const y = () => fs.createReadStream('./a.txt').setEncoding('utf8')

// async function* fromRStream(i: () => ReadStream): AsyncIterator<string> {
//   const j = i()
//   for await (const chunk of j) {
//     yield chunk
//   }
//   yield ''
// }

// const cs = cStream(fromRStream(y))
//   .flatMapF(lines)
//   .merge(
//     cStream(fromRStream(y)).flatMap(a => cStream(lines(a)))
//   )
//   .merge(
//     cStream(fromRStream(y)).flatMap(a => cStream(lines(a)))
//   )
//   .map(a => a.length)
//   .subscribe(({
//     next: async (a) => {
//       console.log(a)
//       await sleep(500)
//     },
//     onError: (e) => {
//       console.log('doh', e.message)
//     },
//     onComplete: () => {
//       console.log('all done')
//     }
//   }))
