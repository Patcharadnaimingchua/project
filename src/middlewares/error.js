const { errors } = require('../utils/messages');

module.exports = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || errors.SERVER_ERROR,
    ...(err.errors && { errors: err.errors }), 
    timestamp: new Date().toISOString(),
  });
};