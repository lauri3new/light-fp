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

const lookupUserFromToken = async (token: string) => ((Math.random() > 0.5)
  ? Right<User>({ name: 'sam', id: 1 })
  : Left<string>('user dos not exist.'))

const getToken = (ctx: Context) => fromNullable(ctx.req.headers.authorization)

// eslint-disable-next-line import/prefer-default-export
export const authMiddleware = <A extends Context>(ctx: A) => fromEither(getToken(ctx))
  .flatMapF(async (token) => lookupUserFromToken(token))
  .map(user => ({ ...ctx, user }))
  .leftMap((a) => {
    // switch case
    if (a === null) {
      return BadRequest('no access token provided')
    }
    return BadRequest(a)
  })

router.get('/user', handlerM(authMiddleware, async (ctx) => OK({
  type: 'User',
  data: ctx.user
})))

app.use(router)

app.listen(3000)
