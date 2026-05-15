const Cart = require("../models/cartModel");
const Book = require("../models/bookModel");

// POST /cart — add item to cart (creates cart if it doesn't exist)
const addToCart = async (req, res) => {
  try {
    const { userId, bookId, quantity } = req.body;

    // verify the book exists and has enough stock
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.stock < quantity) {
      return res.status(400).json({ message: `Only ${book.stock} copies in stock` });
    }

    // Check if book is already in user's cart
    const existingCart = await Cart.findOne({ userId, "items.bookId": bookId });

    if (existingCart) {
      // Increment quantity of existing item
      const cart = await Cart.findOneAndUpdate(
        { userId, "items.bookId": bookId },
        { $inc: { "items.$.quantity": quantity } },
        { new: true }
      ).populate("items.bookId");

      return res.json(cart);
    }

    // Add new item to cart (upsert creates cart if it doesn't exist)
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $push: { items: { bookId, title: book.title, quantity } } },
      { new: true, upsert: true }
    ).populate("items.bookId");

    res.status(201).json(cart);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /cart/:userId — Get a user's cart
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate("items.bookId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /cart/:userId/item/:bookId — Remove a specific item
const removeFromCart = async (req, res) => {
  try {
    const { userId, bookId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { bookId } } },
      { new: true }
    ).populate("items.bookId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// DELETE /cart/:userId — Clear a user's cart
const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOneAndDelete({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
};
