const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://moiz:Syedmoiz1@cluster0.qukix6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db("myDatabase");
  }
  return db;
}

module.exports = connectToDatabase;
