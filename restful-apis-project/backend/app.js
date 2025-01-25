const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { default: mongoose } = require("mongoose");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const dotenv = require("dotenv");
dotenv.config();

const DB_CONNECTION_URL = process.env.DB_URI;

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, "data/images");
  },
  filename: (req, file, cb) => {
    return cb(null, uuidv4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const app = express();

// app.use(bodyParser.urlEncoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// Now every incoming request is parsed for that file or for such files.
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "data", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type ,Authorization");

  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error?.data;
  return res.status(status).json({ message: message, data: data });
});

// Database connection
mongoose
  .connect(DB_CONNECTION_URL, {})
  .then((result) => {
    // result is the connection client object
    // console.log(result);
    app.listen(8080);
  })
  .catch((err) => console.log(err));
