import { Express, Response } from 'express'
import { match } from 'path-to-regexp'
import {
  Context, HttpMethods
} from './handler'
import {
  Result, resultAction
} from './result'
import {
  PromiseEither, peLeft
} from '../PromiseEither'
import { Right } from '../Either'

export type notFound = 'not found'

export type httpRoutes<A extends Context> = (ctx: A) => PromiseEither<notFound | Result, Result>
export type httpApp = (ctx: Context) => Promise<Result>

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

export const bindApp = (expressApp: Express, httpApp: httpApp) => {
  expressApp.use('*', (req, res) => httpApp({ req }).then((result) => {
    runResponse(res, result)
  }))
}

export const seal = (a: httpRoutes<Context>, notFound: () => Result, onError: (e?: Error) => Result): httpApp => (ctx: Context) => a(ctx)
  .onComplete(
    x => x,
    y => {
      if (y === 'not found') {
        return notFound()
      }
      return y
    },
    onError
  )

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(path: string, handler:(_: A) => Promise<Result>) => <B extends A>(ctx: B): PromiseEither<notFound, Result> => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return PromiseEither(handler({ ...ctx, req: { ...ctx.req, params: _match.params } }).then(Right))
  }
  return peLeft('not found' as notFound)
}

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)

export const combine = <A extends Context>(...a: httpRoutes<A>[]): httpRoutes<A> => (ctx: A) => {
  const [aa, ...as] = a
  if (as && as.length === 0) return aa(ctx)
  return PromiseEither(aa(ctx).__val.then(c => c.match(
    () => combine(...as)(ctx).__val,
    () => c
  )))
}

export const composeKHandler = <A extends Context, B extends Context>(a: (_:A) => PromiseEither<Result, B>, b: (_:B) => Promise<Result>): (_:A) => Promise<Result> => (ctx: A) => a(ctx).__val.then(
  c => c.match(
    y => y,
    n => b(n)
  )
)
