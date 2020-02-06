
import express, { Request, Response, Router } from 'express'
import { Context, dabaRequest } from '../Server/handler'
import {
  PromiseEither,
  fromPromiseOptionF, composeK,
} from '../PromiseEither'
import { Right, Left, Either } from '../Either'
import {
  Result, OK, BadRequest, InternalServerError,
} from './result'
import { Some } from '../Option'
import { queryValidatorMiddleware } from './reqValidations'
// what about routeHandler registration?

const app = express()

const router = express.Router()

type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>

app.use()

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

const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

const routeHandler = <A extends Request>(a: (ctx: Context) => Promise<Result>) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
  result => runResponse(res, result),
)

const lRouter = <A extends Context>(middleware: middleware<Context, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
  const _router = Router()
  Object.keys(routeHandlersObj).forEach((path) => {
    const { method, handler } = routeHandlersObj[path]
    _router[method](path, routeHandler(async (ctx) => middleware(ctx).onComplete(
      lreq => handler(lreq),
      i => i,
      () => InternalServerError('ad'),
    )))
  })
  return _router
}

const dabaMiddleware = <A extends Context>(ctx: A): PromiseEither<never, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
  ...ctx,
  daba: {
    daba: '123',
  },
})))

const loggerMiddleware = <A extends Context>(ctx: A) => PromiseEither(
  (Math.random() > 0.5) ? Promise.resolve(Right(ctx)) : Promise.resolve(Left('doh')),
).leftMap(string => BadRequest(string))
const failMiddleware = <A extends Context>(ctx: A) => PromiseEither(Promise.resolve(Left(ctx)))

const userHandler = (ctx: dabaRequest) => Promise.resolve(OK('hello'))

const mws = composeK(loggerMiddleware, dabaMiddleware)

lRouter(mws, {
  '/hello': { method: HttpMethods.GET, handler: userHandler },
})

router.get('/ok', routeHandler(
  async (ctx) => dabaMiddleware(ctx)
    .onComplete(
      userHandler,
      i => i,
      () => InternalServerError('aef'),
    ),
))

const runResponset = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

const routeHandlert = <A extends Request, B extends Context>(
  mwsa: (ctx: Context) => PromiseEither<Result, B>, a: (ctx: B) => Promise<Result>,
) => async (req: Request, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
    a,
    async i => i,
    async () => InternalServerError('awd'),
  ).then(async t => {
    const ba = await t
    runResponset(res, ba)
  })

const basef = routeHandlert(mws, async (abc) => OK(abc))


const get = <A extends Request, B extends Context>(_router: Router) => (path: string, handle: (ctx: B | Context) => Promise<Result>, middlewares?: (ctx: Context) => PromiseEither<Result, B>) => {
  if (middlewares) {
    _router.get(path, routeHandlert(middlewares, handle))
  } else {
    _router.get(path, routeHandler((ctx: Context) => handle(ctx)))
  }
}


const myHandler = routeHandlert(mws, async (abc) => OK(abc))

// router.get('/hello', routeHandlert(loggerMiddleware, myHandler))

// const b = get(router)('/hello', r)

router.get('ok')

// https://http4s.org/v0.17/api/org/http4s/response#Self=org.http4s.Response
