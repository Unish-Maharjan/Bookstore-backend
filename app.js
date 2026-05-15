require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");

const connectDatabase = require("./database");

const app = express();

// Connect DB
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/books", bookRoutes);
app.use("/cart", cartRoutes);
app.use("/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Bookstore API running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "MulterError" || err.message.includes("Only JPEG")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});