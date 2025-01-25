const path = require("path");
const fs = require("fs");

const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  let totalItems;

  return Post.find()

    .countDocuments()
    .then((noOfDocs) => {
      totalItems = noOfDocs;

      return Post.find()
        .populate("creator")
        .skip((currentPage - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((posts) => {
      if (!posts) {
        const err = new Error("No posts found.");
        err.statusCode = 403;
        throw err;
      }

      res.status(200).json({
        posts,
        totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  return Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("Could not found Post.");
        error.statusCode = 404; // Not Found
        throw err;
      }
      res.status(200).json({ post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  // let imageUrl = req.file.path.replace("\\", "/");
  // imageUrl = imageUrl.replace("\\", "/");
  imageUrl = "images/" + req.file.filename;

  if (!req.file) {
    const err = new Error("No Image Provided!");
    err.statusCode = 422;
    throw err;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Vaildation Failed, eneterd data is incorrect");
    err.statusCode = 422;
    err.data = errors.array();
    throw err;
    // return res
    //   .status(422)
    //   .json({
    //     message: "Vaildation Failed, eneterd data is incorrect",
    //     errors: errors.array(),
    //   });
  }
  const post = new Post({
    title,
    content,
    // imageUrl: "images/2acde4fd-ee3b-4cd7-b5c0-5834ce1ca560-OIG4.jpeg",
    imageUrl: imageUrl,
    creator: req.userId,
  });
  return post
    .save()
    .then((post) => {
      User.findById(req.userId)
        .then((user) => user.posts.push(post))
        .catch((err) => {
          throw err;
        });
      return post.populate("creator");
    })
    .then((post) => {
      res.status(201).json({
        message: "Post created successfully!",
        post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;

  // the first option
  let imageUrl = req.body.image;

  // the second option
  if (req.file) {
    // console.log(req.file);
    imageUrl = "images/" + req.file.filename;
  }

  if (!imageUrl) {
    const error = new Error("No file picked, please try again!");
    error.statusCode = 422;
    throw error;
  }
  // Input Validation Errors
  const valErrors = validationResult(req);
  if (!valErrors.isEmpty()) {
    const error = new Error("Entered data is incorrect, please try again!");
    error.statusCode = 422;
    err.data = valErrors.array();
    throw error;
  }

  return Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No post found.");
        error.statusCode = 404; //not Found
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403; //not Found
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((post) => post.populate("creator"))
    .then((post) =>
      res.status(200).json({
        message: "Post is updated successfully",
        post,
      })
    )
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  return Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not found Post.");
        error.statusCode = 404; // Not Found
        throw err;
      }
      // check logged in user
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403; //not Found
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => User.findById(req.userId))
    .then((user) => user.posts.pull(postId))
    .then((result) => {
      return res.status(200).json({ message: "Deleted post successfully." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePathAbs = path.join(__dirname, "..", "data" + "/" + filePath);
  // console.log(filePathAbs);
  fs.unlink(filePathAbs, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

//   creator: { name: "any" },
//   createdAt: new Date().toISOString(),
