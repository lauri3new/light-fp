import express from 'express'

const app = express()
const router = express.Router()

router.get('/user', (req, res) => {
  res.send('hello world!')
})

app.use(router)

app.listen(3000)
