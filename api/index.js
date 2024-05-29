// server.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = "your_secret_key";

app.use(bodyParser.json());
app.use(cors());

const uri =
  "mongodb+srv://moiz:Syedmoiz1@cluster0.qukix6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

class SquareState {
  constructor(squares) {
    this.squares = squares;
  }
}

async function startServer() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("myDatabase");
    const usersCollection = db.collection("users");
    const squareStatesCollection = db.collection("squareStates");

    // User registration endpoint
    app.post("/api/signup", async (req, res) => {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User(email, hashedPassword);
      await usersCollection.insertOne(user);
      res.send({ message: "Sign up successful" });
    });

    // User login endpoint
    app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await usersCollection.findOne({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ email: user.email }, SECRET_KEY, {
          expiresIn: "1h",
        });
        res.send({ token });
      } else {
        res.status(401).send({ message: "Invalid credentials" });
      }
    });

    // Middleware to authenticate JWT token
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

    // Endpoint to receive the current state of squares from the frontend
    app.get("/api/squares", authenticateJWT, async (req, res) => {
      const state = await squareStatesCollection.findOne({});
      res.send(state ? state.squares : []);
    });

    // Endpoint to update the state of squares when they are all white
    app.post("/api/squares", authenticateJWT, async (req, res) => {
      const { squares } = req.body;
      let state = await squareStatesCollection.findOne({});
      if (!state) {
        state = new SquareState(squares);
        await squareStatesCollection.insertOne(state);
      } else {
        await squareStatesCollection.updateOne(
          { _id: state._id },
          { $set: { squares: squares } }
        );
      }
      res.send({ message: "State updated successfully" });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();
