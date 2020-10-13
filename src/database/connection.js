const knex = require('knex')

const configuration = require('../../knexfile')

const connection = knex(
  process.env.ENVIRONMENT === 'production'
    ? configuration.production
    : configuration.development,
)

module.exports = {
  connection
}