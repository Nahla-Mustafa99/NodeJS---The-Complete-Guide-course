const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { body } = require("express-validator");
const { isAuth } = require("../middleware/is-auth");
const User = require("../models/user");

// PUT /auth/signup
router.put(
  "/signup",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((val, { req }) => {
        return User.findOne({ email: val }).then((email) => {
          if (email)
            return Promise.reject(
              new Error("email already in use, try another one!")
            );
          return true;
        });
      })
      .normalizeEmail(),
    body("name")
      .notEmpty()
      .withMessage("user name is required")
      .isLength({
        min: 3,
        max: 10,
      })
      .withMessage("Name length must be between 3 to 10 characters"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({
        min: 5,
        max: 30,
      })
      .withMessage("Password length must be between 5 to 30 characters"),
  ],
  authController.signup
);

// POST /auth/login
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .trim()
      .normalizeEmail(),
    body("password").notEmpty().withMessage("password is required"),
  ],
  authController.login
);

// GET /auth/status
router.get("/status", isAuth, authController.getUserStatus);

// PUT /auth/status
router.put(
  "/status",
  isAuth,
  [body("status").notEmpty().withMessage("status is required!").trim()],
  authController.updateUserStatus
);

module.exports = router;
