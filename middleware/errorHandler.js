const logger = require('../utils/logger');

/**
 * Global error handler — must be registered LAST in Express
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`, { stack: err.stack });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large' });
  }

  // Prisma known request errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${err.meta?.target?.join(', ')}`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFoundHandler };
