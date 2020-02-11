import express from 'express'
import { handler } from '../handler'
import { OK } from '../result'

const app = express()
const router = express.Router()

router.get('/user', handler(
  async () => OK('hello world!') // () => Promise.resolve(OK('hello world!'))
))

app.use(router)

app.listen(3000)
