const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true, minlength: 1 },
    totalAmount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["NPR"], default: "NPR" },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PAID", "CANCELLED"],
      default: "PENDING_PAYMENT",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);