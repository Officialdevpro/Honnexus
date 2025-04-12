const cache = new Map(); // In-memory cache

// Function to handle casting errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`;
  return new AppError(message, 400);
};

// Development error handler
const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error handler
const sendErrorPro = (err, res) => {
  // Operational error, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  else {
    // Log error
    console.error('ERROR 💥', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// Main error handler
module.exports = (err, req, res, next) => {
  // Check if error is cached
  const cacheKey = `${err.name}-${err.message}`;
  if (cache.has(cacheKey)) {
    // Return cached response
    return res.status(cache.get(cacheKey).statusCode).json(cache.get(cacheKey).response);
  }

  // Express will automatically know if it's 4 params then it is GEHM
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle error based on the environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }
    // Cache the error response for a short period (e.g., 5 seconds)
    const response = sendErrorPro(err, res);
    cache.set(cacheKey, { statusCode: err.statusCode, response });

    // Remove cached error after 5 seconds
    setTimeout(() => {
      cache.delete(cacheKey);
    }, 5000); // 5 seconds cache time
  }
};
