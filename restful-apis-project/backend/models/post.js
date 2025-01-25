const { default: mongoose } = require("mongoose");

const Shcema = mongoose.Schema;

const postSchema = new Shcema(
  {
    title: { type: String, required: true },

    content: { type: String, required: true },
    imageUrl: { type: String, required: true },

    // creator: { type: Object, required: true },
    creator: { ref: "User", type: Shcema.Types.ObjectId },
  },
  { timestamps: true }
);
// Carete a model upon that schema
module.exports = mongoose.model("Post", postSchema);
