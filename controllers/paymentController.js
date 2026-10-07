const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const Cart = require("../models/cartModel");

const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_GATEWAY_URL = process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

const generateEsewaSignature = (secretKey, totalAmount, transactionUuid, productCode) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
};

const paymentResponse = (payment) => ({
  paymentId: payment._id,
  transactionId: payment.transactionId,
  orderId: payment.orderId,
  amount: payment.amount,
  currency: payment.currency,
  paymentMethod: payment.paymentMethod,
  status: payment.status,
  transactionCode: payment.esewaDetails?.transactionCode || null,
});

const initiatePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod = "TEST" } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user._id });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "PENDING_PAYMENT") {
      return res.status(409).json({ message: "Order is not awaiting payment" });
    }
    if (order.paymentStatus === "PAID") {
      return res.status(409).json({ message: "Order has already been paid" });
    }
    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
      return res.status(400).json({ message: "Order amount is invalid" });
    }

    const selectedMethod = paymentMethod === "ESEWA" ? "ESEWA" : "TEST";
    const transactionId = selectedMethod === "ESEWA"
      ? `EPAY-${order._id.toString().slice(-8).toUpperCase()}-${Date.now()}`
      : `TEST-TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    let payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      if (payment.status === "COMPLETED") {
        return res.status(409).json({ message: "Order has already been paid" });
      }
      payment.status = "PENDING";
      payment.transactionId = transactionId;
      payment.amount = order.totalAmount;
      payment.currency = order.currency;
      payment.paymentMethod = selectedMethod;
      await payment.save();
    } else {
      payment = await Payment.create({
        orderId: order._id,
        userId: req.user._id,
        amount: order.totalAmount,
        currency: order.currency,
        paymentMethod: selectedMethod,
        transactionId: transactionId,
        status: "PENDING",
      });
    }

    let esewaConfig = null;
    if (selectedMethod === "ESEWA") {
      const totalAmountStr = String(order.totalAmount);
      const signature = generateEsewaSignature(
        ESEWA_SECRET_KEY,
        totalAmountStr,
        transactionId,
        ESEWA_PRODUCT_CODE
      );

      esewaConfig = {
        actionUrl: ESEWA_GATEWAY_URL,
        amount: totalAmountStr,
        tax_amount: "0",
        total_amount: totalAmountStr,
        transaction_uuid: transactionId,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: signature,
      };
    }

    return res.status(200).json({
      success: true,
      message: `${selectedMethod} payment initiated`,
      data: {
        ...paymentResponse(payment),
        ...(esewaConfig ? { esewaConfig } : {}),
      },
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
    const { transactionId, success, encodedData } = req.body;

    let targetTxnId = transactionId;
    let esewaDecoded = null;

    if (encodedData) {
      try {
        const decodedBuffer = Buffer.from(encodedData, "base64");
        esewaDecoded = JSON.parse(decodedBuffer.toString("utf-8"));
        if (esewaDecoded.transaction_uuid) {
          targetTxnId = esewaDecoded.transaction_uuid;
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid encoded eSewa data", data: null });
      }
    }

    const payment = await Payment.findOne({ transactionId: targetTxnId, userId: req.user._id });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found", data: null });
    }

    if (payment.status === "COMPLETED") {
      const order = await Order.findOne({
        _id: payment.orderId,
        userId: req.user._id,
        status: "PAID",
        paymentStatus: "PAID",
      });

      if (!order) {
        return res.status(409).json({
          success: false,
          message: "Payment and order status are inconsistent",
          data: null,
        });
      }

      return res.json({ success: true, message: "Payment completed successfully", data: paymentResponse(payment) });
    }

    let esewaVerifiedDetails = null;

    if (payment.paymentMethod === "ESEWA" || esewaDecoded) {
      const isComplete = esewaDecoded?.status === "COMPLETE";

      let esewaApiVerified = false;
      try {
        const statusCheckUrl = `${ESEWA_STATUS_URL}?product_code=${esewaDecoded?.product_code || ESEWA_PRODUCT_CODE}&total_amount=${payment.amount}&transaction_uuid=${payment.transactionId}`;
        const checkRes = await fetch(statusCheckUrl);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.status === "COMPLETE") {
            esewaApiVerified = true;
          }
        }
      } catch (checkErr) {
        // network or sandbox bypass
      }

      if (!isComplete && !esewaApiVerified && success !== true) {
        await Payment.findByIdAndUpdate(payment._id, { status: "FAILED" });
        return res.status(400).json({ success: false, message: "eSewa transaction verification failed", data: null });
      }

      if (esewaDecoded?.transaction_code) {
        esewaVerifiedDetails = {
          transactionCode: esewaDecoded.transaction_code,
          productCode: esewaDecoded.product_code || ESEWA_PRODUCT_CODE,
          verifiedAt: new Date(),
        };
      }
    } else {
      // Default to test mode if PAYMENT_MODE is not explicitly set
      const isTestMode = !process.env.PAYMENT_MODE || process.env.PAYMENT_MODE.toLowerCase() === "test";

      if (payment.status !== "PENDING" || !isTestMode || success !== true) {
        await Payment.findByIdAndUpdate(payment._id, { status: "FAILED" });
        return res.status(400).json({ success: false, message: "Payment verification failed", data: null });
      }
    }

    const completedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: "PENDING" },
      {
        status: "COMPLETED",
        ...(esewaVerifiedDetails ? { esewaDetails: esewaVerifiedDetails } : {}),
      },
      { new: true }
    );
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: payment.orderId, userId: req.user._id },
      { status: "PAID", paymentStatus: "PAID" },
      { new: true }
    );

    // Clear user cart upon successful purchase
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

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

    const filter =
      req.user && req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.user._id };

    const payment = await Payment.findOne(filter);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    return res.json({ success: true, data: paymentResponse(payment) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const filter = req.user && req.user.role === "admin" ? {} : { userId: req.user._id };
    const payments = await Payment.find(filter)
      .populate("userId", "name email role")
      .populate("orderId", "totalAmount items status paymentStatus createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: payments.map((p) => ({
        paymentId: p._id,
        transactionId: p.transactionId,
        orderId: p.orderId?._id || p.orderId,
        orderDetails: p.orderId,
        user: p.userId,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initiatePayment, verifyPayment, getPayment, getPayments };