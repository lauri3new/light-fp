
import { Request, Response } from 'express'
import { PromiseEither } from '../PromiseEither'
import {
  Result, InternalServerError
} from './result'
import { runResponse } from './index'

type middleware <A extends Context, B extends A> = (ctx: A) => PromiseEither<Result, B>
type handler <B extends Context = Context> = (ctx: B) => Promise<Result>

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

interface routeHandlersObj<A extends Context> {
  [path: string]: {
    method: HttpMethods,
    handler: handler<A>
  }
}

type HttpEffect<A> = Promise<void>

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

export const contextHandlerM = <A extends Request, B extends Context>(
  globalMiddleware: middleware<Context, B>, onMiddlewareError: (e?: Error) => Result = () => InternalServerError('')
) => <C extends B>(handlerMiddleware: middleware<B, C>, a: handler<C>) => async (req: Request, res: Response): HttpEffect<A> => {
    const b = globalMiddleware({ req }).flatMap(ctx => handlerMiddleware(ctx))
      .onComplete(
        a,
        async i => i,
        onMiddlewareError
      ).then(async t => {
        const result = await t
        runResponse(res, result)
      })
  }
