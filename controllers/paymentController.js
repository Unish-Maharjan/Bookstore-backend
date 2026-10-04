const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");

const paymentResponse = (payment) => ({
  paymentId: payment._id,
  transactionId: payment.transactionId,
  orderId: payment.orderId,
  amount: payment.amount,
  currency: payment.currency,
  paymentMethod: payment.paymentMethod,
  status: payment.status,
});

const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "CANCELLED") {
      return res.status(409).json({ message: "Cancelled orders cannot be paid" });
    }
    if (order.paymentStatus === "PAID") {
      return res.status(409).json({ message: "Order has already been paid" });
    }
    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
      return res.status(400).json({ message: "Order amount is invalid" });
    }

    const existingPayment = await Payment.findOne({ orderId: order._id });
    if (existingPayment) {
      return res.status(409).json({ message: "A payment already exists for this order" });
    }

    const payment = await Payment.create({
      orderId: order._id,
      userId: req.user._id,
      amount: order.totalAmount,
      currency: order.currency,
      paymentMethod: "TEST",
      transactionId: `TEST-TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Sandbox payment initiated",
      data: paymentResponse(payment),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A payment already exists for this order" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { transactionId, success } = req.body;
    const payment = await Payment.findOne({ transactionId, userId: req.user._id });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found", data: null });
    }

    if (payment.status === "COMPLETED") {
      return res.json({ success: true, message: "Payment completed successfully", data: paymentResponse(payment) });
    }

    if (payment.status !== "PENDING" || process.env.PAYMENT_MODE !== "test" || success !== true) {
      await Payment.findByIdAndUpdate(payment._id, { status: "FAILED" });
      return res.status(400).json({ success: false, message: "Payment verification failed", data: null });
    }

    const completedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: "PENDING" },
      { status: "COMPLETED" },
      { new: true }
    );
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: payment.orderId, userId: req.user._id, status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
      { status: "PAID", paymentStatus: "PAID" },
      { new: true }
    );

    if (!completedPayment || !updatedOrder) {
      await Payment.findOneAndUpdate({ _id: payment._id, status: "COMPLETED" }, { status: "PENDING" });
      return res.status(409).json({ success: false, message: "Order could not be marked as paid", data: null });
    }

    return res.json({
      success: true,
      message: "Payment completed successfully",
      data: paymentResponse(completedPayment),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

const getPayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await Payment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    return res.json({ success: true, data: paymentResponse(payment) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { initiatePayment, verifyPayment, getPayment };