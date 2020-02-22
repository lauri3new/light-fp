import express from 'express'
import * as yup from 'yup'
import { query } from '../validations'
import { authMiddleware } from './example2-1'
import { composeK, PromiseEither } from '../../PromiseEither'
import { handlerM, handler, Context } from '../handler'
import { OK, BadRequest, InternalServerError } from '../result'
import { Right, Left, Either } from '../../Either'

const app = express()
const router = express.Router()

const paginationParams = yup.object().shape({
  page: yup.string().notRequired(),
  query: yup.string()
})

const validate = query(
  paginationParams
)

interface ctxRoles {
  roles: roles
}

interface roles {
  OrganisationManagerEditor?: number
}

// acl
const isOrganisationManager = (roles: roles) => (id: number): Either<string, number> => (roles.OrganisationManagerEditor
  ? Right(id)
  : Left('not sufficient roles'))

const filterFieldsByRole = (roles: roles) => (user: { name: string, id: number }) => (roles.OrganisationManagerEditor
  ? Right({ name: 'sam', id: 1 })
  : Left<string>('user dos not exist.'))

// service
const getUserById = (id: number) => ((Math.random() > 0.5)
  ? Right({ name: 'sam', id: 1 })
  : Left<string>('user dos not exist.'))

// my service
const aclGetUserById = async (roles: roles, id: number) => isOrganisationManager(roles)(id)
  .flatMap(getUserById)
  .flatMap(filterFieldsByRole(roles))

// vs

const getRoles = <A extends Context>(ctx: A) => PromiseEither<never, Context & ctxRoles>(Promise.resolve(Right({
  ...ctx,
  roles: {
    OrganisationManagerEditor: 1
  }
})))

router.get('/user', handlerM(getRoles, async (ctx) => PromiseEither(aclGetUserById(ctx.roles, 1))
  .onComplete(
    errorMessage => BadRequest({ error: errorMessage }),
    user => OK(user),
    () => InternalServerError({ error: 'doh' })
  )))

app.use(router)

app.listen(3000)
