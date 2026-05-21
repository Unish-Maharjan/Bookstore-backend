const Book = require("../models/bookModel");


const createBook = async (req, res) => {
  try {
    const bookData = { ...req.body };

    if (req.file) {
      bookData.image = req.file.path;
    }

    const book = await Book.create(bookData);
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
       message: error.message 
      });
  }
};

const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ 
      message: error.message });
  }
};



const getSingleBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ 
        message: "Book not found" 
       });
    }

    res.json(book);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid book ID"
       });
    }
    res.status(500).json({ 
      message: error.message 
    });
  }
};


const updateBook = async (req, res) => {
  try {
    const updateData = { ...req.body };

    
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ 
        message: "Book not found" 
      });
    }

    res.json(updatedBook);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
         message: "Invalid book ID" 
        });
    }
    res.status(500).json({ message: error.message });
  }
};


const deleteBook = async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ 
        message: "Book not found" 
       });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid book ID"
       });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBook,
  getBooks,
  getSingleBook,
  updateBook,
  deleteBook,
};
