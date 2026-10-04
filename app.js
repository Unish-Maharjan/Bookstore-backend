require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const connectDatabase = require("./database");

const app = express();

connectDatabase();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/books", bookRoutes);
app.use("/cart", cartRoutes);
app.use("/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);


app.get("/", (req, res) => {
  res.json({ message: "Bookstore API running" });
});

app.get("/test", (req, res) => {
  res.json({ message: "API working fine" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

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