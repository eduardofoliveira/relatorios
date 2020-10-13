require('dotenv').config()

module.exports = {

  development: {
    client: 'oracledb',
    connection: {
      user          : process.env.CLOUD_ORACLE_USER,
      password      : process.env.CLOUD_ORACLE_PASS,
      connectString : process.env.CLOUD_CONNECTSTRING,
    },
    pool: {
      min: 1,
      max: 5
    }
  },

  production: {
    client: 'oracledb',
    connection: {
      user          : process.env.CLOUD_ORACLE_USER,
      password      : process.env.CLOUD_ORACLE_PASS,
      connectString : process.env.CLOUD_CONNECTSTRING,
    },
    pool: {
      min: 1,
      max: 5
    }
  }

};
