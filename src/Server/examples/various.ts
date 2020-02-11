
// import express, { Request, Response, Router } from 'express'
// import { Context, dabaRequest } from './handler'
// import { PromiseEither, fromPromiseOptionF } from '../../PromiseEither'
// import { Right, Left, Either } from '../../Either'
// import {
//   Result, OK, BadRequest, InternalServerError, resultAction,
// } from '../result'
// import { Some } from '../../Option'
// // what about routeHandler registration?

// const app = express()

// type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>

// type ahandler <B extends Context = Context> = (ctx: B) => Promise<Result>

// enum HttpMethods {
//   GET = 'get',
//   POST = 'post',
//   PUT = 'put',
//   DELETE = 'delete',
//   PATCH = 'patch',
//   OPTIONS = 'options'
// }

// interface routeHandlersObj<A extends Context> {
//   [path: string]: {
//     method: HttpMethods,
//     handler: ahandler<A>
//   }
// }

// type HttpEffect<A> = Promise<void>

// const runResponse = (res: Response, result: Result) => {
//   res.set('content-type', result.contentType || 'application/json')
//   const {
//     headers, cookies, clearCookies, action,
//   } = result
//   if (headers) {
//     res.set(headers)
//   }
//   if (cookies) {
//     cookies.forEach((cookie) => {
//       const { name, value, ...options } = cookie
//       res.cookie(name, value, options)
//     })
//   }
//   if (clearCookies) {
//     clearCookies.forEach((clearCookie) => {
//       const { name, ...options } = clearCookie
//       res.clearCookie(name, options)
//     })
//   }
//   if (action) {
//     const [resMethod, firstarg, options, cb] = action
//     if (resMethod === resultAction.redirect) {
//       return res[resMethod](firstarg)
//     }
//     if (resMethod === resultAction.sendFile) {
//       return res[resMethod](firstarg, options)
//     }
//     if (resMethod === resultAction.render) {
//       return res[resMethod](firstarg, options, cb)
//     }
//   }
//   res.status(result.status).send(result.body)
// }

// const routeHandler = <A>(a: (ctx: Context) => Promise<Result<A>>) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
//   result => runResponse(res, result),
// )

// const lRouter = (routeHandlersObj: routeHandlersObj<Context>): Router => {
//   const _router = Router()
//   Object.keys(routeHandlersObj).forEach((path) => {
//     const { method, handler } = routeHandlersObj[path]
//     _router[method](path, routeHandler(handler))
//   })
//   return _router
// }

// const lmwRouter = <A extends Context>(middleware: middleware<Context, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
//   const _router = Router()
//   Object.keys(routeHandlersObj).forEach((path) => {
//     const { method, handler } = routeHandlersObj[path]
//     _router[method](path, routeHandler(async (ctx) => middleware(ctx).onComplete(
//       lreq => handler(lreq),
//       i => i,
//       () => InternalServerError('doh'),
//     )))
//   })
//   return _router
// }

// const dabaMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
//   ...ctx,
//   daba: {
//     daba: '123',
//   },
// })))

// const loggerMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A> => {
//   console.log(`#log ${ctx.req.path}`)
//   return PromiseEither(Promise.resolve(Right(ctx)))
// }

// const handler1 = (ctx: Context) => Promise.resolve(OK({ hello: 'world' }))

// const helloRoutes = lRouter({
//   '/hello': {
//     method: HttpMethods.GET,
//     handler: handler1,
//   },
// })

// const handler2 = (ctx: dabaRequest) => Promise.resolve(OK({ hello: 'world' }))


// enum userErrors {
//   notFound = 'user was not found'
// }

// const getUserTwo = (id: number) => PromiseEither(new Promise<Either<userErrors, User>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right({
//         id,
//         name: 'jabba',
//       }))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(userErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// enum friendsErrors {
//   notFound = 'friends were not found'
// }

// interface User {
//   id: number
//   name: string
// }

// const getFriendsByUsernameTwo = (name: string) => PromiseEither(new Promise<Either<friendsErrors, User[]>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right([{
//         id: 4,
//         name: 'jabba',
//       }]))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(friendsErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// const tokenLookup = (token: string): Promise<Either<string, string>> => Promise.resolve(Math.random() > 0.5 ? Right('valid') : Left('invalid'))

// const authMiddleware = async (ctx: Context): Promise<Either<Result, Context>> => {
//   const token = ctx.req.headers.authorization
//   if (!token) {
//     return Left(BadRequest('sorry no token'))
//   }
//   const dbtoken = await tokenLookup(token)
//   return dbtoken.match(
//     () => Right(ctx),
//     () => Left(BadRequest('sorry you are not logged in')),
//   )
// }

// const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

// const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

