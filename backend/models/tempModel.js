const mongoose = require("mongoose");
const tempSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, "Please provide the admission Number."],
  },
  username: String,
  email: String,
  otpExpires: Date,
  otp: String,
});

const TempUsers = mongoose.model("TempUsers", tempSchema);

module.exports = TempUsers;
