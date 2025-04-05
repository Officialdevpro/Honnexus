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

const User = mongoose.model("Users", userSchema);
module.exports = User;
