/* eslint-disable no-tabs */
import { CookieOptions } from 'express'

export type body = Object | Buffer | string | null

export interface Cookie extends CookieOptions {
  name: string
  value: string
}

export interface ClearCookie extends CookieOptions {
  name: string
}

export enum resultAction {
  render = 'render',
  sendFile = 'sendFile',
  redirect = 'redirect',
}

export interface Result<A = body> {
  contentType?: string
  body: A
  status: httpStatus
  headers?: { [key: string]: string }
  cookies?: Cookie[]
  clearCookies?: Cookie[]
  action?: [ resultAction, string] | [ resultAction, string, object] | [ resultAction, string, object, (error: any, html: any) => void ]
}

export enum httpStatus {
  OK = 200,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500
}

export const Result = <A = body>(status: httpStatus, body: A, contentType = 'application/json') => ({
  status,
  body,
  contentType,
  map: <B>(f: (_: Result<A>) => Result<A>) => f(Result(status, body, contentType)),
})

export const OK = <A>(body: A) => Result(httpStatus.OK, body)
export const BadRequest = <A>(body: A) => Result(httpStatus.BadRequest, body)
export const InternalServerError = <A>(body: A) => Result(httpStatus.InternalServerError, body)
export const NotFound = <A>(body: A) => Result(httpStatus.NotFound, body)

export const withCookies = <A extends Result>(cookies: Cookie[]) => (a: A) => ({
  ...a,
  cookies,
})

export const clearCookies = <A extends Result>(cookies: ClearCookie[]) => (a: A) => ({
  ...a,
  clearCookies: cookies,
})

export const withContentType = <A extends Result>(contentType: string) => (a: A) => ({
  ...a,
  contentType,
})

export const withHeaders = <A extends Result>(headers: { [key: string]: string }) => (a: A) => ({
  ...a,
  headers: {
    ...a.headers,
    ...headers,
  },
})

export const withAction = <A extends Result>(action: [ resultAction, string] | [ resultAction, string, object]) => (a: A) => ({
  ...a,
  action,
})
