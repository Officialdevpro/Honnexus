const mongoose = require("mongoose");
const Book = require("../models/bookModel"); // adjust path
const Borrow = require("../models/borrowModel");
const BookNotification = require("../models/notifyModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.subscribeToBookNotification = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;
  const { bookId } = req.body;

  if (!studentId || !bookId) {
    return next(new AppError("Both studentId and bookId are required", 400));
  }

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError("Book not found", 404));
  }

  // Check if student already borrowed this book and hasn't returned it
  const alreadyBorrowed = await Borrow.findOne({
    studentId: req.user.studentId,
    bookId: book.toObject().bookId,
  });

  if (alreadyBorrowed) {
    return res.status(200).json({
      status: "fail",
      message: "You already borrowed this book.",
    });
  }

  // Check if already subscribed
  const existingSubscription = await BookNotification.findOne({
    studentId: studentId.toString(),
    bookId: bookId.toString(),
  });

  if (existingSubscription) {
    return res.status(400).json({
      status: "fail",
      message: "You are already subscribed for this book.",
    });
  }

  // Subscribe user for notification
  await BookNotification.create({
    studentId: studentId.toString(),
    bookId: bookId.toString(),
  });

  res.status(200).json({
    status: "success",
    message: "You will be notified when this book is back in stock.",
  });
});
