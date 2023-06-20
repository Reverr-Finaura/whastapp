const admin = require("firebase-admin");
const serviceKey = require("./serviceKey");

admin.initializeApp({
  credential: admin.credential.cert(serviceKey),
});

module.exports = admin;
