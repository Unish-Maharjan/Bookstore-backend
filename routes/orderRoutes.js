const express = require("express");
const { createOrder, getOrder, getOrders, updateOrderStatus } = require("../controllers/orderController");
const { authenticate, adminOnly } = require("../middleware/authMiddleware");
const { validateOrder } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/", authenticate, validateOrder, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrder);
router.patch("/:id", authenticate, adminOnly, updateOrderStatus);

module.exports = router;