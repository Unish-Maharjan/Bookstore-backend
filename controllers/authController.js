// controllers/authController.js
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// POST /auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: generateToken(user) });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: generateToken(user) });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };