import yup from 'yup'
import { Context } from './handler'
import { Right, Left, Either } from '../Either'
import { BadRequest, Result } from './result'
import { PromiseEither } from '../PromiseEither'

// TODO: tidy and find what yup actually returns on error for example

const PEfromValidation = <A extends object>(a: yup.ObjectSchema<A>, input: any): Promise<Either<Result, A>> => a.validate(input)
  .then(abd => Right(abd))
  .catch(() => Left(BadRequest('asef')))

export const query = <B extends object>(a: yup.ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { query: _query } = ctx.req
  return PromiseEither(PEfromValidation(a, _query)).map(q => ({ ...ctx, query: q }))
}

const param = <B extends object>(a: yup.ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { param: _param } = ctx.req
  return PromiseEither(PEfromValidation(a, _param)).map(p => ({ ...ctx, param: p }))
}

const body = <B extends object>(a: yup.ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { body: _body } = ctx.req
  return PromiseEither(PEfromValidation(a, _body)).map(b => ({ ...ctx, body: b }))
}

// TODO: yup.object combining

const paginationParams = yup.object({
  page: yup.string(),
  query: yup.string()
})

export type query = yup.InferType<typeof paginationParams>

export const queryValidatorMiddleware = query(paginationParams)
