const express = require("express");
const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("./mongodb");
const router = express.Router();

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User(email, hashedPassword);

  try {
    const db = await connectToDatabase();
    await db.collection("users").insertOne(user);
    res.status(200).json({ message: "Sign up successful" });
  } catch (error) {
    console.error("Error inserting user into database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
