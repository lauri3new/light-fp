
import express, { Request, Response, Router } from 'express'
import { Context, dabaRequest } from '../Server/handler'
import { PromiseEither, fromPromiseOptionF } from '../PromiseEither'
import { Right, Left, Either } from '../Either'
import {
  Result, OK, BadRequest, InternalServerError, resultAction,
} from './result'
import { Some } from '../Option'
// what about routeHandler registration?

const app = express()

type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>

type ahandler <B extends Context = Context> = (ctx: B) => Promise<Result>

enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options'
}

interface routeHandlersObj<A extends Context> {
  [path: string]: {
    method: HttpMethods,
    handler: ahandler<A>
  }
}

type HttpEffect<A> = Promise<void>

const runResponse = (res: Response, result: Result) => {
  res.set('content-type', result.contentType || 'application/json')
  const {
    headers, cookies, clearCookies, action,
  } = result
  if (headers) {
    res.set(headers)
  }
  if (cookies) {
    cookies.forEach((cookie) => {
      const { name, value, ...options } = cookie
      res.cookie(name, value, options)
    })
  }
  if (clearCookies) {
    clearCookies.forEach((clearCookie) => {
      const { name, ...options } = clearCookie
      res.clearCookie(name, options)
    })
  }
  if (action) {
    const [resMethod, firstarg, options, cb] = action
    if (resMethod === resultAction.redirect) {
      return res[resMethod](firstarg)
    }
    if (resMethod === resultAction.sendFile) {
      return res[resMethod](firstarg, options)
    }
    if (resMethod === resultAction.render) {
      return res[resMethod](firstarg, options, cb)
    }
  }
  res.status(result.status).send(result.body)
}

const routeHandler = <A>(a: (ctx: Context) => Promise<Result<A>>) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
  result => runResponse(res, result),
)

const lRouter = (routeHandlersObj: routeHandlersObj<Context>): Router => {
  const _router = Router()
  Object.keys(routeHandlersObj).forEach((path) => {
    const { method, handler } = routeHandlersObj[path]
    _router[method](path, routeHandler(handler))
  })
  return _router
}

const lmwRouter = <A extends Context>(middleware: middleware<Context, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
  const _router = Router()
  Object.keys(routeHandlersObj).forEach((path) => {
    const { method, handler } = routeHandlersObj[path]
    _router[method](path, routeHandler(async (ctx) => middleware(ctx).onComplete(
      lreq => handler(lreq),
      i => i,
      () => InternalServerError('doh'),
    )))
  })
  return _router
}

const dabaMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
  ...ctx,
  daba: {
    daba: '123',
  },
})))

const loggerMiddleware = <A extends Context>(ctx: A): PromiseEither<Result, A> => {
  console.log(`#log ${ctx.req.path}`)
  return PromiseEither(Promise.resolve(Right(ctx)))
}

const handler1 = (ctx: Context) => Promise.resolve(OK({ hello: 'world' }))

const helloRoutes = lRouter({
  '/hello': {
    method: HttpMethods.GET,
    handler: handler1,
  },
})

const handler2 = (ctx: dabaRequest) => Promise.resolve(OK({ hello: 'world' }))


enum userErrors {
  notFound = 'user was not found'
}

const getUserTwo = (id: number) => PromiseEither(new Promise<Either<userErrors, User>>((res, rej) => {
  setTimeout(() => {
    if (Math.random() < 0.3) {
      return res(Right({
        id,
        name: 'jabba',
      }))
    }
    if (Math.random() < 0.3) {
      return res(Left(userErrors.notFound))
    }
    // eslint-disable-next-line no-throw-literal
    return rej(new Error('boom'))
  })
}))

enum friendsErrors {
  notFound = 'friends were not found'
}

interface User {
  id: number
  name: string
}

const getFriendsByUsernameTwo = (name: string) => PromiseEither(new Promise<Either<friendsErrors, User[]>>((res, rej) => {
  setTimeout(() => {
    if (Math.random() < 0.3) {
      return res(Right([{
        id: 4,
        name: 'jabba',
      }]))
    }
    if (Math.random() < 0.3) {
      return res(Left(friendsErrors.notFound))
    }
    // eslint-disable-next-line no-throw-literal
    return rej(new Error('boom'))
  })
}))

const tokenLookup = (token: string): Promise<Either<string, string>> => Promise.resolve(Math.random() > 0.5 ? Right('valid') : Left('invalid'))

const authMiddleware = async (ctx: Context): Promise<Either<Result, Context>> => {
  const token = ctx.req.headers.authorization
  if (!token) {
    return Left(BadRequest('sorry no token'))
  }
  const dbtoken = await tokenLookup(token)
  return dbtoken.match(
    () => Right(ctx),
    () => Left(BadRequest('sorry you are not logged in')),
  )
}

const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

const userHandlerTwo = <A extends Context>(ctx: A) => PromiseEither(authMiddleware(ctx))
  .flatMap(() => getUserTwo(1)
    .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
    .flatMapF(async user => Right(user))
    .flatMapF(async ({ user }) => {
      const [a] = await Promise.all([
        getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val,
      ])
      return a
    })
    .leftMap((a): Result => {
      switch (a) {
        case userErrors.notFound:
          return BadRequest(userErrors.notFound)
        case friendsErrors.notFound:
          return BadRequest(userErrors.notFound)
      }
    }))

const helloWorldRoutes = lmwRouter(loggerMiddleware, {
  '*': {
    method: HttpMethods.GET,
    handler: handler1,
  },
})

app.use('/api/test', routeHandler(async ctx => loggerMiddleware(ctx).flatMap(userHandlerTwo).onComplete(
  a => OK(a),
  b => b,
  () => OK('safe'),
)))
app.use('/api', helloRoutes)
app.use('/api/helloworld', helloWorldRoutes)

app.listen(3000)
