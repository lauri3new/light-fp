import { CookieOptions } from 'express'

export type body = Object | Buffer | string | null

export interface Cookie extends CookieOptions {
  name: string
  value: string
}

// result may need to expand on..
export interface Result<A = body> {
  contentType?: string
  body: A
  status: httpStatus
  headers?: { [key: string]: string }
  cookies?: Cookie[]
}

enum httpStatus {
  OK = 200,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500
}

export const OK = <A>(body: A) => ({
  status: httpStatus.OK,
  body,
  contentType: 'application/json',
})

export const BadRequest = <A>(body: A) => ({
  status: httpStatus.BadRequest,
  body,
  contentType: 'application/json',
})

export const NotFound = <A>(body: A) => ({
  status: httpStatus.NotFound,
  body,
  contentType: 'application/json',
})

export const InternalServerError = () => ({
  status: httpStatus.InternalServerError,
  body: 'Sorry something went wrong.',
  contentType: 'application/json',
})
