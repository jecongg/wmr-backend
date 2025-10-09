'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // definisikan asosiasi di sini, misal:
      // Student.belongsToMany(models.Teacher, { through: 'Schedules' });
    }
  }
  Student.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authUid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Student',
  });
  return Student;
};