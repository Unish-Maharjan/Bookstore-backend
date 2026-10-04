const express = require("express");
const { createOrder, getOrder } = require("../controllers/orderController");
const { authenticate } = require("../middleware/authMiddleware");
const { validateOrder } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/", authenticate, validateOrder, createOrder);
router.get("/:id", authenticate, getOrder);

module.exports = router;