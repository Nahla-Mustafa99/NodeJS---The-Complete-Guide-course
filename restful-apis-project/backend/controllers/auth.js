const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/user");

// @desc create new user
exports.signup = (req, res, next) => {
  const { email, password, name } = req.body;

  //  Validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Vaildation Failed!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  return bcrypt
    .hash(password, 12)
    .then((hash) => {
      const user = new User({ email, password: hash, name });
      return user.save();
    })
    .then((user) => {
      return res
        .status(201)
        .json({ message: "User created!", userId: user._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.stausCode = 500;
      }
      next(err);
    });
};

// @desc login and generate a token
exports.login = (req, res, next) => {
  const { email, password } = req.body;

  //  Validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Vaildation Failed!");
    error.statusCode = 422;
    error.data = valErrors.array();
    throw error;
  }
  let loadedUser;
  return User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
      }

      loadedUser = user;
      // return bcrypt.compare(password, user.password, 12);
      return bcrypt.compare(password, user.password);
    })
    .then((isMatch) => {
      if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "1h" }
      );

      return res
        .status(200)
        .json({ token: token, userId: loadedUser._id.toString() });
    })

    .catch((err) => {
      if (!err.statusCode) {
        err.stausCode = 500;
      }
      next(err);
    });
};

// @desc get user status
exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("This user is'nt found");
        error.statusCode = 404;
        throw error;
      }
      return res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.stausCode = 500;
      }
      next(err);
    });
};

// @desc update user status
exports.updateUserStatus = (req, res, next) => {
  const { status } = req.body;

  return User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("This user is'nt found");
        error.statusCode = 404;
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .catch((user) => {
      return res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.stausCode = 500;
      }
      next(err);
    });
};
