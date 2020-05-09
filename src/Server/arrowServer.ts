// import { Express, Response } from 'express'
// import { Arrow, ofContext } from '../SpecialKPE'
// import { runResponse } from '.'
// import { Context } from './handler'

// const bindApp = (expressApp: Express) => {
//   expressApp.use('*', (req, res) => ofContext<Context>().runWith(
//     { req },
//     a => a,
//     a => a,
//     a => a
//   ).then((result) => {
//     runResponse(res, result)
//   }))
// }

// export default bindApp
