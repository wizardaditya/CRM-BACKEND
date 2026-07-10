const { validationResult } = require('express-validator');
const { validationError }   = require('../utils/apiResponse');

/**
 * Run after express-validator chains.
 * Returns a 422 with all field errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationError(res, errors.array());
  }
  next();
};

module.exports = validate;
