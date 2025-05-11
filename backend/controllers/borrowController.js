const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const User = require("../models/userModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

const checkUserAndBook = async (studentId, bookId, next) => {
  // Check if user exists using the studentId (assuming it's a string in the database)
  const user = await User.findOne({ studentId });
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
  let studentId;
  if (req.user.role !== "student") {
    studentId = req.query.studentId;
    if (!studentId) {
      return next(new AppError("studentId is required", 400));
    }
  } else {
    const student = await User.findOne({ _id: req.user._id });
    studentId = student.studentId;
  }

  const user = await User.findOne({ studentId });
  const result = await Borrow.aggregate([
    { $match: { studentId } },
    {
      $lookup: {
        from: "book_staffs",
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

const sendEmail = require("../utils/email.js");

const BookNotification = require("../models/notifyModel");
// Should include 'User'

exports.returnBorrow = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const book = await Book.findById(req.body.bookId).session(session);
    if (!book) throw new Error("Book not found");

    // Increase the stock
    book.stock += 1;
    await book.save({ session });

    // Get notifications for this book that haven't been sent yet
    const notifications = await BookNotification.find({
      bookId: book._id,
      notified: false,
    })
      .populate("bookId")
      .populate("studentId") // populate to get student email
      .session(session);

    if (notifications.length > 0) {
      const bookDetails = {
        title: book.title,
        author: book.author,
        description: book.description,
      };

      for (const notification of notifications) {
        if (!notification.studentId || !notification.studentId.email) continue;

        let message = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .wrapper {
      width: 100%;
      padding: 20px 0px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
      overflow: hidden;
    }
    .header {
      background-color: #ffa100;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
    }
    .book-image {
      width: 100%;
      display: block;
    }
    
    .book-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }
    .book-table th, .book-table td {
      padding: 14px 12px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    .book-table th {
      background-color: #703bf6;
      color: white;
      font-weight: 600;
      text-align: center;
    }
    .book-table tr:nth-child(even) {
      background-color: #edf2f7;
    }
    .footer {
      text-align: center;
      padding: 18px;
      background-color: #f8fafc;
      font-size: 13px;
      color: #94a3b8;
    }
    a.borrow-button {
      display: inline-block;
      background-color: #2f80ed;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .header {
        font-size: 20px;
        padding: 18px 16px;
      }
      .book-table th, .book-table td {
        padding: 12px 10px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        📚 Grab It Before It’s Gone
      </div>
       <h2>Dear ${notification.studentId.username || "Student"},</h2>
          <p>The book you were waiting for, <strong>${
            book.bookName
          }</strong>, is now back in stock!</p>

      <img class="book-image" src="${book.icon}" alt="${book.bookName}" />

      <div class="content">
        <table class="book-table">
          <thead>
            <tr>
              <th colspan="2">Book Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Title</strong></td>
              <td>${book.bookName}</td>
            </tr>
            <tr>
              <td><strong>Author</strong></td>
              <td>${book.author}</td>
            </tr>
            <tr>
              <td><strong>Stock</strong></td>
              <td>${book.stock}</td>
            </tr>
            <tr>
              <td><strong>Location</strong></td>
              <td>${book.location}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 30px;">Click below to borrow it before someone else does!</p>
        <a class="borrow-button" href="https://honnexus.onrender.com/${
          book._id
        }">📖 Borrow Now</a>
      </div>

      <div class="footer">
        Thank you for using HonNexus Library System!
      </div>
    </div>
  </div>
</body>
</html>
`;

        await sendEmail({
          email: notification.studentId.email,
          subject: `${book.bookName} Book is now available!`,
          message,
        });

        notification.notified = true;
        await notification.save({ session });
      }
    }

    const borrow = await Borrow.findOne({
      bookId: book.toObject().bookId,
    }).session(session);
    if (!borrow) throw new Error("Borrow record not found");

    const user = await User.findOne({
      studentId: borrow.toObject().studentId,
    }).session(session);
    if (!user) throw new Error("User not found");

    user.returnCount += 1;
    await user.save({ session });

    await borrow.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Book returned successfully and students notified",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError(err.message, 500));
  }
});

async function returnBook(bookId) {
  try {
    const book = await Book.findById(bookId);
    if (!book) return console.log("Book not found");

    const notifications = await BookNotification.find({
      bookId: book._id,
      notified: false,
    })
      .populate("bookId")
      .populate("studentId");

    if (!notifications || notifications.length === 0) {
      return console.log("No pending notifications found.");
    }

    for (const notification of notifications) {
      if (!notification.studentId?.email) continue;

      let message = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .wrapper {
      width: 100%;
      padding: 20px 0px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
      overflow: hidden;
    }
    .header {
      background-color: #ffa100;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
    }
    .book-image {
      width: 100%;
      display: block;
    }
    
    .book-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }
    .book-table th, .book-table td {
      padding: 14px 12px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    .book-table th {
      background-color: #703bf6;
      color: white;
      font-weight: 600;
      text-align: center;
    }
    .book-table tr:nth-child(even) {
      background-color: #edf2f7;
    }
    .footer {
      text-align: center;
      padding: 18px;
      background-color: #f8fafc;
      font-size: 13px;
      color: #94a3b8;
    }
    a.borrow-button {
      display: inline-block;
      background-color: #2f80ed;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .header {
        font-size: 20px;
        padding: 18px 16px;
      }
      .book-table th, .book-table td {
        padding: 12px 10px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        📚 Grab It Before It’s Gone
      </div>
       <h2>Dear ${notification.studentId.username || "Student"},</h2>
          <p>The book you were waiting for, <strong>${
            book.bookName
          }</strong>, is now back in stock!</p>

      <img class="book-image" src="${book.icon}" alt="${book.bookName}" />

      <div class="content">
        <table class="book-table">
          <thead>
            <tr>
              <th colspan="2">Book Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Title</strong></td>
              <td>${book.bookName}</td>
            </tr>
            <tr>
              <td><strong>Author</strong></td>
              <td>${book.author}</td>
            </tr>
            <tr>
              <td><strong>Stock</strong></td>
              <td>${book.stock}</td>
            </tr>
            <tr>
              <td><strong>Location</strong></td>
              <td>${book.location}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 30px;">Click below to borrow it before someone else does!</p>
        <a class="borrow-button" href="https://honnexus.onrender.com/${
          book._id
        }">📖 Borrow Now</a>
      </div>

      <div class="footer">
        Thank you for using HonNexus Library System!
      </div>
    </div>
  </div>
</body>
</html>
`;

      try {
        await sendEmail({
          email: notification.studentId.email,
          subject: `${book.bookName} Book is now available!`,
          message,
        });
        console.log("Email sent to:", notification.studentId.email);
        notification.notified = true;
        await notification.save();
      } catch (err) {
        console.error(
          "Email failed to:",
          notification.studentId.email,
          err.message
        );
      }
    }
  } catch (error) {
    console.error("Error in returnBook:", error.message);
  }
}

// returnBook("67f40e31f6fc81a12e6af4df");
