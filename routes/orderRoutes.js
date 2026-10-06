const express = require("express");
const { createOrder, getOrder, getOrders } = require("../controllers/orderController");
const { authenticate } = require("../middleware/authMiddleware");
const { validateOrder } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/", authenticate, validateOrder, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrder);

module.exports = router;