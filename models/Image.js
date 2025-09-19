const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    categories: [String],
    isPublic: { type: Boolean, default: true },
    imageUrl: { type: String, required: true }, // Cloudinary URL
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shareLink: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
