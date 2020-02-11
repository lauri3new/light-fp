import express from 'express'
import { Context, handlerM } from '../handler'
import { OK, BadRequest } from '../result'
import { fromEither, fromNullable } from '../../PromiseEither'
import { Right, Left } from '../../Either'

const app = express()
const router = express.Router()

interface User {
  name: string
  id: number
}

const tokenLookup = async (token: string) => ((Math.random() > 0.5)
  ? Right<User>({ name: 'jabba', id: 1 })
  : Left<string>('user dos not exist.'))

const getToken = (ctx: Context) => fromNullable(ctx.req.headers.authorization)

const authMiddleware = <A extends Context>(ctx: A) => fromEither(getToken(ctx))
  .flatMapF(async (token) => tokenLookup(token))
  .map(user => ({ ...ctx, user }))
  .leftMap((a) => {
    if (a === null) {
      return BadRequest('no access token provided')
    }
    return BadRequest(a)
  })

router.get('/user', handlerM(authMiddleware, async ({ user }) => OK({
  type: 'User',
  data: user
})))

app.use(router)

app.listen(3000)
