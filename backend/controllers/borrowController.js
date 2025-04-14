const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const User = require("../models/userModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

const checkUserAndBook = async (studentId, bookId, next) => {
  // Check if user exists using the studentId (assuming it's a string in the database)
  const user = await User.findOne({ studentId });
  console.log(user);
  if (!user) {
    return next(new AppError("User not found with provided studentId", 404));
  }

  // Check if book exists
  const book = await Book.findOne({ bookId });
  if (!book) {
    return next(new AppError("Book not found with provided bookId", 404));
  }

  return book; // Returning the book if both the user and book are found
};

exports.borrowBook = catchAsync(async (req, res, next) => {
  const { studentId, bookId } = req.body;

  // Validate presence
  if (!studentId || !bookId) {
    return next(new AppError("studentId, bookId are required", 400));
  }

  // Check if user and book exist
  const book = await checkUserAndBook(studentId, bookId, next);
  if (!book) return;

  if (book.stock <= 0) {
    return next(new AppError("Book is currently out of stock", 400));
  }

  // Create borrow record
  const borrow = await Borrow.create({ studentId, bookId });

  // Decrease book stock
  book.stock -= 1;
  await book.save();

  res.status(201).json({
    status: "success",
    data: borrow,
  });
});

// 📌 GET Borrow Records by Student ID with Manual Book Population
exports.getBorrowsByStudentId = catchAsync(async (req, res, next) => {
  const studentId = "22ECEBE175";
  let data = req.query.studentId;
  console.log(req.query);
  const user = await User.findOne({ studentId });
  const result = await Borrow.aggregate([
    { $match: { studentId } },
    {
      $lookup: {
        from: "books",
        localField: "bookId",
        foreignField: "bookId",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    {
      $project: {
        _id: "$bookDetails._id",
        icon: "$bookDetails.icon",
        bookName: "$bookDetails.bookName",
        createdAt: 1,
      },
    },
  ]);

  // Add time-ago calculation
  const booksWithTimeAgo = result.map((book) => ({
    ...book,
    createdAt: getTimeAgo(book.createdAt),
  }));

  res.status(200).json({
    status: "success",
    results: booksWithTimeAgo.length,

    books: booksWithTimeAgo,
    user,
  });
});

// Time calculation helper function
const getTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
};

// 📌 GET Borrow by ID
exports.getBorrow = catchAsync(async (req, res, next) => {
  const borrow = await Borrow.findById(req.params.id)
    .populate("userId", "username email")
    .populate("bookId", "bookName author");

  if (!borrow) {
    return next(new AppError("Borrow record not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: borrow,
  });
});

// 📌 UPDATE Borrow Record (e.g., returnDate)
exports.updateBorrow = catchAsync(async (req, res, next) => {
  const { returnDate } = req.body;

  const borrow = await Borrow.findByIdAndUpdate(
    req.params.id,
    { returnDate },
    { new: true, runValidators: true }
  );

  if (!borrow) {
    return next(new AppError("Borrow record not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: borrow,
  });
});

// 📌 DELETE Borrow Record (Return Book)
exports.deleteBorrow = catchAsync(async (req, res, next) => {
  const borrow = await Borrow.findById(req.params.id);

  if (!borrow) {
    return next(new AppError("Borrow record not found", 404));
  }

  const book = await Book.findById(borrow.bookId);
  if (book) {
    book.stock += 1;
    await book.save();
  }

  await borrow.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
