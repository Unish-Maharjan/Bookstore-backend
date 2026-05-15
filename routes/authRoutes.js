const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// TEST LOGIN ROUTE
router.post("/login", (req, res) => {

  const token = jwt.sign(
    {
      id: "123",
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({
    message: "Login successful",
    token,
  });
});

module.exports = router;