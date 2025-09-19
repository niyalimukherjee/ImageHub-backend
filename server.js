const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const imageRoutes = require("./routes/images");
dotenv.config();

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", authRoutes);

app.use("/images", imageRoutes);

// quick protected route to test JWT
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// connect and start
mongoose.connect(process.env.MONGO_URI, { })
  .then(() => {
    console.log("✅ MongoDB connected");
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`🚀 Server listening on ${port}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });
