
// interface ShareStream {
//   // share: (sink: Sink<number>) => Stream,
//   subscribe: (sink: Sink<number>) => void, // should be unsubscribe handler
//   map: (g: (_:number) => number) => any,
//   // scan: (g: (_:number, __:number) => number) => Stream,
//   // flatMap: (g: (_:number) => Stream) => Stream,
//   // merge: (_: Stream) => Stream,
//   // concat: (_: Stream) => Stream,
// }

// const ShareStream = (dataProvider: (_: Sink<number>) => void): ShareStream => {
//   const sinks: Sink<number>[] = []
//   let nextVal
//   const getSinks = () => sinks
//   dataProvider({
//     onNext: (val) => {
//       getSinks().forEach((s) => {
//         s.onNext(val)
//       })
//     },
//     onComplete: () => {
//       sinks.forEach((s) => {
//         s.onComplete()
//       })
//     },
//     onError: () => {
//       sinks.forEach((s) => {
//         s.onError()
//       })
//     },
//   })
//   return ({
//     subscribe: (sink: Sink<number>) => {
//       sinks.push(sink)
//     },
//     map: (g: (_:number) => number) => ({
//       subscribe: (sink: Sink<number>) => {
//         sinks.push({
//           ...sink,
//           onNext: (a) => (g(a)),
//         })
//       },
//     }),
//   })
// }
