const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["NPR"], default: "NPR" },
    paymentMethod: { type: String, enum: ["TEST", "ESEWA", "COD"], required: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    esewaDetails: {
      transactionCode: { type: String },
      productCode: { type: String },
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);