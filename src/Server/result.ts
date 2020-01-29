
export type body = Object | Buffer | string | null

export interface Result<A = body> {
  contentType?: string
  body: A
  status: httpStatus
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
