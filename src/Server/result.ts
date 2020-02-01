/* eslint-disable no-tabs */
import { CookieOptions } from 'express'

export type body = Object | Buffer | string | null

export interface Cookie extends CookieOptions {
  name: string
  value: string
}

enum resultAction {
  render = 'render',
  sendFile = 'sendFile',
  redirect = 'redirect',
}

// maxAgeSets the max-age property of the Cache-Control header in milliseconds or a string in ms format	0
// rootRoot directory for relative filenames.// lastModified	Sets the Last-Modified header to the last modified date of the file on the OS. Set false to disable it.	Enabled	4.9.0+
// headers	Object containing HTTP headers to serve with the file
// dotfiles	Option for serving dotfiles. Possible values are “allow”, “deny”, “ignore”.	“ignore
// acceptRanges	Enable or disable accepting ranged requests.	true	4.14+
// cacheControl	Enable or disable setting Cache-Control response header.	true	4.14+
// immutable

// result may need to expand on..
export interface Result<A = body> {
  contentType?: string
  body: A
  status: httpStatus
  headers?: { [key: string]: string }
  cookies?: Cookie[]
  action?: [ resultAction, string] | [ resultAction, string, object]
  // sendFileOptions?:
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
