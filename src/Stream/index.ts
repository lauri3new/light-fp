interface Sink<E, A> {
  onNext: (a: A) => void,
  onError: (e: E) => void,
  onComplete: () => void,
}

type unsubscribe = () => void

interface Stream<E, A> {
  subscribe: (sink: Sink<E, A>) => unsubscribe,
  map: <B>(g: (_:A) => B) => Stream<E, B>,
  scan: <B>(g: (_:A, __:B) => B, initial: B) => Stream<E, B>,
  flatMap: <EE, B>(g: (_:A) => Stream<EE, B>) => Stream<E | EE, B>,
  merge: (_: Stream<E, A>) => Stream<E, A>,
  concat: (_: Stream<E, A>) => Stream<E, A>,
}

const Stream = <E, A>(dataProvider: (_: Sink<E, A>) => unsubscribe): Stream<E, A> => ({
  subscribe: (sink: Sink<E, A>) => {
    const fine = 'fine'
    const complete = 'complete'
    const error = 'error'
    let state = fine
    return dataProvider({
      onNext: (a) => {
        if (state === fine) {
          sink.onNext(a)
        }
      },
      onComplete: () => {
        if (state === fine) {
          sink.onComplete()
        }
        state = complete
      },
      onError: (e) => {
        if (state === fine) {
          sink.onError(e)
        }
        state = error
      },
    })
  },
  map: <B>(g: (_:A) => B) => Stream<E, B>((_sink: Sink<E, B>) => dataProvider(({
    ..._sink,
    onNext: (a) => _sink.onNext(g(a)),
  }))),
  flatMap: <EE, B>(g: (_:A) => Stream<EE, B>) => Stream<EE | E, B>((_sink: Sink<EE | E, B>) => dataProvider(({
    ..._sink,
    onNext: (a) => {
      g(a).subscribe({
        ..._sink,
        onError: () => {},
        onComplete: () => {},
      })
    },
  }))),
  scan: <B>(g: (_:A, __:B) => B, initial: B) => {
    let b = initial
    return Stream<E, B>((_sink: Sink<E, B>) => dataProvider(({
      ..._sink,
      onNext: (a) => {
        const sc = g(a, b)
        _sink.onNext(sc)
        b = sc
      },
    })))
  },
  merge: (s: Stream<E, A>) => Stream((_sink: Sink<E, A>) => {
    const a = dataProvider(_sink)
    const b = s.subscribe(_sink)
    return () => {
      a()
      b()
    }
  }),
  concat: (s: Stream<E, A>) => Stream((_sink: Sink<E, A>) => dataProvider({
    ..._sink,
    onComplete: () => {
      s.subscribe(_sink)
    },
  })),
})

const fromPromise = <E, A>(a: Promise<A>) => Stream((_sink: Sink<E, A>) => {
  a.then(ia => {
    _sink.onNext(ia)
    _sink.onComplete()
  })
    .catch(e => {
      _sink.onError(e)
    })
  return () => {}
})

// example

const a = Stream((observer: Sink<string, number>) => {
  observer.onNext(1)
  observer.onNext(2)
  observer.onComplete()
  return () => {}
})

const ba = (n: number) => Stream((observer: Sink<never, number>) => {
  observer.onNext(n + 100)
  observer.onNext(n + 100)
  observer.onComplete()
  observer.onNext(n + 200)
  return () => {}
})

a.flatMap(ba).scan((j, b) => j + b, 0).subscribe({
  onNext: b => console.log('next', b),
  onError: (e) => console.log('error', e),
  onComplete: () => console.log('complete'),
})
