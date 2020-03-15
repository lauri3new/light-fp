
import { Request, Response } from 'express'
import { PromiseEither, composeK } from '../PromiseEither'
import {
  Result, resultAction, InternalServerError
} from './result'

type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>
type handler <B extends Context = Context> = (ctx: B) => Promise<Result>

export interface Context {
  req: Request
}

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
    handler: handler<A>
  }
}

type HttpEffect<A> = Promise<void>

export const runResponse = (res: Response, result: Result) => {
  res.set('content-type', result.contentType || 'application/json')
  const {
    headers, cookies, clearCookies, action
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

export const handler = <A>(
  a: (ctx: Context) => Promise<Result<A>>
) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
    result => runResponse(res, result)
  )

export const handlerM = <A extends Request, B extends Context>(
  mwsa: middleware<Context, B>, a: handler<B>, onMiddlewareError: (e?: Error) => Result = () => InternalServerError('')
) => async (req: Request, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
    a,
    async i => i,
    onMiddlewareError
  ).then(async t => {
    const result = await t
    runResponse(res, result)
  })

export const contextHandler = <A extends Request, B extends Context>(
  mwsa: middleware<Context, B>, onMiddlewareError: (e?: Error) => Result = () => InternalServerError('')
) => (a: handler<B>) => async (req: Request, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
    a,
    async i => i,
    onMiddlewareError
  ).then(async t => {
    const result = await t
    runResponse(res, result)
  })

export const contextHandlerM = <A extends Request, B extends Context, C extends B>(
  globalMiddleware: middleware<Context, B>, onMiddlewareError: (e?: Error) => Result = () => InternalServerError('')
) => (handlerMiddleware: middleware<B, C>, a: handler<B>) => async (req: Request, res: Response): HttpEffect<A> => composeK(globalMiddleware, handlerMiddleware)({ req }).onComplete(
    a,
    async i => i,
    onMiddlewareError
  ).then(async t => {
    const result = await t
    runResponse(res, result)
  })
