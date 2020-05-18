import express, { Express, Response, Request } from 'express'
import { match } from 'path-to-regexp'
import {
  Result, resultAction, OK, NotFound
} from './result'
import {
  Arrow, combineA, ofContext, of, composeA, extendContext
} from '../index'
import { Left, Right, Either } from '../../Either'
import { InternalServerError } from '../../Server/result'

export interface Context {
  req: Request
}

export enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options'
}

export type httpRoutes<A extends Context, B> = Arrow<B, Result, Result, A>
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

export const bindApp = <A>(expressApp: Express, httpApp: httpApp) => {
  expressApp.use('*', (req, res) => httpApp({ req }).then((result) => {
    runResponse(res, result)
  }))
}

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(path: string) => Arrow<A & { req: { params: object } }, Result, undefined, A>(
  async (ctx: A) => {
    const _match = match(path)(ctx.req.baseUrl)
    if (_match && ctx.req.method.toLowerCase() === method) {
      return [Right(undefined), ({ ...ctx, req: { ...ctx.req, params: _match.params } })]
    }
    return [Left(NotFound({})), ctx]
  }
)

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)

const myRoute = get<Context & { requestId: number } & hasKnex>('/hello/:id')

ofContext<Context>().thenMergeCtx(async () => {
  const a = { requestId: 3 }
  return Right(a)
})
  .andThen(myRoute)

type hasKnex = { knex: object }
const theType = ofContext<Context & hasKnex>()
  .thenMergeCtx(async () => {
    const a = { requestId: 3 }
    return Right(a)
  }).andThen(
    myRoute
  )

// const bindAppTwo = <A extends Context, B>(a: httpRoutes<A, B>) =>
// express App, http App, dependencies minus context, NotFound, ErrorHandler

const bindAppTwo = <A, B>(expressApp: Express, a: httpRoutes<A & Context, B>, dependencies: A, onError: (e?: Error) => Result) => {
  expressApp.use('*', (req, res) => a.runWith({ req, ...dependencies },
    result => result,
    result => result,
    onError)
    .then(result => runResponse(res, result)))
}