// const userHandlerTwo = <A extends Context>(ctx: A) => PromiseEither(authMiddleware(ctx))
//   .flatMap(() => getUserTwo(1)
//     .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
//     .flatMapF(async user => Right(user))
//     .flatMapF(async ({ user }) => {
//       const [a] = await Promise.all([
//         getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val,
//       ])
//       return a
//     })
//     .leftMap((a): Result => {
//       switch (a) {
//         case userErrors.notFound:
//           return BadRequest(userErrors.notFound)
//         case friendsErrors.notFound:
//           return BadRequest(userErrors.notFound)
//       }
//     }))

// const helloWorldRoutes = lmwRouter(loggerMiddleware, {
//   '*': {
//     method: HttpMethods.GET,
//     handler: handler1,
//   },
// })

// app.use('/api/test', routeHandler(async ctx => loggerMiddleware(ctx).flatMap(userHandlerTwo).onComplete(
//   a => OK(a),
//   b => b,
//   () => OK('safe'),
// )))
// app.use('/api', helloRoutes)
// app.use('/api/helloworld', helloWorldRoutes)

// app.listen(3000)

// /* eslint-disable  */
// // TODO: write demo route handlers + middleware using PromiseEither
// import express, { Request, Response, Router } from 'express'
// import { PromiseEither, fromPromiseOptionF } from '../../PromiseEither'
// import { Right, Left, Either } from '../../Either'
// import {
//   Result, OK, BadRequest, InternalServerError,
// } from '../result'
// import { Some } from '../../Option'

// const app = express()

// const router = express.Router()

// interface User {
//   id: number
//   name: string
// }

// export interface Context {
//   req: Request
// }

// interface AuthRequest {
//   req: Request
//   user: User
// }

// // const route = (handler: (_: Request) => PromiseEither<Result, Result>) => (ctx: Request, res: Response) => (ctx) => handler
// const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')
// type HttpEffect<A> = Promise<void>
// type handler = <A extends Context, B>(a: (ctx: A) => Promise<B>) => (ctx: A, res: Response) => HttpEffect<B>
// // type handlerFn = <A, B>(ctx: B, res: Response) => HttpEffect<A>
// const handler = <A extends Context, B>(a: (ctx: A) => Promise<Result<B>>) => (ctx: A, res: Response): HttpEffect<B> => a(ctx).then(
//   result => runResponse(res, result),
// )

// const tokenLookup = (token: string): Promise<Either<string, string>> => Promise.resolve(Math.random() > 0.5 ? Right("valid") : Left("invalid"))

// const authMiddleware = async <A extends Context>(ctx: A): Promise<Either<Result, AuthRequest>> => {
//   const token = ctx.req.headers.authorization
//   if (!token) {
//     return Left(BadRequest("sorry no token"))
//   }
//   const dbtoken = await tokenLookup(token)
//   return dbtoken.match(
//     token => Right({
//       ...ctx,
//       user: { id: 1, name: 'sef' }
//     }),
//     () => Left(BadRequest("sorry you are not logged in"))
//   )
// }

// interface daba {
//   daba: string
// }

// export interface dabaRequest {
//   daba: daba,
//   req: Request
// }

// const dabaMiddleware = async <A extends Context>(ctx: A): Promise<Either<Result, A & dabaRequest>> => {
//   return Right({
//     ...ctx,
//     daba: {
//       daba: '123'
//     }
//   })
// }

// const loggerMiddleware = async <A extends Context>(ctx: A): Promise<Either<Result, A>> => {
//   return Right(ctx)
// }

// router.get('/', authMiddleware)

// enum userErrors {
//   notFound = 'user was not found'
// }

// const getUserTwo = (id: number) => PromiseEither(new Promise<Either<userErrors, User>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right({
//         id,
//         name: 'jabba',
//       }))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(userErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// enum friendsErrors {
//   notFound = 'friends were not found'
// }

// const getFriendsByUsernameTwo = (name: string) => PromiseEither(new Promise<Either<friendsErrors, User[]>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right([{
//         id: 4,
//         name: 'jabba',
//       }]))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(friendsErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

// const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

// const userHandlerTwo = handler((ctx: Context) => PromiseEither(authMiddleware(ctx))
//   .flatMap((ctx) => {
//     return getUserTwo(1)
//     .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
//     .flatMapF(async user => Right(user))
//     .flatMapF(async ({ user }) => {
//       const [ a ] = await Promise.all([
//         getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val
//       ])
//       return a
//     })
//     .leftMap((a): Result => {
//       switch (a) {
//         case userErrors.notFound:
//           return BadRequest(userErrors.notFound)
//         case friendsErrors.notFound:
//           return BadRequest(userErrors.notFound)
//       }
//     })
//   })
//     .onComplete(
//       data => OK(data),
//       r => r,
//       InternalServerError,
//     ))
// // build a typed router ?
// enum HttpMethods {
//   GET = 'get'
// }
// // registratio

