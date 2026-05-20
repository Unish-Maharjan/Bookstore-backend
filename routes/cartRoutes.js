const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  decrementItem,
} = require("../controllers/cartController");

const { validateCart } = require("../middleware/validateMiddleware");


router.post("/", validateCart, addToCart);


router.get("/:userId", getCart);

router.patch("/:userId/item/:bookId", decrementItem);

router.delete("/:userId/item/:bookId", removeFromCart);

router.delete("/:userId", clearCart);

module.exports = router;