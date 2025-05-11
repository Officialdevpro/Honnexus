// review // rating // createdAt // ref to user //
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Types.ObjectId,
      ref: "book_staffs",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      max: 5,
      min: 1,
    },
    studentId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ book: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "studentId",
    select: "username",
  });
  next();
});

// This is not a middleware, this is a statics method
reviewSchema.statics.calcAverageRatings = async function (bookId) {
  const matchStage = bookId 
    ? { $match: { bookId: new mongoose.Types.ObjectId(bookId) } } 
    : { $match: {} };

  // Rest of the method remains the same
  const overallStats = await this.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  let stats;
  if (overallStats.length > 0) {
    stats = {
      nRating: overallStats[0].nRating,
      avgRating: Math.round(overallStats[0].avgRating * 10) / 10,
    };
  } else {
    stats = {
      nRating: 0,
      avgRating: 0,
    };
  }

  // Calculate rating counts and percentages
  const ratingCounts = await this.aggregate([
    matchStage,
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = stats.nRating;
  const percentages = {};
  if (total > 0) {
    ratingCounts.forEach((rc) => {
      percentages[rc._id] = ((rc.count / total) * 100).toFixed(2);
    });
  }

  return {
    ...stats,
    percentages,
  };
};





reviewSchema.statics.calcAllBooksStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$bookId",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        ratings: { $push: "$rating" }
      }
    },
    {
      $project: {
        bookId: "$_id",
        nRating: 1,
        avgRating: { $round: [{ $multiply: ["$avgRating", 10] }, 0] },
        ratings: 1,
      }
    }
  ]);

  // Calculate percentages for each rating (1-5)
  const statsWithPercentages = stats.map(stat => {
    const total = stat.nRating;
    const percentages = {};
    if (total > 0) {
      // Initialize all possible ratings to 0.00%
      [5, 4, 3, 2, 1].forEach(r => (percentages[r] = "0.00"));
      // Count occurrences of each rating
      const counts = stat.ratings.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      // Calculate percentages
      Object.entries(counts).forEach(([key, value]) => {
        percentages[key] = ((value / total) * 100).toFixed(2);
      });
    }
    return { ...stat, percentages };
  });

  return statsWithPercentages;
};

// reviewSchema.index({ user: 1 }, { unique: true });

// reviewSchema.post("save", function () {
//   //here no need to call the next middle were because of post hook
//   this.constructor.calcAverageRatings();
// });

const Reviews = mongoose.model("Reviews", reviewSchema);
module.exports = Reviews;
