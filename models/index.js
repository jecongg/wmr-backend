'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

// --------------------------------------------------------------------
// PERUBAHAN UTAMA DI SINI
// Impor instance sequelize langsung dari file connection.js Anda.
// Sesuaikan path ini jika lokasi connection.js Anda berbeda.
// Saya berasumsi file connection.js ada di root folder backend Anda.
const sequelize = require('../database/connection.js'); 
// --------------------------------------------------------------------

const db = {};

// Logika ini tetap sama: membaca semua file model di folder ini secara otomatis
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Logika ini juga tetap sama: menjalankan fungsi .associate() untuk relasi
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Menambahkan instance sequelize dan Sequelize ke objek db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;