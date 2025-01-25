const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const feedController = require("../controllers/feed");

const { isAuth } = require("../middleware/is-auth");

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// Get /feed/posts/:postId
router.get("/posts/:postId", isAuth, feedController.getPost);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    body("title", "Title length should be 5 at least")
      .trim()
      .isLength({ min: 5 }),
    body("content", "Content length should be 5 to 500 characters")
      .trim()
      .isLength({ min: 5, max: 500 }),
  ],
  feedController.createPost
);

// PUT /feed/post/:postId
router.put(
  "/post/:postId",
  isAuth,
  [
    body("title", "Title length should be 5 at least")
      .trim()
      .isLength({ min: 5 }),
    body("content", "Content length should be 5 to 500 characters")
      .trim()
      .isLength({ min: 5, max: 500 }),
  ],
  feedController.updatePost
);

// DELETE /feed/post/:postId
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
