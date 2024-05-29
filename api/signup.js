const connectToDatabase = require("./mongodb");
const bcrypt = require("bcryptjs");

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}
module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User(email, hashedPassword);

    const db = await connectToDatabase();
    await db.collection("users").insertOne(user);
    res.status(200).json({ message: "Sign up successful" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
