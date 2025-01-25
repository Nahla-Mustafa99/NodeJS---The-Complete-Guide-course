const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const MongoDBStore = require("connect-mongodb-session")(session);
/** CSRF-CSRF PACKAGE */
const { doubleCsrf } = require("csrf-csrf");
const { csrfSync } = require("csrf-sync");
const cookieParser = require("cookie-parser");
/** ================ */
const flash = require("connect-flash");
const multer = require("multer");

const errorController = require("./controllers/error");
const User = require("./models/user");

/** REPLACE CONNECTION STRING IF USING ATLAS
 *  "mongodb+srv://<username>:<password>@<cluster-id>.mongodb.net/<dbName>?retryWrites=true&authSource=admin"
 */
const MONGODB_URI = process.env.DATABASE_URL;
// const { doubleCsrfProtection } = doubleCsrf({
//   getSecret: () => "any long string, used to generate the hash of the token",
//   getTokenFromRequest: (req) => req.body["_csrf"],
// });
const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => req?.body["_csrf"] || req.headers["csrf-token"],
});
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "data/images");
  },
  filename: (req, file, cb) => {
    /** DO NOT USE new Date().toISOString() on Windows */
    cb(null, Date.now() + "-" + file.originalname);
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

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/data/images", express.static(path.join(__dirname, "data", "images")));
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

/** CSRF-CSRF PACKAGE */
app.use(cookieParser("supersecret"));
// app.use(doubleCsrfProtection);
app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
  next();
});
/** ================ */
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken(true);

  next();
});

app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(....)
  return res.redirect("/500");
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session?.isLoggedIn,
    csrfToken: req.csrfToken(),
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
