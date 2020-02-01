import yup from 'yup'
import { lRequest } from './handler'
import { Right, Left } from '../Either'
import { BadRequest } from './result'

const queryValidatorMiddleware = <A extends lRequest>(ctx: A) => {
  const a = ctx.req.query
  const v = yup.object({
    page: yup.string(),
    query: yup.string(),
  })
  return v.validate(a)
    .then(abd => Right({
      ...ctx,
      query: abd,
    }))
    .catch(() => Left(BadRequest('asef')))
}
