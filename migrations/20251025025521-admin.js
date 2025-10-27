'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(db, client) {
    await db.collection('admins').insertOne({
      name: "admin Example",
      email: "admin@example.com",
      authId: "",
      authUid: "",
  });
  },
  async down(db, client) {
    await db.collection('admins').deleteOne({ email: 'admin@example.com' });
  }
};