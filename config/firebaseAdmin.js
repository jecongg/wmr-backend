const admin = require('firebase-admin');

// Path ke file kunci yang sudah Anda download
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;