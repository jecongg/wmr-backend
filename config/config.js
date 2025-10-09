require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // <-- Baca dari .env
    port: process.env.DB_PORT,       // <-- Baca dari .env
    logging: console.log
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // <-- Baca dari .env
    port: process.env.DB_PORT,       // <-- Baca dari .env
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // <-- Baca dari .env
    port: process.env.DB_PORT,       // <-- Baca dari .env
    logging: false
  }
};