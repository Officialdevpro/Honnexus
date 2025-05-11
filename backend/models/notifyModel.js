const mongoose = require("mongoose");

const bookNotificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "book_staffs",
    required: true,
  },
 
  notified: {
    type: Boolean,
    default: false, // Indicates whether the student has already been notified
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BookNotification = mongoose.model("BookNotification", bookNotificationSchema);

module.exports = BookNotification;
