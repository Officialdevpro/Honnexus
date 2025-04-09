const Book = require("../models/bookModel.js");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");

const path = require("path");

// Filter body helper (optional, in case you want to allow specific fields for update)
const filterObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// 📌 CREATE Book
exports.createBook = catchAsync(async (req, res, next) => {
  const book = await Book.create(req.body);

  res.status(201).json({
    status: "success",
    data: book,
  });
});

// 📌 GET All Books
exports.getAllBooks = catchAsync(async (req, res, next) => {
  const userSemester = req.user.semester;

  const books = await Book.find({ semester: userSemester });

  if (!books || books.length === 0) {
    return next(new AppError("No books found for your semester", 404));
  }

  res.status(200).json({
    status: "success",
    data: books,
  });
});


// 📌 GET Single Book by ID
exports.getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError("Book not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: book,
  });
});

// 📌 UPDATE Book
exports.updateBook = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    "icon",
    "bookName",
    "subject",
    "stock",
    "semester",
    "edition",
    "available"
  );

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedBook) {
    return next(new AppError("Book not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedBook,
  });
});

// 📌 DELETE Book
exports.deleteBook = catchAsync(async (req, res, next) => {
  const deletedBook = await Book.findByIdAndDelete(req.params.id);

  if (!deletedBook) {
    return next(new AppError("Book not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});


// 📌 GET Five Random Books
exports.getRandomBooks = catchAsync(async (req, res, next) => {
  const randomBooks = await Book.aggregate([{ $sample: { size: 5 } }]);

  if (!randomBooks || randomBooks.length === 0) {
    return next(new AppError("No books found", 404));
  }

  res.status(200).json({
    status: "success",
    results: randomBooks.length,
    data: randomBooks,
  });
});
