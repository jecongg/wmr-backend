'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Teachers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Menambahkan constraint unique di level database
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      instrument: {
        type: Sequelize.STRING,
        allowNull: false
      },
      experience: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hourlyRate: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      availability: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'invited' // Menambahkan default value di level database
      },
      authProvider: {
        type: Sequelize.STRING,
        allowNull: true
      },
      authUid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Teachers');
  }
};