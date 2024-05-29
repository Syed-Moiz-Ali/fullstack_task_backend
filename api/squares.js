const connectToDatabase = require("./mongodb");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

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

module.exports = async (req, res) => {
  const db = await connectToDatabase();

  if (req.method === "GET") {
    authenticateJWT(req, res, async () => {
      const state = await db.collection("squareStates").findOne({});
      res.status(200).json(state ? state.squares : []);
    });
  } else if (req.method === "POST") {
    authenticateJWT(req, res, async () => {
      const { squares } = req.body;
      let state = await db.collection("squareStates").findOne({});
      if (!state) {
        state = new SquareState(squares);
        await db.collection("squareStates").insertOne(state);
      } else {
        await db
          .collection("squareStates")
          .updateOne({ _id: state._id }, { $set: { squares: squares } });
      }
      res.status(200).json({ message: "State updated successfully" });
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
