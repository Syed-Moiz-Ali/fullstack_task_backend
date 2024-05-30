const express = require("express");
const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("./mongodb");
const router = express.Router();

const SECRET_KEY = "your_secret_key";

class SquareState {
  constructor(squares) {
    this.squares = squares;
  }
}

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

router.get("/squares", authenticateJWT, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const state = await db.collection("squareStates").findOne({});
    res.status(200).json(state ? state.squares : []);
  } catch (error) {
    console.error("Error fetching squares:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/squares", authenticateJWT, async (req, res) => {
  const { squares } = req.body;
  try {
    const db = await connectToDatabase();
    let state = await db.collection("squareStates").findOne({});

    if (!state) {
      state = new SquareState(squares);
      await db.collection("squareStates").insertOne(state);
    } else {
      await db
        .collection("squareStates")
        .updateOne({ _id: state._id }, { $set: { squares } });
    }
    res.status(200).json({ message: "State updated successfully" });
  } catch (error) {
    console.error("Error updating squares:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
