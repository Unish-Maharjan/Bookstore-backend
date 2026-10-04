const Joi = require("joi");

// wraps a Joi schema into express middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors: messages });
  }
  next();
};


const bookSchema = Joi.object({
  title: Joi.string().trim().required(),
  author: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  stock: Joi.number().min(0).required(),
  rating: Joi.number().min(0).max(5).required(),
  image: Joi.string().allow(null, "")
  
});


const cartSchema = Joi.object({
  userId: Joi.string().required(),
  bookId: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
});

const orderSchema = Joi.object({});

const initiatePaymentSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  paymentMethod: Joi.string().valid("TEST", "Test Electronic Payment").default("TEST"),
});

const verifyPaymentSchema = Joi.object({
  transactionId: Joi.string().pattern(/^TEST-TXN-[A-F0-9]{16}$/).required(),
  success: Joi.boolean().valid(true, false).default(true),
});

module.exports = {
  validateBook: validate(bookSchema),
  validateCart: validate(cartSchema),
  validateOrder: validate(orderSchema),
  validateInitiatePayment: validate(initiatePaymentSchema),
  validateVerifyPayment: validate(verifyPaymentSchema),
};
