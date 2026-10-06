const express = require("express");
const {
  initiatePayment,
  verifyPayment,
  getPayment,
  getPayments,
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validateInitiatePayment,
  validateVerifyPayment,
} = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/initiate", authenticate, validateInitiatePayment, initiatePayment);
router.post("/verify", authenticate, validateVerifyPayment, verifyPayment);
router.get("/", authenticate, getPayments);
router.get("/:id", authenticate, getPayment);

module.exports = router;