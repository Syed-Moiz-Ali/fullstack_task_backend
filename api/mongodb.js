const mongoose = require("mongoose");

const uri =
  "mongodb+srv://moiz:Syedmoiz1@cluster0.qukix6m.mongodb.net/myDatabase?retryWrites=true&w=majority";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "myDatabase",
    });
  }
  return mongoose.connection;
}

module.exports = connectToDatabase;
