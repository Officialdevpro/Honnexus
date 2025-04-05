const express = require("express");
const app = express();
const path = require("path");
const userRoutes = require("./routes/userRoutes.js");
const reviewRoutes = require("./routes/reviewRoutes.js");
const analysRoutes = require("./routes/analysRoutes.js");
const morgan = require("morgan");
const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controllers/errorController.js");

const compression = require("compression");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const {
  product,
  tempUser,
  signup,
  createSendToken,
  signToken,
} = require("./controllers/authController.js");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const User = require("./models/userModel.js");
const { createDefaultData } = require("./utils/defaultData.js");
const TempUsers = require("./models/tempModel.js");

// 1) GLOBAL MIDDLEWARES

// Set security  HTTP headers
// app.use(helmet());

//Limit requests from same IP
// const limiter = rateLimit({
//   max: 50,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again in an hour!",
//   handler: (req, res, next, options) => {
//     res.status(options.statusCode).json({
//       status: "fail",
//       message: options.message,
//     });
//   },
// });
const otpLimiter = rateLimit({
  max: 20,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "fail",
      message: options.message,
    });
  },
});
// app.use("/api", limiter);

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow all CRUD methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify headers if needed
  })
);

app.use(compression());
app.use("/", express.static(path.join(__dirname, "..", "Frontend")));
app.use(
  "/api/v1/users/resetPassword/:id",
  express.static(path.join(__dirname, "..", "Frontend"))
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" })); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data
app.use(cookieParser());

// Data sanitization against NOSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// app.use((req, res, next) => {
//   console.log(req.user);
//   next();
// });
// Middleware

// Import the configured passport instance

app.get("/", product, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/analytics", analysRoutes);

// OTP VERIFICATION
app.post("/verifyMe", otpLimiter, tempUser);

app.all("*", (req, res, next) => {
  // const err = new Error("Cant find " + req.originalUrl + " on this server");
  // err.status = "fail";
  // err.statusCode = 404;
  // next(err);
  next(new AppError("Can't find " + req.originalUrl + " on this server", 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE (GEHM)
app.use(globalErrorHandler);

module.exports = app;