// app.listen(3000, () => console.log('Example app listening on port!'))


// // good enough for now, look into kleisli otherwise
// // to be able to write something like middleware.andThen.handler
// const globalMiddlewares = (ctx: Context) => PromiseEither(authMiddleware(ctx))
//   .flatMapF(dabaMiddleware)

// const userHandler = (ctx: Context) => globalMiddlewares(ctx)
// .flatMap((ctx) => {
//   return getUserTwo(1)
//   .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
//   .flatMapF(async user => Right(user))
//   .flatMapF(async ({ user }) => {
//     const [ a ] = await Promise.all([
//       getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val
//     ])
//     return a
//   })
//   .leftMap((a) => {
//     switch (a) {
//       case userErrors.notFound:
//         return BadRequest(userErrors.notFound)
//       case friendsErrors.notFound:
//         return BadRequest(userErrors.notFound)
//     }
//   })
// })
//   .onComplete(
//     data => OK(data),
//     r => r,
//     InternalServerError,
//   )

// /* eslint-disable  */
// // TODO: write demo route handlers + middleware using PromiseEither
// import express, { Request, Response, Router } from 'express'
// import { PromiseEither, fromPromiseOptionF } from '../../PromiseEither'
// import { Right, Left, Either } from '../../Either'
// import {
//   Result, OK, BadRequest, InternalServerError,
// } from '../result'
// import { Some } from '../../Option'

// const app = express()

// const router = express.Router()

// interface User {
//   id: number
//   name: string
// }

// const getUser = (id: number) => PromiseEither(new Promise<Either<string, User>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right({
//         id,
//         name: 'jabba',
//       }))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left('user was not found'))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// const getFriendsByUsername = (name: string) => PromiseEither(new Promise<Either<string, User[]>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right([{
//         id: 4,
//         name: 'jabba',
//       }]))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left('no friends found'))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// // const route = (handler: (_: Request) => PromiseEither<Result, Result>) => (ctx: Request, res: Response) => (ctx) => handler
// const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')
// type HttpEffect<A> = Promise<void>
// type handler = <A extends Result, B extends Request>(a: (ctx: Request) => Promise<A>) => (ctx: B, res: Response) => HttpEffect<A>
// type handlerFn = <A, B>(ctx: B, res: Response) => HttpEffect<A>
// const handler = <A extends Result, B extends Request>(a: (ctx: Request) => Promise<A>) => (ctx: B, res: Response): HttpEffect<A> => a(ctx).then(
//   result => runResponse(res, result),
// )

// const tokenLookup = (token: string): Promise<Either<string, string>> => Promise.resolve(Math.random() > 0.5 ? Right("valid") : Left("invalid"))

// const authMiddleware = async (ctx: Request): Promise<Either<Result, Request>> => {
//   const token = ctx.headers.authorization
//   if (!token) {
//     return Left(BadRequest("sorry no token"))
//   }
//   const dbtoken = await tokenLookup(token)
//   return dbtoken.match(
//     token => Right(ctx),
//     () => Left(BadRequest("sorry you are not logged in"))
//   )
// }

// const userHandler = handler((req: Request) =>
//   getUser(1)
//   .flatMap(user => getFriendsByUsername(user.name).map(friends => ({ user, friends })))
//   .flatMapF(async user => Right(user))
//   .onComplete(
//     data => OK(data),
//     BadRequest,
//     () => InternalServerError('Error'),
//   ))

// enum userErrors {
//   notFound = 'user was not found'
// }

// const getUserTwo = (id: number) => PromiseEither(new Promise<Either<userErrors, User>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right({
//         id,
//         name: 'jabba',
//       }))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(userErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// enum friendsErrors {
//   notFound = 'friends were not found'
// }

// const getFriendsByUsernameTwo = (name: string) => PromiseEither(new Promise<Either<friendsErrors, User[]>>((res, rej) => {
//   setTimeout(() => {
//     if (Math.random() < 0.3) {
//       return res(Right([{
//         id: 4,
//         name: 'jabba',
//       }]))
//     }
//     if (Math.random() < 0.3) {
//       return res(Left(friendsErrors.notFound))
//     }
//     // eslint-disable-next-line no-throw-literal
//     return rej(new Error('boom'))
//   })
// }))

// const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

// const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

