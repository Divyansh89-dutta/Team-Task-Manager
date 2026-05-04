const logger = require('../utils/logger');

const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: 409,
    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
  };
};

const handleValidationError = (err) => ({
  statusCode: 422,
  message: Object.values(err.errors).map((e) => e.message).join('. '),
});

const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: 'Your token has expired. Please log in again.',
});

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') ({ statusCode, message } = handleCastError(err));
  else if (err.code === 11000) ({ statusCode, message } = handleDuplicateKeyError(err));
  else if (err.name === 'ValidationError') ({ statusCode, message } = handleValidationError(err));
  else if (err.name === 'JsonWebTokenError') ({ statusCode, message } = handleJWTError());
  else if (err.name === 'TokenExpiredError') ({ statusCode, message } = handleJWTExpiredError());

  if (statusCode >= 500) {
    logger.error('Server Error:', { message: err.message, stack: err.stack, url: req.originalUrl });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
