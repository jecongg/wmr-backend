'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(db, client) {
    await db.collection('announcements').insertOne(
    {
      "content": "Halo, Ini System WMR Baru woi",
      "createdAt": {
        "$date": "2025-10-26T07:13:12.940Z"
      },
      "updatedAt": {
        "$date": "2025-10-26T07:13:12.940Z"
      },
      "__v": 0
    });
  },
  async down(db, client) {
    await db.collection('announcements').deleteOne({content: 'Hello, Welcome to WMR!'});
  }
};