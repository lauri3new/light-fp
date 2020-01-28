// TODO: write demo route handlers + middleware using PromiseEither
import express, { Request, Response } from 'express'
import { PromiseEither, sequence } from '../PromiseEither'
import { Right, Left, Either } from '../Either'

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

// const route = (handler: (_: Request) => PromiseEither<Result, Result>) => (req: Request, res: Response) => (req) => handler

const helloWorld = (req: Request, res: Response) => getUser(1)
  .flatMap(user => getFriendsByUsername(user.name).map(friends => ({ user, friends })))
  .flatMapF(async user => Right(user))
  .fork(
    username => res.status(200).send(username),
    errorMessage => res.status(400).send(errorMessage),
    username => res.status(500).send(username),
  )

router.use('/hello', helloWorld)

app.use('/', router)

app.use('*', (req, res) => res.send({ ok: 404 }))

app.listen(3000, () => console.log('Example app listening on port!'))
