const admin = require("firebase-admin");
const serviceKey = require("./serviceKey");
const { getStorage } = require('firebase-admin/storage');

admin.initializeApp({
  credential: admin.credential.cert(serviceKey),
  // storageBucket: 'gs://reverr-25fb3.appspot.com'
});


module.exports = admin ;
