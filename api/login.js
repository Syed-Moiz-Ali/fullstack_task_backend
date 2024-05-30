const connectToDatabase = require("./mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = 'screate_key';

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { email, password } = req.body;

    const db = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ email: user.email }, SECRET_KEY, {
        expiresIn: "10m",
      });
      res.status(200).json({ token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
