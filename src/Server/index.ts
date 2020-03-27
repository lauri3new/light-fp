import express, { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Context, runResponse, HttpMethods, contextHandlerM
} from './handler'
import {
  Result, OK, BadRequest, InternalServerError, NotFound, httpStatus
} from './result'
import {
  PromiseEither, peLeft, peRight, composeK
} from '../PromiseEither'
import { Right } from '../Either'

type notFound = 'not found'

type httpRoutes<A extends Context> = (ctx: A) => PromiseEither<notFound | Result, Result>
type httpApp = (ctx: Context) => Promise<Result>

export const bindApp = (expressApp: Express, httpApp: httpApp) => {
  expressApp.use('*', (req, res) => httpApp({ req }).then((result) => runResponse(res, result)))
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

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(path: string, handler:(_: A) => Promise<Result>) => (ctx: A): PromiseEither<notFound, Result> => {
  if (match(path)(ctx.req.baseUrl) && ctx.req.method.toLowerCase() === method) {
    return PromiseEither(handler(ctx).then(Right))
  }
  return peLeft('not found' as notFound)
}

const get = matchMethodAndPath(HttpMethods.GET)
const post = matchMethodAndPath(HttpMethods.POST)
const patch = matchMethodAndPath(HttpMethods.PATCH)
const put = matchMethodAndPath(HttpMethods.PUT)
const del = matchMethodAndPath(HttpMethods.DELETE)
const options = matchMethodAndPath(HttpMethods.OPTIONS)

const combine = <A extends Context>(a: httpRoutes<A>, b: httpRoutes<A>) => (ctx: A) => PromiseEither(
  a(ctx).__val.then(c => c.match(
    () => b(ctx).__val,
    () => c
  ))
)

const authMyApp = (ctx: Context): PromiseEither<Result, Context> => {
  if (Math.random() > 0.5) {
    return peRight<Context>(ctx)
  }
  return peLeft<Result>(BadRequest({}))
}

const composeKhandler = <A extends Context, B extends Context>(a: (_:A) => PromiseEither<Result, B>, b: (_:B) => Promise<Result>): (_:A) => Promise<Result> => (ctx: A) => a(ctx).__val.then(
  c => c.match(
    y => y,
    n => b(n)
  )
)

// kleisli combinators

// combineK
// composeK
// composeKp
