const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  logger.error('Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
