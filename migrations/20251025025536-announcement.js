'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(db, client) {
    await db.collection('announcements').insertOne(
    {
      "content": "Hello, Welcome to WMR!",
    });
  },
  async down(db, client) {
    await db.collection('announcements').deleteOne({content: 'Hello, Welcome to WMR!'});
  }
};