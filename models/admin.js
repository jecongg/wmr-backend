"use strict"

const {Model} = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Admin extends Model {
    }
    Admin.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: "Admin",
        tableName: "admin",
        timestamps: true,
    })
    return Admin;
};
