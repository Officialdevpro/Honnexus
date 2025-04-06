const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, "Admission Number is required!"],
  },
  username: {
    type: String,
    required: [true, "Please tell us your name!"],
    maxlength: [20, "Username should be less than 20 letters"],
  },
  email: {
    type: String,
    required: [true, "Plese provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  profile: {
    type: String,
    default: () => `profile-${Math.floor(Math.random() * 10)}.png`,
  },
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", function (next) {
  // Only set semester if not already set manually
  if (!this.semester && this.studentId && this.studentId.length >= 2) {
    const currentYear = new Date().getFullYear();
    const admissionYear = parseInt("20" + this.studentId.slice(0, 2)); // "22" -> 2022

    const monthDiff = (currentYear - admissionYear) * 12 + new Date().getMonth();
    const calculatedSemester = Math.floor(monthDiff / 6) + 1;

    // Set semester between 1 and 8
    this.semester = Math.min(Math.max(calculatedSemester, 1), 8);
  }

  next();
});


const User = mongoose.model("Users", userSchema);
module.exports = User;
