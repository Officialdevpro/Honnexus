const { default: mongoose } = require("mongoose");
const User = require("../models/userModel.js");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { createDefaultData } = require("../utils/defaultData.js");
const { promisify } = require("util");
const sendEmail = require("../utils/email.js");
const path = require("path");
const TempUsers = require("../models/tempModel.js");
const { studentsData } = require("../data/students.js");

// Function to generate JWT with role included
const signToken = (id, role) => {
  try {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
      expiresIn: "90d",
    });
  } catch (e) {
    throw new Error("Token generation failed");
  }
};

// Function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role); // Pass role here

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    user,
    token,
  });
};

// Middleware to check if ID exists
const checkId = catchAsync(async (req, res, next, val) => {
  const isValidId = await User.findById(val);
  if (isValidId) {
    next();
  } else {
    return res.status(404).json({
      status: "failed",
      message: "User not found",
    });
  }
});

// SIGNUP Controller
const signup = catchAsync(async (req, res, next) => {
  let role = "student"; // default

  if (req.body.adminId) {
    if (req.body.adminId !== process.env.ADMIN_SECRET_KEY) {
      return next(new AppError("Invalid admin ID", 400));
    } else {
      role = "admin";
      let isExist = await User.findOne({ studentId: "admin" });
      if (!isExist) {
        const newAdmin = await User.create({
          username: "admin",
          email: "admin@gmail.com",
          semester: 5,
          studentId: "admin",
          role: "admin",
        });
        newAdmin.save();
        return createSendToken(newAdmin, 201, res);
      }
      return createSendToken(isExist, 200, res);
    }
  } else {
   
  
    const tempUser = await TempUsers.findOne({ studentId: req.body.studentId });
   
    if (!tempUser) {
      return next(new AppError("Something went wrong.", 400));
    }
    if (tempUser.otpExpires < Date.now()) {
      return next(new AppError("Your OTP has expired.", 400));
    }
    if (tempUser.otp !== req.body.otp) {
      return next(new AppError("OTP you entered is invalid", 400));
    }

    let isExist = await User.findOne({ studentId: req.body.studentId });
    if (!isExist) {
      const newUser = await User.create({
        username: tempUser.username,
        email: tempUser.email,
        studentId: tempUser.studentId,
      });
      newUser.save();
      createSendToken(newUser, 201, res);
    } else {
      createSendToken(isExist, 200, res);
    }
    await TempUsers.findByIdAndDelete(tempUser._id);
  }
});

// LOGIN Controller
const logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email & password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

// LOGOUT Controller
const logOut = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    message: "You are logged out!",
  });
};

// Protect Route Middleware
const product = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.sendFile(path.join(__dirname, "..", "views", "auth.html"));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return res.sendFile(path.join(__dirname, "..", "views", "auth.html"));
  }

  req.user = freshUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

const tempUser = catchAsync(async (req, res, next) => {
  const { studentId } = req.body;

 

  // Find the student based on studentId
  const student = studentsData.find(
    (student) => student.studentId === studentId
  );

  if (!student) {
    return next(new AppError("Invalid student ID..", 400));
  }

  const email = student.email;

  // Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpirationTime = Date.now() + 5 * 60 * 1000;

  let isExit = await TempUsers.findOne({ email });

  if (!isExit) {
    await TempUsers.create({
      studentId: student.studentId,
      username: student.name,
      email: student.email,
      otp,
      otpExpires: otpExpirationTime,
    });
  } else {
    isExit.otp = otp;
    isExit.otpExpires = otpExpirationTime;
    await isExit.save();
  }

  const message = `
    <h2>Dear ${student.name},</h2>
    <p>Thank you for using <strong>Honnexus</strong>!</p>
    <p>Your One-Time Password (OTP) for verification is:</p>
    <div style="text-align: center;">
        <h1 style="font-size: 36px; color: #000;">${otp}</h1>
    </div>
    <p>Please enter this OTP in <strong>Honnexus</strong> to complete your verification process.</p>
    <p>If you did not request this verification, please ignore this email.</p>
    <p>Thank you!</p>
    <h3>Best regards,</h3>
    <p>Department of ECE</p>
     <p>Sona College of Technology</p>
  `;

  try {
    await sendEmail({
      email,
      subject: "OTP Verification Code (valid for 5 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email",
      studentId,
    });
  } catch (e) {
    return next(
      new AppError(
        "There was an error sending the email. Try again later!" + e,
        500
      )
    );
  }
});

const sendForgotPage = catchAsync(async (req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "views", "resetPassword.html"));
});

// Controller to send current user info
const getCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("No user logged in", 401));
  }

  res.status(200).json({
    status: "success",

    user: req.user,
  });
});

module.exports = {
  product,
  getCurrentUser,
  signup,
  logIn,
  logOut,
restrictTo,
  tempUser,

  createSendToken,
  signToken,
  sendForgotPage,
};
