const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true,
  },
  bookName: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  
  subject: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
  },
  edition: {
    type: String,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  
});



// Exporting the model
module.exports = mongoose.model("book_staffs", BookSchema);
