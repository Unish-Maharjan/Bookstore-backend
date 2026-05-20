const express = require("express");
const router = express.Router();

const {
  createBook,
  getBooks,
  getSingleBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const { authenticate, adminOnly } = require("../middleware/authMiddleware");
const { validateBook } = require("../middleware/validateMiddleware");
const upload = require("../middleware/uploadMiddleware");


router.get("/", getBooks);
router.get("/:id", getSingleBook);


router.post(
  "/",
  authenticate,
  adminOnly,
  upload.single("image"),
  validateBook,
  createBook
);

router.put(
  "/:id",
  authenticate,
  adminOnly,
  upload.single("image"),
  validateBook,
  updateBook
);

router.delete("/:id", authenticate, adminOnly, deleteBook);

module.exports = router;
