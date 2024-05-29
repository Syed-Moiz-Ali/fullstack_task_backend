// Import necessary modules
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// Create an Express app
const app = express();
const PORT = process.env.PORT || 5000; // Set the port number
const SECRET_KEY = "your_secret_key"; // Secret key for JWT

// Middleware to parse JSON bodies and handle CORS
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection URI
const uri =
  "mongodb+srv://moiz:Syedmoiz1@cluster0.qukix6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// User class for creating user instances
class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

// SquareState class for storing square states
class SquareState {
  constructor(squares) {
    this.squares = squares;
  }
}

// Function to start the server and connect to MongoDB
async function startServer() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    // Access the database and collections
    const db = client.db("myDatabase");
    const usersCollection = db.collection("users");
    const squareStatesCollection = db.collection("squareStates");

    // User registration endpoint
    app.post("/api/signup", async (req, res) => {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
      const user = new User(email, hashedPassword); // Create a new user instance
      await usersCollection.insertOne(user); // Insert the user into the collection
      res.send({ message: "Sign up successful" }); // Send success response
    });

    // User login endpoint
    app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await usersCollection.findOne({ email }); // Find user by email
      if (user && (await bcrypt.compare(password, user.password))) {
        // Check password
        const token = jwt.sign({ email: user.email }, SECRET_KEY, {
          expiresIn: "10m",
        }); // Generate JWT
        res.send({ token }); // Send token as response
      } else {
        res.status(401).send({ message: "Invalid credentials" }); // Send error response
      }
    });

    // Middleware to authenticate JWT token
    const authenticateJWT = (req, res, next) => {
      const token = req.headers.authorization; // Get token from headers
      if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
          // Verify token
          if (err) {
            return res.sendStatus(403); // Send forbidden status if token is invalid
          }
          req.user = user; // Attach user to request object
          next(); // Move to the next middleware or route handler
        });
      } else {
        res.sendStatus(401); // Send unauthorized status if no token
      }
    };

    // Endpoint to receive the current state of squares from the frontend
    app.get("/api/squares", authenticateJWT, async (req, res) => {
      const state = await squareStatesCollection.findOne({}); // Find the current state
      res.send(state ? state.squares : []); // Send the state or an empty array
    });

    // Endpoint to update the state of squares
    app.post("/api/squares", authenticateJWT, async (req, res) => {
      const { squares } = req.body;
      let state = await squareStatesCollection.findOne({}); // Find the current state
      if (!state) {
        state = new SquareState(squares); // Create a new state if none exists
        await squareStatesCollection.insertOne(state); // Insert the new state
      } else {
        await squareStatesCollection.updateOne(
          { _id: state._id },
          { $set: { squares: squares } }
        ); // Update the existing state
      }
      res.send({ message: "State updated successfully" }); // Send success response
    });

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1); // Exit the process with an error status
  }
}

// Call the function to start the server
startServer();

// Export the app module (useful for testing or other integrations)
module.exports = app;
