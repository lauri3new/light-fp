import { ObjectSchema, ValidationError } from 'yup'
import { Context } from './handler'
import { Right, Left } from '../Either'
import { BadRequest, Result } from './result'
import { PromiseEither } from '../PromiseEither'

// TODO: tidy and find what yup actually returns on error for example

const PEfromValidation = <A extends object>(a: ObjectSchema<A>, input: any): PromiseEither<Result, A> => PromiseEither(a.validate(input)
  .then(b => Right(b))
  .catch((e) => Left(BadRequest(e))))

export const query = (a: (_: ValidationError) => Result) => <B extends object>(b: ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { query: _query } = ctx.req
  return PEfromValidation(b, _query).map(q => ({ ...ctx, query: q }))
}

export const param = (a: (_: ValidationError) => Result) => <B extends object>(b: ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { param: _param } = ctx.req
  return PEfromValidation(b, _param).map(p => ({ ...ctx, param: p }))
}

export const body = (a: (_: ValidationError) => Result) => <B extends object>(b: ObjectSchema<B>) => <A extends Context>(ctx: A) => {
  const { body: _body } = ctx.req
  return PEfromValidation(b, _body).map(bd => ({ ...ctx, body: bd }))
}
