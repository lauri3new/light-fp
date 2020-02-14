import express from 'express'

const app = express()
const router = express.Router()

// whats wrong with this? not explicit in the type that this function is throwable, what type the error is.

const lookupUserFromToken = async (token: string) => {
  if (Math.random() > 0.5) {
    return ({ name: 'sam', id: 1 })
  }
  throw new Error('user dos not exist.')
}

// whats wrong with this? what state is req in? did we cover all the cases?
// how do we test this middleware? what if multiple middleware are stacked together?

const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(400).send('no access token provided')
  }
  try {
    const user = await lookupUserFromToken(token)
    req.user = user
    next()
  } catch (e) {
    res.status(400).send(e.message)
  }
}

// whats wrong with this? how do we know we have req.user?

router.get('/user', authMiddleware, (req: any, res: any) => {
  res.send({
    type: 'User',
    data: req.user
  })
})

app.use(router)

app.listen(3000)
