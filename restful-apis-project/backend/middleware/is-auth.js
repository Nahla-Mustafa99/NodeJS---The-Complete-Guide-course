const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

exports.isAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error(
      "Not authenticated, there is no authorization header provided"
    );
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

    if (!decodedToken) {
      const error = new Error("Not authenticated, Invalid token");
      error.statusCode = 401;
      throw error;
    }

    req.userId = decodedToken.userId;
    return next();
  } catch (err) {
    if (err.statusCode) err.statusCode = 500;
    throw err;
    // next(err);
  }
};
