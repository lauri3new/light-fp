/* eslint-disable  */
// TODO: write demo route handlers + middleware using PromiseEither
import express, { Request, Response, Router } from 'express'
import { PromiseEither, fromPromiseOptionF } from '../PromiseEither'
import { Right, Left, Either } from '../Either'
import {
  Result, OK, BadRequest, InternalServerError,
} from './result'
import { Some } from '../Option'

const app = express()

const router = express.Router()

interface User {
  id: number
  name: string
}

const getUser = (id: number) => PromiseEither(new Promise<Either<string, User>>((res, rej) => {
  setTimeout(() => {
    if (Math.random() < 0.3) {
      return res(Right({
        id,
        name: 'jabba',
      }))
    }
    if (Math.random() < 0.3) {
      return res(Left('user was not found'))
    }
    // eslint-disable-next-line no-throw-literal
    return rej(new Error('boom'))
  })
}))

const getFriendsByUsername = (name: string) => PromiseEither(new Promise<Either<string, User[]>>((res, rej) => {
  setTimeout(() => {
    if (Math.random() < 0.3) {
      return res(Right([{
        id: 4,
        name: 'jabba',
      }]))
    }
    if (Math.random() < 0.3) {
      return res(Left('no friends found'))
    }
    // eslint-disable-next-line no-throw-literal
    return rej(new Error('boom'))
  })
}))

// const route = (handler: (_: Request) => PromiseEither<Result, Result>) => (ctx: Request, res: Response) => (ctx) => handler
const runResponse = (res: Response, result: Result) => res.status(result.status).send(result.body).setHeader('content-type', result.contentType || 'application/json')
type HttpEffect<A> = Promise<void>
type handler = <A extends Result, B extends Request>(a: (ctx: Request) => Promise<A>) => (ctx: B, res: Response) => HttpEffect<A>
type handlerFn = <A, B>(ctx: B, res: Response) => HttpEffect<A>
const handler = <A extends Result, B extends Request>(a: (ctx: Request) => Promise<A>) => (ctx: B, res: Response): HttpEffect<A> => a(ctx).then(
  result => runResponse(res, result),
)

const tokenLookup = (token: string): Promise<Either<string, string>> => Promise.resolve(Math.random() > 0.5 ? Right("valid") : Left("invalid"))

const authMiddleware = async (ctx: Request): Promise<Either<Result, Request>> => {
  const token = ctx.headers.authorization
  if (!token) {
    return Left(BadRequest("sorry no token"))
  }
  const dbtoken = await tokenLookup(token)
  return dbtoken.match(
    token => Right(ctx),
    () => Left(BadRequest("sorry you are not logged in"))
  )
}

const userHandler = handler((req: Request) => 
  getUser(1)
  .flatMap(user => getFriendsByUsername(user.name).map(friends => ({ user, friends })))
  .flatMapF(async user => Right(user))
  .onComplete(
    data => OK(data),
    BadRequest,
    () => InternalServerError('Error'),
  ))

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

const orBadRequest = <A extends string, B> (a: PromiseEither<A, B>) => a.leftMap((ue: string) => BadRequest(ue))

const mapErrors = <A, B>(a:A, f:(_:A) => B): B => f(a)

const userHandlerTwo = handler((req: Request) => PromiseEither(authMiddleware(req))
  .flatMap((ctx) => {
    return getUserTwo(1)
    .flatMap(user => getFriendsByUsernameTwo(user.name).map(friends => ({ user, friends })))
    .flatMapF(async user => Right(user))
    .flatMapF(async ({ user }) => {
      const [ a ] = await Promise.all([
        getFriendsByUsernameTwo(user.name).__val, getUserTwo(1).__val
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
    })
  })
    .onComplete(
      data => OK(data),
      r => r,
      () => InternalServerError('awd'),
    ))
// build a typed router ?
enum HttpMethods {
  GET = 'get'
}
// registratio
router.use('/hello', userHandler)

const userRouter = express.Router()

userRouter.use('/helloagain', userHandlerTwo)

router.use('/daba', userRouter)

app.use('/', router)

app.use('*', (ctx, res) => res.send({ ok: 404 }))

app.listen(3000, () => console.log('Example app listening on port!'))
