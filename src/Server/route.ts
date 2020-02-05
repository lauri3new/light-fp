
import express, { Request, Response, Router } from 'express'
import { lRequest, dabaRequest } from '../Server/handler'
import {
  PromiseEither, sequence,
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

type middleware <A extends lRequest, B extends A> = (req: A) => PromiseEither<Result, B>

app.use()

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

const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

const routeHandler = <A extends Request>(a: (req: lRequest) => Promise<Result>) => (req: A, res: Response): HttpEffect<A> => a({ req }).then(
  result => runResponse(res, result),
)

const lRouter = <A extends lRequest>(middleware: middleware<lRequest, A>, routeHandlersObj: routeHandlersObj<A>): Router => {
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

const dabaMiddleware = <A extends lRequest>(req: A): PromiseEither<never, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
  ...req,
  daba: {
    daba: '123',
  },
})))

const loggerMiddleware = <A extends lRequest>(req: A) => PromiseEither(
  (Math.random() > 0.5) ? Promise.resolve(Right(req)) : Promise.resolve(Left('doh')),
).leftMap(string => BadRequest(string))
const failMiddleware = <A extends lRequest>(req: A) => PromiseEither(Promise.resolve(Left(req)))

const userHandler = (req: dabaRequest) => Promise.resolve(OK('hello'))

const mws = composeK(loggerMiddleware, dabaMiddleware)

lRouter(mws, {
  '/hello': { method: HttpMethods.GET, handler: userHandler },
})

router.get('/ok', routeHandler(
  async (req) => dabaMiddleware(req)
    .onComplete(
      userHandler,
      i => i,
      () => InternalServerError(),
    ),
))

const runResponset = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')

const routeHandlert = <A extends Request, B extends lRequest>(
  mwsa: (req: lRequest) => PromiseEither<Result, B>, a: (req: B) => Promise<Result>,
) => async (req: A, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
    a,
    async i => i,
    async () => InternalServerError(),
  ).then(async t => {
    const ba = await t
    runResponset(res, ba)
  })

const basef = routeHandlert(mws, async (abc) => OK(abc))


const get = <A extends Request, B extends lRequest>(_router: Router) => (path: string, handle: (req: B | lRequest) => Promise<Result>, middlewares?: (req: lRequest) => PromiseEither<Result, B>) => {
  if (middlewares) {
    _router.get(path, routeHandlert(middlewares, handle))
  } else {
    _router.get(path, routeHandler((req: lRequest) => handle(req)))
  }
}


const myHandler = routeHandlert(mws, async (abc) => OK(abc))

router.get('/hello', routeHandlert(loggerMiddleware, myHandler))

const b = get(router)('/hello', r)

router.get('ok')

// https://http4s.org/v0.17/api/org/http4s/response#Self=org.http4s.Response