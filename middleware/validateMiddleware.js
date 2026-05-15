const Joi = require("joi");

// Wraps a Joi schema into Express middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Validation error", errors: messages });
  }
  next();
};

// Book validation — image is optional (handled by multer separately)
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

// Cart validation
const cartSchema = Joi.object({
  userId: Joi.string().required(),
  bookId: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
});

module.exports = {
  validateBook: validate(bookSchema),
  validateCart: validate(cartSchema),
};
