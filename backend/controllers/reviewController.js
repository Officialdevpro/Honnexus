const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const Reviews = require("../models/reviewModel.js");
const User = require("../models/userModel.js");

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const bookId = req.params.bookId;

  const filter = bookId ? { bookId } : {};

  const reviews = await Reviews.find(filter);

  const stats = await Reviews.calcAverageRatings(bookId);

  res.status(200).json({
    status: "success",
    result: reviews.length,
    reviews,
    stats,
  });
});

exports.createReviews = catchAsync(async (req, res, next) => {
  let data = req.body;
  // data.studentId = req.user._id;
  data.studentId = "67f35fdec46a57f418a079c8";
  const newReview = await Reviews.create(data);

  res.status(201).json({
    status: "success",
    review: newReview,
  });
});

exports.updateReviews = catchAsync(async (req, res, next) => {
  const { rating } = req.body;
  const { bookId } = req.params;
  const userId = req.user._id;


  // Update or create the rating
  const updatedRating = await Reviews.findOneAndUpdate(
    { bookId: bookId, studentId: userId }, // Filter by book and user
    { rating }, // Data to update
    {
      new: true, // Return updated document
      runValidators: true, // Validate data
      upsert: true, // Create if not exists
      setDefaultsOnInsert: true, // Use schema defaults if needed
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      rating: updatedRating,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  await Reviews.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: "success",
  });
});
