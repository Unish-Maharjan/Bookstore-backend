const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;
