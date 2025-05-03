const Book = require("../models/bookModel.js");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const mongoose = require("mongoose");
const User = require("../models/userModel.js");

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

const Reviews = require("../models/reviewModel"); // Import Review model

exports.getAllBooks = catchAsync(async (req, res, next) => {
  const userSemester = req.user.semester;

  // 1. Get books for current semester
  const books = await Book.find({ semester: userSemester });
  if (!books.length) return next(new AppError("No books found for your semester", 404));

  // 2. Get all book IDs
  const bookIds = books.map(book => book._id);

  // 3. Get review stats for these books
  const reviewStats = await Reviews.aggregate([
    {
      $match: { bookId: { $in: bookIds } }
    },
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
        avgRating: { $round: ["$avgRating", 1] },
        ratings: 1
      }
    }
  ]);

  // 4. Merge stats with books
  const booksWithStats = books.map(book => {
    const stats = reviewStats.find(s => s.bookId.equals(book._id));
    const percentages = {};
    
    if (stats) {
      // Calculate rating percentages
      [5, 4, 3, 2, 1].forEach(rating => {
        const count = stats.ratings.filter(r => r === rating).length;
        percentages[rating] = ((count / stats.nRating) * 100).toFixed(2);
      });
    }

    return {
      ...book.toObject(),
      stats: {
        nRating: stats?.nRating || 0,
        avgRating: stats?.avgRating || 0,
        percentages: stats ? percentages : {}
      }
    };
  });

  res.status(200).json({
    status: "success",
    results: booksWithStats.length,
    data: booksWithStats
  });
});

const Borrow = require("../models/borrowModel.js");

exports.getAll = catchAsync(async (req, res, next) => {
  // 1. Fetch all books
  const books = await Book.find({});
  if (!books.length) return next(new AppError("No books found", 404));

  // 2. Get review stats for all books
  const reviewStats = await Reviews.calcAllBooksStats();

  // 3. Merge stats into each book
  const booksWithStats = books.map(book => {
    const stats = reviewStats.find(s => s.bookId.equals(book._id));
    return {
      ...book.toObject(),
      stats: stats ? {
        nRating: stats.nRating,
        avgRating: stats.avgRating / 10, // Revert rounding from aggregation
        percentages: stats.percentages
      } : {
        nRating: 0,
        avgRating: 0,
        percentages: {}
      }
    };
  });

  res.status(200).json({
    status: "success",
    books: booksWithStats
  });
});


// 📌 GET Single Book by ID
exports.getBook = catchAsync(async (req, res, next) => {
  let book = await Book.findOne({bookId:req.params.bookId});
  

  if (!book) {
    return next(new AppError("Book not found", 404));
  }

  res.status(200).json({
    status: "success",
    book
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
//book id is 67f188785a2a92e8898df87a
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

exports.getBookById = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;

  const book = await Book.findOne({_id: bookId});
 
  const daota = book.toObject();
 
  const students = await Borrow.find({ bookId:daota.bookId }).populate("studentId") || []
  const borrowers = await Promise.all(
    students.map(async (borrow) => {
      const student = await User.findOne(
        { studentId: borrow.studentId },
        { username: 1, studentId: 1, _id: 0 }  // 👈 pick only needed fields
      );
  
      return {
        student: student || null,
      };
    })
  );
  
  
  
 

  const data = await Book.aggregate([
    // 1. Match the book
    { $match: { _id: new mongoose.Types.ObjectId(bookId) } },

    // 2. Convert _id to string for borrow lookup
    { $addFields: { bookIdString: { $toString: "$_id" } } },

    // 3. Lookup active borrows (using string ID)
    {
      $lookup: {
        from: "borrows",
        localField: "bookIdString",
        foreignField: "bookId",
        as: "borrows"
      }
    },

    // 4. Find current borrow (last unreturned borrow)
    { $unwind: { path: "$borrows", preserveNullAndEmptyArrays: true } },
    { $sort: { "borrows.createdAt": -1 } },
    { $limit: 1 },

    // 5. Lookup student details
    {
      $lookup: {
        from: "users",
        localField: "borrows.studentId",
        foreignField: "studentId",
        as: "currentStudent"
      }
    },
    { $unwind: { path: "$currentStudent", preserveNullAndEmptyArrays: true } },

    // 6. Lookup reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "bookId",
        as: "reviews"
      }
    },

    // 7. Calculate review stats
    {
      $addFields: {
        stats: {
          nRating: { $size: "$reviews" },
          avgRating: { $round: [{ $avg: "$reviews.rating" }, 1] },
          percentages: {
            $arrayToObject: {
              $map: {
                input: [5, 4, 3, 2, 1],
                as: "r",
                in: {
                  k: { $toString: "$$r" },
                  v: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $size: { $filter: { input: "$reviews", cond: { $eq: ["$$this.rating", "$$r"] } } } },
                              { $max: [1, { $size: "$reviews" }] }
                            ]
                          },
                          100
                        ]
                      },
                      2
                    ]
                  }
                }
              }
            }
          }
        }
      }
    },

    // 8. Final projection
    {
      $project: {
        _id: 1,
       semester: 1,
        stock: 1,
        available: 1,
        icon:1,
        stats: 1,
        currentBorrower: {
          $cond: {
            if: { $ifNull: ["$currentStudent", false] },
            then: {
              username: "$currentStudent.username",
              email: "$currentStudent.email",
              profile: "$currentStudent.profile"
            },
            else: null
          }
        }
      }
    }
  ]);

  if (!data.length) return next(new AppError("Book not found", 404));

  res.status(200).json({
    status: "success",
    data: data[0],
    borrowers
  });
});