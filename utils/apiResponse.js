/**
 * Standardised API response helpers
 * Every controller uses these — never manually construct response shapes.
 */

const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Created') =>
  success(res, data, message, 201);

const error = (res, message = 'Server error', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

const notFound = (res, message = 'Resource not found') =>
  error(res, message, 404);

const unauthorized = (res, message = 'Unauthorized') =>
  error(res, message, 401);

const forbidden = (res, message = 'Forbidden') =>
  error(res, message, 403);

const validationError = (res, errors) =>
  error(res, 'Validation failed', 422, errors);

const paginated = (res, data, meta, message = 'Success') =>
  res.status(200).json({ success: true, message, data, meta });

module.exports = {
  success, created, error, notFound,
  unauthorized, forbidden, validationError, paginated,
};
