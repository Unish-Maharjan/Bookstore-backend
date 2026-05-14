const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

const { validateCart } = require("../middleware/validateMiddleware");

// POST /cart — Add item to cart
router.post("/", validateCart, addToCart);

// GET /cart/:userId — Get a user's cart
router.get("/:userId", getCart);

// DELETE /cart/:userId/item/:bookId — Remove specific item
router.delete("/:userId/item/:bookId", removeFromCart);

// DELETE /cart/:userId — Clear entire cart
router.delete("/:userId", clearCart);

module.exports = router;
