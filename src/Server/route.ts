
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

const dabaMiddleware = <A extends lRequest>(req: A): PromiseEither<Result, A & dabaRequest> => PromiseEither(Promise.resolve(Right({
  ...req,
  daba: {
    daba: '123',
  },
})))

const loggerMiddleware = <A extends lRequest>(req: A): PromiseEither<Result, A> => PromiseEither(Promise.resolve(Right(req)))

const userHandler = (req: dabaRequest) => Promise.resolve(OK('hello'))

lRouter(dabaMiddleware, {
  '/hello': { method: HttpMethods.GET, handler: userHandler },
})
