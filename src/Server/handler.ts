
import { Request, Response } from 'express'
import { PromiseEither } from '../PromiseEither'
import {
  Result, resultAction, InternalServerError,
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

export const handler = <A>(
  a: (ctx: Context) => Promise<Result<A>>,
) => (req: Request, res: Response): HttpEffect<A> => a({ req }).then(
    result => runResponse(res, result),
  )

export const handlerM = <A extends Request, B extends Context>(
  mwsa: middleware<Context, B>, a: handler<B>, onMiddlewareError: (e?: Error) => Result = () => InternalServerError(''),
) => async (req: Request, res: Response): HttpEffect<A> => mwsa({ req }).onComplete(
    a,
    async i => i,
    onMiddlewareError,
  ).then(async t => {
    const result = await t
    runResponse(res, result)
  })

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
