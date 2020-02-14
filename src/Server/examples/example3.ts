import express from 'express'
import * as yup from 'yup'
import { query } from '../validations'
import { authMiddleware } from './example2-1'
import { composeK } from '../../PromiseEither'
import { handlerM } from '../handler'
import { OK } from '../result'

const app = express()
const router = express.Router()

const paginationParams = yup.object().shape({
  page: yup.string().notRequired(),
  query: yup.string()
})

const validate = query(
  paginationParams
)

router.get('/user', handlerM(composeK(authMiddleware, validate), async (ctx) => {
  //
  console.log(ctx.query)
  return OK({
    type: 'User',
    data: ctx.user
  })
}))

app.use(router)

app.listen(3000)
