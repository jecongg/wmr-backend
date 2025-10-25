'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(db, client) {
    await db.collection('teachers').insertOne(
    {
      "email": "student@example.com",
      "name": "STUDENT EXAMPLE",
      "age": 19,
      "phone_number": "081234567890",
      "address": "Jl. Example 1",
      "parent_name": "Parent Example",
      "parent_phone": "08111222333",
      "status": "active",
      "authProvider": null
    });
  },
  async down(db, client) {
    await db.collection('teachers').deleteOne({ email: 'student@example.com' });
  }
};