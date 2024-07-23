var admin = require("firebase-admin");

var serviceAccount = require("./socialdev-2165b-firebase-adminsdk-l53y4-13f1573199.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
