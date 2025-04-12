const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    bookId: {
      type: String, // Ensure bookId is treated as a String
      required: [true, "Book ID is required!"], // Validation for the bookId
    },
    
    studentId: {
      type: String, // Ensure studentId is treated as a String
      required: [true, "Student ID is required!"], // Validation for the studentId
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const Borrow = mongoose.model("Borrow", borrowSchema);
module.exports = Borrow;
