// import express, { Express, Request } from 'express'
// import { PromiseEither } from '../PromiseEither'
// import { Right } from '../Either'
// import { Option, Some, None } from '../Option'

// some ideas about how routing could work

// const app = express()

// interface Result {
//   status: number
//   body: string
//   contentType: string
// }

// const match = (req: Request, method: string, path: string) => {
//   if (req.path === path) return true
//   return false
// }

// type Route = (req: Request) => Option<PromiseEither<Result, Result>>
// const Route = (method: string, path: string, handler: (req: Request) => PromiseEither<Result, Result>) => (req: Request): Option<PromiseEither<Result, Result>> => {
//   if (match(req, method, path)) {
//     return Some(handler(req))
//   }
//   return None()
// }

// const route = Route('GET', '/hello', (req) => PromiseEither(Promise.resolve(Right({
//   status: 200,
//   body: 'string',
//   contentType: 'string',
// }))))

// const combine = (a: Route, b: Route) => (req: Request) => a(req).orElse(b(req))

// const router = combine(route, route)

// const App = (a: Express, ruter: any) => {
//   a.use('*', (req, res) => {
//     ruter(req, res)
//   })
// }
