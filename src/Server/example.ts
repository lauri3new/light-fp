
import express, { Request, Response, Router } from 'express'
import { lRequest, dabaRequest } from '../Server/handler'
import { PromiseEither, sequence, fromPromiseOptionF } from '../PromiseEither'
import { Right, Left, Either } from '../Either'
import {
  Result, OK, BadRequest, InternalServerError,
} from './result'
import { Some } from '../Option'
// what about routeHandler registration?

const app = express()

type middleware <A extends lRequest, B extends A> = (req: A) => PromiseEither<Result, B>

type ahandler <B extends lRequest = lRequest> = (req: B) => Promise<Result>

enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options'
}

interface routeHandlersObj<A extends lRequest> {
  [path: string]: {
    method: HttpMethods,
    handler: ahandler<A>
  }
}

type HttpEffect<A> = Promise<void>

const runResponse = (res: Response, result: Result) => {
  res.setHeader('content-type', result.contentType || 'application/json')
  res.status(result.status).send(result.body)
}

const routeHandler = <A>(a: (req: lRequest) => Promise<Result<A>>) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
  result => runResponse(res, result),
)

const lRouter = (routeHandlersObj: routeHandlersObj<lRequest>): Router => {
  const _router = Router()
  Object.keys(routeHandlersObj).forEach((path) => {
    const { method, handler } = routeHandlersObj[path]
    _router[method](path, routeHandler(handler))
  })
  return _router
}

const lmwRouter = <A extends lRequest>(middleware: middleware<lRequest, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
  const _router = Router()
  Object.keys(routeHandlersObj).forEach((path) => {
    const { method, handler } = routeHandlersObj[path]
    _router[method](path, routeHandler(async (req) => middleware(req).onComplete(
      lreq => handler(lreq),
      i => i,
      () => InternalServerError(),
    )))
  })
  return _router
}

const dabaMiddleware = <A extends lRequest>(req: A): PromiseEither<Result, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
  ...req,
  daba: {
    daba: '123',
  },
})))

const loggerMiddleware = <A extends lRequest>(req: A): PromiseEither<Result, A> => {
  console.log(`#log ${req.req.path}`)
  return PromiseEither(Promise.resolve(Right(req)))
}

const handler1 = (req: lRequest) => Promise.resolve(OK({ hello: 'world' }))

const helloRoutes = lRouter({
  '/hello': {
    method: HttpMethods.GET,
    handler: handler1,
  },
})

const handler2 = (req: dabaRequest) => Promise.resolve(OK({ hello: 'world' }))


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

const authMiddleware = async (req: lRequest): Promise<Either<Result, lRequest>> => {
  const token = req.req.headers.authorization
  if (!token) {
    return Left(BadRequest('sorry no token'))
  }
  const dbtoken = await tokenLookup(token)
  return dbtoken.match(
    () => Right(req),
    () => Left(BadRequest('sorry you are not logged in')),
  )
}

const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

const userHandlerTwo = <A extends lRequest>(req: A) => PromiseEither(authMiddleware(req))
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

app.use('/api/test', routeHandler(async req => loggerMiddleware(req).flatMap(userHandlerTwo).onComplete(
  a => OK(a),
  b => b,
  () => OK('safe'),
)))
app.use('/api', helloRoutes)
app.use('/api/helloworld', helloWorldRoutes)

app.listen(3000)
