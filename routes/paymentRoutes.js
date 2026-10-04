const express = require("express");
const {
  initiatePayment,
  verifyPayment,
  getPayment,
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validateInitiatePayment,
  validateVerifyPayment,
} = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/initiate", authenticate, validateInitiatePayment, initiatePayment);
router.post("/verify", authenticate, validateVerifyPayment, verifyPayment);
router.get("/:id", authenticate, getPayment);

module.exports = router;