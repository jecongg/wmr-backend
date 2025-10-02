'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword1 = await bcrypt.hash('admin123', 10);
    const hashedPassword2 = await bcrypt.hash('superadmin456', 10);

    await queryInterface.bulkInsert('admin', [
      {
        username: 'admin',
        password: hashedPassword1,
        email: 'admin@wmr.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'superadmin',
        password: hashedPassword2,
        email: 'superadmin@wmr.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admin', null, {});
  }
};
