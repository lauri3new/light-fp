import express from 'express'
import { Context, handlerM } from '../handler'
import { OK, BadRequest } from '../result'
import { Right, Left, Either } from '../../Either'

const app = express()
const router = express.Router()

interface User {
  name: string
  id: number
}

const tokenLookup = (token: string): Either<string, User> => {
  const user: User = { name: 'jabba', id: 1 }
  return ((Math.random() > 0.5)
    ? Right(user)
    : Left('user dos not exist.'))
}

const getToken = (ctx: Context): Either<string, string> => (ctx.req.headers.authorization ? Right(ctx.req.headers.authorization) : Left('sef'))

const authMiddleware = <A extends Context>(ctx: A) => getToken(ctx).map()

// .flatMapF(async (token) => tokenLookup(token))
// .map(user => ({ ...ctx, user }))
// .leftMap((a) => {
//   if (a === null) {
//     return BadRequest('no access token provided')
//   }
//   return BadRequest(a)
// })

router.get('/user', handlerM(authMiddleware, async ({ user }) => OK({
  type: 'User',
  data: user
})))

app.use(router)

app.listen(3000)
