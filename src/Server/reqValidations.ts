import yup, { string } from 'yup'
import { lRequest } from './handler'
import { Right, Left, Either } from '../Either'
import { BadRequest, Result } from './result'
import { PromiseEither } from '../PromiseEither'

export const ok = 'ok'

const PEfromValidation = <A extends object>(a: yup.ObjectSchema<A>, input: any): Promise<Either<Result, A>> => a.validate(input)
  .then(abd => Right(abd))
  .catch(() => Left(BadRequest('asef')))

const queryMw = <B extends object>(a: yup.ObjectSchema<B>) => <A extends lRequest>(ctx: A) => {
  const { query: _query } = ctx.req
  return PromiseEither(PEfromValidation(a, _query)).map(query => ({ ...ctx, query }))
}

const paginationParams = yup.object({
  page: yup.string(),
  query: yup.string(),
})

export type query = yup.InferType<typeof paginationParams>

export const queryValidatorMiddleware = queryMw(paginationParams)
