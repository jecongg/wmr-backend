'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(db, client) {
    await db.collection('teachers').insertOne(
    {
      "email": "teacher@example.com",
      "name": "TEACHER EXAMPLE",
      "age": 40,
      "phone_number": "081234567890",
      "address": "Jl. Example 1",
      "status": "active",
      "authProvider": null
    });
  },
  async down(db, client) {
    await db.collection('teachers').deleteOne({ email: 'teacher@example.com' });
  }
};