// const userHandlerTwo = handler((req: Request) => PromiseEither(authMiddleware(req))
//   .flatMap((ctx) => {
//     return getUserTwo(1)
//     .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
//     .flatMapF(async user => Right(user))
//     .flatMapF(async ({ user }) => {
//       const [ a ] = await Promise.all([
//         getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val
//       ])
//       return a
//     })
//     .leftMap((a): Result => {
//       switch (a) {
//         case userErrors.notFound:
//           return BadRequest(userErrors.notFound)
//         case friendsErrors.notFound:
//           return BadRequest(userErrors.notFound)
//       }
//     })
//   })
//     .onComplete(
//       data => OK(data),
//       r => r,
//       () => InternalServerError('awd'),
//     ))
// // build a typed router ?
// enum HttpMethods {
//   GET = 'get'
// }
// // registratio
// router.use('/hello', userHandler)

// const userRouter = express.Router()

// userRouter.use('/helloagain', userHandlerTwo)

// router.use('/daba', userRouter)

// app.use('/', router)

// app.use('*', (ctx, res) => res.send({ ok: 404 }))

// app.listen(3000, () => console.log('Example app listening on port!'))


// import express, { Request, Response, Router } from 'express'
// import { Context, dabaRequest } from '../Server/handler'
// import {
//   PromiseEither,
//   fromPromiseOptionF, composeK,
// } from '../../PromiseEither'
// import { Right, Left, Either } from '../../Either'
// import {
//   Result, OK, BadRequest, InternalServerError,
// } from '../result'
// import { Some } from '../../Option'
// import { queryValidatorMiddleware } from './reqValidations'
// // what about routeHandler registration?

// const app = express()

// const router = express.Router()

// type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>

// app.use()

// type ahandler <B extends Context = Context> = (ctx: B) => Promise<Result>

// enum HttpMethods {
//   GET = 'get',
//   POST = 'post',
//   PUT = 'put',
//   DELETE = 'delete',
//   PATCH = 'patch',
//   OPTIONS = 'options'
// }

// interface routeHandlersObj<A extends Context> {
//   [path: string]: {
//     method: HttpMethods,
//     handler: ahandler<A>
//   }
// }

// type HttpEffect<A> = Promise<void>

// const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

// const routeHandler = <A extends Request>(a: (ctx: Context) => Promise<Result>) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
//   result => runResponse(res, result),
// )

// const lRouter = <A extends Context>(middleware: middleware<Context, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
//   const _router = Router()
//   Object.keys(routeHandlersObj).forEach((path) => {
//     const { method, handler } = routeHandlersObj[path]
//     _router[method](path, routeHandler(async (ctx) => middleware(ctx).onComplete(
//       lreq => handler(lreq),
//       i => i,
//       () => InternalServerError('ad'),
//     )))
//   })
//   return _router
// }

// const dabaMiddleware = <A extends Context>(ctx: A): PromiseEither<never, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
//   ...ctx,
//   daba: {
//     daba: '123',
//   },
// })))

// const loggerMiddleware = <A extends Context>(ctx: A) => PromiseEither(
//   (Math.random() > 0.5) ? Promise.resolve(Right(ctx)) : Promise.resolve(Left('doh')),
// ).leftMap(string => BadRequest(string))
// const failMiddleware = <A extends Context>(ctx: A) => PromiseEither(Promise.resolve(Left(ctx)))

// const userHandler = (ctx: dabaRequest) => Promise.resolve(OK('hello'))

// const mws = composeK(loggerMiddleware, dabaMiddleware)

// lRouter(mws, {
//   '/hello': { method: HttpMethods.GET, handler: userHandler },
// })

// router.get('/ok', routeHandler(
//   async (ctx) => dabaMiddleware(ctx)
//     .onComplete(
//       userHandler,
//       i => i,
//       () => InternalServerError('aef'),
//     ),
// ))

// const runResponset = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

// const routeHandlert = <A extends Request, B extends Context>(
//   mwsa: (ctx: Context) => PromiseEither<Result, B>, a: (ctx: B) => Promise<Result>,
// ) => async (req: Request, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
//     a,
//     async i => i,
//     async () => InternalServerError('awd'),
//   ).then(async t => {
//     const ba = await t
//     runResponset(res, ba)
//   })

// const basef = routeHandlert(mws, async (abc) => OK(abc))


// const get = <A extends Request, B extends Context>(_router: Router) => (path: string, handle: (ctx: B | Context) => Promise<Result>, middlewares?: (ctx: Context) => PromiseEither<Result, B>) => {
//   if (middlewares) {
//     _router.get(path, routeHandlert(middlewares, handle))
//   } else {
//     _router.get(path, routeHandler((ctx: Context) => handle(ctx)))
//   }
// }


// const myHandler = routeHandlert(mws, async (abc) => OK(abc))

// // router.get('/hello', routeHandlert(loggerMiddleware, myHandler))

// // const b = get(router)('/hello', r)

// router.get('ok')

// // https://http4s.org/v0.17/api/org/http4s/response#Self=org.http4s.Response
