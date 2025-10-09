const { Sequelize } = require("sequelize");

const {
    database,
    username,
    password,
    host,
    dialect,
} = require("../config/config.js").development;


const sequelize = new Sequelize(database, username, password, {
    host: host,
    dialect: dialect,
    port: 3306,
})

module.exports = sequelize;