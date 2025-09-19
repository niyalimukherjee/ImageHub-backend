// routes/images.js
const express = require("express");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const Image = require("../models/Image");
const authMiddleware = require("../middleware/auth");
const streamifier = require("streamifier");

const router = express.Router();

// Multer setup (temp storage in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /images/upload
 * Protected route - requires auth middleware
 * Expects multipart/form-data with:
 *  - image (File)
 *  - title
 *  - description
 *  - categories (comma-separated)
 *  - isPublic ("true"/"false")
 */
router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    // Basic validation
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Create Cloudinary upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      async (error, uploadedImage) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }

        try {
          const newImage = new Image({
            title: req.body.title || "Untitled",
            description: req.body.description || "",
            categories: req.body.categories
              ? req.body.categories.split(",").map(s => s.trim()).filter(Boolean)
              : [],
            isPublic: req.body.isPublic === "true",
            imageUrl: uploadedImage.secure_url,
            owner: req.user.id,
          });

          const savedImage = await newImage.save();
          return res.status(201).json(savedImage);
        } catch (dbErr) {
          console.error("DB save error:", dbErr);
          return res.status(500).json({ error: "Failed to save image record" });
        }
      }
    );

    // Pipe the multer buffer into the Cloudinary upload stream
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error("Upload route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get public images
router.get("/public", async (req, res) => {
  try {
    const images = await Image.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error("Error fetching public images:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my images
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const images = await Image.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error("Error fetching user images:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete image
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) return res.status(404).json({ error: "Image not found" });
    if (image.owner.toString() !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    await Image.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
