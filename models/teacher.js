'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Teacher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Teacher.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Pastikan email tidak boleh duplikat
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true, // Nomor telepon bisa jadi opsional
    },
    instrument: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photo: {
      type: DataTypes.TEXT, // Cukup untuk menyimpan URL atau string base64 yang panjang
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    availability: {
      type: DataTypes.JSON, // Tipe data JSON untuk array ketersediaan hari
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'invited', // Nilai default saat guru baru dibuat
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: true, // 'email' atau 'google'
    },
    authUid: {
      type: DataTypes.STRING,
      allowNull: true, // Boleh null jika login via email/password
    },
  }, {
    sequelize,
    modelName: 'Teacher',
  });
  return Teacher;
};