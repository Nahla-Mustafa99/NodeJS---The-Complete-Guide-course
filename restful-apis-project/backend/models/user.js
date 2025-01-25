// const { default: mongoose } = require("mongoose");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true },

    name: { type: String, required: true },

    password: { type: String, required: true },

    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],

    status: { type: String, default: "I'm new there" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
