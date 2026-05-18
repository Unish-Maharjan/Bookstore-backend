const Cart = require("../models/cartModel");
const Book = require("../models/bookModel");

// POST /cart — Add item to cart (or increment if exists)
const addToCart = async (req, res) => {
  const { userId, bookId, quantity } = req.body;

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.stock < quantity) {
      return res
        .status(400)
        .json({ message: `Only ${book.stock} copies available in stock` });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create a new cart for this user
      cart = new Cart({
        userId,
        items: [
          {
            bookId: book._id,
            title: book.title,
            quantity,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.bookId.toString() === bookId
      );

      if (existingItem) {
        // Check stock before incrementing
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > book.stock) {
          return res.status(400).json({
            message: `Cannot add ${quantity} more. Only ${book.stock - existingItem.quantity} left in stock`,
          });
        }
        existingItem.quantity = newQuantity;
      } else {
        // Add new item to cart
        cart.items.push({
          bookId: book._id,
          title: book.title,
          quantity,
        });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /cart/:userId/item/:bookId — Decrement item quantity by 1
const decrementItem = async (req, res) => {
  const { userId, bookId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.bookId.toString() === bookId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    if (item.quantity === 1) {
      cart.items = cart.items.filter((i) => i.bookId.toString() !== bookId);
    } else {
      item.quantity -= 1;
    }

    await cart.save();
    res.status(200).json({ message: "Item decremented", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /cart/:userId — Get a user's cart
const getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate(
      "items.bookId",
      "title author price image"
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /cart/:userId/item/:bookId — Remove a specific item from cart
const removeFromCart = async (req, res) => {
  const { userId, bookId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemExists = cart.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (!itemExists) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items = cart.items.filter(
      (item) => item.bookId.toString() !== bookId
    );

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /cart/:userId — Clear the entire cart
const clearCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addToCart, getCart, removeFromCart, clearCart, decrementItem };